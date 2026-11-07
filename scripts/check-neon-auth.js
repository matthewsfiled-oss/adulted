// Live check against Neon Auth: starts Adulted on localhost, signs up a brand-new
// test user through the app's /api/auth proxy, reads it back via /api/me (server SDK),
// then checks sign-out, a wrong password, and sign-in. Prints no secrets.
// Run after `neon deploy`:  npm run check:auth
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const root = path.join(__dirname, '..');
require(path.join(root, 'server/node_modules/dotenv')).config({ path: [path.join(root, '.env.local'), path.join(root, 'server/.env')], quiet: true });
const { createApp } = require(path.join(root, 'server/src/app'));
const { createAuthRouter } = require(path.join(root, 'server/src/auth'));

const out = path.join(root, 'neon-auth-check.txt');
fs.writeFileSync(out, `Run ${new Date().toISOString()}\n`);
const log = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };
let failed = 0;
const step = (ok, label, detail = '') => { if (!ok) failed++; log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`); };

(async () => {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) { log('FAIL  NEON_AUTH_BASE_URL is missing. Run `neon deploy` (it writes .env.local), then try again.'); process.exit(1); }
  log(`Neon Auth host: ${new URL(baseUrl).host}`);
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET || crypto.randomBytes(32).toString('base64');
  const authRouter = await createAuthRouter({ baseUrl, cookieSecret });
  const server = createApp({ client: {}, models: {}, authRouter }).listen(0, 'localhost');
  await new Promise((r) => server.once('listening', r));
  const base = `http://localhost:${server.address().port}`; // localhost is a trusted origin by default
  const jar = new Map();
  const go = async (p, body) => {
    const headers = { origin: base };
    if (body) headers['content-type'] = 'application/json';
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(base + p, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';'); const i = pair.indexOf('=');
      const k = pair.slice(0, i).trim(), v = pair.slice(i + 1).trim();
      if (!v || /max-age=0|expires=thu, 01 jan 1970/i.test(c)) jar.delete(k); else jar.set(k, v);
    }
    let json = null; try { json = await res.json(); } catch {}
    return { status: res.status, json };
  };

  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const email = `adulted-test-${stamp}@example.com`;
  const password = `Ad-${crypto.randomBytes(9).toString('base64url')}`;
  log(`Test user: ${email}\n`);
  try {
    let r = await go('/api/auth/sign-up/email', { name: 'Adulted Test User', email, password });
    step(r.status === 200 && r.json?.user?.email === email, 'Sign up a new user on Neon Auth', r.status === 200 ? '' : `${r.status} ${r.json?.code || ''} ${r.json?.message || ''}`);
    r = await go('/api/me');
    const u = r.json?.user;
    step(u?.email === email, 'Read the current user back (server SDK, /api/me)', u ? `id ${u.id}, name "${u.name}", created ${u.createdAt}` : `status ${r.status}${r.status === 401 ? ' (no session: is "Verify email at signup" on?)' : ''}`);
    r = await go('/api/auth/sign-out', {});
    step((await go('/api/me')).status === 401, 'Sign out ends the session');
    r = await go('/api/auth/sign-in/email', { email, password: password + 'x' });
    step(r.status === 401, 'Wrong password is rejected', `${r.status} ${r.json?.code || ''}`);
    r = await go('/api/auth/sign-in/email', { email, password });
    step(r.status === 200 && (await go('/api/me')).json?.user?.email === email, 'Sign back in and read the user');
  } catch (e) {
    step(false, 'Unexpected error', e && e.message);
  } finally {
    server.close();
  }
  log(failed ? `\n${failed} step(s) failed.` : '\nAll steps passed. The test user is in the neon_auth schema on the production branch.');
  process.exit(failed ? 1 : 0);
})();
