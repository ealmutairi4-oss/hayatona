'use strict';

process.env.DB_FILE = ':memory:';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/db');
const { classify, compute } = require('../src/scoring');
const { validateAssessment, MSG } = require('../src/validation');
const { hashPassword } = require('../src/auth');
const { createApp } = require('../src/app');
const { t } = require('../src/i18n');

let server;
let base;

before(async () => {
  db.open(':memory:');
  const insert = db.get().prepare('INSERT INTO admins (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)');
  insert.run('boss', 'المدير', hashPassword('correct-horse-battery'), 'admin');
  insert.run('analyst', 'المحلل', hashPassword('analyst-password-1'), 'analyst');
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => { server.close(); db.close(); });

const valid = { name: 'محمد أحمد', gender: 'male', age: '36', phone: '0551234567', heartRate: '90', pbf: '18.5' };

async function post(path, body, headers = {}) {
  const res = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json(), headers: res.headers };
}

async function login(username, password) {
  const res = await post('/api/admin/login', { username, password });
  assert.equal(res.status, 200);
  return res.headers.get('set-cookie').split(';')[0];
}

// ───────── التصنيف ─────────
test('حدود نبض القلب', () => {
  const cases = [[1, -9], [78, -9], [79, -6], [84, -6], [85, -3], [98, -3], [99, 0], [108, 0],
    [109, 3], [117, 3], [118, 6], [126, 6], [127, 9], [140, 9], [141, 12], [250, 12]];
  for (const [hr, pts] of cases) assert.equal(classify('hr', hr).points, pts, `HR ${hr}`);
});

test('حدود PBF مع الكسور العشرية', () => {
  const cases = [[10, 1], [13.99, 1], [14, -2], [20.99, -2], [21, -1], [24.99, -1], [25, 0],
    [31.99, 0], [32, 1], [39.99, 1], [40, 2], [100, 2]];
  for (const [v, pts] of cases) assert.equal(classify('pbf', v).points, pts, `PBF ${v}`);
  assert.equal(classify('pbf', 9.99), null);
  assert.equal(classify('pbf', 0), null);
});

test('المعادلة: مثال المواصفات (36 سنة، مجموع −2 → 34)', () => {
  const r = compute(36, { points: -3 }, { points: 1 });
  assert.deepEqual(r, { totalPoints: -2, bioAge: 34, ageDiff: -2 });
});

// ───────── التحقق ─────────
test('التحقق من المدخلات', () => {
  assert.deepEqual(validateAssessment(valid).errors, {});
  assert.equal(validateAssessment({ ...valid, age: '17' }).errors.age, MSG.ageMin);
  assert.equal(validateAssessment({ ...valid, heartRate: '0' }).errors.heartRate, MSG.hrPositive);
  assert.equal(validateAssessment({ ...valid, heartRate: '90.5' }).errors.heartRate, MSG.hrNumber);
  assert.equal(validateAssessment({ ...valid, heartRate: 'abc' }).errors.heartRate, MSG.hrNumber);
  assert.equal(validateAssessment({ ...valid, pbf: '-1' }).errors.pbf, MSG.pbfRange);
  assert.equal(validateAssessment({ ...valid, pbf: '100.1' }).errors.pbf, MSG.pbfRange);
  assert.equal(validateAssessment({ ...valid, gender: 'x' }).errors.gender, MSG.gender);
  const arabic = validateAssessment({ ...valid, age: '٣٦', heartRate: '٩٠', pbf: '١٨٫٥', phone: '٠٥٥١٢٣٤٥٦٧' });
  assert.deepEqual(arabic.errors, {});
  assert.equal(arabic.values.pbf, 18.5);
  assert.equal(arabic.values.phone, '0551234567');
});

// ───────── واجهة الموظف ─────────
test('إرسال تقييم صالح يعيد النتيجة بدون نقاط أو جداول', async () => {
  const { status, data } = await post('/api/assessments', valid);
  assert.equal(status, 201);
  assert.equal(data.result.age, 36);
  assert.equal(data.result.bioAge, 31); // −3 (جيد جدًا) + −2 (رياضية)
  assert.equal(data.result.ageDiff, -5);
  assert.equal(data.result.heartRate.label, 'جيد جدًا');
  assert.equal(data.result.pbf.label, 'رياضية (Athletes)');
  const json = JSON.stringify(data);
  assert.ok(!json.includes('points') && !json.includes('min_value'));

  const view = await fetch(`${base}/api/results/${data.token}`).then((r) => r.json());
  assert.equal(view.result.bioAge, 31);
});

