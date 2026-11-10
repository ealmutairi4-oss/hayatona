'use strict';

const db = require('./db');
const { t } = require('./i18n');

const AGE_GROUP_SQL = `
  CASE
    WHEN age < 30 THEN '18–29'
    WHEN age < 40 THEN '30–39'
    WHEN age < 50 THEN '40–49'
    WHEN age < 60 THEN '50–59'
    ELSE '60+'
  END`;

const AGE_GROUPS = ['18–29', '30–39', '40–49', '50–59', '60+'];

/** يبني شرط WHERE من مرشحات التاريخ والجنس والفئة العمرية. */
function buildFilter(query = {}) {
  const clauses = [];
  const params = [];
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRe.test(query.from || '')) {
    clauses.push('created_at >= ?');
    params.push(`${query.from}T00:00:00.000Z`);
  }
  if (dateRe.test(query.to || '')) {
    clauses.push('created_at <= ?');
    params.push(`${query.to}T23:59:59.999Z`);
  }
  if (query.gender === 'male' || query.gender === 'female') {
    clauses.push('gender = ?');
    params.push(query.gender);
  }
  if (AGE_GROUPS.includes(query.ageGroup)) {
    clauses.push(`(${AGE_GROUP_SQL}) = ?`);
    params.push(query.ageGroup);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

function round1(n) {
  return n === null || n === undefined ? null : Math.round(n * 10) / 10;
}

const AGG_COLUMNS = `
  COUNT(*)            AS count,
  AVG(total_points)   AS avgPoints,
  AVG(age)            AS avgAge,
  AVG(bio_age)        AS avgBioAge,
  AVG(age_diff)       AS avgDiff,
  SUM(age_diff < 0)   AS younger,
  SUM(age_diff = 0)   AS same,
  SUM(age_diff > 0)   AS older`;

function shapeAgg(row) {
  return {
    count: row.count || 0,
    avgPoints: round1(row.avgPoints),
    avgAge: round1(row.avgAge),
    avgBioAge: round1(row.avgBioAge),
    avgDiff: round1(row.avgDiff),
    younger: row.younger || 0,
    same: row.same || 0,
    older: row.older || 0,
  };
}

function distribution(test, column, where, params, lang) {
  const d = db.get();
  const rules = d.prepare('SELECT code, label, label_en, points FROM scoring_rules WHERE test = ? ORDER BY sort_order').all(test)
    .map((r) => ({ ...r, label: lang === 'en' && r.label_en ? r.label_en : r.label }));
  const counts = new Map(
    d.prepare(`SELECT ${column} AS code, COUNT(*) AS n FROM assessments ${where} GROUP BY ${column}`)
      .all(...params)
      .map((r) => [r.code, r.n]),
  );
  return rules.map((r) => ({ code: r.code, label: r.label, points: r.points, count: counts.get(r.code) || 0 }));
}

function getStats(query, lang = 'ar') {
  const G = (g) => t(lang, `gender_${g}`);
  const d = db.get();
  const { where, params } = buildFilter(query);

  const summary = shapeAgg(d.prepare(`SELECT ${AGG_COLUMNS} FROM assessments ${where}`).get(...params));

  const byGenderRows = d.prepare(`SELECT gender, ${AGG_COLUMNS} FROM assessments ${where} GROUP BY gender`).all(...params);
  const byGender = ['male', 'female'].map((g) => {
    const row = byGenderRows.find((r) => r.gender === g) || {};
    return { key: g, label: G(g), ...shapeAgg(row) };
  });

  const byAgeRows = d.prepare(`SELECT ${AGE_GROUP_SQL} AS grp, ${AGG_COLUMNS} FROM assessments ${where} GROUP BY grp`).all(...params);
  const byAgeGroup = AGE_GROUPS.map((g) => {
    const row = byAgeRows.find((r) => r.grp === g) || {};
    return { key: g, label: g, ...shapeAgg(row) };
  });

  const crossRows = d.prepare(`
    SELECT gender, ${AGE_GROUP_SQL} AS grp, ${AGG_COLUMNS}
    FROM assessments ${where} GROUP BY gender, grp
  `).all(...params);
  const byGenderAgeGroup = [];
  for (const g of ['male', 'female']) {
    for (const a of AGE_GROUPS) {
      const row = crossRows.find((r) => r.gender === g && r.grp === a);
      if (row) byGenderAgeGroup.push({ gender: g, genderLabel: G(g), ageGroup: a, ...shapeAgg(row) });
    }
  }

  return {
    summary,
    hrDistribution: distribution('hr', 'hr_code', where, params, lang),
    pbfDistribution: distribution('pbf', 'pbf_code', where, params, lang),
    byGender,
    byAgeGroup,
    byGenderAgeGroup,
  };
}

module.exports = { getStats, buildFilter, AGE_GROUP_SQL, AGE_GROUPS };
