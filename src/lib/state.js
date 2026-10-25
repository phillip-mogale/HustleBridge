import { store } from './ui.js';
import { presetBlueprint } from './copy.js';

const KEY = 'hb-state-v2';
/** Live objects. Views import these and read them directly; setBlueprint() mutates them in place. */
export const BP = {};   // Blueprint numbers: price, hoursPerJob, target, ext, transport, fixed, hours
export const SRC = {};  // 'you' | 'ai' for each number
export const LB = {};   // Blueprint wording: unit, units, client, clients, mat, second, supplier

const defaults = () => ({
  v: 2, name: '', guest: true, demo: false, session: null, setup: {}, rating0: 3, rating: 3,
  meta: { shape: 'services', name: 'My business', desc: '' }, confirmed: false,
  progress: 0, evidence: 0, streak: 0, lastDay: '', checked: {}, log: [], mdata: {}, assume: {},
  sim: null, pastHist: [], pitch: null, filters: { type: 'All', stage: 'Any', loc: 'Any' },
  sens: 2, cash0: 2500, ins: null, hideInstall: false, learnSens: null, intake: [], events: [], savedAt: 0, dirty: false
});

export let S = defaults();

export function setBlueprint(b) {
  S.meta = { shape: b.shape, name: b.name, desc: b.desc || '' };
  for (const o of [BP, SRC, LB]) for (const k of Object.keys(o)) delete o[k];
  Object.assign(BP, b.values); Object.assign(SRC, b.src); Object.assign(LB, b.labels);
}
export const blueprintOut = () => ({ shape: S.meta.shape, name: S.meta.name, desc: S.meta.desc, labels: { ...LB }, values: { ...BP }, src: { ...SRC } });

let timer = 0, syncHook = null;
export const onSave = (fn) => { syncHook = fn; };
export function save(now) {
  S.savedAt = Date.now(); S.dirty = true;
  clearTimeout(timer);
  const w = () => { const snap = { ...S, blueprint: blueprintOut() }; store.set(KEY, JSON.stringify(snap)); if (syncHook) syncHook(); };
  now ? w() : (timer = setTimeout(w, 250));
}
addEventListener('pagehide', () => save(true));

function applyDay() {
  const d = new Date(), today = d.toISOString().slice(0, 10);
  if (S.lastDay === today) return;
  const y = new Date(d.getTime() - 864e5).toISOString().slice(0, 10);
  S.streak = S.lastDay === y ? S.streak + 1 : 1; S.lastDay = today;
}

export function loadState() {
  let snap = null;
  try { snap = JSON.parse(store.get(KEY) || 'null'); } catch { snap = null; }
  S = Object.assign(defaults(), snap || {});
  delete S.blueprint;
  setBlueprint(snap && snap.blueprint && snap.blueprint.values ? snap.blueprint : presetBlueprint('braider'));
  applyDay();
  return S;
}
/** Replace everything with a snapshot, for example one pulled from the user's account. */
export function adopt(snap) { S = Object.assign(defaults(), snap, { session: S.session }); const b = snap.blueprint; delete S.blueprint; if (b && b.values) setBlueprint(b); save(true); }

export const D = (n) => S.mdata[n] || (S.mdata[n] = {});
export const hasBlueprint = () => S.confirmed || S.demo;

export function resetFresh(keepSession = true) {
  const sess = keepSession ? S.session : null, name = S.name, guest = S.guest;
  S = Object.assign(defaults(), { session: sess, name, guest, streak: 1, lastDay: new Date().toISOString().slice(0, 10) });
  setBlueprint(presetBlueprint('braider')); save(true);
}

export function startDemo(key = 'braider') {
  const p = presetBlueprint(key);
  S = Object.assign(defaults(), { demo: true, guest: true, name: p.person, confirmed: true, streak: 3, lastDay: new Date().toISOString().slice(0, 10), session: null });
  setBlueprint(p);
  S.checked = { ext: true, transport: true, fixed: true, hours: true };
  S.assume = { ext: true, transport: false, data: true, hours: false, admin: false, cancel: false };
  S.progress = 2; S.evidence = 7; S.rating0 = 2; S.rating = 4;
  S.setup = { stage: 'Already operating', province: 'Gauteng', town: 'Soweto', money: 'R500 to R2 000', have: ['A smartphone with data', 'Part-time hours'], challenge: 'Pricing' };
  const now = Date.now();
  S.log = [{ t: 'Mission 2: Make the numbers work', k: 'self', at: now - 864e5 }, { t: 'Mission 1: Understand the customer', k: 'self', at: now - 2 * 864e5 }, { t: 'Business Blueprint confirmed', k: 'self', at: now - 3 * 864e5 }];
  S.mdata = {
    1: { c: 'Women in my area who braid for work or church and cannot spend a Saturday in a salon', p: 'Salons are far, expensive and slow, and the wait is unpredictable', o: 'Braids at their home, booked and confirmed on WhatsApp', why: 'She is my most regular client and she tells her friends.' },
    2: { tools: 10, admin: 0.5, cancel: 0, why: 'I had never counted admin time before.' }
  };
  S.pastHist = [{ t: 'Your extensions supplier raises prices by 20%.', c: 'Absorb the cost', d: 0, why: '' }, { t: 'A week with no orders.', c: 'Use the week to rest and plan', d: 0, why: '' }];
  save(true);
}

export function logEvidence(t, k) { S.log.unshift({ t, k, at: Date.now() }); S.evidence += 1; save(); }
export function track(name, props) { S.events.push({ name, at: new Date().toISOString(), props: props || null }); if (S.events.length > 200) S.events.splice(0, 50); save(); }

const MIN = 60e3;
export function ago(at) {
  const d = Date.now() - at;
  if (d < MIN) return 'Just now'; if (d < 60 * MIN) return Math.round(d / MIN) + ' min ago';
  if (d < 24 * 60 * MIN) return Math.round(d / (60 * MIN)) + ' hours ago';
  const n = Math.round(d / (24 * 60 * MIN)); return n === 1 ? 'Yesterday' : n + ' days ago';
}
