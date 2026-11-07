const path = require('path');
// server/.env first, then the repo-root .env.local that `neon deploy` / `neon env pull` writes.
require('dotenv').config({ path: [path.join(__dirname, '..', '.env'), path.join(__dirname, '..', '..', '.env.local')], quiet: true });
const Anthropic = require('@anthropic-ai/sdk');
const { createApp } = require('./app');
const { createWaitlistStore } = require('./waitlist');
const { createReportStore } = require('./reports');
const { createAuthRouter } = require('./auth');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and paste your key.');
  process.exit(1);
}

const waitlist = createWaitlistStore({
  databaseUrl: process.env.DATABASE_URL || '',
  filePath: path.join(__dirname, '..', 'data', 'waitlist.jsonl'),
});
if (waitlist.kind === 'file') {
  console.warn('No DATABASE_URL set: launch-list signups go to server/data/waitlist.jsonl. Free hosts erase this on restart.');
}
const reports = createReportStore({
  databaseUrl: process.env.DATABASE_URL || '',
  filePath: path.join(__dirname, '..', 'data', 'reports.jsonl'),
});
if (!process.env.ADMIN_KEY) {
  console.warn('No ADMIN_KEY set: the signup download link is turned off.');
}

(async () => {
const authRouter = await createAuthRouter({
  baseUrl: process.env.NEON_AUTH_BASE_URL || '',
  cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET || '',
});
if (!authRouter) console.warn('No NEON_AUTH_BASE_URL set: account sign-up is turned off.');

const app = createApp({
  client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  adminKey: process.env.ADMIN_KEY || '',
  waitlist,
  reports,
  corsOrigin: process.env.CORS_ORIGIN || true,
  dailyAiLimit: Number(process.env.DAILY_AI_LIMIT) || 1000,
  authRouter,
  publicDir: path.join(__dirname, '..', 'public'),
  webDir: path.join(__dirname, '..', 'web'),
  models: {
    main: process.env.AI_MODEL || 'claude-sonnet-5-5',
    fast: process.env.FAST_MODEL || 'claude-haiku-4-5-20251001',
  },
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Adulted running on port ${port}  (website: /, app: /app, API: /api)`);
});
})().catch((e) => { console.error('Startup failed:', e && e.message); process.exit(1); });
