import { S, BP, SRC, LB, save, track, logEvidence } from '../../lib/state.js';
import { ic, R, T, tagFor, $, $$, go, flash, esc } from '../../lib/ui.js';
import { calc } from '../../lib/engine.js';
import { C } from '../../lib/shared.js';
import { syncNow } from '../../lib/api.js';

const fields = () => { const u = LB.unit; return [['price', `Price per ${u}`, 'R', 'What you charge a customer today.'], ['hoursPerJob', `Hours per ${u}`, 'h', 'Including preparation, admin and finishing.'], ['target', 'Monthly income goal', 'R', 'What you would like to take home.'], ['ext', `${LB.mat} per ${u}`, 'R', 'Estimated from typical costs. Check your receipts.'], ['transport', `${LB.second} per ${u}`, 'R', 'Estimated for a typical order. Check your own costs.'], ['fixed', 'Data and fixed costs a month', 'R', 'Estimated for messages, tools and equipment.'], ['hours', 'Hours you can sell a month', 'h', 'Estimated from a part-time week.']]; };
const shapeName = { services: 'Time-based service with direct materials', goods: 'Make and sell goods', resale: 'Buy and resell' };

function engine() {
  const c = C(), gap = BP.price - c.cost, unchecked = Object.values(S.checked).filter((v) => !v).length, u = LB.unit;
  $('#engine').innerHTML = `<h3>What the calculator works out</h3><p class="fine" style="margin:0">${T('calculator', 'What is this?')}</p><p class="sub">Plain formulas, shown so you can check them by hand.</p>
  <div class="bprow"><span class="k">Hourly rate you need<br><small>(goal + fixed costs) ÷ hours</small></span><span class="v">${R(c.hourly)}</span></div>
  <div class="bprow"><span class="k">Your time per ${u}<br><small>${BP.hoursPerJob} hours × ${R(c.hourly)}</small></span><span class="v">${R(c.labour)}</span></div>
  <div class="bprow"><span class="k">${LB.mat} and ${LB.second.toLowerCase()}</span><span class="v">${R(c.direct)}</span></div>
  <div class="bprow"><span class="k"><b>Full cost per ${u}</b></span><span class="v">${R(c.cost)}</span></div>
  <div class="callout ${gap < 0 ? 'pink' : 'mint'}" style="margin-top:14px">${ic(gap < 0 ? 'warn' : 'check')}<span>${gap < 0 ? `You charge ${R(BP.price)}. Each ${u} costs you ${R(c.cost)} once your own time counts. That is ${R(-gap)} short.` : `Your price covers every cost and pays your time, with ${R(gap)} to spare.`}</span></div>
  <button class="btn pink" id="confirm" style="width:100%;margin-top:18px">${S.confirmed ? 'Save changes' : 'Confirm my Blueprint'}</button>
  <p class="fine" style="margin-top:12px">${unchecked ? `${unchecked} estimate${unchecked > 1 ? 's' : ''} still unchecked. You can confirm now and check them later.` : 'Every estimate has been checked.'}</p>`;
  $('#confirm').onclick = confirm;
}
function confirm() {
  const first = !S.confirmed, w = document.createElement('div'); w.className = 'stampwrap'; w.innerHTML = '<div class="bigstamp"><div><b>Blueprint<br>confirmed</b><span>Your first piece of evidence</span></div></div>'; document.body.appendChild(w);
  S.confirmed = true; S.demo = false; S.fresh = false;
  if (first) { logEvidence('Business Blueprint confirmed', 'self'); track('blueprint_confirmed', { secs: S.t0 ? Math.round((Date.now() - S.t0) / 1000) : null, estimatesChecked: Object.values(S.checked).filter(Boolean).length }); }
  else logEvidence('Business Blueprint updated', 'self');
  save(true); syncNow();
  setTimeout(() => { flash(first ? 'Blueprint confirmed. Your bridge has its first pier.' : 'Blueprint saved. Your other screens now use these numbers.'); go('dashboard'); }, 1500);
}
export default {
  render() {
    return `<div class="onb-steps"><span class="ok"><i>${ic('check')}</i>Setup</span><span class="ok"><i>${ic('check')}</i>Chat</span><span class="on"><i>3</i>Blueprint</span></div>
 <h1 class="h-page">Check your Business Blueprint.</h1>
 <p class="p-page">Your Blueprint is your business on one page. Edit anything that looks wrong. Numbers marked as estimates are the AI's best guess, so tap them once you have checked them.</p>
 <div class="bp-grid"><div class="card"><div class="row-between"><div><div class="field" style="min-width:min(100%,360px)"><label class="sr" for="bp-name">Business name</label><input class="input" id="bp-name" maxlength="60" value="${esc(S.meta.name)}" style="font-weight:700;font-size:1.1rem"></div><p class="sub" style="margin-top:8px">${shapeName[S.meta.shape] || ''}</p></div><span class="tag self">${S.confirmed ? 'Confirmed' : 'Draft'}</span></div><div id="fields"></div></div>
 <aside class="card sticky" id="engine"></aside></div>`;
  },
  mount() {
    $('#bp-name').oninput = (e) => { S.meta.name = e.target.value.slice(0, 60) || 'My business'; save(); };
    $('#fields').innerHTML = fields().map(([k, l, u, h]) => `<div class="fld"><label for="f-${k}">${l}</label><small>${h}</small><div class="ctrl"><div class="numin">${u === 'R' ? '<span>R</span>' : ''}<input id="f-${k}" data-k="${k}" type="number" inputmode="decimal" min="0" step="${k === 'hoursPerJob' ? 0.25 : 1}" value="${BP[k]}">${u === 'h' ? '<span style="padding:0 12px 0 0">hrs</span>' : ''}</div>${SRC[k] === 'you' ? tagFor.self : `<button class="tag ${S.checked[k] ? 'ver' : 'est'} tagbtn" data-chk="${k}" aria-pressed="${!!S.checked[k]}">${S.checked[k] ? ic('check') + 'Checked by you' : 'AI estimate, check it'}</button>`}</div></div>`).join('');
    $$('#fields input').forEach((i) => i.addEventListener('input', () => { const k = i.dataset.k; BP[k] = Math.max(k === 'hours' || k === 'hoursPerJob' ? (k === 'hours' ? 1 : 0.25) : 0, +i.value || 0); save(); engine(); }));
    $$('[data-chk]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.chk; S.checked[k] = !S.checked[k]; b.className = 'tag tagbtn ' + (S.checked[k] ? 'ver' : 'est'); b.setAttribute('aria-pressed', S.checked[k]); b.innerHTML = S.checked[k] ? ic('check') + 'Checked by you' : 'AI estimate, check it'; save(); engine(); }));
    engine();
  }
};
