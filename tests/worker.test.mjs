import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const env = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'anon', AI_API_KEY: 'k', AI_PROVIDER: 'anthropic', AI_MODEL: 'm', ASSETS: { fetch: () => new Response('asset') } };
const call = (path, init = {}, e = env) => worker.fetch(new Request('https://hb.test' + path, { headers: { Origin: 'https://hb.test', 'Content-Type': 'application/json', ...(init.headers || {}) }, ...init }), e, {});
let upstream = [];
const realFetch = globalThis.fetch;
const mock = (fn) => { globalThis.fetch = async (u, o) => { upstream.push({ u: String(u), o }); return fn(String(u), o); }; };
test.afterEach(() => { globalThis.fetch = realFetch; upstream = []; });

test('non-API paths go to static assets', async () => { assert.equal(await (await call('/dashboard')).text(), 'asset'); });
test('health never leaks secrets', async () => { const j = await (await call('/api/health')).json(); assert.deepEqual(j, { ok: true, supabase: true, ai: true }); });
test('cross-origin writes are refused', async () => {
  const r = await worker.fetch(new Request('https://hb.test/api/db/events', { method: 'POST', headers: { Origin: 'https://evil.test', Authorization: 'Bearer t' }, body: '[]' }), env, {});
  assert.equal(r.status, 403);
});
test('db: unknown table, anonymous write, read-only table, missing owner filter', async () => {
  assert.equal((await call('/api/db/secrets')).status, 404);
  assert.equal((await call('/api/db/profiles', { method: 'POST', body: '{}' })).status, 401);
  assert.equal((await call('/api/db/opportunities', { method: 'POST', headers: { Authorization: 'Bearer t' }, body: '{}' })).status, 403);
  assert.equal((await call('/api/db/events', { method: 'DELETE', headers: { Authorization: 'Bearer t' } })).status, 400);
});
test('db: forwards the user token and adds the anon key server-side', async () => {
  mock(() => new Response('[]', { status: 200 }));
  const r = await call('/api/db/profiles?user_id=eq.abc', { headers: { Authorization: 'Bearer usertoken' } });
  assert.equal(r.status, 200);
  assert.equal(upstream[0].u, 'https://x.supabase.co/rest/v1/profiles?user_id=eq.abc');
  assert.equal(upstream[0].o.headers.Authorization, 'Bearer usertoken');
  assert.equal(upstream[0].o.headers.apikey, 'anon');
});
test('db and auth say so plainly when Supabase is not configured', async () => {
  assert.equal((await call('/api/auth/login', { method: 'POST', body: '{}' }, { ASSETS: env.ASSETS })).status, 503);
  assert.equal((await call('/api/db/profiles', { headers: { Authorization: 'Bearer t' } }, { ASSETS: env.ASSETS })).status, 503);
});
test('ai: returns a validated blueprint and clamps junk', async () => {
  mock(() => new Response(JSON.stringify({ content: [{ text: '```json\n' + JSON.stringify({ done: true, blueprint: { shape: 'goods', name: 'Cakes', values: { price: 120, hoursPerJob: 2, target: 4000, ext: 40, transport: 10, fixed: 250, hours: 9999 }, stated: ['price'] } }) + '\n```' }] }), { status: 200 }));
  const r = await call('/api/ai/chat', { method: 'POST', body: JSON.stringify({ transcript: [{ role: 'user', content: 'I bake cupcakes' }] }) });
  const j = await r.json(); assert.equal(j.done, true); assert.equal(j.blueprint.values.hours, 400); assert.equal(j.blueprint.src.price, 'you'); assert.equal(j.blueprint.src.ext, 'ai');
  assert.equal(upstream[0].o.headers['x-api-key'], 'k');
});
test('ai: refuses to loop past three questions and rejects empty input', async () => {
  mock(() => new Response(JSON.stringify({ content: [{ text: '{"done":false,"question":"More?","chips":[]}' }] }), { status: 200 }));
  const t = [1, 2, 3].map((i) => ({ role: 'user', content: 'a' + i }));
  assert.equal((await call('/api/ai/chat', { method: 'POST', body: JSON.stringify({ transcript: t }) })).status, 502);
  assert.equal((await call('/api/ai/chat', { method: 'POST', body: JSON.stringify({ transcript: [] }) })).status, 400);
});
test('ai: provider failure falls back to the second provider', async () => {
  let n = 0; mock((u) => (n++ === 0 ? new Response('no', { status: 500 }) : new Response(JSON.stringify({ choices: [{ message: { content: '{"done":false,"question":"Who buys it?","chips":["Neighbours"]}' } }] }), { status: 200 })));
  const e2 = { ...env, AI2_PROVIDER: 'openai', AI2_API_KEY: 'k2', AI2_MODEL: 'g', AI2_BASE_URL: 'https://o.test/v1' };
  const j = await (await call('/api/ai/chat', { method: 'POST', body: JSON.stringify({ transcript: [{ role: 'user', content: 'hi' }] }) }, e2)).json();
  assert.equal(j.question, 'Who buys it?'); assert.ok(upstream[1].u.startsWith('https://o.test/v1/chat/completions'));
});
