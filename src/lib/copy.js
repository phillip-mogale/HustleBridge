/**
 * Everything that changes with the business shape lives here: preset Blueprints, mission wording,
 * simulation events and the offline rules-based intake parser. Numbers in this file are only starting
 * points. The calculation engine does all the maths.
 */
import { calc, sanitizeBlueprint } from './engine.js';
import { R } from './ui.js';

const YOU = { price: 'you', hoursPerJob: 'you', target: 'you', ext: 'ai', transport: 'ai', fixed: 'ai', hours: 'ai' };

export const PRESETS = {
  braider: {
    person: 'Nomsa', shape: 'services', name: "Braiding at clients' homes", desc: 'Time-based service with direct materials',
    labels: { unit: 'style', units: 'styles', client: 'client', clients: 'clients', mat: 'Extensions', second: 'Transport', supplier: 'extensions supplier' },
    values: { price: 350, hoursPerJob: 4, target: 6000, ext: 120, transport: 40, fixed: 300, hours: 80 }, src: { ...YOU }
  },
  baker: {
    person: 'Naledi', shape: 'goods', name: 'Home bakery: cupcake boxes', desc: 'Make and sell goods',
    labels: { unit: 'box', units: 'boxes', client: 'customer', clients: 'customers', mat: 'Ingredients', second: 'Packaging', supplier: 'ingredients supplier' },
    values: { price: 120, hoursPerJob: 1.5, target: 4000, ext: 38, transport: 12, fixed: 250, hours: 60 }, src: { ...YOU }
  },
  designer: {
    person: 'Thabo', shape: 'services', name: 'Freelance logo design', desc: 'Time-based service with software and data costs',
    labels: { unit: 'logo job', units: 'logo jobs', client: 'client', clients: 'clients', mat: 'Stock assets and fees', second: 'Data and travel', supplier: 'software supplier' },
    values: { price: 200, hoursPerJob: 5, target: 8000, ext: 25, transport: 35, fixed: 700, hours: 100 }, src: { ...YOU }
  }
};
export const presetBlueprint = (k) => { const p = PRESETS[k] || PRESETS.braider; return JSON.parse(JSON.stringify(p)); };

/* ---------- shape-specific mission and event wording ---------- */
const M2 = {
  services: { t: ['Tool wear', 'Combs, clips, heat tools, laptops or other tools, replaced over time'], a: ['Admin and messaging', 'Booking chats, photos, quotes, confirmations'], c: ['Cancellation allowance', 'A little set aside for no-shows'], forget: [['Tools that wear out', 'Equipment you replace over time'], ['Admin and messaging time', 'Unpaid, but still your hours'], ['Cancellations and no-shows', 'Materials bought, slot empty']] },
  goods: { t: ['Equipment, gas and electricity', 'Oven, mixer, gas, power and cleaning, spread across what you make'], a: ['Selling and messaging time', 'Taking orders, photos, deliveries, chasing payment'], c: ['Waste and leftovers', 'A little set aside for spoilage and unsold items'], forget: [['Gas, power and equipment wear', 'Used up every time you make something'], ['Selling and messaging time', 'Unpaid, but still your hours'], ['Waste and unsold stock', 'Made, paid for, never sold']] },
  resale: { t: ['Carrying and handling', 'Bags, fuel for collecting stock, storage'], a: ['Chasing orders and payments', 'Messages, follow-ups, reminders'], c: ['Unsold or returned stock', 'A little set aside for stock that does not move'], forget: [['Carrying and storage costs', 'Small costs that add up'], ['Chasing orders and payments', 'Unpaid, but still your hours'], ['Stock that does not sell', 'Money tied up on a shelf']] }
};
export const m2Copy = (shape) => M2[shape] || M2.services;

const M4 = {
  services: { tests: [['Pre-orders on WhatsApp', 'Post your prices and ask for bookings.', 'About R0 to R50'], ['Weekend pop-up', 'Rent a chair or table for a day.', 'About R100 to R300'], ['Referral offer to five past clients', 'Ask each one to bring a friend.', 'About R0 to R150']], res: ['Data for messages', 'A friend to help on the day', 'A printed price list', 'A second set of tools'] },
  goods: { tests: [['Pre-orders before you make anything', 'Take payment or a promise first, then buy ingredients.', 'About R0 to R50'], ['A taste-test stall at a market', 'Sell one small batch and ask what people think.', 'About R100 to R300'], ['Orders from five friends and their families', 'A small first batch, made to order.', 'About R0 to R150']], res: ['Data for messages', 'A friend to help on the day', 'Packaging or labels', 'A table or stall space'] },
  resale: { tests: [['Pre-orders before buying stock', 'Only buy what is already promised.', 'About R0 to R50'], ['One small batch at a stall', 'Buy little, sell it, count what is left.', 'About R100 to R300'], ['Ask five regulars what they would buy', 'Short messages, honest answers.', 'About R0 to R100']], res: ['Data for messages', 'A friend to help on the day', 'Bags or packaging', 'Transport money'] }
};
export const m4Copy = (shape) => M4[shape] || M4.services;

