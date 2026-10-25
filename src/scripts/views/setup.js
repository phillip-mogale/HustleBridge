import { S, save, resetFresh, track } from '../../lib/state.js';
import { ic, $, $$, go, esc } from '../../lib/ui.js';

const PROV = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];
const cchips = (name, opts, sel, multi) => `<div class="chipset" role="${multi ? 'group' : 'radiogroup'}">${opts.map((o) => `<label class="cchip"><input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${o}" ${(multi ? (sel || []).includes(o) : sel === o) ? 'checked' : ''}><span>${o}</span></label>`).join('')}</div>`;
export default {
  render() {
    const st = S.setup || {};
    return `<div class="onb-steps"><span class="on"><i>1</i>Setup</span><span><i>2</i>Chat</span><span><i>3</i>Blueprint</span></div>
 <h1 class="h-page">Let's start with you.</h1><p class="p-page">Takes about a minute. No account needed yet. We never ask for a street address.</p>
 <form id="sf" class="stack-y" style="margin-top:24px" novalidate>
  <fieldset class="card"><legend>What should we call you?</legend><div class="field" style="max-width:420px"><label class="sr" for="sf-name">First name</label><input class="input" id="sf-name" autocomplete="given-name" maxlength="20" placeholder="First name" value="${esc(S.name && S.name !== 'Friend' ? S.name : '')}"></div></fieldset>
  <fieldset class="card"><legend>Where are you with your business?</legend><div class="stages">${[['Exploring an idea', 'Nothing sold yet. I want to test it first.'], ['Just started', 'A few sales, still working it out.'], ['Already operating', 'Regular customers and real costs.']].map(([t, d]) => `<label class="scard"><input type="radio" name="stage" value="${t}" ${st.stage === t ? 'checked' : ''}><span><b>${t}</b><small>${d}</small></span></label>`).join('')}</div></fieldset>
  <fieldset class="card"><legend>Where are you based?</legend><div class="grid2" style="margin-top:12px"><div class="field"><label for="sf-prov">Province</label><select class="input" id="sf-prov">${PROV.map((p) => `<option ${p === st.province ? 'selected' : ''}>${p}</option>`).join('')}</select></div><div class="field"><label for="sf-town">Town or suburb (optional)</label><input class="input" id="sf-town" maxlength="40" value="${esc(st.town || '')}" placeholder="For example: Soweto"></div></div></fieldset>
  <fieldset class="card"><legend>How sure am I about my numbers today?</legend><p class="sub">1 is guessing. 5 is checked against receipts and records. There is no right answer. You will rate again later.</p><div class="rating" id="sr">${[1, 2, 3, 4, 5].map((n) => `<button type="button" aria-pressed="${S.rating0 === n}" data-r="${n}">${n}</button>`).join('')}</div><div class="scale"><span>Guessing</span><span>Checked with records</span></div></fieldset>
  <details class="card more"><summary>Add more detail <span>(optional, helps tailor your missions)</span></summary>
   <p class="sub" style="margin-top:14px">Money you could spend on testing</p>${cchips('money', ['Under R500', 'R500 to R2 000', 'Over R2 000'], st.money, false)}<p class="sub" style="margin-top:16px">Anything else you have</p>${cchips('have', ['Tools or equipment', 'A smartphone with data', 'Part-time hours', 'Full-time hours'], st.have, true)}<p class="sub" style="margin-top:16px">Your biggest challenge right now</p>${cchips('challenge', ['Pricing', 'Costs', 'Finding customers', 'Cash flow', 'Finding support'], st.challenge, false)}</details>
  <div class="row-between"><button type="button" class="back" data-go="landing">${ic('arrow')}Back</button><button class="btn pink" id="sgo">Continue to the chat${ic('arrow')}</button></div></form>`;
  },
  mount() {
    if (S.demo || (S.confirmed && !S.fresh)) { /* returning from the demo or an existing account: start a clean setup but keep sign-in */ if (S.demo) { const pend = S.pending; resetFresh(); S.pending = pend; } }
    $$('#sr button').forEach((b) => (b.onclick = () => { S.rating0 = +b.dataset.r; S.rating = S.rating0; save(); $$('#sr button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    $('#sf').addEventListener('submit', (e) => {
      e.preventDefault(); const v = (n) => ($(`input[name=${n}]:checked`) || {}).value;
      S.name = ($('#sf-name').value.trim() || 'Friend').slice(0, 20); S.t0 = Date.now(); S.fresh = true;
      S.setup = { stage: v('stage') || 'Already operating', province: $('#sf-prov').value, town: $('#sf-town').value.trim(), money: v('money') || 'Under R500', have: $$('input[name=have]:checked').map((x) => x.value), challenge: v('challenge') || 'Pricing' };
      track('setup_done', { stage: S.setup.stage }); save(true); go('start');
    });
  }
};
