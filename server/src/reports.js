// Reports people send about AI answers ("Report this answer").
// Uses Postgres when DATABASE_URL is set, otherwise a local file (free hosts wipe it on restart).
// Reports are deleted after 12 months, as the privacy policy says.
const fs = require('fs');
const path = require('path');

const FEATURES = ['ask'];
const REASONS = ['wrong', 'unsafe', 'kids', 'other'];
const KEEP_DAYS = 365;
const clip = (v, n) => String(v == null ? '' : v).replace(/\u0000/g, '').trim().slice(0, n);

function cleanReport(b) {
  const r = b || {};
  if (!FEATURES.includes(r.feature) || !REASONS.includes(r.reason)) return null;
  const content = clip(r.content, 4000);
  if (!content) return null;
  return { feature: r.feature, reason: r.reason, note: clip(r.note, 500), content };
}

function postgresStore(databaseUrl) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const ready = pool.query(`create table if not exists ai_reports (
    id bigserial primary key,
    feature text not null,
    reason text not null,
    note text,
    content text not null,
    created_at timestamptz not null default now()
  )`);
  return {
    kind: 'postgres',
    async add(r) {
      await ready;
      await pool.query('insert into ai_reports (feature, reason, note, content) values ($1, $2, $3, $4)', [r.feature, r.reason, r.note, r.content]);
      await pool.query(`delete from ai_reports where created_at < now() - interval '${KEEP_DAYS} days'`);
    },
    async list() {
      await ready;
      const q = await pool.query('select feature, reason, note, content, created_at from ai_reports order by created_at desc');
      return q.rows.map((x) => ({ ...x, created_at: new Date(x.created_at).toISOString() }));
    },
  };
}

function fileStore(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const read = () => { try { return fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
  return {
    kind: 'file',
    async add(r) {
      const cutoff = Date.now() - KEEP_DAYS * 864e5;
      const rows = read().filter((x) => Date.parse(x.created_at) >= cutoff);
      rows.push({ ...r, created_at: new Date().toISOString() });
      fs.writeFileSync(filePath, rows.map((x) => JSON.stringify(x)).join('\n') + '\n');
    },
    async list() { return read().reverse(); },
  };
}

function createReportStore({ databaseUrl, filePath }) {
  return databaseUrl ? postgresStore(databaseUrl) : fileStore(filePath);
}

const cell = (v) => {
  const s = String(v ?? '');
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const reportsCsv = (rows) => ['reported_at,feature,reason,note,answer', ...rows.map((r) => [r.created_at, r.feature, r.reason, r.note, r.content].map(cell).join(','))].join('\n') + '\n';

module.exports = { createReportStore, cleanReport, reportsCsv };
