import test from 'node:test';
import assert from 'node:assert/strict';
import { calc, jobsAt, pricing, planState, profitOf, jobsOf, cashSeries, runway, jobsNeeded, sanitizeBlueprint, sanitizeValues } from '../src/lib/engine.js';

const NOMSA = { price: 350, hoursPerJob: 4, target: 6000, ext: 120, transport: 40, fixed: 300, hours: 80 };

test('Nomsa: full cost per style is R475 and capacity is 20', () => {
  const c = calc(NOMSA);
  assert.equal(Math.round(c.hourly * 100) / 100, 78.75);
  assert.equal(c.labour, 315);
  assert.equal(c.direct, 160);
  assert.equal(Math.round(c.cost), 475);
  assert.equal(c.cap, 20);
  assert.equal(Math.round(NOMSA.price - c.cost), -125);
});

test('Hand check: the R350 designer example loses money below break-even', () => {
  const c = calc({ price: 200, hoursPerJob: 3, target: 8000, ext: 20, transport: 10, fixed: 700, hours: 100 });
  assert.ok(c.cost > 200);
});

test('Zero, negative and huge inputs never produce NaN or Infinity', () => {
  for (const v of [{}, { hours: 0, hoursPerJob: 0 }, { hours: -5, hoursPerJob: -1, target: -1 }, { price: 1e12, hours: 1e9, hoursPerJob: 1e-9 }]) {
    const c = calc(v);
    for (const k of Object.keys(c)) assert.ok(Number.isFinite(c[k]), k + ' finite for ' + JSON.stringify(v));
  }
});

test('Demand: a higher price loses clients by the stated assumption; no change at reference price', () => {
  assert.equal(jobsAt(350, 20, 20, 2, 350), 20);
  assert.equal(jobsAt(400, 20, 20, 2, 350), 18); // +R50 = 5 steps * 2% = 10% of 20
  assert.equal(jobsAt(300, 10, 20, 2, 350), 11); // lower price brings clients back, capped
  assert.equal(jobsAt(300, 20, 20, 2, 350), 20); // never above capacity
  assert.equal(jobsAt(9999, 20, 20, 6, 350), 0);
});

test('Pricing tool: capacity warning when planned work exceeds hours', () => {
  const p = pricing({ t: 6000, f: 300, h: 80, d: 160, hp: 4, j: 25, p: 350, ref: 350, s: 2 });
  assert.equal(p.over, true);
  assert.equal(p.cap, 20);
  assert.equal(p.load, 100);
  assert.equal(Math.round(p.cost), 475);
});

test('Supplier rise absorbed lowers profit by materials increase times jobs', () => {
  const a = planState(NOMSA, 2);
  const before = profitOf(a);
  const b = { ...a, ext: Math.round(a.ext * 1.2) };
  assert.equal(before - profitOf(b), 24 * jobsOf(a)); // 20% of R120 = R24 per job
});

test('Cash runway: null when profit covers draw, a month count when it does not', () => {
  assert.equal(runway(NOMSA, 2, 2500, 'plan', 0), null);
  assert.ok(runway(NOMSA, 2, 2500, 'plan', 6000) !== null);
  assert.equal(cashSeries(NOMSA, 2, 2500, 'plan', 0, 6).length, 6);
});

test('Jobs needed: null when price does not cover direct costs', () => {
  assert.equal(jobsNeeded(100, NOMSA), null);
  assert.equal(jobsNeeded(350, NOMSA), Math.ceil(6300 / 190));
});

test('sanitizeBlueprint rejects junk and clamps values', () => {
  assert.equal(sanitizeBlueprint(null), null);
  assert.equal(sanitizeBlueprint({ values: { price: 0 } }), null);
  const b = sanitizeBlueprint({ shape: 'nonsense', name: '<b>Cakes</b>', values: { price: 35, hoursPerJob: -4, target: 'x', hours: 9999 }, stated: ['price'] });
  assert.equal(b.shape, 'services');
  assert.equal(b.name, 'bCakes/b');
  assert.equal(b.values.hours, 400);
  assert.equal(b.values.hoursPerJob, 0.25);
  assert.equal(b.src.price, 'you');
  assert.equal(b.src.ext, 'ai');
  assert.deepEqual(Object.keys(sanitizeValues({})).length, 7);
});
