// Waitlist storage. Uses Postgres when DATABASE_URL is set (recommended: a free Neon database).
// Without it, falls back to a local file, which free hosts wipe on every restart.

const fs = require('fs');
const path = require('path');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanEmail(v) {
  const e = String(v || '').trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

function postgresStore(databaseUrl) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: databaseUrl, max: 3 });
  const ready = pool.query(`create table if not exists waitlist (
    email text primary key,
    source text,
    created_at timestamptz not null default now()
  )`);
  return {
    kind: 'postgres',
    async add(email, source) {
      await ready;
      await pool.query('insert into waitlist (email, source) values ($1, $2) on conflict (email) do nothing', [email, source]);
    },
    async list() {
      await ready;
      const r = await pool.query('select email, source, created_at from waitlist order by created_at');
      return r.rows.map((x) => ({ email: x.email, source: x.source, created_at: new Date(x.created_at).toISOString() }));
    },
  };
}

function fileStore(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const read = () => {
    try {
      return fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    } catch {
      return [];
    }
  };
  return {
    kind: 'file',
    async add(email, source) {
      if (read().some((r) => r.email === email)) return;
      fs.appendFileSync(filePath, JSON.stringify({ email, source, created_at: new Date().toISOString() }) + '\n');
    },
    async list() { return read(); },
  };
}

function createWaitlistStore({ databaseUrl, filePath }) {
  return databaseUrl ? postgresStore(databaseUrl) : fileStore(filePath);
}

const csvCell = (v) => {
  const s = String(v ?? '');
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // stop spreadsheet formula injection
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const toCsv = (rows) => ['email,source,signed_up_at', ...rows.map((r) => [r.email, r.source, r.created_at].map(csvCell).join(','))].join('\n') + '\n';

module.exports = { createWaitlistStore, cleanEmail, toCsv };
