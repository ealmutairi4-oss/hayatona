'use strict';

const path = require('node:path');
const express = require('express');
const config = require('./config');
const { securityHeaders, sameOrigin } = require('./security');
const { fail } = require('./i18n');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(securityHeaders);
  app.use(express.json({ limit: '10kb' }));

  // فحص سلامة الخدمة (لـ Docker وموازن الأحمال) — لا يكشف أي بيانات
  app.get('/healthz', (req, res) => {
    try {
      require('./db').get().prepare('SELECT 1').get();
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  app.use('/api', sameOrigin);
  app.use('/api', require('./routes/public'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api', (req, res) => fail(req, res, 404, 'e.notFound'));

  const publicDir = path.join(__dirname, '..', 'public');
  app.get('/result', (req, res) => res.sendFile(path.join(publicDir, 'result.html')));
  app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin', 'index.html')));
  app.get('/admin/login', (req, res) => res.sendFile(path.join(publicDir, 'admin', 'login.html')));
  app.use(express.static(publicDir, { extensions: ['html'], maxAge: config.isProduction ? '1h' : 0 }));

  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err.type === 'entity.parse.failed') return fail(req, res, 400, 'e.badData');
    if (err.type === 'entity.too.large') return fail(req, res, 413, 'e.tooLarge');
    console.error(err);
    fail(req, res, 500, 'e.server');
  });

  return app;
}

module.exports = { createApp };
