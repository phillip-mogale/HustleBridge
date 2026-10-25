import { S, BP, LB, SRC, setBlueprint, save, track } from '../../lib/state.js';
import { ic, R, $, $$, go, openSheet, esc } from '../../lib/ui.js';
import { calc, sanitizeBlueprint } from '../../lib/engine.js';
import { PRESETS, presetBlueprint, parseBusiness } from '../../lib/copy.js';
import { ai } from '../../lib/api.js';

const MAX = 3;
const FALLBACK = [
  null,
  { q: 'Thanks. Which costs do you pay yourself each time you make or do one?', chips: ['Materials and transport', 'Materials, transport and data', 'I am not sure'] },
  { q: 'Last one. How many hours a month can you realistically sell?', chips: ['About 60', 'About 80', 'About 100'] }
];
let turns = 0, busy = false, aiOk = true, draft = null; const transcript = [];

function addMsg(t, who, html) { const m = document.createElement('div'); m.className = 'msg ' + who; m.innerHTML = who === 'ai' ? `<div class="who">${ic('spark')}Guide</div>${html ? t : esc(t)}` : esc(t); $('#msgs').appendChild(m); $('#msgs').scrollTop = 1e5; return m; }
const typing = () => { const ty = document.createElement('div'); ty.className = 'msg ai typing'; ty.innerHTML = '<i></i><i></i><i></i>'; $('#msgs').appendChild(ty); $('#msgs').scrollTop = 1e5; return ty; };
function chips(list) { $('#quick').innerHTML = (list || []).map((c) => `<button type="button">${esc(c)}</button>`).join(''); $$('#quick button').forEach((b) => (b.onclick = () => reply(b.textContent))); }

function firstLook(bp) {
  const c = calc(bp.values), gap = bp.values.price - c.cost;
  return `<div class="look"><b>First look</b><div class="lk"><span>You charge</span><b class="num">${R(bp.values.price)}</b></div><div class="lk"><span>Each ${esc(bp.labels.unit)} really costs</span><b class="num">${R(c.cost)}</b></div><div class="lk ${gap < 0 ? 'neg' : 'pos'}"><span>${gap < 0 ? 'Short on every one' : 'Left after every cost'}</span><b class="num">${R(Math.abs(gap))}</b></div><small>Your own ${bp.values.hoursPerJob} hours are counted as a cost. Some figures are estimates, so we will check them next.</small></div>`;
}
function applyPending(bp) { const p = S.pending; if (!p) return bp; for (const k of Object.keys(p)) { bp.values[k] = p[k]; bp.src[k] = 'you'; } return bp; }

function finish(bp, note) {
  bp = applyPending(bp); setBlueprint(bp); S.pending = null; S.intake = transcript.filter((t) => t.role === 'user').map((t) => t.content); S.checked = {}; for (const k of ['ext', 'transport', 'fixed', 'hours']) S.checked[k] = SRC[k] === 'you'; save(true);
  busy = true; chips([]); const ty = typing();
  setTimeout(() => { ty.remove(); addMsg(note || 'Thanks. I have drafted your Blueprint. Some numbers are my estimates, so please check each one before we use it.', 'ai'); $('#quick').innerHTML = '<button type="button" id="rv" style="background:var(--jac);color:var(--on-jac);border-color:var(--jac)">Review my Blueprint</button>'; $('#rv').onclick = () => go('blueprint'); $('#qcount').textContent = 'Blueprint drafted'; busy = false; }, 700);
}

function ask(q, list) { busy = true; chips([]); const ty = typing(); setTimeout(() => { ty.remove(); addMsg(q, 'ai'); chips(list); $('#qcount').textContent = `Question ${Math.min(turns + 1, MAX)} of ${MAX}`; busy = false; }, 500); }

