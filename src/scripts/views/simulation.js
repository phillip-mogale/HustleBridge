import { S, BP, LB, save, logEvidence, track } from '../../lib/state.js';
import { ic, R, T, tagFor, slider, $, $$, toast, esc } from '../../lib/ui.js';
import { jobsOf, profitOf, keptPer } from '../../lib/engine.js';
import { C, events } from '../../lib/shared.js';
import { saveDecision, syncNow } from '../../lib/api.js';

const cap1 = (s) => s[0].toUpperCase() + s.slice(1);
function simNew() { const c = C(); S.sim = { price: BP.price, ref: BP.price, ext: BP.ext, tr: BP.transport, fixed: BP.fixed, base: c.cap, cap: c.cap, cash: S.cash0, loss: S.sens, oneOff: 0, ev: 0, hist: (S.pastHist || []).map((x) => ({ ...x })) }; }

function kpis() {
  const s = S.sim, p = profitOf(s), m = keptPer(s), j = jobsOf(s), u = j / Math.max(1, s.cap);
  $('#k-m').textContent = R(m); $('#k-m').className = m < 0 ? 'neg' : 'pos'; $('#k-p').textContent = R(p); $('#k-p').className = p < 0 ? 'neg' : 'pos'; $('#k-c').textContent = R(s.cash + p); $('#k-j').textContent = j + ' of ' + s.base;
  $('#k-meter').className = 'meter' + (u > 1 ? ' over' : ''); $('#k-meter i').style.width = Math.min(100, u * 100) + '%';
  const lost = Math.max(0, s.base - j), gain = Math.max(0, j - s.base), w = lost === 1 ? LB.client : LB.clients;
  $('#k-warn').textContent = (s.price === s.ref ? `At today's price all your ${LB.clients} stay. Move the price to see demand react.` : (lost ? `At ${R(s.price)}, about ${lost} ${w} would leave (assumption).` : gain ? `At ${R(s.price)}, about ${gain} more ${gain === 1 ? LB.client : LB.clients} might buy (assumption).` : 'No change in customers at this price.')) + ` Capacity used: ${Math.round(u * 100)}%.`;
}

