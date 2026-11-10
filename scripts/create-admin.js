'use strict';

/**
 * إنشاء حساب إدارة أو تحديث كلمة مروره.
 *   npm run create-admin -- <username> [admin|analyst] ["الاسم المعروض"]
 * تُطلب كلمة المرور بشكل تفاعلي، أو تُقرأ من متغير ADMIN_PASSWORD.
 *   admin   : التقارير المجمعة + السجلات الفردية + الحذف + تصدير البيانات الشخصية
 *   analyst : التقارير المجمعة والتصدير الإحصائي فقط
 */
const readline = require('node:readline');
const db = require('../src/db');
const { hashPassword } = require('../src/auth');

const [username, role = 'admin', displayName] = process.argv.slice(2);

if (!username || !/^[A-Za-z0-9._-]{3,40}$/.test(username) || !['admin', 'analyst'].includes(role)) {
  console.error('الاستخدام: npm run create-admin -- <username> [admin|analyst] ["الاسم المعروض"]');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

(async () => {
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await askHidden('كلمة المرور (12 حرفًا على الأقل): ');
    const confirm = await askHidden('تأكيد كلمة المرور: ');
    if (password !== confirm) { console.error('كلمتا المرور غير متطابقتين.'); process.exit(1); }
  }
  if (password.length < 12) { console.error('يجب ألا تقل كلمة المرور عن 12 حرفًا.'); process.exit(1); }

  db.open();
  const hash = hashPassword(password);
  const existing = db.get().prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (existing) {
    db.get().prepare('UPDATE admins SET password_hash = ?, role = ?, active = 1, display_name = COALESCE(?, display_name) WHERE id = ?')
      .run(hash, role, displayName || null, existing.id);
    console.log(`تم تحديث الحساب: ${username} (${role})`);
  } else {
    db.get().prepare('INSERT INTO admins (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(username, displayName || username, hash, role);
    console.log(`تم إنشاء الحساب: ${username} (${role})`);
  }
  db.close();
})();
