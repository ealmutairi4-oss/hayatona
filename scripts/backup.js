'use strict';

/**
 * نسخة احتياطية متسقة من قاعدة البيانات أثناء تشغيل الموقع.
 *   npm run backup -- [مجلد_الحفظ]      (الافتراضي: ./backups)
 * يُحتفظ بآخر BACKUP_KEEP نسخة (الافتراضي 14). خزّن النسخ في موقع مشفّر وفق سياسة الجهة.
 */
const fs = require('node:fs');
const path = require('node:path');
const db = require('../src/db');

const dir = path.resolve(process.argv[2] || process.env.BACKUP_DIR || 'backups');
const keep = Number.parseInt(process.env.BACKUP_KEEP, 10) || 14;

fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const target = path.join(dir, `biological-age-${stamp}.db`);

db.open();
db.get().prepare('VACUUM INTO ?').run(target);
db.close();
fs.chmodSync(target, 0o600);
console.log(`تم إنشاء النسخة الاحتياطية: ${target}`);

const old = fs.readdirSync(dir)
  .filter((f) => /^biological-age-.*\.db$/.test(f))
  .sort()
  .slice(0, -keep);
old.forEach((f) => fs.unlinkSync(path.join(dir, f)));
if (old.length) console.log(`تم حذف ${old.length} نسخة قديمة.`);
