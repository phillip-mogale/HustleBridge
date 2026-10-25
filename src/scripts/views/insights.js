import { S, BP, LB, save } from '../../lib/state.js';
import { ic, R, T, tagFor, slider, $, $$, toast, go } from '../../lib/ui.js';
import { profitOf, jobsAt } from '../../lib/engine.js';
import { C, plan, cash, run, events, patternInfo } from '../../lib/shared.js';
import { MX } from '../../lib/missions.js';

export function spark(vals, w = 220, h = 56) {
  const mn = Math.min(...vals, 0), mx = Math.max(...vals, 1), X = (i) => 4 + i / (vals.length - 1) * (w - 8), Y = (v) => h - 6 - (v - mn) / (mx - mn || 1) * (h - 12);
  const pts = vals.map((v, i) => X(i).toFixed(1) + ' ' + Y(v).toFixed(1));
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="Cash over the next ${vals.length} months"><path d="M${pts.join(' L')} L${X(vals.length - 1)} ${h} L${X(0)} ${h}Z" fill="var(--jac-soft)"/><path d="M${pts.join(' L')}" fill="none" stroke="var(--jac)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${X(vals.length - 1)}" cy="${Y(vals[vals.length - 1])}" r="5" fill="var(--protea)"/></svg>`;
}
export function nextBest() {
  const p = S.progress, un = Object.values(S.checked).filter((v) => !v).length, pat = patternInfo();
  if (p < 4) { const why = ['You have no customer evidence in your profile yet.', 'You have not counted every cost yet.', 'You have not practised a shock yet.', 'You have no plan for what to test next.'][p]; return { t: `Mission ${p + 1}: ${MX[p + 1].name}`, why, go: 'mission', arg: p + 1, cta: 'Open mission' }; }
  if (un) return { t: `Check ${un} estimate${un > 1 ? 's' : ''} in your Blueprint`, why: 'Estimates the AI made are still marked as unchecked, which weakens your profile.', go: 'blueprint', cta: 'Check them' };
  if (pat.msg && pat.cnt.wait / pat.n >= 0.6) return { t: 'Practise a response that is not waiting', why: 'Most of your decisions so far were to wait or absorb a cost.', go: 'simulation', cta: 'Open simulation' };
  return { t: 'Browse support that fits you', why: 'Your missions are done and your profile is ready.', go: 'opportunities', cta: 'See support' };
}
function respRank() { const EV = events()[0], base = plan(); EV.shock(base); const none = profitOf(base); return EV.opts.map((o) => { const s = { ...base }; o[2](s); return { l: o[0], p: profitOf(s), d: profitOf(s) - none, a: o[3] }; }).sort((a, b) => b.p - a.p); }
function movers() {
  const pl = plan(), p0 = profitOf(pl);
  const t = [['Your price', { price: Math.round(pl.price * 1.1) }], [`Number of ${LB.clients}`, { base: Math.round(pl.base * 1.1) }], [`${LB.mat} cost`, { ext: Math.round(pl.ext * 1.1) }], [`${LB.second} cost`, { tr: Math.round(pl.tr * 1.1) }], ['Fixed costs', { fixed: Math.round(pl.fixed * 1.1) }]];
  return t.map(([l, o]) => ({ l, d: profitOf(plan(o)) - p0 })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
}
const SCN = [['plan', 'Your plan'], ['quiet', 'A quiet month'], ['sup', 'Supplier +20%'], ['both', 'Both']];

export default {
  render() {
    S.ins = S.ins || { scn: 'plan', draw: Math.round(BP.target / 2 / 100) * 100 }; const I = S.ins, pat = patternInfo(), nb = nextBest(), mv = movers(), mx = Math.max(...mv.map((x) => Math.abs(x.d)), 1), rr = respRank(), rmax = Math.max(...rr.map((x) => Math.abs(x.p)), 1);
    const dmax = Math.max(6000, BP.target * 1.2);
    return `<div class="row-between"><div><h1 class="h-page">Insights</h1><p class="p-page">Forecasts and patterns worked out from your own numbers and decisions. They are ${T('projected', 'projections')}, not promises.</p></div></div>
 <section class="card" style="margin-top:20px"><div class="row-between"><h3>Your next 6 months of cash</h3>${tagFor.proj}</div><p class="sub">Cash in the business after you take your living money out each month. Starts at ${R(S.cash0)}.</p>
  <div class="seg" id="scn" style="margin-top:14px;flex-wrap:wrap">${SCN.map(([k, l]) => `<button data-s="${k}" aria-pressed="${I.scn === k}">${l}</button>`).join('')}</div>
  <div class="grid2" style="grid-template-columns:.8fr 1.2fr;align-items:start"><div>${slider('i-draw', 'You take out each month', 0, Math.round(dmax / 100) * 100, 100, I.draw, R, 'Your living costs from the business')}<div class="kpis" id="i-k" style="margin-top:10px"></div></div><div id="i-chart"></div></div><p class="fine" id="i-sent" style="margin-top:12px"></p></section>
 <div class="grid2"><section class="card"><div class="row-between"><h3>If your supplier raises prices, what holds up best?</h3>${tagFor.proj}</div><p class="sub">Each response tried on your own numbers. Profit this month, with your ${T('demand', 'demand')} assumption of ${S.sens}% of ${LB.clients} lost per R10 rise.</p>
   <ul class="list rank">${rr.map((x, i) => `<li><span class="dot ${i === 0 ? 'done' : 'lock'}">${i === 0 ? ic('check') : i + 1}</span><div class="grow">${x.l}<div class="bar"><i style="width:${Math.max(4, Math.abs(x.p) / rmax * 100)}%;background:var(--${x.p < 0 ? 'protea' : 'jac'})"></i></div></div><b class="num">${R(x.p)}</b></li>`).join('')}</ul><p class="fine">The top response is the best on paper under your assumption. It is not a promise, and it ignores how ${LB.clients} feel.</p></section>
  <section class="card"><div class="row-between"><h3>What moves your month most</h3>${tagFor.calc}</div><p class="sub">Change in monthly profit if each number rises by 10%.</p>
   <div class="tornado">${mv.map((x) => `<div class="tr"><span>${x.l}</span><div class="tt"><i class="${x.d < 0 ? 'neg' : 'pos'}" style="width:${Math.abs(x.d) / mx * 50}%;${x.d < 0 ? 'right' : 'left'}:50%"></i></div><b class="num">${x.d >= 0 ? '+' : '−'}${R(Math.abs(x.d))}</b></div>`).join('')}</div><p class="fine">Check the top numbers first. A small error there changes your month the most.</p></section></div>
 <div class="grid2"><section class="card"><div class="row-between"><h3>Pattern spotted</h3>${tagFor.proj}</div>${pat.msg ? `<div class="callout" style="margin-top:14px">${ic('spark')}<span><b>${pat.msg}</b> ${pat.tip}</span></div><div class="mix" aria-label="Your decision mix"><i class="m1" style="flex:${pat.cnt.wait || 0.01}"></i><i class="m2" style="flex:${pat.cnt.price || 0.01}"></i><i class="m3" style="flex:${pat.cnt.act || 0.01}"></i></div><div class="legend"><span><b style="background:var(--muted)"></b>Waited or absorbed ${pat.cnt.wait}</span><span><b style="background:var(--protea)"></b>Changed a price ${pat.cnt.price}</span><span><b style="background:var(--jac)"></b>Took action ${pat.cnt.act}</span></div><button class="btn sm" data-go="simulation" style="margin-top:14px">Practise a different response</button>` : `<div class="empty">${ic('sim')}<b>Make two decisions first</b><p>Respond to two events in the simulation and your pattern appears here.</p><button class="btn sm" data-go="simulation">Open simulation</button></div>`}</section>
  <section class="card"><div class="row-between"><h3>Teach it from real life</h3><span class="tag self">Your results</span></div><p class="sub">Tried a price change on real ${LB.clients}? Enter what happened and your forecasts update. Example values shown, replace them with yours.</p>
   <div class="grid3 learn"><div class="field"><label for="l-ch">Price change (R)</label><input class="input" id="l-ch" type="number" value="30" inputmode="numeric"></div><div class="field"><label for="l-b">${LB.clients[0].toUpperCase() + LB.clients.slice(1)} before</label><input class="input" id="l-b" type="number" value="20" inputmode="numeric"></div><div class="field"><label for="l-a">${LB.clients[0].toUpperCase() + LB.clients.slice(1)} after</label><input class="input" id="l-a" type="number" value="19" inputmode="numeric"></div></div>
   <div class="callout mint" style="margin-top:14px" id="l-out"></div><button class="btn sm" id="l-use" style="margin-top:14px">Use this in my forecasts</button></section></div>
 <section class="card next" style="margin-top:20px"><div class="ring"></div><span class="kicker">Recommended next</span><h3>${nb.t}</h3><p>${nb.why}</p><button class="btn" data-go="${nb.go}" data-arg="${nb.arg || ''}">${nb.cta}${ic('arrow')}</button></section>`;
  },
  mount() {
    const I = S.ins;
    const draw = () => {
      const s = cash(I.scn, I.draw, 6), mn = Math.min(...s), mxv = Math.max(...s), rw = run(I.scn, I.draw);
      $('#i-k').innerHTML = `<div class="kpi"><span>Cash after 6 months</span><b class="${s[5] < 0 ? 'neg' : ''}">${R(s[5])}</b></div><div class="kpi"><span>Lowest point</span><b class="${mn < 0 ? 'neg' : ''}">${R(Math.min(mn, S.cash0))}</b></div><div class="kpi" style="grid-column:1/-1"><span>${T('runway')}</span><b class="${rw !== null && rw < 12 ? 'neg' : 'pos'}">${rw === null ? 'Not running out' : 'About ' + rw + ' month' + (rw === 1 ? '' : 's')}</b></div>`;
      const W = 520, H = 210, l = 48, r = 10, t = 20, b = 30, vmax = Math.max(mxv, S.cash0, 1000), vmin = Math.min(mn, 0), Y = (v) => t + (1 - (v - vmin) / (vmax - vmin || 1)) * (H - t - b), bw = (W - l - r) / 6 - 14;
      let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Projected cash for each of the next 6 months"><line class="axis" x1="${l}" x2="${W - r}" y1="${Y(0)}" y2="${Y(0)}"/>`;
      [0, 0.5, 1].forEach((f) => { const v = vmin + (vmax - vmin) * f; svg += `<line class="grid" x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${l - 8}" y="${Y(v) + 4}" text-anchor="end">${R(Math.round(v / 100) * 100)}</text>`; });
      s.forEach((v, i) => { const x = l + 7 + i * ((W - l - r) / 6), y0 = Y(0), y1 = Y(v); svg += `<rect x="${x}" y="${Math.min(y0, y1)}" width="${bw}" height="${Math.max(3, Math.abs(y0 - y1))}" rx="6" fill="${v < 0 ? 'var(--protea)' : 'var(--jac)'}" opacity="${v === mn ? 1 : 0.85}"/><text x="${x + bw / 2}" y="${H - 10}" text-anchor="middle">M${i + 1}</text><text x="${x + bw / 2}" y="${Math.min(y0, y1) - 5}" text-anchor="middle" style="fill:var(--text);font-weight:700">${R(v)}</text>`; });
      $('#i-chart').innerHTML = svg + '</svg>';
      $('#i-sent').textContent = rw === null ? `At ${R(I.draw)} a month, your cash holds in this scenario.` : `At ${R(I.draw)} a month, your cash would run out in about ${rw} month${rw === 1 ? '' : 's'} in this scenario. Cutting what you take out, or protecting your margin, buys time.`;
    };
    $$('#scn button').forEach((b) => (b.onclick = () => { I.scn = b.dataset.s; save(); $$('#scn button').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); }));
    $('#i-draw').oninput = (e) => { I.draw = +e.target.value; $('#i-draw-o').textContent = R(I.draw); save(); draw(); }; draw();
    const learn = () => { const ch = +$('#l-ch').value, b = +$('#l-b').value, a = +$('#l-a').value; const ok = ch > 0 && b > 0 && a >= 0 && a <= b * 3; const sens = ok ? Math.round(((b - a) / b) / (ch / 10) * 1000) / 10 : null; S.learnSens = sens;
      $('#l-out').innerHTML = ok ? `${ic('check')}<span>You lost <b>${Math.max(0, b - a)}</b> of ${b} ${LB.clients} after a ${R(ch)} rise. That is about <b>${sens}% per R10</b>. Your forecasts use ${S.sens}% now.</span>` : `${ic('info')}<span>Enter a price rise, how many ${LB.clients} you had, and how many you have now.</span>`; $('#l-use').disabled = !ok; };
    ['l-ch', 'l-b', 'l-a'].forEach((id) => ($('#' + id).oninput = learn)); learn();
    $('#l-use').onclick = () => { S.sens = Math.max(0, Math.min(6, S.learnSens)); save(true); toast('Forecasts updated with your real results.'); go('insights'); };
  }
};
