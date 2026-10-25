import { S, BP, LB, D, save, track } from '../../lib/state.js';
import { ic, R, tagFor, $, $$, copyText, go, esc } from '../../lib/ui.js';
import { C, M2miss } from '../../lib/shared.js';

const PSEC = [['problem', 'The problem', 'self'], ['customer', 'Your customer', 'self'], ['offer', 'Your offer', 'self'], ['numbers', 'Your numbers', 'sim'], ['next', 'Your next step', 'self'], ['risks', 'Risks you have practised', 'sim']];
const PCHK = ['Business Blueprint confirmed', `Cost and break-even known`, 'One shock practised in the simulation', 'Low-cost test planned', 'Use of funds listed', 'Pitch outline reviewed', 'ID and bank details ready', 'Official eligibility rules read'];
const auto = () => [S.confirmed || S.demo, S.progress >= 2, S.progress >= 3, S.progress >= 4];

function init() {
  if (S.pitch) return; const c = C(), u = LB.unit, r100 = (x) => Math.max(0, Math.round(x / 100) * 100);
  S.pitch = {
    path: 'C', sec: {
      problem: D(1).p || 'Describe the problem your customers have and what it costs them.', customer: D(1).c || 'Describe one specific customer you serve.', offer: D(1).o || 'Describe what you offer and how people order or book it.',
      numbers: `Each ${u} costs about ${R(c.cost + M2miss())} once my own hours count, and I charge ${R(BP.price)}. I can make or do ${c.cap} ${LB.units} a month.`,
      next: D(4).test ? `I will run a test: ${D(4).test}, spending no more than ${R(D(4).budget)}. Success is ${D(4).target} sales.` : 'Describe the next low-cost test you will run.',
      risks: 'A supplier price rise or a quiet week. I have practised both in HustleBridge and know my margin and cash in each case.'
    },
    funds: [[`Starting ${LB.mat.toLowerCase()}`, r100(BP.ext * c.cap / 2)], ['Equipment or tools', 0], ['Flyers and photos', 400], ['Data buffer', r100(BP.fixed * 2)]], checks: {}
  };
  save();
}

function right() {
  const P = S.pitch, h = P.checks, total = () => P.funds.reduce((a, f) => a + (+f[1] || 0), 0), a = auto();
  const notes = {
    A: `${ic('check')}<span><b>Start small.</b> You may not need funding yet. ${D(4).test ? `Your Mission 4 test, ${esc(D(4).test)}, costs up to ${R(D(4).budget)}.` : 'Plan a low-cost test in Mission 4 first.'} Run it, then update your numbers.</span>`,
    B: `${ic('check')}<span><b>Shared resources.</b> A hub, a workspace or a mentor can be worth as much as cash. <button class="linkish" id="toinkind">See in-kind support</button></span>`,
    C: `${ic('check')}<span><b>Prepare for funding.</b> Funders expect you to show what you need and why. Your use of funds and checklist are below. Nobody can promise you a result.</span>`
  };
  $('#pathnote').innerHTML = `<div class="callout mint">${notes[P.path]}</div>`; const lk = $('#toinkind'); if (lk) lk.onclick = () => { S.filters.type = 'In-kind'; save(true); go('opportunities'); };
  $('#pright').innerHTML = `${P.path === 'A' ? '' : `<section class="card"><div class="row-between"><h3>Use of funds</h3>${tagFor.asm}</div><p class="sub">What you would spend and why. Your plan, not a promise of funding. Starting amounts are only suggestions, so change them.</p><div id="funds">${P.funds.map((f, i) => `<div class="frow"><label class="sr" for="fl${i}">Item</label><input class="input" id="fl${i}" data-fl="${i}" maxlength="60" value="${esc(f[0])}"><div class="numin"><span>R</span><input type="number" inputmode="numeric" min="0" aria-label="Amount" data-fa="${i}" value="${f[1]}"></div><button class="icon-btn" data-fx="${i}" aria-label="Remove item">×</button></div>`).join('')}</div><button class="btn ghost sm" id="fadd" style="margin-top:12px;color:var(--text)">Add an item</button><div class="bprow" style="margin-top:12px"><span class="k"><b>Total you would ask for</b></span><span class="v" id="ftotal">${R(total())}</span></div><p class="fine">Your simulated month shows about ${R(C().cap * (BP.price - C().direct) - BP.fixed)} before paying yourself. Compare that with what you ask for.</p></section>`}
  <section class="card"><div class="row-between"><h3>Application checklist</h3><span class="tag sim" id="cn"></span></div><div class="meter" style="margin-bottom:8px"><i id="cbar"></i></div>${PCHK.map((t, i) => { const au = a[i]; const on = au || h[i]; return `<label class="check"><input type="checkbox" data-c="${i}" ${on ? 'checked' : ''} ${au ? 'disabled' : ''}><span class="box">${ic('check')}</span><span class="grow">${t}${au ? '<small>Done from your profile</small>' : ''}</span></label>`; }).join('')}</section>`;
  const prog = () => { const n = PCHK.filter((_, i) => a[i] || h[i]).length; $('#cn').textContent = n + ' of ' + PCHK.length; $('#cbar').style.width = (n / PCHK.length * 100) + '%'; }; prog();
  $$('[data-c]').forEach((c) => (c.onchange = () => { h[c.dataset.c] = c.checked; save(); prog(); }));
  if (P.path !== 'A') {
    $$('[data-fl]').forEach((i) => (i.oninput = () => { P.funds[i.dataset.fl][0] = i.value; save(); }));
    $$('[data-fa]').forEach((i) => (i.oninput = () => { P.funds[i.dataset.fa][1] = Math.max(0, +i.value || 0); $('#ftotal').textContent = R(total()); save(); }));
    $$('[data-fx]').forEach((b) => (b.onclick = () => { P.funds.splice(+b.dataset.fx, 1); save(); right(); }));
    $('#fadd').onclick = () => { P.funds.push(['New item', 0]); save(); right(); const l = $$('[data-fl]'); l[l.length - 1].select(); };
  }
}

