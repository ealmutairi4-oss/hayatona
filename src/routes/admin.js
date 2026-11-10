'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../auth');
const { getStats, buildFilter, AGE_GROUP_SQL, GENDER_LABEL } = require('../stats');
const { rateLimit, noStore } = require('../security');

const router = express.Router();
router.use(noStore);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'محاولات دخول كثيرة. يرجى المحاولة بعد 15 دقيقة.',
});

// ───────── الدخول والخروج ─────────
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const admin = auth.authenticate(username, password);
  if (!admin) {
    auth.audit(req, 'login_failed', { username: String(username || '').slice(0, 50) });
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
  }
  loginLimiter.reset(req.ip);
  db.get().prepare("UPDATE admins SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(admin.id);
  const token = auth.createSession(admin.id);
  res.cookie(auth.COOKIE, token, auth.cookieOptions());
  req.admin = { id: admin.id };
  auth.audit(req, 'login');
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  auth.destroySession(req);
  res.clearCookie(auth.COOKIE, { path: '/' });
  res.json({ ok: true });
});

// كل ما بعد هذا السطر يتطلب جلسة إدارة صالحة
router.use(auth.requireAdmin);

router.get('/me', (req, res) => res.json({ admin: req.admin }));

// ───────── التقارير المجمعة (admin + analyst) ─────────
router.get('/stats', (req, res) => res.json(getStats(req.query)));

router.get('/rules', (req, res) => {
  const rules = db.get().prepare(`
    SELECT test, code, min_value, min_inclusive, max_value, max_inclusive, label, points
    FROM scoring_rules ORDER BY sort_order
  `).all();
  res.json({ rules });
});

// ───────── التصدير ─────────
function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // منع حقن الصيغ في Excel
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function sendCsv(res, filename, rows) {
  const body = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`﻿${body}\r\n`); // BOM لعرض العربية بشكل صحيح في Excel
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

/** تقرير إحصائي مجمع — لا يتضمن أي بيانات شخصية. */
router.get('/export/stats.csv', (req, res) => {
  const s = getStats(req.query);
  const rows = [];
  const aggHeader = ['المجموعة', 'عدد التقييمات', 'متوسط النقاط', 'متوسط العمر الزمني', 'متوسط العمر التقديري', 'متوسط الفارق', 'أصغر من العمر الزمني', 'مساوٍ', 'أكبر من العمر الزمني'];
  const aggRow = (label, a) => [label, a.count, a.avgPoints, a.avgAge, a.avgBioAge, a.avgDiff, a.younger, a.same, a.older];

  rows.push(['تقرير العمر البيولوجي — إحصاءات مجمعة']);
  rows.push(['من تاريخ', req.query.from || '—', 'إلى تاريخ', req.query.to || '—']);
  rows.push([]);
  rows.push(['الملخص العام']);
  rows.push(aggHeader);
  rows.push(aggRow('جميع التقييمات', s.summary));
  rows.push([]);
  rows.push(['توزيع تصنيفات اختبار الخطوة']);
  rows.push(['التصنيف', 'النقاط', 'العدد']);
  s.hrDistribution.forEach((d) => rows.push([d.label, d.points, d.count]));
  rows.push([]);
  rows.push(['توزيع تصنيفات نسبة الدهون PBF']);
  rows.push(['التصنيف', 'النقاط', 'العدد']);
  s.pbfDistribution.forEach((d) => rows.push([d.label, d.points, d.count]));
  rows.push([]);
  rows.push(['حسب الجنس']);
  rows.push(aggHeader);
  s.byGender.forEach((g) => rows.push(aggRow(g.label, g)));
  rows.push([]);
  rows.push(['حسب الفئة العمرية']);
  rows.push(aggHeader);
  s.byAgeGroup.forEach((g) => rows.push(aggRow(g.label, g)));
  rows.push([]);
  rows.push(['حسب الجنس والفئة العمرية']);
  rows.push(aggHeader);
  s.byGenderAgeGroup.forEach((g) => rows.push(aggRow(`${g.genderLabel} ${g.ageGroup}`, g)));

  auth.audit(req, 'export_stats', { filter: req.query });
  sendCsv(res, `biological-age-stats-${stamp()}.csv`, rows);
});

/**
 * تصدير السجلات: افتراضيًا بدون الاسم ورقم التواصل.
 * تضمين البيانات الشخصية (pii=1) متاح لدور admin فقط ويُسجَّل في سجل التدقيق.
 */
