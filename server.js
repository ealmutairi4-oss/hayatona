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

const { n } = db.get().prepare('SELECT COUNT(*) AS n FROM admins').get();
if (n === 0) {
  console.warn('⚠ لا توجد حسابات إدارة. أنشئ حسابًا: npm run create-admin -- <username> admin');
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
