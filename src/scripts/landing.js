import { S, loadState, startDemo, resetFresh, save } from '../lib/state.js';
import { $, $$, ic, LOGO, R, bridgeSVG, wireGlobal, go, store } from '../lib/ui.js';
import { wireEntry } from './shell.js';

loadState(); wireEntry(); wireGlobal();
if (store.get('hb-lite') === '1') document.body.classList.add('lite');
$$('[data-i]').forEach((el) => (el.innerHTML = ic(el.dataset.i)));
$$('[data-logo]').forEach((el) => (el.innerHTML = LOGO));
$('.trust').innerHTML = ['Free to try', 'Works on any phone', 'No payment details', 'Light on data'].map((t) => `<span>${ic('check')}${t}</span>`).join('');
$('#land-bridge').innerHTML = bridgeSVG(['done', 'done', 'now', 'lock']);

/* the hero price test (illustrative: Nomsa's R475 style) */
const r = $('#pt-range');
function upd() { const p = +r.value, net = p - 475; $('#pt-price').textContent = R(p); $('#pt-big').textContent = (net < 0 ? '−' : '+') + 'R' + Math.abs(net); $('#pt-result').className = 'pt-result' + (net >= 0 ? ' gain' : ''); $('#pt-unit').textContent = net < 0 ? 'lost on every style, once her 4 hours count' : 'kept after hair, transport and a fair wage for 4 hours'; }
r.addEventListener('input', upd); upd();

/* "try it with your own numbers": nothing is saved until the person chooses to build a Blueprint */
const g = (id) => +$('#' + id).value || 0;
function own() {
  const price = g('o-price'), h = Math.max(0.5, g('o-hours')), mat = g('o-mat'), fixed = g('o-fixed'), goal = g('o-goal'), hours = 80, hourly = (goal + fixed) / hours, cost = hourly * h + mat, gap = price - cost, cap = Math.floor(hours / h), contrib = price - mat, need = contrib > 0 ? Math.ceil((goal + fixed) / contrib) : null;
  $('#o-cost').textContent = R(cost); $('#o-pr').textContent = R(price); $('#o-cap').textContent = cap + ' jobs'; $('#o-need').textContent = need === null ? 'Not possible' : need + ' jobs';
  let msg = gap < 0 ? `Short by ${R(-gap)} on every job once your own time counts.` : `Covers every cost and pays your time, with ${R(gap)} to spare.`;
  if (need === null) msg += ' Your price does not even cover materials.'; else if (need > cap) msg += ` You would need ${need} jobs but only have hours for ${cap}. Raise the price, cut the time or lower the goal.`; else msg += ' You have enough hours for this goal at this price.';
  const v = $('#o-verdict'); v.textContent = msg; v.className = 'o-verdict' + (gap >= 0 && need !== null && need <= cap ? ' ok' : '');
}
['o-price', 'o-hours', 'o-mat', 'o-fixed', 'o-goal'].forEach((id) => $('#' + id).addEventListener('input', own)); own();
$('#o-go').onclick = () => { if (S.demo || !S.confirmed) resetFresh(); S.pending = { price: g('o-price'), hoursPerJob: Math.max(0.5, g('o-hours')), ext: g('o-mat'), transport: 0, fixed: g('o-fixed'), target: g('o-goal') }; save(true); go('setup'); };

