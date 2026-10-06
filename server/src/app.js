const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { TASKS, parseJson } = require('../../shared/prompts');
const { cleanEmail, toCsv } = require('./waitlist');
const { cleanReport, reportsCsv } = require('./reports');

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

const limiter = (limit, windowMs) => rateLimit({
  windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'too_many_requests' }),
});

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || '')); const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};

// How often one person can use each AI feature (per 10 minutes), and how long the answer can be.
const AI_LIMITS = { ask: 20, snap: 10 };
const MAX_TOKENS = { ask: 1200, snap: 1500 };
const SYSTEM = "You are Adulted's life-skills helper for young adults living on their own for the first time in the U.S. Give accurate, safe, practical help in plain language. Put safety first: for emergencies tell people to call 911, and for thoughts of suicide or self-harm share the 988 Suicide and Crisis Lifeline (call or text 988). Follow the requested format exactly.";

/**
 * Build the whole service: landing page (/), web app (/app), API (/api).
 * `client` is an Anthropic SDK client (or a fake in tests).
 * Nothing people type or photograph is stored or logged: it goes to Claude and is dropped.
 */
function createApp({
  client, models, adminKey = '', waitlist, reports, corsOrigin = true, dailyAiLimit = 1000,
  publicDir, webDir, trustProxy = 1,
}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy); // correct client IPs behind Render's proxy
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:'],
        'connect-src': ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use('/api', cors({ origin: corsOrigin }));
  // Photos for Snap and Solve need room; everything else stays small.
  const smallJson = express.json({ limit: '64kb' });
  const photoJson = express.json({ limit: '5mb' });
  app.use((req, res, next) => (req.path === '/api/ai/snap' ? photoJson : smallJson)(req, res, next));

  // Log the route and timing only. Never log bodies: they can include personal details.
  app.use((req, res, next) => {
    const t = Date.now();
    res.on('finish', () => { if (req.path.startsWith('/api')) console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - t}ms`); });
    next();
  });

  app.get('/health', (req, res) => res.json({ ok: true }));

  // ---------- AI: per-person limits and a daily budget for everyone ----------
  let day = new Date().toISOString().slice(0, 10);
  let used = 0;
  const dailyBudget = (req, res, next) => {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== day) { day = today; used = 0; }
    if (used >= dailyAiLimit) return res.status(429).json({ error: 'daily_limit' });
    used += 1;
    next();
  };

  for (const kind of Object.keys(TASKS)) {
    const task = TASKS[kind];
    app.post(`/api/ai/${kind}`, limiter(AI_LIMITS[kind] || 10, 10 * 60 * 1000), async (req, res, next) => {
      let input;
      try { input = task.input(req.body || {}); } catch { return next(new HttpError(400, 'bad_input')); }
      dailyBudget(req, res, async () => {
        try {
          const reply = await client.messages.create({
            model: models[task.tier] || models.main,
            max_tokens: MAX_TOKENS[kind] || 1200,
            system: SYSTEM,
            messages: [{ role: 'user', content: task.content ? task.content(input) : task.prompt(input) }],
          });
          const text = (reply.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
          if (!text) throw new HttpError(502, 'ai_unavailable');
          if (!task.json) return res.json({ text });
          res.json({ result: task.clean(parseJson(text), input) });
        } catch (e) {
          if (e && e.code === 'invalid_json') return next(new HttpError(502, 'invalid_json'));
          next(e);
        }
      });
    });
  }

  // ---------- Launch list: people who want to hear when the phone apps are out ----------
  app.post('/api/waitlist', limiter(10, 60 * 60 * 1000), async (req, res, next) => {
    try {
      const b = req.body || {};
      if (b.company) return res.json({ ok: true }); // hidden field only bots fill in
      const email = cleanEmail(b.email);
      if (!email) throw new HttpError(400, 'invalid_email');
      const source = ['landing', 'app', 'web-app'].includes(b.source) ? b.source : 'landing';
      if (!waitlist) throw new HttpError(503, 'waitlist_unavailable');
      await waitlist.add(email, source);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // Download signups as a spreadsheet: /api/admin/waitlist.csv?key=YOUR_ADMIN_KEY
  app.get('/api/admin/waitlist.csv', async (req, res, next) => {
    try {
      if (!adminKey || !safeEqual(req.get('x-admin-key') || req.query.key, adminKey)) return res.status(401).json({ error: 'unauthorized' });
      const rows = waitlist ? await waitlist.list() : [];
      res.set('content-type', 'text/csv; charset=utf-8');
      res.set('content-disposition', 'attachment; filename="adulted-waitlist.csv"');
      res.set('cache-control', 'no-store');
      res.send(toCsv(rows));
    } catch (e) { next(e); }
  });

  // ---------- Reports about AI answers (required by Google Play's AI content policy) ----------
  app.post('/api/report', limiter(20, 60 * 60 * 1000), async (req, res, next) => {
    try {
      const r = cleanReport(req.body);
      if (!r) throw new HttpError(400, 'bad_input');
      if (!reports) throw new HttpError(503, 'reports_unavailable');
      await reports.add(r);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // Download reports as a spreadsheet: /api/admin/reports.csv?key=YOUR_ADMIN_KEY
  app.get('/api/admin/reports.csv', async (req, res, next) => {
    try {
      if (!adminKey || !safeEqual(req.get('x-admin-key') || req.query.key, adminKey)) return res.status(401).json({ error: 'unauthorized' });
      const rows = reports ? await reports.list() : [];
      res.set('content-type', 'text/csv; charset=utf-8');
      res.set('content-disposition', 'attachment; filename="adulted-ai-reports.csv"');
      res.set('cache-control', 'no-store');
      res.send(reportsCsv(rows));
    } catch (e) { next(e); }
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

  // ---------- Website ----------
  if (webDir && fs.existsSync(path.join(webDir, 'index.html'))) {
    app.use('/app', express.static(webDir, { index: 'index.html', maxAge: '10m' }));
    app.get('/app/{*rest}', (req, res) => res.sendFile(path.join(webDir, 'index.html')));
  }
  if (publicDir && fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, { extensions: ['html'], maxAge: '10m' }));
  }
  app.use((req, res) => {
    const notFound = publicDir && path.join(publicDir, '404.html');
    if (notFound && fs.existsSync(notFound)) return res.status(404).sendFile(notFound);
    res.status(404).json({ error: 'not_found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.code });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'too_large' });
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'bad_json' });
    if (err && err.status === 429) return res.status(429).json({ error: 'ai_busy' });
    console.error('Server error:', err && (err.status || ''), err && err.message);
    res.status(502).json({ error: 'ai_unavailable' });
  });

  return app;
}

module.exports = { createApp };
