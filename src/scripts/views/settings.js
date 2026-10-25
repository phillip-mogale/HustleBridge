import { S, BP, blueprintOut, save, resetFresh, startDemo } from '../../lib/state.js';
import { ic, $, $$, toast, store, setTheme, themeMode, go, flash, esc } from '../../lib/ui.js';
import { auth, wipe } from '../../lib/api.js';
import { guestSheet } from '../../lib/shared.js';
import { installApp } from './dashboard.js';

function exportData() {
  return { exportedAt: new Date().toISOString(), profile: { name: S.name, ...S.setup, ratingBefore: S.rating0, ratingNow: S.rating }, blueprint: blueprintOut(), progress: { spansBuilt: S.progress, evidence: S.evidence }, missions: S.mdata, decisions: (S.sim ? S.sim.hist : S.pastHist) || [], pitch: S.pitch };
}
export default {
  render() {
    const m = themeMode(), st = S.setup || {}, email = S.session ? S.session.email : '';
    return `<h1 class="h-page">Settings</h1><p class="p-page">Your account, how HustleBridge looks, and what happens to your data.</p>
 <div class="grid2" style="align-items:start"><div class="stack-y">
  <section class="card"><h3>Account</h3><div class="stack-y" style="margin-top:14px"><div class="field"><label for="st-name">First name</label><input class="input" id="st-name" value="${esc(S.name)}" maxlength="20"></div><div class="field"><label for="st-mail">Email</label><input class="input" id="st-mail" value="${esc(email)}" placeholder="${S.guest ? 'No account yet' : ''}" readonly aria-readonly="true"></div></div>${S.guest ? '<button class="btn sm pink" id="mkacc" style="margin-top:16px">Create a free account</button><p class="fine">Your work is only on this phone until you do.</p>' : '<button class="btn ghost sm" id="signout" style="margin-top:16px;color:var(--text)">Sign out</button>'}</section>
  <section class="card"><h3>Your Blueprint</h3><p class="sub">${esc(S.meta.name)}. ${esc(st.stage || 'Operating')}${st.province ? ', ' + esc(st.province) : ''}. Editing it updates every screen.</p><button class="btn sm" data-go="blueprint" style="margin-top:14px">Edit Blueprint</button></section>
  <section class="card"><h3>Appearance</h3><div class="seg" id="themeseg" style="margin-top:14px">${['light', 'dark', 'system'].map((t) => `<button data-t="${t}" aria-pressed="${m === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
   <div class="field" style="margin-top:16px"><label for="st-lang">Language</label><select class="input" id="st-lang"><option>English</option><option disabled>isiZulu (coming soon)</option><option disabled>Afrikaans (coming soon)</option><option disabled>Sesotho (coming soon)</option></select></div>
   <label class="swrow"><span><b>Data saver</b><small>Turns off animation and heavy visuals to use less data and battery.</small></span><span class="sw"><input type="checkbox" id="st-lite" ${document.body.classList.contains('lite') ? 'checked' : ''}><i></i></span></label></section></div>
 <div class="stack-y">
  <section class="card"><h3>Install on your phone</h3><p class="sub">Open HustleBridge like any app. The simulation, pricing tool and your saved work keep working offline.</p><div class="cta-row" style="margin-top:14px"><button class="btn sm" id="st-inst">Install app</button><button class="btn ghost sm" style="color:var(--text)" data-go="offline">Preview offline page</button></div></section>
  <section class="card"><h3>Your data</h3><p class="sub">Your data is yours. Export it or delete it at any time.</p>
   <div class="cta-row" style="margin-top:14px"><button class="btn sm" id="st-exp">${ic('download')}Export my data</button></div>
   <hr class="navhr" style="margin:20px 0"><h4 style="font-size:1.05rem">Delete my data</h4><p class="sub">This removes your Blueprint, progress and decisions from this device and from your account. It cannot be undone.</p>
   <div class="field" style="margin-top:12px"><label for="st-del">Type DELETE to confirm</label><input class="input" id="st-del" autocomplete="off"></div><button class="btn pink sm" id="st-delgo" style="margin-top:12px" disabled>${ic('lock')}Delete everything</button></section>
  <section class="card"><h3>About the AI</h3><p class="sub">The AI helps draft your Blueprint and explain results. It never does the arithmetic. Read more in the <button class="linkish" data-go="privacy">privacy notice</button>.</p></section></div></div>`;
  },
  mount() {
    $('#st-name').oninput = (e) => { S.name = e.target.value.trim().slice(0, 20); save(); const me = $('.top .me'); if (me) me.textContent = (S.name || 'Y')[0].toUpperCase(); };
    const lt = $('#st-lite'); lt.onchange = () => { document.body.classList.toggle('lite', lt.checked); store.set('hb-lite', lt.checked ? '1' : '0'); };
    const mk = $('#mkacc'); if (mk) mk.onclick = guestSheet;
    const so = $('#signout'); if (so) so.onclick = async () => { await auth.logout(); flash('Signed out. Your work is still on this device.', 'info'); go('landing'); };
    $$('[data-t]').forEach((b) => (b.onclick = () => { setTheme(b.dataset.t); $$('[data-t]').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    $('#st-inst').onclick = installApp;
    $('#st-exp').onclick = () => { const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hustlebridge-data.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Your data was downloaded.'); };
    $('#st-del').oninput = (e) => { $('#st-delgo').disabled = e.target.value.trim() !== 'DELETE'; };
    $('#st-delgo').onclick = async () => { $('#st-delgo').disabled = true; try { await wipe(); } catch { /* local data is still removed */ } try { await auth.logout(); } catch { /* ignore */ } store.del('hb-state-v2'); resetFresh(false); store.del('hb-state-v2'); flash('Your data has been deleted.', 'info'); go('landing'); };
  }
};
