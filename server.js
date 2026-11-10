'use strict';

const config = require('./src/config');
const db = require('./src/db');
const { purgeExpiredSessions } = require('./src/auth');
const { createApp } = require('./src/app');

db.open();

/** الحذف التلقائي للسجلات الأقدم من مدة الاحتفاظ المحددة (RETENTION_DAYS). */
function housekeeping() {
  purgeExpiredSessions();
  if (config.retentionDays > 0) {
    const cutoff = new Date(Date.now() - config.retentionDays * 86400000).toISOString();
    const info = db.get().prepare('DELETE FROM assessments WHERE created_at < ?').run(cutoff);
    if (info.changes) {
      db.get().prepare('INSERT INTO audit_log (action, details) VALUES (?, ?)')
        .run('retention_purge', JSON.stringify({ deleted: Number(info.changes), cutoff }));
    }
  }
}
housekeeping();
setInterval(housekeeping, 60 * 60 * 1000).unref();

/**
 * إنشاء أول حساب مدير تلقائيًا من متغيرات البيئة (مفيد في الاستضافات مثل Render).
 * يعمل فقط إذا لم يوجد أي حساب إدارة، ولا يغيّر الحسابات الموجودة أبدًا.
 */
const { n } = db.get().prepare('SELECT COUNT(*) AS n FROM admins').get();
if (n === 0) {
  const username = (process.env.ADMIN_USERNAME || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (/^[A-Za-z0-9._-]{3,40}$/.test(username) && password.length >= 12) {
    const { hashPassword } = require('./src/auth');
    db.get()
      .prepare("INSERT INTO admins (username, display_name, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run(username, process.env.ADMIN_DISPLAY_NAME || 'مدير النظام', hashPassword(password));
    console.log(`تم إنشاء حساب المدير الأول: ${username}`);
  } else {
    console.warn('⚠ لا توجد حسابات إدارة. اضبط ADMIN_USERNAME وADMIN_PASSWORD (12 حرفًا على الأقل)، أو نفّذ: npm run create-admin -- <username> admin');
  }
}

const server = createApp().listen(config.port, config.host, () => {
  console.log(`العمر البيولوجي — يعمل على http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