router.get('/export/records.csv', (req, res) => {
  const includePii = req.query.pii === '1';
  if (includePii && req.admin.role !== 'admin') {
    return res.status(403).json({ error: 'لا تملك صلاحية تصدير البيانات الشخصية.' });
  }
  const { where, params } = buildFilter(req.query);
  const records = db.get().prepare(`
    SELECT id, name, phone, gender, age, ${AGE_GROUP_SQL} AS age_group,
           heart_rate, hr_class, hr_points, pbf, pbf_class, pbf_points,
           total_points, bio_age, age_diff, created_at
    FROM assessments ${where} ORDER BY id
  `).all(...params);

  const header = ['رقم السجل'];
  if (includePii) header.push('الاسم', 'رقم التواصل');
  header.push('الجنس', 'العمر', 'الفئة العمرية', 'النبض', 'تصنيف النبض', 'نقاط النبض',
    'PBF %', 'تصنيف PBF', 'نقاط PBF', 'مجموع النقاط', 'العمر التقديري', 'الفارق', 'تاريخ ووقت التقييم (UTC)');

  const rows = [header];
  for (const r of records) {
    const row = [r.id];
    if (includePii) row.push(r.name, r.phone);
    row.push(GENDER_LABEL[r.gender], r.age, r.age_group, r.heart_rate, r.hr_class, r.hr_points,
      r.pbf, r.pbf_class, r.pbf_points, r.total_points, r.bio_age, r.age_diff, r.created_at);
    rows.push(row);
  }
  auth.audit(req, includePii ? 'export_records_pii' : 'export_records', { filter: req.query, count: records.length });
  sendCsv(res, `biological-age-records${includePii ? '-pii' : ''}-${stamp()}.csv`, rows);
});

