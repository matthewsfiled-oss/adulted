const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { createApp } = require('../src/app');
const { createWaitlistStore } = require('../src/waitlist');
const { createReportStore } = require('../src/reports');

// A fake Claude client that replies with whatever text we queue up.
function fakeClient(queue) {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (req) => {
        calls.push(req);
        const next = queue.shift();
        if (next instanceof Error) throw next;
        return { content: [{ type: 'text', text: typeof next === 'string' ? next : JSON.stringify(next) }] };
      },
    },
  };
}

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}
const post = (base, p, body) => fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const models = { main: 'm-main', fast: 'm-fast' };

const ANSWER = {
  title: 'Unclog the sink', summary: 'Use a plunger first.', urgent: false,
  steps: [{ t: 'Plunge', d: 'Cover the drain and plunge.' }, { d: 'no title, dropped' }],
  safety: 'Never mix drain cleaners.', pro: 'Call a plumber if it backs up again.', guides: ['toilet', 'made-up'],
};

test('ask returns a cleaned answer, sends only known profile fields, and uses the main model', async () => {
  const client = fakeClient(['Sure!\n' + JSON.stringify(ANSWER)]);
  await withServer(createApp({ client, models }), async (base) => {
    const res = await post(base, '/api/ai/ask', { q: 'My sink is clogged', profile: { state: 'Massachusetts', living: 'Apartment', ssn: '123-45-6789' } });
    assert.equal(res.status, 200);
    const { result } = await res.json();
    assert.equal(result.title, 'Unclog the sink');
    assert.deepEqual(result.steps, [{ t: 'Plunge', d: 'Cover the drain and plunge.' }]);
    assert.deepEqual(result.guides, ['toilet']);
    assert.equal(result.urgent, false);
    assert.equal(client.calls[0].model, 'm-main');
    const prompt = client.calls[0].messages[0].content;
    assert.match(prompt, /state: Massachusetts/);
    assert.doesNotMatch(prompt, /123-45-6789/);
    assert.match(client.calls[0].system, /988/);
  });
});

test('bad input is refused before calling Claude, and only Adulted tasks exist', async () => {
  const client = fakeClient([]);
  await withServer(createApp({ client, models }), async (base) => {
    assert.equal((await post(base, '/api/ai/ask', { q: '' })).status, 400);
    assert.equal((await post(base, '/api/ai/chat', { text: 'write my essay' })).status, 404);
    assert.equal(client.calls.length, 0);
  });
});

test('unreadable AI replies become a clean error', async () => {
  const client = fakeClient(['sorry, no json', new Error('boom')]);
  await withServer(createApp({ client, models }), async (base) => {
    const a = await post(base, '/api/ai/ask', { q: 'How do I iron a shirt?' });
    assert.equal(a.status, 502);
    assert.deepEqual(await a.json(), { error: 'invalid_json' });
    const b = await post(base, '/api/ai/ask', { q: 'How do I iron a shirt?' });
    assert.deepEqual(await b.json(), { error: 'ai_unavailable' });
  });
});

test('daily AI budget stops calls once used up', async () => {
  const client = fakeClient([ANSWER, ANSWER]);
  await withServer(createApp({ client, models, dailyAiLimit: 1 }), async (base) => {
    assert.equal((await post(base, '/api/ai/ask', { q: 'How do I iron a shirt?' })).status, 200);
    const res = await post(base, '/api/ai/ask', { q: 'How do I iron a shirt?' });
    assert.equal(res.status, 429);
    assert.deepEqual(await res.json(), { error: 'daily_limit' });
  });
});

test('launch list saves clean emails once and exports CSV for the admin only', async () => {
  const waitlist = createWaitlistStore({ filePath: path.join(os.tmpdir(), `adulted-wl-${Date.now()}.jsonl`) });
  await withServer(createApp({ client: fakeClient([]), models, waitlist, adminKey: 'adm' }), async (base) => {
    assert.equal((await post(base, '/api/waitlist', { email: 'nope' })).status, 400);
    assert.equal((await post(base, '/api/waitlist', { email: ' Matt@Example.com ', source: 'landing' })).status, 200);
    assert.equal((await post(base, '/api/waitlist', { email: 'matt@example.com', source: 'app' })).status, 200);
    assert.equal((await post(base, '/api/waitlist', { email: 'bot@example.com', company: 'Spam' })).status, 200);
    assert.equal((await fetch(`${base}/api/admin/waitlist.csv?key=wrong`)).status, 401);
    const lines = (await (await fetch(`${base}/api/admin/waitlist.csv?key=adm`)).text()).trim().split('\n');
    assert.equal(lines.length, 2);
    assert.match(lines[1], /^matt@example\.com,landing,/);
  });
});

test('serves the landing page and the web app', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adulted-site-'));
  fs.mkdirSync(path.join(dir, 'public')); fs.mkdirSync(path.join(dir, 'web'));
  fs.writeFileSync(path.join(dir, 'public', 'index.html'), '<h1>landing</h1>');
  fs.writeFileSync(path.join(dir, 'public', 'privacy.html'), '<h1>privacy</h1>');
  fs.writeFileSync(path.join(dir, 'web', 'index.html'), '<main id="app">app</main>');
  const app = createApp({ client: fakeClient([]), models, publicDir: path.join(dir, 'public'), webDir: path.join(dir, 'web') });
  await withServer(app, async (base) => {
    assert.match(await (await fetch(`${base}/`)).text(), /landing/);
    assert.match(await (await fetch(`${base}/privacy`)).text(), /privacy/);
    assert.match(await (await fetch(`${base}/app`)).text(), /id="app"/);
    assert.match(await (await fetch(`${base}/app/anything`)).text(), /id="app"/);
    assert.equal((await fetch(`${base}/api/nope`)).status, 404);
    assert.equal((await fetch(`${base}/health`)).status, 200);
  });
});

test('reports about AI answers are saved and exported for the admin only', async () => {
  const reports = createReportStore({ filePath: path.join(os.tmpdir(), `adulted-rep-${Date.now()}.jsonl`) });
  await withServer(createApp({ client: fakeClient([]), models, reports, adminKey: 'adm' }), async (base) => {
    assert.equal((await post(base, '/api/report', { feature: 'chat', reason: 'wrong', content: 'x' })).status, 400);
    assert.equal((await post(base, '/api/report', { feature: 'ask', reason: 'wrong', content: '' })).status, 400);
    assert.equal((await post(base, '/api/report', { feature: 'ask', reason: 'unsafe', note: 'says "mix bleach"', content: '=HYPERLINK("x")\nline two' })).status, 200);
    assert.equal((await fetch(`${base}/api/admin/reports.csv?key=nope`)).status, 401);
    const csv = await (await fetch(`${base}/api/admin/reports.csv?key=adm`)).text();
    assert.match(csv, /^reported_at,feature,reason,note,answer\n/);
    assert.match(csv, /,ask,unsafe,"says ""mix bleach""","'=HYPERLINK/);
  });
});
