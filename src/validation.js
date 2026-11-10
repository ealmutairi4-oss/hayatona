'use strict';

// رموز رسائل التحقق — تُترجم في src/i18n.js بالمفاتيح v.<code>
const MSG = {
  required: 'required', nameLength: 'nameLength', gender: 'gender',
  ageNumber: 'ageNumber', ageMin: 'ageMin', ageMax: 'ageMax', phone: 'phone',
  hrNumber: 'hrNumber', hrPositive: 'hrPositive', hrMax: 'hrMax',
  pbfNumber: 'pbfNumber', pbfRange: 'pbfRange', outOfRange: 'outOfRange',
};

const HR_MAX = 250; // حد منطقية فسيولوجية لاكتشاف أخطاء الإدخال

/** تحويل الأرقام العربية-الهندية والفارسية إلى أرقام لاتينية، وتوحيد الفاصلة العشرية. */
function normalizeDigits(input) {
  return String(input ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٫,]/g, '.') // ٫ أو ، → نقطة عشرية
    .replace(/[٬]/g, '')   // فاصل الآلاف العربي
    .trim();
}

function parseInteger(raw) {
  const s = normalizeDigits(raw);
  if (!/^[+-]?\d+$/.test(s)) return null;
  return Number.parseInt(s, 10);
}

function parseDecimal(raw) {
  const s = normalizeDigits(raw).replace(/%$/, '').trim();
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(s)) return null;
  return Number.parseFloat(s);
}

/**
 * التحقق من صيغة المدخلات وصلاحيتها. لا يعتمد على جداول التصنيف.
 * يعيد { errors, values } — errors تحوي رموز الرسائل، وvalues صالحة فقط إذا كانت errors فارغة.
 */
function validateAssessment(body = {}) {
  const errors = {};
  const values = {};

  // الاسم
  const name = String(body.name ?? '').replace(/\s+/g, ' ').trim();
  if (!name) errors.name = MSG.required;
  else if (name.length < 2 || name.length > 100) errors.name = MSG.nameLength;
  else values.name = name;

  // الجنس
  const gender = String(body.gender ?? '').trim();
  if (!gender) errors.gender = MSG.gender;
  else if (gender !== 'male' && gender !== 'female') errors.gender = MSG.gender;
  else values.gender = gender;

  // العمر
  if (String(body.age ?? '').trim() === '') errors.age = MSG.required;
  else {
    const age = parseInteger(body.age);
    if (age === null) errors.age = MSG.ageNumber;
    else if (age < 18) errors.age = MSG.ageMin;
    else if (age > 120) errors.age = MSG.ageMax;
    else values.age = age;
  }

  // رقم التواصل
  const phoneRaw = normalizeDigits(body.phone).replace(/[\s\-()]/g, '');
  if (!phoneRaw) errors.phone = MSG.required;
  else if (!/^\+?\d{9,15}$/.test(phoneRaw)) errors.phone = MSG.phone;
  else values.phone = phoneRaw;

  // نبض القلب
  if (String(body.heartRate ?? '').trim() === '') errors.heartRate = MSG.required;
  else {
    const hr = parseInteger(body.heartRate);
    if (hr === null) errors.heartRate = MSG.hrNumber;
    else if (hr <= 0) errors.heartRate = MSG.hrPositive;
    else if (hr > HR_MAX) errors.heartRate = MSG.hrMax;
    else values.heartRate = hr;
  }

  // نسبة الدهون PBF
  if (String(body.pbf ?? '').trim() === '') errors.pbf = MSG.required;
  else {
    const pbf = parseDecimal(body.pbf);
    if (pbf === null) errors.pbf = MSG.pbfNumber;
    else if (pbf < 0 || pbf > 100) errors.pbf = MSG.pbfRange;
    else values.pbf = Math.round(pbf * 100) / 100;
  }

  return { errors, values };
}

module.exports = { validateAssessment, normalizeDigits, parseInteger, parseDecimal, MSG };