test('PBF أقل من 10% يُرفض برسالة المواصفات ولا يُحفظ', async () => {
  const before = db.get().prepare('SELECT COUNT(*) AS n FROM assessments').get().n;
  const { status, data } = await post('/api/assessments', { ...valid, pbf: '8' });
  assert.equal(status, 422);
  assert.equal(data.fields.pbf, t('ar', 'v.outOfRange'));
  assert.equal(data.fields.pbf, 'القيمة خارج نطاق التصنيف المعتمد. يرجى مراجعة قراءة الجهاز أو التأكد من إدخالها.');
  const afterCount = db.get().prepare('SELECT COUNT(*) AS n FROM assessments').get().n;
  assert.equal(afterCount, before);
});

test('مدخلات غير مكتملة لا تُحفظ', async () => {
  const { status, data } = await post('/api/assessments', { ...valid, name: '', age: '15' });
  assert.equal(status, 422);
  assert.ok(data.fields.name && data.fields.age);
});

test('رفض الطلبات من أصل مختلف', async () => {
  const { status } = await post('/api/assessments', valid, { Origin: 'https://evil.example' });
  assert.equal(status, 403);
});

// ───────── الإدارة والصلاحيات ─────────
test('واجهات الإدارة تتطلب تسجيل الدخول', async () => {
  assert.equal((await fetch(`${base}/api/admin/stats`)).status, 401);
  assert.equal((await post('/api/admin/login', { username: 'boss', password: 'wrong' })).status, 401);
});

test('المدير: إحصاءات وسجلات وتصدير وحذف', async () => {
  await post('/api/assessments', { ...valid, gender: 'female', age: '45', heartRate: '145', pbf: '41' });
  const cookie = await login('boss', 'correct-horse-battery');
  const h = { headers: { Cookie: cookie } };

  const stats = await fetch(`${base}/api/admin/stats`, h).then((r) => r.json());
  assert.ok(stats.summary.count >= 2);
  assert.equal(stats.hrDistribution.length, 8);
  assert.equal(stats.pbfDistribution.length, 6);
  assert.equal(stats.byAgeGroup.find((g) => g.key === '40–49').count, 1);

  const records = await fetch(`${base}/api/admin/assessments`, h).then((r) => r.json());
  assert.ok(records.items[0].name && records.items[0].phone);

  const csv = await fetch(`${base}/api/admin/export/records.csv`, h).then((r) => r.text());
  assert.ok(!csv.includes('محمد أحمد') && !csv.includes('0551234567'), 'التصدير الافتراضي بدون بيانات شخصية');
  const csvPii = await fetch(`${base}/api/admin/export/records.csv?pii=1`, h).then((r) => r.text());
  assert.ok(csvPii.includes('محمد أحمد'));
  const statsCsv = await fetch(`${base}/api/admin/export/stats.csv`, h).then((r) => r.text());
  assert.ok(statsCsv.includes('توزيع تصنيفات اختبار الخطوة') && !statsCsv.includes('محمد'));

  const id = records.items[0].id;
  const del = await fetch(`${base}/api/admin/assessments/${id}`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.equal(del.status, 200);
  const audit = db.get().prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'delete_record'").get().n;
  assert.equal(audit, 1);
});

test('المحلل: تقارير مجمعة فقط', async () => {
  const cookie = await login('analyst', 'analyst-password-1');
  const h = { headers: { Cookie: cookie } };
  assert.equal((await fetch(`${base}/api/admin/stats`, h)).status, 200);
  assert.equal((await fetch(`${base}/api/admin/assessments`, h)).status, 403);
  assert.equal((await fetch(`${base}/api/admin/export/records.csv?pii=1`, h)).status, 403);
  assert.equal((await fetch(`${base}/api/admin/export/records.csv`, h)).status, 200);
});

// ───────── إدارة الحسابات والحذف الجماعي ─────────
test('إدارة الحسابات: إنشاء وتعطيل وحماية آخر مدير', async () => {
  const cookie = await login('boss', 'correct-horse-battery');
  const send = (method, path, body) => fetch(base + path, {
    method, headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });

  assert.equal((await send('POST', '/api/admin/users', { username: 'nurse1', role: 'analyst', password: 'short' })).status, 400);
  assert.equal((await send('POST', '/api/admin/users', { username: 'nurse1', displayName: 'ممرضة', role: 'analyst', password: 'nurse-password-1' })).status, 201);
  assert.equal((await send('POST', '/api/admin/users', { username: 'nurse1', role: 'analyst', password: 'nurse-password-1' })).status, 409);
  const nurseCookie = await login('nurse1', 'nurse-password-1');

  const { users } = await fetch(`${base}/api/admin/users`, { headers: { Cookie: cookie } }).then((r) => r.json());
  const nurse = users.find((u) => u.username === 'nurse1');
  const boss = users.find((u) => u.username === 'boss');

  // تعطيل الحساب ينهي جلساته فورًا
  assert.equal((await send('PATCH', `/api/admin/users/${nurse.id}`, { active: false })).status, 200);
  assert.equal((await fetch(`${base}/api/admin/stats`, { headers: { Cookie: nurseCookie } })).status, 401);
  assert.equal((await post('/api/admin/login', { username: 'nurse1', password: 'nurse-password-1' })).status, 401);

  // لا يمكن للمدير تعطيل نفسه
  assert.equal((await send('PATCH', `/api/admin/users/${boss.id}`, { active: false })).status, 400);

  // المحلل لا يدير الحسابات
  const analystCookie = await login('analyst', 'analyst-password-1');
  assert.equal((await fetch(`${base}/api/admin/users`, { headers: { Cookie: analystCookie } })).status, 403);
});

test('تغيير كلمة المرور الشخصية', async () => {
  const cookie = await login('analyst', 'analyst-password-1');
  const change = (body) => fetch(`${base}/api/admin/me/password`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  assert.equal((await change({ currentPassword: 'wrong', newPassword: 'analyst-password-2' })).status, 400);
  assert.equal((await change({ currentPassword: 'analyst-password-1', newPassword: 'analyst-password-2' })).status, 200);
  assert.equal((await post('/api/admin/login', { username: 'analyst', password: 'analyst-password-1' })).status, 401);
  await login('analyst', 'analyst-password-2');
});

test('الحذف الجماعي حسب التاريخ وسجل التدقيق', async () => {
  db.get().prepare("UPDATE assessments SET created_at = '2020-01-01T10:00:00.000Z' WHERE id = (SELECT MIN(id) FROM assessments)").run();
  const cookie = await login('boss', 'correct-horse-battery');
  const res = await fetch(`${base}/api/admin/assessments/purge`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ before: '2021-01-01' }),
  }).then((r) => r.json());
  assert.equal(res.deleted, 1);
  const audit = await fetch(`${base}/api/admin/audit`, { headers: { Cookie: cookie } }).then((r) => r.json());
  assert.ok(audit.items.some((a) => a.action === 'purge_records'));
  assert.ok(audit.items.some((a) => a.action === 'create_user'));
});