// ───────── السجلات الفردية (admin فقط) ─────────
router.get('/assessments', auth.requireRole('admin'), (req, res) => {
  const { where, params } = buildFilter(req.query);
  const q = String(req.query.q || '').trim().slice(0, 100);
  let fullWhere = where;
  const fullParams = [...params];
  if (q) {
    const cond = '(name LIKE ? OR phone LIKE ? OR CAST(id AS TEXT) = ?)';
    fullWhere = where ? `${where} AND ${cond}` : `WHERE ${cond}`;
    fullParams.push(`%${q}%`, `%${q}%`, q);
  }
  const pageSize = 20;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const d = db.get();
  const { total } = d.prepare(`SELECT COUNT(*) AS total FROM assessments ${fullWhere}`).get(...fullParams);
  const items = d.prepare(`
    SELECT id, name, gender, age, phone, heart_rate, hr_class, hr_points,
           pbf, pbf_class, pbf_points, total_points, bio_age, age_diff, created_at
    FROM assessments ${fullWhere} ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(...fullParams, pageSize, (page - 1) * pageSize);
  auth.audit(req, 'view_records', { page, q: q || undefined });
  res.json({ items, total, page, pageSize });
});

router.delete('/assessments/:id', auth.requireRole('admin'), (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'رقم سجل غير صالح.' });
  const info = db.get().prepare('DELETE FROM assessments WHERE id = ?').run(id);
  if (!info.changes) return res.status(404).json({ error: 'السجل غير موجود.' });
  auth.audit(req, 'delete_record', { id });
  res.json({ ok: true });
});

/** حذف جماعي للسجلات المنشأة قبل تاريخ محدد (تنفيذ سياسة الاحتفاظ يدويًا). */
router.post('/assessments/purge', auth.requireRole('admin'), (req, res) => {
  const before = String((req.body || {}).before || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(before) || Number.isNaN(Date.parse(before))) {
    return res.status(400).json({ error: 'يرجى تحديد تاريخ صحيح.' });
  }
  const cutoff = `${before}T00:00:00.000Z`;
  const info = db.get().prepare('DELETE FROM assessments WHERE created_at < ?').run(cutoff);
  const deleted = Number(info.changes);
  auth.audit(req, 'purge_records', { before, deleted });
  res.json({ ok: true, deleted });
});

// ───────── الحساب الشخصي ─────────
const MIN_PASSWORD = 12;

router.post('/me/password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const row = db.get().prepare('SELECT password_hash FROM admins WHERE id = ?').get(req.admin.id);
  if (!row || !auth.verifyPassword(String(currentPassword || ''), row.password_hash)) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  }
  if (String(newPassword || '').length < MIN_PASSWORD) {
    return res.status(400).json({ error: `يجب ألا تقل كلمة المرور الجديدة عن ${MIN_PASSWORD} حرفًا.` });
  }
  db.get().prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(auth.hashPassword(newPassword), req.admin.id);
  auth.endOtherSessions(req.admin.id, req);
  auth.audit(req, 'change_own_password');
  res.json({ ok: true });
});

// ───────── إدارة الحسابات (admin فقط) ─────────
const USERNAME_RE = /^[A-Za-z0-9._-]{3,40}$/;

function activeAdminCount(excludeId) {
  return db.get()
    .prepare("SELECT COUNT(*) AS n FROM admins WHERE role = 'admin' AND active = 1 AND id != ?")
    .get(excludeId).n;
}

router.get('/users', auth.requireRole('admin'), (req, res) => {
  const users = db.get().prepare(`
    SELECT id, username, display_name, role, active, created_at, last_login_at
    FROM admins ORDER BY active DESC, username
  `).all();
  res.json({ users });
});

router.post('/users', auth.requireRole('admin'), (req, res) => {
  const { username, displayName, role, password } = req.body || {};
  const u = String(username || '').trim();
  const name = String(displayName || '').replace(/\s+/g, ' ').trim() || u;
  if (!USERNAME_RE.test(u)) return res.status(400).json({ error: 'اسم المستخدم: 3–40 حرفًا لاتينيًا أو أرقامًا أو (. _ -).' });
  if (!['admin', 'analyst'].includes(role)) return res.status(400).json({ error: 'دور غير صالح.' });
  if (name.length > 80) return res.status(400).json({ error: 'الاسم المعروض طويل جدًا.' });
  if (String(password || '').length < MIN_PASSWORD) {
    return res.status(400).json({ error: `يجب ألا تقل كلمة المرور عن ${MIN_PASSWORD} حرفًا.` });
  }
  const exists = db.get().prepare('SELECT 1 FROM admins WHERE username = ?').get(u);
  if (exists) return res.status(409).json({ error: 'اسم المستخدم مستخدم مسبقًا.' });
  const info = db.get()
    .prepare('INSERT INTO admins (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(u, name, auth.hashPassword(password), role);
  auth.audit(req, 'create_user', { id: Number(info.lastInsertRowid), username: u, role });
  res.status(201).json({ ok: true });
});

router.patch('/users/:id', auth.requireRole('admin'), (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const user = db.get().prepare('SELECT * FROM admins WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'الحساب غير موجود.' });
  const { role, active, password } = req.body || {};
  const changes = {};

  if (role !== undefined) {
    if (!['admin', 'analyst'].includes(role)) return res.status(400).json({ error: 'دور غير صالح.' });
    changes.role = role;
  }
  if (active !== undefined) changes.active = active ? 1 : 0;
  if (password !== undefined) {
    if (String(password).length < MIN_PASSWORD) {
      return res.status(400).json({ error: `يجب ألا تقل كلمة المرور عن ${MIN_PASSWORD} حرفًا.` });
    }
    changes.password_hash = auth.hashPassword(password);
  }
  if (!Object.keys(changes).length) return res.status(400).json({ error: 'لا توجد تغييرات.' });

  if (id === req.admin.id && (changes.active === 0 || changes.role === 'analyst')) {
    return res.status(400).json({ error: 'لا يمكنك تعطيل حسابك أو خفض صلاحيته بنفسك.' });
  }
  const losesAdmin = user.role === 'admin' && user.active === 1 && (changes.active === 0 || changes.role === 'analyst');
  if (losesAdmin && activeAdminCount(id) === 0) {
    return res.status(400).json({ error: 'يجب أن يبقى حساب مدير نشط واحد على الأقل.' });
  }

  const sets = Object.keys(changes).map((k) => `${k} = ?`).join(', ');
  db.get().prepare(`UPDATE admins SET ${sets} WHERE id = ?`).run(...Object.values(changes), id);
  // إنهاء جلسات الحساب عند تعطيله أو تغيير صلاحيته أو كلمة مروره
  db.get().prepare('DELETE FROM sessions WHERE admin_id = ?').run(id);
  auth.audit(req, 'update_user', {
    id, username: user.username,
    role: changes.role, active: changes.active, passwordReset: password !== undefined || undefined,
  });
  res.json({ ok: true });
});

// ───────── سجل التدقيق (admin فقط) ─────────
router.get('/audit', auth.requireRole('admin'), (req, res) => {
  const items = db.get().prepare(`
    SELECT l.id, l.action, l.details, l.ip, l.created_at, a.username
    FROM audit_log l LEFT JOIN admins a ON a.id = l.admin_id
    ORDER BY l.id DESC LIMIT 200
  `).all();
  res.json({ items });
});

module.exports = router;