const round5 = (x) => Math.max(5, Math.round(x / 5) * 5);

/** Three simulation events chosen for this business. Each option mutates a month state `s`. */
export function eventsFor(v, L, shape) {
  const sup = L.supplier, un = L.unit, cl = L.clients, bump = round5(v.price * 0.14), sur = round5(v.price * 0.09), disc = round5(v.price * 0.09), trExtra = round5(v.price * 0.04);
  const cap = calc(v).cap, quiet = Math.max(1, Math.round(cap * 0.25)), fill = Math.max(1, Math.round(cap * 0.2)), refs = Math.max(1, Math.round(cap * 0.1));
  const e1 = {
    t: `Your ${sup} raises prices by 20%.`, d: `From Monday everything you buy from them costs more. Your ${cl} have not been told anything.`,
    shock: (s) => { s.ext = Math.round(s.ext * 1.2); },
    opts: [
      [`Raise your price by ${R(bump)}`, `Some ${cl} may leave. How many is your assumption.`, (s) => { s.price += bump; }, 'Uses your demand assumption: customers lost for every R10 rise.'],
      ['Find another supplier', 'Slightly cheaper, but farther away.', (s) => { s.ext = Math.round(v.ext * 1.04); s.tr += trExtra; }, `Assumes the new supplier's quality is fine for your ${cl}.`],
      ['Absorb the cost', `Keep the price. Keep the ${cl}.`, () => {}, 'No assumptions. The margin shrinks.'],
      [`Add a ${R(sur)} surcharge`, 'Shown on the quote so it is clear.', (s) => { s.price += sur; }, 'Uses your demand assumption. A clearly explained surcharge may lose fewer customers.']
    ],
    tip: `If your price already sat below your full cost, a surcharge may help less than cutting a cost. Try the Mission 2 numbers.`
  };
  const e2 = {
    t: 'A week with no orders.', d: `Two regulars are away and nobody messaged. About ${quiet} ${cl} will not buy this month.`,
    shock: (s) => { s.base = Math.max(0, s.base - quiet); },
    opts: [
      [`Offer ${R(disc)} off for orders this week`, 'Fills gaps, lowers your average price.', (s) => { s.base += fill; }, `Assumes ${fill} extra orders. That is a guess, not a forecast.`],
      ['Ask past customers for referrals', 'Free, but needs your time.', (s) => { s.base += refs; }, `Assumes ${refs} referral${refs > 1 ? 's' : ''} buy. Treat it as a test.`],
      ['Use the week to rest and plan', 'Protect your energy for the busy weeks.', () => {}, 'No assumptions.']
    ],
    tip: 'Quiet weeks are normal. A cash buffer of a few sales gives you room to choose calmly.'
  };
  const e3 = {
    services: { t: 'A client cancels two hours before.', d: 'You have already travelled and bought what you need.', a: ['Fill the slot from your waiting list', 'Message three people now.'], b: ['Charge half price as a late fee', 'Fair if you told them the rule up front.'], c: ['Absorb it and keep the relationship', 'They may rebook and refer friends.'] },
    goods: { t: 'A big order is cancelled the day before.', d: 'The ingredients are bought and half of it is already made.', a: ['Sell the extra at a stall or to neighbours', 'Message three people now.'], b: ['Charge half price as a cancellation fee', 'Fair if you told them the rule up front.'], c: ['Absorb it and keep the relationship', 'They may order again and refer friends.'] },
    resale: { t: 'A batch of stock does not sell.', d: 'You paid for it up front and the cash is stuck on the shelf.', a: ['Offer it to regulars at a small discount', 'Message three people now.'], b: ['Ask for a deposit on future orders', 'Fair if you tell them the rule up front.'], c: ['Hold on to it and wait', 'It may sell next month, or not.'] }
  }[shape] || null;
  const E3 = e3 || { t: 'A customer cancels at the last minute.', d: 'You have already spent on this order.', a: ['Fill it from a waiting list', 'Message three people now.'], b: ['Charge half price as a cancellation fee', 'Fair if you told them the rule up front.'], c: ['Absorb it and keep the relationship', 'They may come back.'] };
  const ev3 = {
    t: E3.t, d: E3.d, shock: (s) => { s.base = Math.max(0, s.base - 1); },
    opts: [
      [E3.a[0], E3.a[1], (s) => { s.base += 1; }, 'Assumes someone is free at short notice.'],
      [E3.b[0], E3.b[1], (s) => { s.oneOff += Math.round(s.price / 2); }, 'Assumes they agree. State your policy before taking orders, so it is not a surprise.'],
      [E3.c[0], E3.c[1], () => {}, 'No assumptions. The loss is yours.']
    ],
    tip: 'Ethical choice: a clear cancellation policy shared before the order protects you and treats customers fairly.'
  };
  return [e1, e2, ev3];
}

