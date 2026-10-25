import { loadState, S, startDemo, resetFresh } from '../lib/state.js';
import { $, $$, ic, LOGO, wireGlobal, showFlash, store, go, toast } from '../lib/ui.js';
import { syncNow } from '../lib/api.js';
import { route } from '../lib/icons.js';

const GUARDED = ['dashboard', 'missions', 'mission', 'simulation', 'pricing', 'insights', 'profile', 'opportunities', 'pitch', 'preferences'];
const NEEDS_SETUP = ['start', 'blueprint'];

const TOUR = [
  { v: 'dashboard', t: 'Your bridge', d: 'Each mission lays a span. Progress is proof you can show, not points.' },
  { v: 'blueprint', t: 'Your business, on one page', d: 'Chat once, then check every number. Anything the AI estimated is marked so you can verify it.' },
  { v: 'simulation', t: 'Practise a bad week', d: 'A supplier raises prices. Choose a response and see what it does to margin, customers and cash.' },
  { v: 'pricing', t: 'See what a job really costs', d: 'Drag the price and watch customers and monthly take-home change together.' },
  { v: 'insights', t: 'Look ahead', d: 'Forecasts, your decision patterns and what moves your month most, all from your own numbers.' },
  { v: 'profile', t: 'Proof you can show', d: 'What you understand, what you have only guessed, and what to do next. Labelled self-reported, simulated or verified.' },
  { v: 'opportunities', t: 'Find your next step', d: 'Real support, filtered to your stage, with a source link and a last-checked date.' }
];
export function startTour() { startDemo(); try { sessionStorage.setItem('hb-tour', '0'); } catch { /* ignore */ } go('dashboard'); }
function tour(name) {
  let i; try { i = sessionStorage.getItem('hb-tour'); } catch { return; } if (i === null) return; i = +i; const s = TOUR[i]; if (!s) return;
  const el = document.createElement('div'); el.id = 'tour'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Guided tour'); document.body.appendChild(el);
  const end = () => { try { sessionStorage.removeItem('hb-tour'); } catch { /* ignore */ } el.remove(); };
  const to = (n) => { try { sessionStorage.setItem('hb-tour', String(n)); } catch { /* ignore */ } go(TOUR[n].v); };
  if (s.v !== name) { to(i); return; }
  el.innerHTML = `<div class="tmeta"><span class="tag sim">Tour ${i + 1} of ${TOUR.length}</span><button class="icon-btn" id="t-x" aria-label="End tour">×</button></div><b>${s.t}</b><p>${s.d}</p><div class="tnav"><button class="btn ghost sm" id="t-b" style="color:var(--text)" ${i === 0 ? 'disabled' : ''}>Back</button><button class="btn sm" id="t-n">${i === TOUR.length - 1 ? 'Finish' : 'Next'}</button></div>`;
  $('#t-x').onclick = end; $('#t-b').onclick = () => to(i - 1); $('#t-n').onclick = () => (i === TOUR.length - 1 ? end() : to(i + 1));
}

/** Entry points that work from any page: the demo account, a fresh start and the guided tour. Register before wireGlobal(). */
export function wireEntry() {
  document.addEventListener('click', (e) => {
    const d = e.target.closest('[data-go="demo"]');
    if (d) { e.preventDefault(); e.stopImmediatePropagation(); startDemo(); try { sessionStorage.setItem('hb-flash', JSON.stringify(['Demo mode: two missions are already done so you can look around.', 'info'])); } catch { /* ignore */ } go('dashboard'); return; }
    const s = e.target.closest('[data-go="setup"]'); if (s && (!S.confirmed || S.demo)) resetFresh();
    if (e.target.closest('[data-tour]')) { e.preventDefault(); e.stopImmediatePropagation(); startTour(); }
  }, true);
}

/** Start a page: load saved work, guard the route, draw the view and hydrate the shell. */
export function boot(view, name, arg) {
  loadState(); wireEntry(); wireGlobal();
  if (store.get('hb-lite') === '1') document.body.classList.add('lite');
  const hasSession = !!S.session || S.confirmed || S.demo;
  let tourOn = false; try { tourOn = sessionStorage.getItem('hb-tour') !== null; } catch { /* ignore */ }
  if (GUARDED.includes(name) && !hasSession && !tourOn) { location.replace('/setup'); return; }
  if (NEEDS_SETUP.includes(name) && !S.setup.stage && !S.demo && !S.confirmed) { location.replace('/setup'); return; }
  const main = $('#view');
  main.innerHTML = view.render(arg); if (view.mount) view.mount(arg);
  $$('[data-logo]').forEach((e) => (e.innerHTML = LOGO));
  const key = name === 'mission' ? 'missions' : name;
  $$('#side-nav a,#tabs a').forEach((a) => (a.dataset.nav === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const mb = $('#tabs [data-more]'); if (mb) { const inTabs = $$('#tabs a').some((a) => a.dataset.nav === key); inTabs ? mb.removeAttribute('aria-current') : mb.setAttribute('aria-current', 'page'); mb.onclick = openMore; }
  const set = (sel, t) => { const e = $(sel); if (e) e.textContent = t; };
  set('#c-ev', S.evidence); set('#c-streak', S.streak); set('.top .me', (S.name || 'Y')[0].toUpperCase());
  set('#side-biz', S.name ? `${S.name}'s business. Edit it any time.` : 'Your business. Edit it any time.');
  const bar = () => { let o = $('#offbar'); if (!navigator.onLine && !o) { o = document.createElement('div'); o.id = 'offbar'; o.className = 'offbar'; o.setAttribute('role', 'status'); o.innerHTML = `${ic('info')}<span>You are offline. Your work is saved on this phone.</span>`; $('.top').after(o); } else if (navigator.onLine && o) { o.remove(); syncNow(); } };
  addEventListener('online', bar); addEventListener('offline', bar); bar();
  showFlash(); tour(name); if (S.session) syncNow();
  main.focus({ preventScroll: true });
}

async function openMore() {
  const { openSheet } = await import('../lib/ui.js'); const { NAV, NAV2, TABS } = await import('../lib/icons.js');
  const rest = [...NAV.filter((n) => !TABS.includes(n[0])), ...NAV2];
  openSheet('More', `<div class="morelist">${rest.map(([v, l, i]) => `<a class="morebtn" href="${route(v)}">${ic(i)}<span>${l}</span>${ic('arrow')}</a>`).join('')}</div>`);
}
