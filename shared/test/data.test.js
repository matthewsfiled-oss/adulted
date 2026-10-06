const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data');
const ART = require('../../web/illustrations').ADULTED_ART;

test('every guide is complete and every step has a picture', () => {
  const keys = new Set(ART.keys);
  for (const [id, g] of Object.entries(D.GUIDES)) {
    assert.ok(g.n && g.mod && g.cat && g.time, `${id} needs a name, module, category, and time`);
    assert.ok([1, 2, 3].includes(g.level), `${id} level`);
    assert.ok(Array.isArray(g.tools), `${id} tools`);
    assert.ok(g.steps.length >= 3 && g.steps.length <= 8, `${id} should have 3 to 8 steps`);
    for (const s of g.steps) {
      assert.ok(s.t && s.d, `${id} step needs a title and a line`);
      assert.ok(s.d.length <= 140, `${id} "${s.t}" is too long to read at a glance`);
      assert.ok(s.img || s.video || keys.has(s.v), `${id} "${s.t}" has no picture`);
    }
    for (const r of g.related || []) assert.ok(D.GUIDES[r], `${id} links to missing guide ${r}`);
  }
});

test('panic list, modules, and checklists point at real content', () => {
  for (const id of D.PANIC) assert.ok(D.GUIDES[id], id);
  assert.ok(D.MODULES.some((m) => m.live));
  for (const m of D.MODULES) if (!m.live) assert.ok(m.soon.length);
  for (const c of Object.values(D.CHECKLISTS)) for (const [, items] of c.groups) assert.ok(items.length);
});

test('prices match the decided plan', () => {
  assert.equal(D.CONFIG.silverMonthly, 6.99);
  assert.equal(D.CONFIG.goldMonthly, 14.99);
  assert.equal(D.CONFIG.silverYearly, 49.99);
  assert.equal(D.CONFIG.goldYearly, 119.99);
  assert.equal(D.TIERS.length, 3);
  assert.equal(D.CONFIG.paymentsLive, false);
});

test('emergency numbers are right', () => {
  const nums = Object.fromEntries(D.RESOURCES.map((r) => [r.n, r.num]));
  assert.equal(nums.Emergency, '911');
  assert.equal(nums['988 Suicide and Crisis Lifeline'], '988');
  assert.equal(nums['Poison Control'], '1-800-222-1222');
});
