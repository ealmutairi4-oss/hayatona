'use strict';

const crypto = require('node:crypto');
const db = require('./db');
const config = require('./config');
const { randomToken, sha256 } = require('./security');

const COOKIE = 'ba_admin';
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p),
  });
  return crypto.timingSafeEqual(actual, expected);
}

// قيمة وهمية لموازنة زمن الاستجابة عند عدم وجود المستخدم
const DUMMY_HASH = hashPassword(randomToken());

function authenticate(username, password) {
  const admin = db.get()
    .prepare('SELECT * FROM admins WHERE username = ? AND active = 1')
    .get(String(username ?? '').trim());
  const ok = verifyPassword(String(password ?? ''), admin ? admin.password_hash : DUMMY_HASH);
  return ok && admin ? admin : null;
}

function idleMs() {
  return config.sessionIdleMinutes * 60 * 1000;
}

function createSession(adminId) {
  const token = randomToken();
  const now = Date.now();
  db.get()
    .prepare('INSERT INTO sessions (token_hash, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(sha256(token), adminId, now + idleMs(), now);
  return token;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    path: '/',
    maxAge: idleMs(),
  };
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1 && part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

function destroySession(req) {
  const token = readCookie(req, COOKIE);
  if (token) db.get().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

/** يتحقق من جلسة الإدارة ويجدد مدتها. */
function requireAdmin(req, res, next) {
  const token = readCookie(req, COOKIE);
  if (!token) return res.status(401).json({ error: 'يرجى تسجيل الدخول.' });
  const d = db.get();
  const now = Date.now();
  const row = d.prepare(`
    SELECT s.token_hash, s.expires_at, a.id, a.username, a.display_name, a.role
    FROM sessions s JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ? AND a.active = 1
  `).get(sha256(token));
  if (!row || row.expires_at < now) {
    if (row) d.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
    res.clearCookie(COOKIE, { path: '/' });
    return res.status(401).json({ error: 'انتهت الجلسة. يرجى تسجيل الدخول مجددًا.' });
  }
  d.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').run(now + idleMs(), row.token_hash);
  res.cookie(COOKIE, token, cookieOptions());
  req.admin = { id: row.id, username: row.username, displayName: row.display_name, role: row.role };
  next();
}

/** يقصر الوصول على دور محدد (مثل مشاهدة السجلات الفردية لدور admin فقط). */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.admin || req.admin.role !== role) {
      return res.status(403).json({ error: 'لا تملك صلاحية الوصول إلى هذه البيانات.' });
    }
    next();
  };
}

/** إنهاء جميع جلسات الحساب ما عدا الجلسة الحالية (بعد تغيير كلمة المرور). */
function endOtherSessions(adminId, req) {
  const current = readCookie(req, COOKIE);
  db.get()
    .prepare('DELETE FROM sessions WHERE admin_id = ? AND token_hash != ?')
    .run(adminId, current ? sha256(current) : '');
}

function purgeExpiredSessions() {
  db.get().prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}

function audit(req, action, details) {
  db.get()
    .prepare('INSERT INTO audit_log (admin_id, action, details, ip) VALUES (?, ?, ?, ?)')
    .run(req.admin ? req.admin.id : null, action, details ? JSON.stringify(details) : null, req.ip || null);
}

module.exports = {
  COOKIE, hashPassword, verifyPassword, authenticate, createSession, destroySession,
  cookieOptions, requireAdmin, requireRole, purgeExpiredSessions, endOtherSessions, audit,
};
