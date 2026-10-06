const test = require('node:test');
const assert = require('node:assert/strict');
const { TASKS, parseJson, isCrisis } = require('../prompts');

test('ask input trims the question and keeps only known profile fields', () => {
  const p = TASKS.ask.input({ q: '  how do I  do laundry ', profile: { state: 'Ohio', name: 'Matt', car: '2000 Ford Mustang' } });
  assert.equal(p.q, 'how do I do laundry');
  assert.deepEqual(p.profile, { state: 'Ohio', car: '2000 Ford Mustang' });
  assert.throws(() => TASKS.ask.input({ q: 'hi' }));
});

test('the prompt asks for JSON and puts safety first', () => {
  const text = TASKS.ask.prompt(TASKS.ask.input({ q: 'water is leaking from my ceiling' }));
  assert.match(text, /only one JSON object/);
  assert.match(text, /911/);
  assert.match(text, /988/);
  assert.match(text, /toilet: Unclog a toilet/);
});

test('clean drops unknown guides and empty steps', () => {
  const r = TASKS.ask.clean({ title: 'x', steps: [{ t: 'a', d: 'b' }, {}], guides: ['gas', 'nope'], urgent: 'yes' });
  assert.equal(r.steps.length, 1);
  assert.deepEqual(r.guides, ['gas']);
  assert.equal(r.urgent, false);
  assert.throws(() => TASKS.ask.clean(null));
});

test('parseJson reads fenced and wrapped JSON', () => {
  assert.deepEqual(parseJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJson('Here you go: {"a":2} hope that helps'), { a: 2 });
  assert.throws(() => parseJson('nothing here'));
});

test('crisis words are caught, everyday words are not', () => {
  for (const t of ['I want to die', 'thinking about suicide', 'i keep cutting myself', 'how do I end my life']) assert.ok(isCrisis(t), t);
  for (const t of ['my phone died', 'how do I kill a spider', 'the toilet is overflowing']) assert.ok(!isCrisis(t), t);
});
