/**
 * Browser client for the Cloudflare Worker proxy. The browser only ever talks to /api/*.
 * Supabase URLs, the Supabase key and every AI key live in the Worker, never in this file.
 */
import { S, save, onSave, adopt, blueprintOut } from './state.js';

async function call(path, { method = 'GET', body, token, timeout = 20000 } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch('/api' + path, {
      method, signal: ctl.signal, keepalive: method !== 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(method === 'POST' && path.startsWith('/db/') ? { Prefer: 'resolution=merge-duplicates,return=minimal' } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const txt = await r.text(); let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = { error: txt }; }
    if (!r.ok) { const e = new Error((data && (data.error_description || data.msg || data.message || data.error)) || 'Request failed'); e.status = r.status; throw e; }
    return data;
  } finally { clearTimeout(t); }
}

/* ---------- AI guide ---------- */
export const ai = {
  /** transcript: [{role:'user'|'assistant', content}]. Resolves to {done, question?, chips?, blueprint?} or throws. */
  chat: (transcript, setup) => call('/ai/chat', { method: 'POST', body: { transcript, setup }, timeout: 25000 }),
  explain: (payload) => call('/ai/explain', { method: 'POST', body: payload, timeout: 15000 })
};

/* ---------- accounts ---------- */
const setSession = (d, email) => { S.session = { access: d.access_token, refresh: d.refresh_token, exp: Date.now() + (d.expires_in || 3600) * 1000 - 60000, uid: d.user && d.user.id, email: (d.user && d.user.email) || email }; S.guest = false; save(true); };
export const auth = {
  async signup(email, password, name) {
    const d = await call('/auth/signup', { method: 'POST', body: { email, password, data: { name } } });
    if (!d.access_token) { const e = new Error('Check your email to confirm your account, then sign in.'); e.confirm = true; throw e; }
    setSession(d, email); return d;
  },
  async login(email, password) { const d = await call('/auth/login', { method: 'POST', body: { email, password } }); setSession(d, email); return d; },
  async logout() { try { if (S.session) await call('/auth/logout', { method: 'POST', token: S.session.access }); } catch { /* signing out locally anyway */ } S.session = null; S.guest = true; save(true); }
};
async function token() {
  const s = S.session; if (!s) return null;
  if (Date.now() < s.exp) return s.access;
  try { const d = await call('/auth/refresh', { method: 'POST', body: { refresh_token: s.refresh } }); setSession(d, s.email); return S.session.access; } catch (e) { if (e.status === 400 || e.status === 401) { S.session = null; S.guest = true; save(true); } return null; }
}

/* ---------- saving to the account ---------- */
let busy = false, again = false;
export async function syncNow() {
  if (!S.session || !navigator.onLine) return false;
  if (busy) { again = true; return false; }
  busy = true;
  try {
    const tk = await token(); if (!tk) return false; const uid = S.session.uid; const now = new Date().toISOString();
    const snap = JSON.stringify({ ...S, session: null, blueprint: blueprintOut() });
    await call('/db/profiles?on_conflict=user_id', { method: 'POST', token: tk, body: { user_id: uid, name: S.name, stage: S.setup.stage || null, location: [S.setup.town, S.setup.province].filter(Boolean).join(', ') || null, resources: S.setup.money || null, main_challenge: S.setup.challenge || null, before_rating: S.rating0, after_rating: S.rating, state: JSON.parse(snap), updated_at: now } });
    const b = blueprintOut();
    await call('/db/blueprints?on_conflict=user_id', { method: 'POST', token: tk, body: { user_id: uid, shape: b.shape, name: b.name, data: b, confirmed_at: S.confirmed ? now : null, updated_at: now } });
    const missions = [1, 2, 3, 4].filter((n) => n <= S.progress && S.mdata[n]).map((n) => ({ user_id: uid, mission: n, responses: S.mdata[n], rationale: S.mdata[n].why || null, completed_at: now }));
    if (missions.length) await call('/db/mission_progress?on_conflict=user_id,mission', { method: 'POST', token: tk, body: missions });
    if (S.events.length) { const ev = S.events.splice(0, S.events.length); try { await call('/db/events', { method: 'POST', token: tk, body: ev.map((e) => ({ user_id: uid, name: e.name, props: e.props, at: e.at })) }); } catch (e) { S.events.unshift(...ev); throw e; } }
    S.dirty = false; return true;
  } catch { return false; } finally { busy = false; if (again) { again = false; setTimeout(syncNow, 1500); } }
}
/** Record one simulation decision as its own row, as the data model requires. */
export async function saveDecision(row) {
  if (!S.session) return;
  const tk = await token(); if (!tk) return;
  try { await call('/db/simulation_sessions', { method: 'POST', token: tk, body: { user_id: S.session.uid, inputs: row.inputs, event: row.event, chosen_action: row.action, outcome: row.outcome, rationale: row.why || null } }); } catch { /* the full snapshot syncs anyway */ }
}
/** After signing in on a new device: take the account's saved work if it has more than this device does. */
export async function pull() {
  const tk = await token(); if (!tk) return false;
  try {
    const rows = await call('/db/profiles?select=state,updated_at&user_id=eq.' + S.session.uid, { token: tk });
    const st = rows && rows[0] && rows[0].state;
    if (st && (st.evidence || 0) > (S.evidence || 0) && st.blueprint) { adopt(st); return true; }
  } catch { /* offline or not set up yet: keep local work */ }
  return false;
}

let t2 = 0;
onSave(() => { if (!S.session) return; clearTimeout(t2); t2 = setTimeout(syncNow, 2500); });
addEventListener('online', () => { if (S.dirty) syncNow(); });

/** Delete this person's saved rows from their account. Row-level security limits each call to their own rows. */
export async function wipe() {
  if (!S.session) return;
  const tk = await token(); if (!tk) return; const uid = S.session.uid;
  for (const t of ['mission_progress', 'simulation_sessions', 'events', 'blueprints', 'profiles']) await call(`/db/${t}?user_id=eq.${uid}`, { method: 'DELETE', token: tk });
}
