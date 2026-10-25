import { calc, jobsAt, planState, profitOf, cashSeries, runway } from './engine.js';
import { S, BP, LB, D, save } from './state.js';
import { $, openSheet, toast, flash, go } from './ui.js';
import { eventsFor } from './copy.js';
import { auth, pull, syncNow } from './api.js';

export const C = () => calc(BP);
export const events = () => eventsFor(BP, LB, S.meta.shape);
export const M2miss = () => { const d = D(2); return (d.tools || 0) + (d.admin || 0) * C().hourly + (d.cancel || 0); };
export const M3cost = () => C().labour + BP.ext * 1.2 + BP.transport;
export function M3m(p) { const c = C(), cap = c.cap, jobs = jobsAt(p, cap, cap, S.sens, BP.price), ext = BP.ext * 1.2, keep = p - (c.labour + ext + BP.transport), month = jobs * (p - ext - BP.transport) - BP.fixed; return { jobs, cap, keep, month }; }
export const mstat = () => [0, 1, 2, 3].map((i) => (i < S.progress ? 'done' : i === S.progress ? 'now' : 'lock'));
export const plan = (o) => planState(BP, S.sens, o);
export const cash = (scn, draw, n) => cashSeries(BP, S.sens, S.cash0, scn, draw, n);
export const run = (scn, draw) => runway(BP, S.sens, S.cash0, scn, draw);
export const profit = profitOf;

/* ---------- decision patterns ---------- */
export function styleOf(c) { if (/^(Absorb|Use the week|Hold on)/.test(c)) return 'wait'; if (/(Raise|surcharge|fee|deposit|discount)/i.test(c) && !/Offer .* off/i.test(c)) return 'price'; return 'act'; }
export function patternInfo() {
  const h = (S.sim ? S.sim.hist : S.pastHist) || [], n = h.length; if (n < 2) return { n, msg: null };
  const cnt = { wait: 0, price: 0, act: 0 }; h.forEach((x) => cnt[styleOf(x.c)]++);
  let msg, tip;
  if (cnt.wait / n >= 0.6) { msg = `You chose to wait or absorb the cost in ${cnt.wait} of ${n} decisions.`; tip = 'That keeps customers happy, but your margin carries every shock. Next time, try a response that changes a price or a cost.'; }
  else if (cnt.price / n >= 0.6) { msg = `You reached for a price change first in ${cnt.price} of ${n} decisions.`; tip = 'Prices are quick to change, but customers may leave. Test your price rise on a few customers before relying on it.'; }
  else if (cnt.act / n >= 0.6) { msg = `You took active steps, like new suppliers or outreach, in ${cnt.act} of ${n} decisions.`; tip = 'Active steps often cost time. Check that your hours still cover your goal.'; }
  else { msg = 'You mix price, cost and outreach responses.'; tip = 'A good spread. Keep checking which response protects your cash best.'; }
  return { n, cnt, msg, tip };
}

/* ---------- save progress with an account ---------- */
export function guestSheet() {
  const sh = openSheet('Keep your progress', `<p class="sub" style="margin-top:6px">Right now your work is saved on this phone only. A free account keeps it safe and lets you open it on any device.</p>
  <form id="gf" novalidate><div class="stack-y" style="gap:14px;margin-top:16px"><div class="field"><label for="g-mail">Email</label><input class="input" id="g-mail" type="email" autocomplete="email" placeholder="you@example.com"><small class="err" id="g-mail-e" role="alert" hidden>Enter an email like name@example.com.</small></div><div class="field"><label for="g-pw">Password</label><input class="input" id="g-pw" type="password" autocomplete="new-password" placeholder="Use at least 8 characters."><small class="err" id="g-pw-e" role="alert" hidden>Use at least 8 characters.</small></div><p class="fine err" id="g-err" role="alert" hidden style="margin:0"></p><button class="btn pink" id="g-go" style="width:100%">Save my progress</button></div></form><p style="text-align:center;margin-top:14px"><button class="linkish" id="g-later">Maybe later</button></p>`);
  $('#g-later', sh.w).onclick = sh.close;
  $('#gf', sh.w).addEventListener('submit', async (e) => {
    e.preventDefault(); const m = $('#g-mail', sh.w).value.trim(), pw = $('#g-pw', sh.w).value, okm = /^\S+@\S+\.\S+$/.test(m), okp = pw.length >= 8;
    $('#g-mail-e', sh.w).hidden = okm; $('#g-pw-e', sh.w).hidden = okp; if (!okm || !okp) return;
    const b = $('#g-go', sh.w); b.disabled = true; b.textContent = 'Saving…'; const er = $('#g-err', sh.w); er.hidden = true;
    try { await auth.signup(m, pw, S.name); S.demo = false; save(true); syncNow(); sh.close(); flash('Progress saved to your free account.'); location.reload(); }
    catch (x) { er.hidden = false; er.textContent = x.confirm ? x.message : (x.status === 0 || x.name === 'TypeError' || x.name === 'AbortError' ? 'Could not reach the server. Check your connection and try again.' : x.message); b.disabled = false; b.textContent = 'Save my progress'; }
  });
}
export { pull, toast, go };
