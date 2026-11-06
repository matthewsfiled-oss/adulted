// Email-and-password accounts on Neon Managed Better Auth (@neon/auth).
// The browser talks only to this server: /api/auth/* is proxied to the branch's
// Neon Auth URL, so sessions are first-party cookies on our own domain.
// /api/me reads the signed-in user on the server with Neon's server SDK.
const { AsyncLocalStorage } = require('node:async_hooks');
const express = require('express');

const MIN_SECRET = 32;

/**
 * Returns an Express router, or null when Auth is not configured
 * (NEON_AUTH_BASE_URL / NEON_AUTH_COOKIE_SECRET missing), so local runs still work.
 */
async function createAuthRouter({ baseUrl, cookieSecret, sameSite = 'lax', log = console } = {}) {
  if (!baseUrl) return null;
  if (!cookieSecret || cookieSecret.length < MIN_SECRET) {
    log.warn(`NEON_AUTH_COOKIE_SECRET must be at least ${MIN_SECRET} characters. Accounts are turned off.`);
    return null;
  }
  const t = await import('@neon/auth/server'); // the SDK is ESM-only; this server is CommonJS
  const store = new AsyncLocalStorage();

  const origin = (req) => req.get('origin') || `${req.protocol}://${req.get('host')}`;
  const auth = t.createAuthServer({
    baseUrl,
    cookieSecret,
    sameSite,
    context: () => {
      const { req, res } = store.getStore();
      return {
        getCookies: () => req.get('cookie') || '',
        setCookie: (name, value, options) => res.append('Set-Cookie', t.serializeSetCookie({ name, value, ...options })),
        getHeader: (name) => req.get(name) ?? null,
        getOrigin: () => origin(req),
        getFramework: () => 'express',
      };
    },
  });

  // Turn an Express request into the Web Request the toolkit expects.
  const toRequest = (req) => {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v === undefined) continue;
      for (const one of [].concat(v)) headers.append(k, one);
    }
    if (!headers.has('origin')) headers.set('origin', origin(req));
    const hasBody = !['GET', 'HEAD'].includes(req.method) && Buffer.isBuffer(req.body) && req.body.length;
    return new Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
      method: req.method, headers, body: hasBody ? req.body : undefined,
    });
  };

  const router = express.Router();

  // Everything Better Auth does: sign-up/email, sign-in/email, sign-out, get-session, request-password-reset...
  router.all('/api/auth/{*path}', express.raw({ type: '*/*', limit: '64kb' }), async (req, res, next) => {
    try {
      const path = [].concat(req.params.path || []).join('/');
      const upstream = await t.handleAuthProxyRequest({
        request: toRequest(req), path, baseUrl, cookieSecret, sameSite,
      });
      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (!['set-cookie', 'content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) res.set(key, value);
      });
      for (const c of upstream.headers.getSetCookie()) res.append('Set-Cookie', c);
      res.set('cache-control', 'no-store');
      res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (e) { next(e); }
  });

  // The signed-in user, read on the server. Only safe profile fields go back.
  router.get('/api/me', (req, res, next) => store.run({ req, res }, async () => {
    try {
      const { data } = await auth.getSession();
      const u = data && data.user;
      res.set('cache-control', 'no-store');
      if (!u) return res.status(401).json({ user: null });
      res.json({ user: { id: u.id, email: u.email, name: u.name, emailVerified: !!u.emailVerified, createdAt: u.createdAt } });
    } catch (e) {
      if (e && (e.status === 401 || e.status === 403)) return res.status(401).json({ user: null });
      next(e);
    }
  }));

  return router;
}

module.exports = { createAuthRouter };