/* ---------- offline rules-based intake (used when the AI guide is unavailable) ---------- */
const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5 };
const money = (s) => { const m = s.match(/R\s?(\d[\d\s,.]*)/i); return m ? parseFloat(m[1].replace(/[\s,]/g, '')) : null; };

/** Reads what it can from the user's own words. Everything it cannot read stays an AI-style estimate for the user to check. */
export function parseBusiness(text) {
  const t = String(text || '');
  const lower = t.toLowerCase();
  const all = [...t.matchAll(/R\s?(\d[\d\s,.]*)/gi)].map((m) => parseFloat(m[1].replace(/[\s,]/g, ''))).filter(Number.isFinite);
  const perM = lower.match(/R\s?(\d[\d\s,.]*)\s*(a|per|each|\/)\s*(month|mo)/i) || lower.match(/(take home|make|earn|want)[^.]*?R\s?(\d[\d\s,.]*)/i);
  const target = perM ? parseFloat((perM[2] && /\d/.test(perM[2]) ? perM[2] : perM[1]).replace(/[\s,]/g, '')) : null;
  const priceM = lower.match(/(charge|sell|price)[^.]*?R\s?(\d[\d\s,.]*)/i);
  let price = priceM ? parseFloat(priceM[2].replace(/[\s,]/g, '')) : (all.find((x) => x !== target) ?? null);
  let hrs = null;
  const hm = lower.match(/(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|half)\s*(?:and a half\s*)?hours?/);
  if (hm) hrs = WORDNUM[hm[1]] ?? parseFloat(hm[1]);
  const goods = /(bake|cake|cupcake|cook|food|sew|craft|sell|stall|make|braai|kota|vetkoek|jewel)/.test(lower) && !/(braid|design|tutor|clean|repair|photo|hair|nail|wash)/.test(lower);
  const resale = /(resell|airtime|reseller|buy and sell|stock|clothes|sneaker|grocer)/.test(lower) && !goods;
  const shape = resale ? 'resale' : goods ? 'goods' : 'services';
  const ref = PRESETS[shape === 'goods' ? 'baker' : 'braider'];
  const name = t.split(/[.!?\n]/)[0].slice(0, 56).replace(/^i\s+(do|make|sell|bake|run)\s+/i, (m) => m.slice(2).replace(/^./, (c) => c.toUpperCase())) || 'My business';
  const draft = {
    shape, name: name.charAt(0).toUpperCase() + name.slice(1), desc: shape === 'services' ? 'Time-based service with direct materials' : shape === 'goods' ? 'Make and sell goods' : 'Buy and resell',
    labels: shape === 'services' ? { unit: 'job', units: 'jobs', client: 'client', clients: 'clients', mat: 'Materials', second: 'Transport', supplier: 'supplier' } : { unit: 'item', units: 'items', client: 'customer', clients: 'customers', mat: shape === 'resale' ? 'Stock cost' : 'Ingredients', second: shape === 'resale' ? 'Delivery' : 'Packaging', supplier: 'supplier' },
    values: { price: price || ref.values.price, hoursPerJob: hrs || ref.values.hoursPerJob, target: target || ref.values.target, ext: ref.values.ext, transport: ref.values.transport, fixed: ref.values.fixed, hours: ref.values.hours },
    stated: [price && 'price', hrs && 'hoursPerJob', target && 'target'].filter(Boolean)
  };
  if (price && !ref.values.ext) draft.values.ext = 0;
  // Keep estimates in proportion to what the user said they charge, so a R25 item does not inherit a R350 item's costs.
  if (price) { const k = price / ref.values.price; draft.values.ext = Math.round(ref.values.ext * Math.min(1.5, Math.max(0.1, k))); draft.values.transport = Math.round(ref.values.transport * Math.min(1.5, Math.max(0.1, k))); }
  return sanitizeBlueprint(draft);
}
