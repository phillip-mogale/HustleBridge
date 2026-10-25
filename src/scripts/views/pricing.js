import { S, BP, LB, save } from '../../lib/state.js';
import { ic, R, T, tagFor, slider, $, $$ } from '../../lib/ui.js';
import { pricing } from '../../lib/engine.js';
import { C } from '../../lib/shared.js';

const PR = {};
const r5 = (x) => Math.max(5, Math.round(x / 5) * 5);
const cap1 = (s) => s[0].toUpperCase() + s.slice(1);

function drawOut() {
  const P = pricing({ ...PR, pmin: PR.lo, pmax: PR.hi }), { hourly, cost, cap, jobs, earn, flat, best, bv, load, over } = P;
  const u = LB.unit, cj = jobs(PR.p), nOk = Object.values(S.assume).filter(Boolean).length;
  const W = 560, H = 260, l = 52, r = 16, t = 22, b = 36, xmin = PR.lo, xmax = PR.hi, ymin = -2000, ymax = Math.max(12000, flat(xmax)), X = (v) => l + (v - xmin) / (xmax - xmin) * (W - l - r), Y = (v) => t + (1 - (v - ymin) / (ymax - ymin)) * (H - t - b);
  let pts = '', pf = ''; const stepP = Math.max(5, Math.round((xmax - xmin) / 40 / 5) * 5);
  for (let p = xmin; p <= xmax; p += stepP) { pts += (pts ? ' L' : 'M') + X(p).toFixed(1) + ' ' + Y(earn(p)).toFixed(1); pf += (pf ? ' L' : 'M') + X(p).toFixed(1) + ' ' + Y(flat(p)).toFixed(1); }
  const yt = [-2000]; const ystep = ymax > 30000 ? 10000 : 4000; for (let v = 0; v <= ymax; v += ystep) yt.push(v);
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly take-home at different prices, with and without ${LB.clients} leaving">`;
  yt.forEach((v) => (svg += `<line class="grid" x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${l - 8}" y="${Y(v) + 4}" text-anchor="end">${v < 0 ? '−' : ''}${Math.abs(v) / 1000}k</text>`));
  [0.2, 0.4, 0.6, 0.8].forEach((f) => { const p = r5(xmin + (xmax - xmin) * f); svg += `<text x="${X(p)}" y="${H - 12}" text-anchor="middle">R${p}</text>`; });
  svg += `<line class="axis" x1="${l}" x2="${W - r}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  svg += `<line x1="${l}" x2="${W - r}" y1="${Y(PR.t)}" y2="${Y(PR.t)}" stroke="var(--mint)" stroke-width="2" stroke-dasharray="6 5"/><text x="${W - r}" y="${Y(PR.t) - 6}" text-anchor="end" style="fill:var(--mint);font-weight:700">Your goal ${R(PR.t)}</text>`;
  svg += `<path d="${pf}" fill="none" stroke="var(--muted)" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round"/><path d="${pts}" fill="none" stroke="var(--jac)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  svg += `<circle cx="${X(best)}" cy="${Y(bv)}" r="6" fill="var(--card)" stroke="var(--jac)" stroke-width="3"/>`;
  svg += `<circle cx="${X(Math.min(xmax, Math.max(xmin, PR.p)))}" cy="${Y(earn(PR.p))}" r="9" fill="var(--protea)" stroke="var(--card)" stroke-width="3"/>`;
  const bx = X(Math.min(xmax, Math.max(xmin, cost))); svg += `<line x1="${bx}" x2="${bx}" y1="${t}" y2="${H - b}" stroke="var(--text)" stroke-width="1.5" stroke-dasharray="3 4"/><text x="${bx + 6}" y="${t + 10}" style="fill:var(--text);font-weight:700">Break-even ${R(cost)}</text></svg>`;
  const lost = PR.j - cj, quotes = [PR.ref, r5(PR.ref * 1.28), r5(PR.ref * 1.57)];
  const a = [['ext', `${LB.mat} price`, 'From my last receipt'], ['transport', `${LB.second} per ${u}`, 'AI estimate until you check it'], ['data', 'Data and booking costs', 'Phone bill and bundles'], ['hours', 'Billable hours', 'Count a typical month'], ['admin', 'Unpaid admin and messages', 'Not in your hours yet'], ['cancel', 'Cancellations and no-shows', 'Missing from the estimate']];
  $('#pout').innerHTML = `<section class="card"><div class="row-between"><h3>Your numbers</h3>${tagFor.calc}</div>
   <div class="kpis kpis3" style="margin-top:14px"><div class="kpi"><span>${T('breakeven')}</span><b>${R(cost)}</b></div><div class="kpi"><span>${cap1(LB.clients)} at ${R(PR.p)}</span><b>${cj} of ${P.base}</b></div><div class="kpi"><span>Take-home this month</span><b class="${earn(PR.p) < PR.t ? 'neg' : 'pos'}">${R(earn(PR.p))}</b></div></div>
   <p class="fine" style="margin-top:12px">Break-even = your hourly rate ${R(hourly)} × ${PR.hp} hrs + ${R(PR.d)} direct. Your quote is ${PR.p < cost ? R(cost - PR.p) + ' below it' : R(PR.p - cost) + ' above it'}. ${PR.p > PR.ref && lost > 0 ? `At this price about ${lost} ${lost === 1 ? LB.client : LB.clients} would leave, by your assumption.` : PR.p < PR.ref && cj > P.base ? 'A lower price may bring customers back, up to your capacity.' : PR.p < PR.ref ? 'A lower price may bring customers back, up to your capacity.' : "Your price matches today's price, so all customers stay."}</p>
   ${over ? `<div class="callout pink" style="margin-top:12px">${ic('warn')}<span><b>${T('capacity', 'Capacity')} warning.</b> ${PR.j} ${LB.clients} need ${load} hours, and you have ${PR.h} billable. That is ${load - PR.h} hours too many, so we count ${cap}.</span></div>` : `<div class="callout mint" style="margin-top:12px">${ic('check')}<span>${PR.j} ${LB.clients} need ${load} of your ${PR.h} billable hours.</span></div>`}</section>
  <section class="card"><div class="row-between"><h3>Monthly take-home by price</h3>${tagFor.proj}</div><p class="sub">Solid line: with ${LB.clients} leaving or arriving, by your assumption. Dotted: if nobody ever left. Pink dot: your quote.</p>${svg}
   <div class="callout" style="margin-top:12px">${ic('info')}<span>Under your assumption, take-home peaks near <b>${R(best)}</b> at ${R(bv)}. That is where this model peaks. It is not what you deserve or should charge, because real ${LB.clients} also weigh value, trust and competition.</span></div></section>
  <section class="card"><h3>Compare three quotes</h3><div class="tbl"><table class="cmp"><tr><th>Quote</th><th>${cap1(LB.clients)}</th><th>Per ${u}</th><th>Per month</th><th>Against goal</th></tr>${quotes.map((p) => { const e = earn(p), per = p - PR.d - hourly * PR.hp; return `<tr><td>${R(p)}</td><td>${jobs(p)}</td><td class="${per < 0 ? 'neg' : 'pos'}">${R(per)}</td><td>${R(e)}</td><td class="${e >= PR.t ? 'pos' : 'neg'}">${e >= PR.t ? 'Meets goal' : R(PR.t - e) + ' short'}</td></tr>`; }).join('')}</table></div>
   <div class="callout" style="margin-top:14px">${ic('info')}<span>A cost-based price is not automatically accepted by the market. Value, demand, competition and testing matter too.</span></div></section>
  <section class="card"><div class="row-between"><h3>${T('assumption', 'Assumption')} checklist</h3><span class="tag ${nOk >= 5 ? 'ver' : 'est'}" id="a-n">${nOk} of 6 checked</span></div><p class="sub">Tick the inputs you have confirmed with real receipts or records.</p>
   ${a.map(([k, l, h]) => `<label class="check"><input type="checkbox" data-a="${k}" ${S.assume[k] ? 'checked' : ''}><span class="box">${ic('check')}</span><span class="grow">${l}<small>${h}</small></span></label>`).join('')}</section>`;
  $$('[data-a]').forEach((c) => (c.onchange = () => { S.assume[c.dataset.a] = c.checked; save(); const n = Object.values(S.assume).filter(Boolean).length, tg = $('#a-n'); tg.textContent = n + ' of 6 checked'; tg.className = 'tag ' + (n >= 5 ? 'ver' : 'est'); }));
}

