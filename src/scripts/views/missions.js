import { S, BP, LB, D, save, logEvidence, track } from '../../lib/state.js';
import { ic, $, $$, toast, go, flash, tagFor, esc, L_ as L } from '../../lib/ui.js';
import { MX } from '../../lib/missions.js';
import { syncNow } from '../../lib/api.js';

const argN = (a) => Math.min(Math.max(+a || S.progress + 1, 1), 4);
const stOf = (n) => (n <= S.progress ? 'done' : n === S.progress + 1 ? 'now' : 'lock');

export const list = {
  render() {
    return `<h1 class="h-page">Four missions, built around your business.</h1><p class="p-page">Learn one idea, do a task with your own numbers, get feedback, and save the result as evidence.</p>
 <div class="path">${[1, 2, 3, 4].map((n) => { const st = (({ done: 'done', now: 'now', lock: 'lock' })[stOf(n)]); return `<button class="mcard ${st}" data-go="mission" data-arg="${n}"><span class="mnum">${st === 'lock' ? ic('lock') : n}</span><h3>${MX[n].name}</h3><p>${MX[n].blurb}</p><span class="st">${st === 'done' ? '<span class="tag ver">' + ic('check') + 'Done</span>' : st === 'now' ? '<span class="tag sim">In progress, ' + MX[n].time + '</span>' : '<span class="tag self">Locked</span>'}<span>${st === 'lock' ? '' : ic('arrow')}</span></span></button>`; }).join('')}</div>
 <div class="callout" style="margin-top:24px">${ic('info')}<span>Numbers you enter in Mission 2 are the numbers the simulation uses in Mission 3. If you underprice early, a later shock shows the result.</span></div>`;
  }
};

export const one = {
  render(a) {
    const n = argN(a), M = MX[n], st = stOf(n);
    const head = `<button class="back" data-go="missions">${ic('arrow')}All missions</button><div class="row-between"><div><span class="tag ${st === 'done' ? 'ver' : st === 'now' ? 'sim' : 'self'}">Mission ${n} of 4</span><h1 class="h-page">${M.name}</h1></div></div>`;
    if (st === 'lock') return head + `<div class="card" style="margin-top:24px;text-align:center;padding:48px 24px"><div class="mnum" style="margin:0 auto 16px">${ic('lock')}</div><h3>Locked for now</h3><p class="sub">Finish Mission ${n - 1} to unlock this one. Your saved numbers carry forward.</p><button class="btn" style="margin-top:20px" data-go="mission" data-arg="${S.progress + 1}">Go to Mission ${S.progress + 1}</button></div>`;
    if (st === 'done') { const d = D(n); return head + `<div class="card" style="margin-top:24px"><div class="row-between"><h3>Your saved output</h3>${tagFor[n === 3 ? 'sim' : 'self']}</div><ul class="list">${M.out().map(([x, y]) => `<li><div class="grow">${esc(x)}<small>${esc(y) || 'Not filled in'}</small></div></li>`).join('')}${d.why ? `<li><div class="grow">Your reasoning<small>${esc(d.why)}</small></div></li>` : ''}</ul></div>`; }
    return head + `<div class="steps" id="msteps">${['Learn', 'Do', 'Feedback', 'Save'].map((s, i) => `<button data-step="${i}">${s}</button>`).join('')}</div><div id="mbody" style="margin-top:20px"></div>`;
  },
  mount(a) { const n = argN(a); if (n !== S.progress + 1) return; S.mstep = 0; step(n); document.addEventListener('click', (e) => { if (e.target.closest('#seeinkind')) { S.filters.type = 'In-kind'; save(true); } }); }
};

function step(n) {
  const M = MX[n], s = S.mstep, box = $('#mbody');
  $$('#msteps button').forEach((b, i) => { b.setAttribute('aria-current', i === s ? 'step' : 'false'); b.classList.toggle('ok', i < s); b.innerHTML = (i < s ? ic('check') : '') + ['Learn', 'Do', 'Feedback', 'Save'][i]; b.onclick = () => { if (i <= s) { S.mstep = i; step(n); } }; });
  const next = (label) => `<button class="btn" style="margin-top:20px" id="nx">${label}${ic('arrow')}</button>`;
  if (s === 0) box.innerHTML = M.learn() + next('Try the task');
  if (s === 1) { box.innerHTML = M.task() + next('See feedback'); const chg = () => { $('#nx').disabled = !M.ok(); save(); }; M.bind(chg); chg(); }
  if (s === 2) box.innerHTML = M.fb() + next('Explain your choice');
  if (s === 3) {
    const d = D(n); box.innerHTML = `<div class="card"><span class="tag sim">Save</span><h3 style="margin-top:12px">${M.ask()}</h3><p class="sub">One or two sentences. Explaining a decision is a skill funders look for.</p><div class="field" style="margin-top:16px"><label for="why">Your reasoning</label><textarea class="input" id="why" placeholder="I chose this because...">${esc(d.why || '')}</textarea></div><button class="btn pink" style="margin-top:20px" id="save" disabled>Save to my profile${ic('arrow')}</button></div>`;
    const chk = () => { $('#save').disabled = L($('#why').value) < 5; }; $('#why').oninput = chk; chk();
    $('#save').onclick = () => { D(n).why = $('#why').value.trim(); saveMission(n); };
  }
  const nx = $('#nx'); if (nx) nx.onclick = () => { S.mstep = s + 1; step(n); }; scrollTo(0, 0);
}

function saveMission(n) {
  S.progress = n; logEvidence(`Mission ${n}: ${MX[n].name}`, n === 3 ? 'sim' : 'self'); track('mission_completed', { n }); save(true); syncNow();
  if (n < 4) { flash(`Saved. Span ${n} is built, plus one piece of evidence.`); go('missions'); return; }
  const w = document.createElement('div'); w.className = 'stampwrap'; w.innerHTML = `<div class="cross"><div class="bigstamp"><div><b>Bridge<br>built</b><span>Your profile is ready</span></div></div><button class="btn pink" id="see">See my profile${ic('arrow')}</button></div>`; document.body.appendChild(w); $('#see').focus(); $('#see').onclick = () => { w.remove(); go('profile'); };
}
