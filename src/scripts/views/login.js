import { S, startDemo, resetFresh, save } from '../../lib/state.js';
import { ic, LOGO, bridgeSVG, $, $$, go } from '../../lib/ui.js';
import { auth, pull, syncNow } from '../../lib/api.js';

const hint = 'Use at least 8 characters.';
export default {
  render() {
    const up = new URLSearchParams(location.search).get('mode') !== 'in';
    return `<div class="loginwrap"><div class="lpanel"><div class="logo" style="font-size:1.4rem"><span>${LOGO}</span>HustleBridge</div>
   <h1>Practise the business. Build the evidence. Find your next step.</h1>
   <p>Free to try. Your numbers stay yours, and nothing is sent to a funder or a lender.</p>
   <div class="bscroll lbridge">${bridgeSVG(['done', 'done', 'now', 'lock'])}</div></div>
  <div class="lform"><div class="seg" role="tablist" aria-label="Account"><button role="tab" aria-selected="${up}" data-mode="up">Create account</button><button role="tab" aria-selected="${!up}" data-mode="in">Sign in</button></div>
   <form id="lf" novalidate><div class="stack-y" style="gap:16px;margin-top:24px">
    <div class="field" id="fn-wrap" ${up ? '' : 'hidden'}><label for="lf-name">First name</label><input class="input" id="lf-name" autocomplete="given-name" maxlength="20" placeholder="Nomsa"></div>
    <div class="field"><label for="lf-mail">Email</label><input class="input" id="lf-mail" type="email" autocomplete="email" placeholder="you@example.com"><small class="err" id="lf-mail-e" role="alert" hidden>Enter an email like name@example.com.</small></div>
    <div class="field"><label for="lf-pw">Password</label><input class="input" id="lf-pw" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${hint}"><small class="err" id="lf-pw-e" role="alert" hidden>${hint}</small></div>
    <p class="fine err" id="lf-err" role="alert" hidden style="margin:0"></p>
    <button class="btn pink" id="lf-go" style="width:100%">${up ? 'Create my account' : 'Sign in'}</button></div></form>
   <div class="or"><span>or</span></div>
   <button class="btn ghost" data-go="demo" style="width:100%;color:var(--text)">Use the demo account</button>
   <p class="fine" style="margin-top:12px">The demo account opens a sample braiding business. No email needed.</p>
   <p class="fine">By continuing you agree to the <button class="linkish" data-go="privacy">short privacy notice</button>.</p></div></div>`;
  },
  mount() {
    const up = new URLSearchParams(location.search).get('mode') !== 'in';
    $$('[data-mode]').forEach((b) => (b.onclick = () => (location.search = '?mode=' + b.dataset.mode)));
    $('#lf').addEventListener('submit', async (e) => {
      e.preventDefault(); const m = $('#lf-mail').value.trim(), pw = $('#lf-pw').value, okm = /^\S+@\S+\.\S+$/.test(m), okp = pw.length >= 8;
      $('#lf-mail-e').hidden = okm; $('#lf-pw-e').hidden = okp; $('#lf-mail').setAttribute('aria-invalid', !okm); $('#lf-pw').setAttribute('aria-invalid', !okp);
      if (!okm || !okp) return; const btn = $('#lf-go'), er = $('#lf-err'); er.hidden = true; btn.disabled = true; const label = btn.textContent; btn.textContent = 'One moment…';
      try {
        if (up) { const name = ($('#lf-name').value.trim() || 'Friend').slice(0, 20); if (!S.confirmed) resetFresh(); S.name = name; save(true); await auth.signup(m, pw, name); S.demo = false; save(true); syncNow(); go(S.confirmed ? 'dashboard' : 'setup'); }
        else { await auth.login(m, pw); S.demo = false; const adopted = await pull(); save(true); go(S.confirmed || adopted ? 'dashboard' : 'setup'); }
      } catch (x) {
        er.hidden = false; btn.disabled = false; btn.textContent = label;
        er.textContent = x.confirm ? x.message : (x.name === 'TypeError' || x.name === 'AbortError' || x.status === 0 ? 'Could not reach the server. Check your connection, or carry on as a guest from the start page.' : x.status === 503 ? 'Accounts are not switched on yet. You can still use the demo account or start as a guest.' : /invalid login/i.test(x.message) ? 'That email and password do not match. Try again.' : x.message);
      }
    });
  }
};
