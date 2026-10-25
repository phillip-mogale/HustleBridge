/**
 * HustleBridge calculation engine.
 * Pure, deterministic functions. No AI, no DOM, no storage. Every result can be checked by hand.
 *
 * Blueprint values (v):
 *   price        selling price of one item or job (R)
 *   hoursPerJob  hours one item or job takes, including prep, admin and delivery
 *   target       monthly take-home the owner wants (R)
 *   ext          materials / ingredients / stock cost per item (R)
 *   transport    second direct cost per item: transport, packaging, delivery (R)
 *   fixed        fixed monthly costs: data, tools, rent (R)
 *   hours        hours a month that can really be sold
 *
 * Goods, services and buy-and-resell all use the same shape. Only the labels differ (see copy.js).
 */

export const SHAPES = ['services', 'goods', 'resale'];

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Core cost maths for a Blueprint's values. */
export function calc(v) {
  const hours = Math.max(1, num(v.hours, 1));
  const per = Math.max(0.25, num(v.hoursPerJob, 0.25));
  const hourly = (num(v.target) + num(v.fixed)) / hours;
  const labour = hourly * per;
  const direct = num(v.ext) + num(v.transport);
  return { hourly, labour, direct, cost: labour + direct, cap: Math.max(0, Math.floor(hours / per)) };
}

/** Share of customers who stay or arrive when the price moves. `sens` is the user's own assumption (% lost per R10). */
export function jobsAt(p, base, cap, sens, ref) {
  const ch = ((p - ref) / 10) * sens / 100;
  return Math.max(0, Math.min(cap, Math.round(base * (1 - ch))));
}

/** A month state used by the simulation and projections. */
export function planState(v, sens, over = {}) {
  const c = calc(v);
  return Object.assign(
    { price: v.price, ref: v.price, ext: v.ext, tr: v.transport, fixed: v.fixed, base: c.cap, cap: c.cap, loss: sens, oneOff: 0 },
    over
  );
}

export const jobsOf = (s) => jobsAt(s.price, s.base, s.cap, s.loss, s.ref);
export const profitOf = (s) => jobsOf(s) * (s.price - s.ext - s.tr) - s.fixed + s.oneOff;
export const keptPer = (s) => s.price - s.ext - s.tr;

/** Cash balance at the end of each of the next n months. */
export function cashSeries(v, sens, cash0, scn, draw, n) {
  let cash = cash0;
  const out = [];
  const c = calc(v);
  for (let m = 1; m <= n; m++) {
    const o = {};
    if ((scn === 'sup' || scn === 'both') && m >= 2) o.ext = Math.round(v.ext * 1.2);
    if ((scn === 'quiet' || scn === 'both') && m === 3) o.base = Math.max(0, c.cap - Math.max(1, Math.round(c.cap * 0.25)));
    cash += profitOf(planState(v, sens, o)) - draw;
    out.push(cash);
  }
  return out;
}

/** Whole months until cash goes below zero, or null if it never does within three years. */
export function runway(v, sens, cash0, scn, draw) {
  const s = cashSeries(v, sens, cash0, scn, draw, 36);
  const i = s.findIndex((x) => x < 0);
  return i < 0 ? null : i;
}

/** Pricing tool maths on a free-standing set of inputs. */
export function pricing(P) {
  const hourly = (P.t + P.f) / Math.max(1, P.h);
  const per = Math.max(0.25, P.hp);
  const labour = hourly * per;
  const cost = labour + P.d;
  const cap = Math.max(1, Math.floor(P.h / per));
  const base = Math.min(P.j, cap);
  const jobs = (p) => jobsAt(p, base, cap, P.s, P.ref);
  const earn = (p) => jobs(p) * (p - P.d) - P.f;
  const flat = (p) => base * (p - P.d) - P.f;
  const lo = P.pmin ?? 100, hi = P.pmax ?? 900;
  let best = lo, bv = -Infinity;
  for (let p = lo; p <= hi; p += 5) { const e = earn(p); if (e > bv) { bv = e; best = p; } }
  return { hourly, labour, cost, cap, base, jobs, earn, flat, best, bv, load: P.j * per, over: P.j > cap };
}

/** Jobs needed a month to reach the goal at a price, or null if the price does not cover direct costs. */
export function jobsNeeded(price, v) {
  const contrib = price - num(v.ext) - num(v.transport);
  return contrib > 0 ? Math.ceil((num(v.target) + num(v.fixed)) / contrib) : null;
}

/** Clamp and complete a Blueprint draft, whether it came from the AI, the parser or a form. Never trusts its input. */
export function sanitizeValues(v = {}) {
  return {
    price: clamp(Math.round(num(v.price)), 0, 100000),
    hoursPerJob: clamp(Math.round(num(v.hoursPerJob, 1) * 4) / 4 || 1, 0.25, 100),
    target: clamp(Math.round(num(v.target)), 0, 500000),
    ext: clamp(Math.round(num(v.ext)), 0, 100000),
    transport: clamp(Math.round(num(v.transport)), 0, 100000),
    fixed: clamp(Math.round(num(v.fixed)), 0, 500000),
    hours: clamp(Math.round(num(v.hours, 80)), 1, 400)
  };
}

const str = (x, max, d = '') => (typeof x === 'string' ? x.replace(/[<>]/g, '').trim().slice(0, max) : d) || d;

/** Validate an AI or parser Blueprint draft into the exact structure the app uses. Returns null if unusable. */
export function sanitizeBlueprint(d) {
  if (!d || typeof d !== 'object') return null;
  const shape = SHAPES.includes(d.shape) ? d.shape : 'services';
  const v = sanitizeValues(d.values || d.v || {});
  if (v.price <= 0) return null;
  const L = d.labels || d.L || {};
  const src = {};
  const stated = Array.isArray(d.stated) ? d.stated : [];
  for (const k of ['price', 'hoursPerJob', 'target', 'ext', 'transport', 'fixed', 'hours']) src[k] = stated.includes(k) ? 'you' : 'ai';
  return {
    shape,
    name: str(d.name, 60, 'My business'),
    desc: str(d.desc, 90, ''),
    labels: {
      unit: str(L.unit, 20, shape === 'services' ? 'job' : 'item'),
      units: str(L.units, 22, shape === 'services' ? 'jobs' : 'items'),
      client: str(L.client, 20, 'customer'),
      clients: str(L.clients, 22, 'customers'),
      mat: str(L.mat, 28, 'Materials'),
      second: str(L.second, 28, shape === 'goods' ? 'Packaging' : 'Transport'),
      supplier: str(L.supplier, 40, 'supplier')
    },
    values: v,
    src
  };
}
