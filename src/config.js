'use strict';

const path = require('node:path');

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  port: int(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  isProduction,
  dbFile: process.env.DB_FILE || path.join(__dirname, '..', 'data', 'biological-age.db'),
  // يُفعَّل عند التشغيل خلف وكيل عكسي (Nginx/Load Balancer) لقراءة عنوان IP الحقيقي
  trustProxy: process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true',
  // ملفات تعريف الارتباط الآمنة (HTTPS فقط) — مفعّلة افتراضيًا في الإنتاج
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction,
  // مدة صلاحية جلسة الإدارة بالدقائق (تتجدد مع الاستخدام)
  sessionIdleMinutes: int(process.env.SESSION_IDLE_MINUTES, 120),
  // مدة صلاحية رابط عرض النتيجة للموظف بالساعات
  resultLinkHours: int(process.env.RESULT_LINK_HOURS, 24),
  // مدة الاحتفاظ بالسجلات بالأيام (0 = بلا حذف تلقائي — يجب تحديدها وفق سياسة الجهة)
  retentionDays: int(process.env.RETENTION_DAYS, 0),
  // الحد الأقصى لعمليات الإرسال لكل عنوان IP خلال 10 دقائق (يُرفع إذا كانت العيادة تُدخل من جهاز واحد)
  submitRateLimit: int(process.env.SUBMIT_RATE_LIMIT, 120),
};
