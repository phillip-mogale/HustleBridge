import { S, BP, LB, save, track } from '../../lib/state.js';
import { ic, R, tagFor, $, $$, esc } from '../../lib/ui.js';
import { OPPS, OPP_TYPES, OPP_LOCS } from '../../lib/opportunities.js';
import { C } from '../../lib/shared.js';

const stageOf = () => (S.setup.stage === 'Exploring an idea' ? 'Idea' : 'Operating');
function draw() {
  const f = S.filters;
  const list = OPPS.filter((o) => (f.type === 'All' || o.type === f.type) && (f.stage === 'Any' || o.stage === 'Any' || o.stage === f.stage) && (f.loc === 'Any' || o.loc === f.loc || o.loc === 'National'));
  $('#opps').innerHTML = list.length ? list.map((o) => `<article class="card opp"><div class="meta"><span class="tag sim">${o.type}</span><span class="tag self">${o.stage === 'Any' ? 'Any stage' : o.stage + ' stage'}</span><span class="tag self">${o.loc}</span>${o.repay ? '<span class="tag warn">Must be repaid</span>' : ''}</div><h3>${o.n}</h3><p style="color:var(--muted)">${o.what}</p><dl><div><dt>Who can apply: </dt><dd>${o.elig}</dd></div>${o.dl ? `<div><dt>Deadline: </dt><dd>${o.dl} <span class="tag ver" style="height:22px">Verified</span></dd></div>` : ''}${o.note ? `<div><dt>Good to know: </dt><dd>${o.note}</dd></div>` : ''}</dl>
   <div class="foot"><span>Last checked ${o.chk}</span><span style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn ghost sm" href="${o.url}" target="_blank" rel="noopener noreferrer" style="color:var(--text)" data-opp="${o.id}">${o.src}${ic('ext')}</a><button class="btn sm" data-prep="${o.id}">Prepare to apply</button></span></div></article>`).join('') : `<div class="card" style="grid-column:1/-1;text-align:center;padding:40px"><h3>Nothing matches yet</h3><p class="sub">Try a different type or location. We list a few verified options rather than a long, stale catalogue.</p></div>`;
  $$('[data-prep]').forEach((b) => (b.onclick = () => prep(OPPS.find((o) => o.id === b.dataset.prep))));
  $$('[data-opp]').forEach((a) => (a.onclick = () => track('opportunity_opened', { id: a.dataset.opp })));
}
function prep(o) {
  const w = document.createElement('div'); w.className = 'sheet-bg';
  const c = C(), items = [['Pitch outline from your profile', S.progress >= 1], ['Use-of-funds summary', !!(S.pitch && S.pitch.funds && S.pitch.funds.length)], [`Cost per ${LB.unit} and break-even evidence`, S.confirmed || S.demo], ['Your last three months of income', false], ['Questions to ask the programme', false]];
  w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Prepare to apply"><div class="row-between"><h3>Prepare for ${esc(o.n)}</h3><button class="icon-btn" id="x" aria-label="Close">×</button></div><p class="sub" style="margin-top:6px">Built from your profile. You apply on the official source yourself.</p>${items.map(([t, ok]) => `<label class="check"><input type="checkbox" ${ok ? 'checked' : ''}><span class="box">${ic('check')}</span><span class="grow">${t}<small>${ok ? 'Ready from your profile' : 'Still to do'}</small></span></label>`).join('')}${o.repay ? `<div class="callout pink" style="margin-top:14px">${ic('warn')}<span><b>This is a loan.</b> Before you apply, work out the monthly repayment against your take-home of ${R(Math.max(0, C().cap * (BP.price - c.direct) - BP.fixed))} before paying yourself.</span></div>` : ''}<div class="callout" style="margin-top:14px">${ic('info')}<span>Be careful of anyone who asks you to pay to unlock funding. The official source never does.</span></div><div class="cta-row"><a class="btn" href="${o.url}" target="_blank" rel="noopener noreferrer" id="official">Open official source${ic('ext')}</a></div></div>`;
  document.body.appendChild(w); const close = () => w.remove(); $('#x', w).onclick = close; w.addEventListener('click', (e) => { if (e.target === w) close(); }); $('#x', w).focus();
}
export default {
  render() {
    return `<h1 class="h-page">Support that fits your stage.</h1><p class="p-page">HustleBridge lists real options and sends you to the official source. You decide whether to apply, and you apply yourself.</p>
 <div class="callout" style="margin-top:16px">${ic('info')}<span>Every listing has a source link and a last-checked date. A deadline appears only once it has been verified. We start with a short list on purpose, because a stale catalogue does more harm than a small one.</span></div>
 <div class="filters" id="filters">${OPP_TYPES.map((t) => `<button class="fchip" data-ft="${t}" aria-pressed="${S.filters.type === t}">${t}</button>`).join('')}
  <label class="sr" for="f-stage">Stage</label><select class="input" id="f-stage" style="width:auto"><option>Any</option><option>Idea</option><option>Operating</option></select>
  <label class="sr" for="f-loc">Location</label><select class="input" id="f-loc" style="width:auto">${OPP_LOCS.map((l) => `<option>${l}</option>`).join('')}</select></div>
 <div class="opps" id="opps"></div>`;
  },
  mount() {
    if (S.filters.stage === 'Any' && !S.filtersTouched) S.filters.stage = 'Any';
    $('#f-stage').value = S.filters.stage; $('#f-loc').value = S.filters.loc;
    $$('[data-ft]').forEach((b) => (b.onclick = () => { S.filters.type = b.dataset.ft; save(); $$('[data-ft]').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); }));
    $('#f-stage').onchange = (e) => { S.filters.stage = e.target.value; S.filtersTouched = true; save(); draw(); };
    $('#f-loc').onchange = (e) => { S.filters.loc = e.target.value; save(); draw(); };
    $('#opps').innerHTML = [1, 2, 3].map(() => '<div class="card"><div class="skel" style="height:22px;width:40%"></div><div class="skel" style="height:24px;width:70%;margin-top:14px"></div><div class="skel" style="height:14px;margin-top:12px"></div><div class="skel" style="height:14px;width:80%;margin-top:8px"></div></div>').join('');
    setTimeout(draw, 250);
  }
};