async function reply(text) {
  if (busy || !text.trim()) return; text = text.trim().slice(0, 600); addMsg(text, 'me'); transcript.push({ role: 'user', content: text }); turns++; chips([]);
  if (turns === 1) { draft = parseBusiness(text); if (draft) { const m = addMsg('Here is a first look from what you told me. These are rough figures. We will check each one next.', 'ai'); m.insertAdjacentHTML('beforeend', firstLook(applyPending(JSON.parse(JSON.stringify(draft))))); $('#msgs').scrollTop = 1e5; } }
  busy = true; const ty = typing();
  if (aiOk) {
    try {
      const res = await ai.chat(transcript, { stage: S.setup.stage, province: S.setup.province });
      ty.remove(); busy = false;
      const bp = res && res.done ? sanitizeBlueprint(res.blueprint) : null;
      if (bp) { track('ai_blueprint'); return finish(bp); }
      if (res && res.question && turns < MAX) { transcript.push({ role: 'assistant', content: res.question }); return ask(res.question, (res.chips || []).slice(0, 4)); }
      throw new Error('unusable');
    } catch (e) { aiOk = false; ty.remove(); busy = false; addMsg('The guide is slow right now, so I will use quick questions instead. Your answers are saved.', 'ai'); }
  } else ty.remove();
  busy = false;
  // Offline rules-based path: fixed short questions, numbers read from the user's own words.
  if (turns === 3) { const hm = text.match(/\d+/); if (hm && draft) { draft.values.hours = Math.min(400, Math.max(1, +hm[0])); draft.src.hours = 'you'; } }
  if (turns < MAX) { const f = FALLBACK[turns]; transcript.push({ role: 'assistant', content: f.q }); ask(f.q, f.chips); }
  else finish(draft || parseBusiness(transcript.filter((t) => t.role === 'user').map((t) => t.content).join(' ')) || presetBlueprint('braider'));
}

function examples() {
  const sh = openSheet('Use an example business', `<p class="sub" style="margin-top:6px">Pick the one closest to yours. You can change every number on the next screen.</p><div class="opts" style="margin-top:14px">${Object.entries(PRESETS).map(([k, p]) => `<button class="opt" data-ex="${k}"><span class="l">${p.person[0]}</span><b>${esc(p.name)}</b><small>${esc(p.desc)}. Charges R${p.values.price} per ${esc(p.labels.unit)}.</small></button>`).join('')}</div>`);
  $$('[data-ex]', sh.w).forEach((b) => (b.onclick = () => { const bp = applyPending(presetBlueprint(b.dataset.ex)); setBlueprint(bp); S.pending = null; S.checked = { ext: false, transport: false, fixed: false, hours: false }; track('example_blueprint', { k: b.dataset.ex }); save(true); go('blueprint'); }));
}

export default {
  render() {
    return `<div class="onb-steps" aria-label="Progress"><span class="ok"><i>${ic('check')}</i>Setup</span><span class="on"><i>2</i>Chat</span><span><i>3</i>Blueprint</span></div>
 <h1 class="h-page">Tell us about your business.</h1>
 <p class="p-page">Three short questions. You will check every number before anything is used.</p>
 <div class="chat"><div class="chatbox"><div class="msgs" id="msgs" aria-live="polite"></div><div class="quick" id="quick"></div>
  <form class="composer" id="composer"><label class="sr" for="chat-in">Your answer</label><input class="input" id="chat-in" autocomplete="off" maxlength="600" placeholder="Type your answer"><button class="send" aria-label="Send">${ic('send')}</button></form></div>
  <p class="fine" style="margin:0">Only what you type here is sent to the AI service. Please do not type ID numbers or bank details.</p>
  <div class="row-between"><span class="fine" style="margin:0" id="qcount">Question 1 of ${MAX}</span><button class="btn ghost sm" style="color:var(--text)" id="ex">Use an example business instead</button></div></div>`;
  },
  mount() {
    turns = 0; busy = false; aiOk = true; draft = null; transcript.length = 0;
    const eg = 'I do braids for women in my area. I charge R350 per style and each style takes about four hours. I want to make R6 000 a month.';
    ask('Hi, I am your guide. Tell me about your business in your own words. What do you sell, to whom, and how do you charge?', [eg]);
    $('#composer').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#chat-in'); const v = i.value; i.value = ''; reply(v); });
    $('#ex').onclick = examples;
  }
};