export default {
  render() {
    init(); const P = S.pitch;
    return `<h1 class="h-page">Prepare your pitch.</h1><p class="p-page">Built from your profile. Edit anything. Nothing is sent anywhere, and you apply on the official source yourself.</p>
 <div class="paths" id="paths">${[['A', 'Start small', 'Test a reduced version first.'], ['B', 'Use shared resources', 'Equipment, space or mentoring instead of cash.'], ['C', 'Prepare for funding', 'Quantify what you need and build the application.']].map(([k, t, d]) => `<label class="scard"><input type="radio" name="path" value="${k}" ${P.path === k ? 'checked' : ''}><span><b>${k}. ${t}</b><small>${d}</small></span></label>`).join('')}</div>
 <div id="pathnote" style="margin-top:16px"></div>
 <div class="grid2 g-pitch"><section class="card"><div class="row-between"><h3>Pitch outline</h3><button class="btn sm" id="pcopy">${ic('copy')}Copy outline</button></div><div class="stack-y" style="margin-top:16px">${PSEC.map(([k, l, t]) => `<div class="field"><label for="p-${k}" class="row-between" style="justify-content:flex-start;gap:10px">${l}${tagFor[t]}</label><textarea class="input" id="p-${k}" rows="3">${esc(P.sec[k])}</textarea></div>`).join('')}</div></section>
 <div class="stack-y" id="pright"></div></div>`;
  },
  mount() {
    const P = S.pitch;
    $$('[name=path]').forEach((r) => (r.onchange = () => { P.path = r.value; save(); right(); }));
    PSEC.forEach(([k]) => ($('#p-' + k).oninput = (e) => { P.sec[k] = e.target.value; save(); }));
    $('#pcopy').onclick = () => { track('pitch_copied'); copyText(PSEC.map(([k, l]) => `${l}\n${P.sec[k]}`).join('\n\n') + (P.path === 'C' ? `\n\nUse of funds\n${P.funds.map((f) => `${f[0]}: ${R(f[1])}`).join('\n')}\nTotal: ${R(P.funds.reduce((a, f) => a + f[1], 0))}` : ''), 'Outline copied. Paste it into an email or form.'); };
    right();
  }
};
