'use strict';

const express = require('express');
const db = require('../db');
const config = require('../config');
const { validateAssessment, MSG } = require('../validation');
const { classify, compute } = require('../scoring');
const { buildRecommendations } = require('../recommendations');
const { rateLimit, randomToken, sha256, noStore } = require('../security');

const router = express.Router();
router.use(noStore);

const GENDER_LABEL = { male: 'ذكر', female: 'أنثى' };

const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: config.submitRateLimit,
  message: 'عدد كبير من المحاولات. يرجى المحاولة بعد قليل.',
});

function tone(points) {
  if (points < 0) return 'good';
  if (points === 0) return 'neutral';
  return 'attention';
}

/** يبني الاستجابة المعروضة للموظف — بدون نقاط أو حدود جداول التصنيف. */
function toPublicResult(row) {
  return {
    name: row.name,
    gender: row.gender,
    genderLabel: GENDER_LABEL[row.gender],
    age: row.age,
    bioAge: row.bio_age,
    ageDiff: row.age_diff,
    heartRate: { value: row.heart_rate, label: row.hr_class, tone: tone(row.hr_points) },
    pbf: { value: row.pbf, label: row.pbf_class, tone: tone(row.pbf_points) },
    recommendations: buildRecommendations(row.hr_code, row.pbf_code),
    createdAt: row.created_at,
  };
}

router.post('/assessments', submitLimiter, (req, res) => {
  const { errors, values } = validateAssessment(req.body);
  if (Object.keys(errors).length) {
    return res.status(422).json({ error: 'يرجى تصحيح الحقول المشار إليها.', fields: errors });
  }

  const hr = classify('hr', values.heartRate);
  const pbf = classify('pbf', values.pbf);
  const rangeErrors = {};
  if (!hr) rangeErrors.heartRate = MSG.outOfRange;
  if (!pbf) rangeErrors.pbf = MSG.outOfRange;
  if (Object.keys(rangeErrors).length) {
    // لا يُحسب العمر التقديري ولا يُحفظ أي سجل لقيمة خارج نطاق التصنيف
    return res.status(422).json({ error: 'يرجى تصحيح الحقول المشار إليها.', fields: rangeErrors });
  }

  const { totalPoints, bioAge, ageDiff } = compute(values.age, hr, pbf);
  const viewToken = randomToken();

  const info = db.get().prepare(`
    INSERT INTO assessments
      (name, gender, age, phone, heart_rate, hr_code, hr_class, hr_points,
       pbf, pbf_code, pbf_class, pbf_points, total_points, bio_age, age_diff, view_token_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    values.name, values.gender, values.age, values.phone,
    values.heartRate, hr.code, hr.label, hr.points,
    values.pbf, pbf.code, pbf.label, pbf.points,
    totalPoints, bioAge, ageDiff, sha256(viewToken),
  );

  const row = db.get().prepare('SELECT * FROM assessments WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: viewToken, result: toPublicResult(row) });
});

router.get('/results/:token', (req, res) => {
  const token = String(req.params.token || '');
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) {
    return res.status(404).json({ error: 'النتيجة غير متاحة.' });
  }
  const row = db.get().prepare('SELECT * FROM assessments WHERE view_token_hash = ?').get(sha256(token));
  const expired = row && Date.now() - Date.parse(row.created_at) > config.resultLinkHours * 3600 * 1000;
  if (!row || expired) {
    return res.status(404).json({ error: 'انتهت صلاحية رابط النتيجة أو أنه غير صحيح.' });
  }
  res.json({ result: toPublicResult(row) });
});

module.exports = router;