// ───────── اللغة الإنجليزية ─────────
test('English: validation messages, labels and recommendations', async () => {
  const bad = await post('/api/assessments', { ...valid, pbf: '8' }, { 'X-Lang': 'en' });
  assert.equal(bad.status, 422);
  assert.match(bad.data.fields.pbf, /outside the approved classification range/);

  const ok = await post('/api/assessments', valid, { 'X-Lang': 'en' });
  assert.equal(ok.status, 201);
  assert.equal(ok.data.result.heartRate.label, 'Very good');
  assert.equal(ok.data.result.pbf.label, 'Athletes');
  assert.equal(ok.data.result.genderLabel, 'Male');
  assert.match(ok.data.result.recommendations.general[0].text, /World Health Organization/);

  // نفس النتيجة بالعربية عند الطلب بدون لغة
  const ar = await fetch(`${base}/api/results/${ok.data.token}`).then((r) => r.json());
  assert.equal(ar.result.heartRate.label, 'جيد جدًا');
  const en = await fetch(`${base}/api/results/${ok.data.token}`, { headers: { 'X-Lang': 'en' } }).then((r) => r.json());
  assert.equal(en.result.pbf.label, 'Athletes');

  const cookie = await login('boss', 'correct-horse-battery');
  const stats = await fetch(`${base}/api/admin/stats`, { headers: { Cookie: cookie, 'X-Lang': 'en' } }).then((r) => r.json());
  assert.equal(stats.hrDistribution[0].label, 'Professional');
  assert.equal(stats.byGender[0].label, 'Male');
  const csv = await fetch(`${base}/api/admin/export/stats.csv?lang=en`, { headers: { Cookie: cookie } }).then((r) => r.text());
  assert.ok(csv.includes('Step test classification distribution'));
  const err = await fetch(`${base}/api/admin/stats`, { headers: { 'X-Lang': 'en' } }).then((r) => r.json());
  assert.equal(err.error, 'Please sign in.');
});
