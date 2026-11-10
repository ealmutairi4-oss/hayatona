'use strict';

const db = require('./db');

function loadRules(test) {
  return db.get()
    .prepare('SELECT * FROM scoring_rules WHERE test = ? ORDER BY sort_order')
    .all(test);
}

function inRange(value, rule) {
  if (rule.min_value !== null) {
    if (rule.min_inclusive ? value < rule.min_value : value <= rule.min_value) return false;
  }
  if (rule.max_value !== null) {
    if (rule.max_inclusive ? value > rule.max_value : value >= rule.max_value) return false;
  }
  return true;
}

/** يعيد قاعدة التصنيف المطابقة للقيمة، أو null إذا كانت خارج نطاق التصنيف المعتمد. */
function classify(test, value) {
  const rule = loadRules(test).find((r) => inRange(value, r));
  return rule ? { code: rule.code, label: rule.label, points: rule.points } : null;
}

/**
 * معادلات الموقع:
 *   مجموع النقاط = نقاط اختبار الخطوة + نقاط PBF
 *   العمر البيولوجي التقديري = العمر الزمني + مجموع النقاط
 *   الفارق = العمر البيولوجي التقديري − العمر الزمني
 */
function compute(age, hr, pbf) {
  const totalPoints = hr.points + pbf.points;
  const bioAge = age + totalPoints;
  return { totalPoints, bioAge, ageDiff: bioAge - age };
}

module.exports = { classify, compute, loadRules, inRange };