export default {
  render() { return `<h1 class="h-page">What does one ${LB.unit} really cost you?</h1><p class="p-page">Pre-filled from your Business Blueprint. It shows the cost of your assumptions and how ${LB.clients} may react. It does not tell you what you deserve to charge.</p>
 <div class="grid2 g-pr"><section class="card" id="pinputs"></section><div class="stack-y" id="pout"></div></div>`; },
  mount() {
    const c = C(); Object.assign(PR, { t: BP.target, f: BP.fixed, h: BP.hours, d: BP.ext + BP.transport, hp: BP.hoursPerJob, p: BP.price, ref: BP.price, j: c.cap || 1, s: S.sens, lo: r5(BP.price * 0.3), hi: r5(BP.price * 2.6) });
    const mx = (v, m) => Math.max(m, Math.round(v * 2 / 100) * 100);
    $('#pinputs').innerHTML = `<div class="row-between"><h3>Your inputs</h3><span class="tag self">From Blueprint</span></div>` +
      slider('p-t', 'Monthly income goal', 0, mx(PR.t, 15000), 100, PR.t, R) + slider('p-f', 'Fixed costs a month', 0, mx(PR.f, 1500), 10, PR.f, R, 'Data, software, equipment') + slider('p-h', 'Billable hours a month', 10, 200, 2, PR.h, (v) => v + ' hrs', 'Not every working hour can be sold') + slider('p-d', `Direct cost per ${LB.unit}`, 0, mx(PR.d, 500), 1, PR.d, R, `${LB.mat}, ${LB.second.toLowerCase()}, fees`) + slider('p-hp', `Hours per ${LB.unit}`, 0.25, 12, 0.25, PR.hp, (v) => v + ' hrs', 'Prep, messages, delivery, admin') + slider('p-j', `${cap1(LB.clients)} at today's price`, 1, Math.max(40, c.cap * 2), 1, PR.j, (v) => v + ' ' + LB.clients) + slider('p-p', 'Price you quote', PR.lo, PR.hi, 5, PR.p, R) +
      `<div class="ctl">${tagFor.asm}<div class="t" style="margin-top:6px"><label for="p-s">${cap1(LB.clients)} lost per R10 price rise</label><output id="p-s-o">${PR.s}%</output></div><input class="range" id="p-s" type="range" min="0" max="6" step="1" value="${PR.s}"><small>Your guess about ${T('demand', 'demand')}. Raise the price and this share leaves. Lower it and they may return.</small></div>`;
    [['p-t', 't', R], ['p-f', 'f', R], ['p-h', 'h', (v) => v + ' hrs'], ['p-d', 'd', R], ['p-hp', 'hp', (v) => v + ' hrs'], ['p-j', 'j', (v) => v + ' ' + LB.clients], ['p-p', 'p', R]].forEach(([id, k, f]) => ($('#' + id).oninput = (e) => { PR[k] = +e.target.value; $('#' + id + '-o').textContent = f(PR[k]); drawOut(); }));
    $('#p-s').oninput = (e) => { PR.s = +e.target.value; S.sens = PR.s; save(); $('#p-s-o').textContent = PR.s + '%'; drawOut(); };
    drawOut();
  }
};