function draw() {
  const s = S.sim, EV = events(), ev = EV[s.ev % EV.length], u = LB.unit;
  const pmax = Math.max(650, Math.round(BP.price * 2 / 5) * 5);
  $('#simL').innerHTML = `<div class="row-between"><h3>Your month</h3>${tagFor.calc}</div>
  ${slider('s-price', `Price per ${u}`, Math.max(5, Math.round(BP.price * 0.5 / 5) * 5), pmax, 5, s.price, R)}${slider('s-base', `${cap1(LB.clients)} at today's price`, 0, s.cap + 4, 1, s.base, (v) => v + ' ' + LB.clients)}${slider('s-ext', `${LB.mat} per ${u}`, 0, Math.max(60, Math.round(BP.ext * 2)), 1, s.ext, R)}${slider('s-fixed', 'Fixed costs a month', 0, Math.max(1000, BP.fixed * 3), 10, s.fixed, R)}
  <div class="kpis" style="margin-top:16px"><div class="kpi"><span>${T('kept', 'Kept per ' + u)}</span><b id="k-m"></b></div><div class="kpi"><span>Profit this month</span><b id="k-p"></b></div><div class="kpi"><span>Cash at month end</span><b id="k-c"></b></div><div class="kpi"><span>${cap1(LB.clients)} who buy</span><b id="k-j"></b></div></div>
  <div class="meter" id="k-meter"><i></i></div><p class="fine" id="k-warn" style="margin:8px 0 0"></p>
  <div class="ctl" style="margin-top:12px;border:0">${tagFor.asm}<div class="t" style="margin-top:6px"><label for="s-loss">${cap1(LB.clients)} lost per R10 price rise</label><output id="s-loss-o">${s.loss}%</output></div><input class="range" id="s-loss" type="range" min="0" max="6" step="1" value="${s.loss}"><small>Your guess about ${T('demand', 'demand')}. You can update it from real results in Insights.</small></div>`;
  [['s-price', 'price', R], ['s-base', 'base', (v) => v + ' ' + LB.clients], ['s-ext', 'ext', R], ['s-fixed', 'fixed', R]].forEach(([id, k, f]) => ($('#' + id).oninput = (e) => { s[k] = +e.target.value; $('#' + id + '-o').textContent = f(s[k]); kpis(); }));
  $('#s-loss').oninput = (e) => { s.loss = +e.target.value; S.sens = s.loss; $('#s-loss-o').textContent = s.loss + '%'; kpis(); save(); }; kpis();
  $('#simR').innerHTML = `<section class="event" id="evt"><span class="lab">${ic('warn')}Event ${s.ev + 1}</span><h3>${ev.t}</h3><p>${ev.d}</p></section>
  <section class="card"><h3>How do you respond?</h3><div class="opts">${ev.opts.map((o, i) => `<button class="opt" data-o="${i}"><span class="l">${'ABCD'[i]}</span><b>${o[0]}</b><small>${o[1]}</small></button>`).join('')}</div></section><div id="resBox"></div>`;
  $$('.opt').forEach((b) => (b.onclick = () => respond(+b.dataset.o))); hist();
}

function respond(i) {
  const s = S.sim, EV = events(), ev = EV[s.ev % EV.length], before = profitOf(s), bm = keptPer(s);
  const a = { ...s }; ev.shock(a); const afterShock = profitOf(a); const b = { ...a }; ev.opts[i][2](b); const after = profitOf(b), am = keptPer(b);
  $$('.opt').forEach((o, j) => { o.disabled = true; o.classList.toggle('picked', j === i); });
  const jl = b.base - jobsOf(b), u = LB.unit;
  $('#resBox').innerHTML = `<section class="card result"><div class="row-between"><h3>What your choice did</h3>${tagFor.calc}</div>
  <div class="tbl"><table class="cmp"><tr><th></th><th>Before event</th><th>After event</th><th>After your choice</th></tr>
  <tr><td>Profit this month</td><td class="${before < 0 ? 'neg' : 'pos'}">${R(before)}</td><td class="${afterShock < 0 ? 'neg' : 'pos'}">${R(afterShock)}</td><td class="${after < 0 ? 'neg' : 'pos'}">${R(after)}</td></tr>
  <tr><td>Kept per ${u}</td><td>${R(bm)}</td><td>${R(keptPer(a))}</td><td>${R(am)}</td></tr>
  <tr><td>${cap1(LB.clients)} who buy</td><td>${jobsOf(s)}</td><td>${jobsOf(a)}</td><td>${jobsOf(b)}</td></tr>
  <tr><td>Cash at month end</td><td>${R(s.cash + before)}</td><td>${R(s.cash + afterShock)}</td><td>${R(s.cash + after)}</td></tr></table></div>
  <div class="callout ${after >= afterShock ? 'mint' : 'pink'}" style="margin-top:14px">${ic(after >= afterShock ? 'check' : 'warn')}<span>${after > afterShock ? `Your response recovered ${R(after - afterShock)} compared with doing nothing, under the assumption below.` : after === afterShock ? 'Your response left the month where the event put it.' : `Your response left you ${R(afterShock - after)} lower than doing nothing would have.`}${b.price > s.price && jl > 0 ? ` About ${jl} ${jl === 1 ? LB.client : LB.clients} would leave at the higher price.` : ''}</span></div>
  <p style="margin-top:12px">${tagFor.asm} <span style="color:var(--muted)">${ev.opts[i][3]}</span></p>
  <p style="margin-top:10px;color:var(--muted)"><b style="color:var(--text)">Try differently next time:</b> ${ev.tip}</p>
  <div class="field" style="margin-top:16px"><label for="why2">Why did you choose this? <span style="font-weight:500;color:var(--muted)">(optional)</span></label><input class="input" id="why2" maxlength="300" placeholder="One sentence is enough"></div>
  <button class="btn pink" id="nextEv" style="margin-top:16px">Save and meet the next event${ic('arrow')}</button></section>`;
  $('#nextEv').onclick = () => {
    const why = $('#why2').value.trim();
    S.sim.hist.unshift({ t: ev.t, c: ev.opts[i][0], d: after - afterShock, why });
    Object.assign(S.sim, b, { ev: s.ev + 1, hist: S.sim.hist, cash: s.cash, loss: s.loss });
    logEvidence(ev.opts[i][0], 'sim'); track('decision_saved', { event: s.ev }); save(true); syncNow();
    saveDecision({ inputs: { price: s.price, ext: s.ext, tr: s.tr, fixed: s.fixed, base: s.base, loss: s.loss }, event: ev.t, action: ev.opts[i][0], outcome: { before, afterShock, after }, why });
    toast('Decision saved. One more piece of evidence.'); draw();
  };
  $('#resBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hist() {
  const h = S.sim.hist;
  $('#hist').innerHTML = `<div class="row-between"><h3>Decision history</h3>${tagFor.sim}</div>${h.length ? `<ul class="list">${h.map((x) => `<li><span class="dot now">${ic('sim')}</span><div class="grow"><b>${esc(x.c)}</b><small>${esc(x.t)}${x.why ? ' You said: ' + esc(x.why) : ''}</small></div><b class="num" style="color:var(${x.d < 0 ? '--protea' : '--mint'})">${x.d >= 0 ? '+' : ''}${R(x.d)}</b></li>`).join('')}</ul>` : `<p class="sub" style="margin-top:10px">Your decisions will appear here, with what each one changed. Respond to the event to start.</p>`}`;
}

export default {
  render() { if (!S.sim || S.sim.base == null) simNew(); return `<h1 class="h-page">Run a month of your business.</h1><p class="p-page">Change your inputs, then respond to what happens. Results are worked out by the calculator from your Blueprint. How ${LB.clients} react is always shown as an ${T('assumption')}.</p>
 <div class="grid2 g-sim"><div class="stack-y"><section class="card" id="simL"></section><section class="card" id="hist"></section></div><div class="stack-y" id="simR"></div></div>`; },
  mount() { draw(); }
};
