// Accounts: the /api/auth proxy and /api/me, run against a local Better Auth server
// (the same engine Neon Auth hosts), so no Neon account or network is needed.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createApp } = require('../src/app');
const { createAuthRouter } = require('../src/auth');

async function startLocalBetterAuth() {
  const { betterAuth } = await import('better-auth');
  const { memoryAdapter } = await import('better-auth/adapters/memory');
  const { toNodeHandler } = await import('better-auth/node');
  const server = http.createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const auth = betterAuth({
    baseURL: `http://127.0.0.1:${port}/api/auth`,
    secret: 'test-secret-test-secret-test-secret-12',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    emailAndPassword: { enabled: true },
    trustedOrigins: (req) => [req ? new URL(req.headers.get('origin') || 'http://x').origin : 'http://127.0.0.1'],
    logger: { disabled: true },
  });
  server.on('request', toNodeHandler(auth));
  return { url: `http://127.0.0.1:${port}/api/auth`, close: () => server.close() };
}

// A tiny browser: keeps cookies and sends Origin like a real page would.
function browser(base) {
  const jar = new Map();
  return async (path, { method = 'GET', body } = {}) => {
    const headers = { origin: base };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';'); const i = pair.indexOf('=');
      const k = pair.slice(0, i).trim(), v = pair.slice(i + 1).trim();
      if (!v || /max-age=0|expires=thu, 01 jan 1970/i.test(c)) jar.delete(k); else jar.set(k, v);
    }
    return res;
  };
}

test('accounts are off when Neon Auth is not configured', async () => {
  assert.equal(await createAuthRouter({}), null);
  assert.equal(await createAuthRouter({ baseUrl: 'https://x', cookieSecret: 'short', log: { warn() {} } }), null);
});

test('email sign-up, current user, sign-out, wrong password, sign-in', async () => {
  const upstream = await startLocalBetterAuth();
  const authRouter = await createAuthRouter({ baseUrl: upstream.url, cookieSecret: 'a'.repeat(40) });
  const app = createApp({ client: {}, models: {}, authRouter });
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const go = browser(base);
  try {
    let r = await go('/api/me');
    assert.equal(r.status, 401, 'signed out at first');

    r = await go('/api/auth/sign-up/email', { method: 'POST', body: { name: 'Test Person', email: 'test@example.com', password: 'long-enough-1' } });
    assert.equal(r.status, 200, await r.clone().text());
    assert.equal(r.headers.get('cache-control'), 'no-store');

    r = await go('/api/me');
    assert.equal(r.status, 200);
    const { user } = await r.json();
    assert.equal(user.email, 'test@example.com');
    assert.equal(user.name, 'Test Person');
    assert.ok(user.id);
    assert.deepEqual(Object.keys(user).sort(), ['createdAt', 'email', 'emailVerified', 'id', 'name'], 'only safe fields');

    r = await go('/api/auth/sign-up/email', { method: 'POST', body: { name: 'Again', email: 'test@example.com', password: 'long-enough-1' } });
    assert.ok(r.status >= 400, 'duplicate email refused');

    r = await go('/api/auth/sign-out', { method: 'POST', body: {} });
    assert.equal(r.status, 200);
    assert.equal((await go('/api/me')).status, 401, 'signed out');

    r = await go('/api/auth/sign-in/email', { method: 'POST', body: { email: 'test@example.com', password: 'wrong-password' } });
    assert.equal(r.status, 401);
    assert.match((await r.json()).code, /INVALID_EMAIL_OR_PASSWORD/);

    r = await go('/api/auth/sign-in/email', { method: 'POST', body: { email: 'test@example.com', password: 'long-enough-1' } });
    assert.equal(r.status, 200);
    assert.equal((await (await go('/api/me')).json()).user.email, 'test@example.com');
  } finally {
    server.close(); upstream.close();
  }
});
