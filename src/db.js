'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

/**
 * جداول التصنيف المعتمدة داخل الموقع.
 * تُزرع في قاعدة البيانات عند أول تشغيل فقط، ولا تُرسل إلى واجهة المستخدم.
 * الحدود: min/max مع تحديد شمول الحد (inclusive) لتغطية القيم العشرية.
 */
const DEFAULT_RULES = [
  // نبض القلب بعد اختبار الخطوة (3 دقائق) — عدد صحيح
  { test: 'hr', code: 'hr_pro',        min: null, minInc: 0, max: 79,  maxInc: 0, label: 'محترف',          points: -9 },
  { test: 'hr', code: 'hr_excellent',  min: 79,   minInc: 1, max: 84,  maxInc: 1, label: 'ممتاز',          points: -6 },
  { test: 'hr', code: 'hr_very_good',  min: 85,   minInc: 1, max: 98,  maxInc: 1, label: 'جيد جدًا',       points: -3 },
  { test: 'hr', code: 'hr_good',       min: 99,   minInc: 1, max: 108, maxInc: 1, label: 'جيد',            points: 0 },
  { test: 'hr', code: 'hr_average',    min: 109,  minInc: 1, max: 117, maxInc: 1, label: 'المتوسط',        points: 3 },
  { test: 'hr', code: 'hr_below_avg',  min: 118,  minInc: 1, max: 126, maxInc: 1, label: 'أقل من المتوسط', points: 6 },
  { test: 'hr', code: 'hr_weak',       min: 127,  minInc: 1, max: 140, maxInc: 1, label: 'ضعيف',           points: 9 },
  { test: 'hr', code: 'hr_poor',       min: 140,  minInc: 0, max: null, maxInc: 0, label: 'فقير',          points: 12 },

  // نسبة الدهون في الجسم PBF — تقبل الكسور العشرية
  { test: 'pbf', code: 'pbf_essential', min: 10, minInc: 1, max: 14,   maxInc: 0, label: 'الدهون الأساسية (ضرورية للحياة)', points: 1 },
  { test: 'pbf', code: 'pbf_athlete',   min: 14, minInc: 1, max: 21,   maxInc: 0, label: 'رياضية (Athletes)',             points: -2 },
  { test: 'pbf', code: 'pbf_fitness',   min: 21, minInc: 1, max: 25,   maxInc: 0, label: 'لياقة عالية (Fitness)',         points: -1 },
  { test: 'pbf', code: 'pbf_normal',    min: 25, minInc: 1, max: 32,   maxInc: 0, label: 'مقبولة / طبيعية',               points: 0 },
  { test: 'pbf', code: 'pbf_overfat',   min: 32, minInc: 1, max: 40,   maxInc: 0, label: 'زيادة دهون (Overfat)',          points: 1 },
  { test: 'pbf', code: 'pbf_obese',     min: 40, minInc: 1, max: null, maxInc: 0, label: 'سمنة',                          points: 2 },
];

let db;

function open(file = config.dbFile) {
  if (db) return db;
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  seedRules(db);
  return db;
}

function migrate(d) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS scoring_rules (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      test          TEXT    NOT NULL CHECK (test IN ('hr', 'pbf')),
      code          TEXT    NOT NULL UNIQUE,
      min_value     REAL,
      min_inclusive INTEGER NOT NULL DEFAULT 1,
      max_value     REAL,
      max_inclusive INTEGER NOT NULL DEFAULT 0,
      label         TEXT    NOT NULL,
      points        INTEGER NOT NULL,
      sort_order    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      gender          TEXT    NOT NULL CHECK (gender IN ('male', 'female')),
      age             INTEGER NOT NULL CHECK (age >= 18),
      phone           TEXT    NOT NULL,
      heart_rate      INTEGER NOT NULL CHECK (heart_rate > 0),
      hr_code         TEXT    NOT NULL,
      hr_class        TEXT    NOT NULL,
      hr_points       INTEGER NOT NULL,
      pbf             REAL    NOT NULL CHECK (pbf >= 0 AND pbf <= 100),
      pbf_code        TEXT    NOT NULL,
      pbf_class       TEXT    NOT NULL,
      pbf_points      INTEGER NOT NULL,
      total_points    INTEGER NOT NULL,
      bio_age         INTEGER NOT NULL,
      age_diff        INTEGER NOT NULL,
      view_token_hash TEXT    NOT NULL UNIQUE,
      created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_assessments_created ON assessments (created_at);

    CREATE TABLE IF NOT EXISTS admins (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      display_name  TEXT    NOT NULL,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL CHECK (role IN ('admin', 'analyst')),
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash  TEXT    PRIMARY KEY,
      admin_id    INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
      expires_at  INTEGER NOT NULL,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id   INTEGER,
      action     TEXT    NOT NULL,
      details    TEXT,
      ip         TEXT,
      created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);
}

function seedRules(d) {
  const { n } = d.prepare('SELECT COUNT(*) AS n FROM scoring_rules').get();
  if (n > 0) return;
  const insert = d.prepare(`
    INSERT INTO scoring_rules (test, code, min_value, min_inclusive, max_value, max_inclusive, label, points, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.exec('BEGIN');
  try {
    DEFAULT_RULES.forEach((r, i) =>
      insert.run(r.test, r.code, r.min, r.minInc, r.max, r.maxInc, r.label, r.points, i + 1));
    d.exec('COMMIT');
  } catch (err) {
    d.exec('ROLLBACK');
    throw err;
  }
}

function get() {
  if (!db) throw new Error('Database not opened');
  return db;
}

function close() {
  if (db) db.close();
  db = undefined;
}

module.exports = { open, get, close, DEFAULT_RULES };
