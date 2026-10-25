import { ic, route, LOGO } from './icons.js';
export { ic, LOGO } from './icons.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const R = (n) => { n = Math.round(n); return (n < 0 ? '−' : '') + 'R' + Math.abs(n).toLocaleString('en-ZA'); };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const L_ = (x) => (x || '').trim().length;

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage full or blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};

/* ---------- navigation ---------- */
export function go(v, arg) { location.href = route(v, arg); }
/** Show a toast after the next page load. */
export function flash(msg, icon = 'spark') { try { sessionStorage.setItem('hb-flash', JSON.stringify([msg, icon])); } catch { /* ignore */ } }
export function toast(msg, icon = 'spark') {
  const host = $('#toasts'); if (!host) return;
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = ic(icon) + '<span>' + esc(msg) + '</span>'; host.appendChild(t);
  setTimeout(() => t.classList.add('out'), 3600); setTimeout(() => t.remove(), 4100);
}
export function showFlash() {
  try { const f = sessionStorage.getItem('hb-flash'); if (f) { sessionStorage.removeItem('hb-flash'); const [m, i] = JSON.parse(f); setTimeout(() => toast(m, i), 350); } } catch { /* ignore */ }
}

/* ---------- theme: light by default ---------- */
export const themeMode = () => document.documentElement.dataset.theme || 'light';
export const isDark = () => { const t = themeMode(); return t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches); };
export const paintTheme = () => $$('[data-theme-toggle]').forEach((b) => (b.innerHTML = ic(isDark() ? 'sun' : 'moon')));
export function setTheme(t) { document.documentElement.dataset.theme = t; store.set('hb-theme', t); paintTheme(); }

/* ---------- sheets ---------- */
export function openSheet(title, html, cls = '') {
  const w = document.createElement('div'); w.className = 'sheet-bg';
  w.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="row-between"><h3>${esc(title)}</h3><button class="icon-btn" data-x aria-label="Close">×</button></div>${html}</div>`;
  document.body.appendChild(w);
  const prev = document.activeElement;
  const close = () => { w.remove(); if (prev && prev.focus) prev.focus(); };
  $('[data-x]', w).onclick = close; w.addEventListener('click', (e) => { if (e.target === w) close(); }); $('[data-x]', w).focus();
  return { w, close };
}

export function copyText(t, msg) {
  const done = () => toast(msg || 'Copied');
  const fb = () => { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch { /* ignore */ } a.remove(); ok ? done() : toast('Select the text and copy it yourself.', 'info'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fb); else fb();
}

/* ---------- labels ---------- */
export const tagFor = {
  self: '<span class="tag self">Self-reported</span>', sim: '<span class="tag sim">Simulated</span>', ver: '<span class="tag ver">Verified</span>',
  est: '<span class="tag est">AI estimate, check it</span>', calc: '<span class="tag calc">Calculated</span>', asm: '<span class="tag warn">Assumption</span>', proj: '<span class="tag proj">Projected</span>'
};

export function slider(id, label, min, max, step, val, fmt, hint) {
  return `<div class="ctl"><div class="t"><label for="${id}">${label}</label><output id="${id}-o" for="${id}">${fmt(val)}</output></div><input class="range" id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}">${hint ? `<small>${hint}</small>` : ''}</div>`;
}

/* ---------- plain-language glossary ---------- */
export const GLOSS = {
  blueprint: ['Business Blueprint', 'Your business on one page: what you sell, what it costs and how many jobs you can take on.'],
  evidence: ['Evidence', 'Proof of the work you did here, like a cost you found or a decision you explained.'],
  calculator: ['The calculator', 'Plain, tested formulas do all the maths. The AI never does it, so you can check every number by hand.'],
  breakeven: ['Break-even price', 'The lowest price that covers every cost and still pays you your goal.'],
  kept: ['Kept per sale', 'What is left from one sale after materials and other direct costs, before you pay yourself.'],
  capacity: ['Capacity', 'The most you can make or do in a month with the hours you have.'],
  assumption: ['Assumption', 'A guess you can change. It is never shown as a fact or a prediction.'],
  projected: ['Projected', 'A forecast worked out from your own numbers if nothing else changes. Not a promise.'],
  readiness: ['Venture Readiness Profile', 'A summary of what you have practised, what you have only guessed, and what to do next.'],
  simulation: ['Simulation', 'A practice month for your business. Nothing real is at risk.'],
  runway: ['Cash runway', 'How many months your cash lasts at the current numbers.'],
  demand: ['Demand', 'How many customers still buy when your price changes.']
};
export const T = (k, label) => `<button type="button" class="term" data-term="${k}">${label || GLOSS[k][0]}</button>`;

export function wireGlobal() {
  document.addEventListener('click', (e) => {
    const old = $('#tip'); if (old) old.remove();
    const t = e.target.closest('.term');
    if (t) {
      e.preventDefault(); e.stopPropagation();
      const g = GLOSS[t.dataset.term]; if (!g) return;
      const tip = document.createElement('div'); tip.id = 'tip'; tip.setAttribute('role', 'tooltip'); tip.innerHTML = `<b>${g[0]}</b><span>${g[1]}</span>`; document.body.appendChild(tip);
      const r = t.getBoundingClientRect(), w = tip.offsetWidth; let left = Math.min(Math.max(12, r.left), innerWidth - w - 12), top = r.bottom + 8;
      if (top + tip.offsetHeight > innerHeight - 12) top = Math.max(12, r.top - tip.offsetHeight - 8);
      tip.style.left = left + 'px'; tip.style.top = top + 'px'; return;
    }
    const th = e.target.closest('[data-theme-toggle]');
    if (th) { setTheme(isDark() ? 'light' : 'dark'); return; }
    const g = e.target.closest('[data-go]');
    if (g && !g.disabled && g.tagName !== 'A') { e.preventDefault(); go(g.dataset.go, g.dataset.arg); }
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const t = $('#tip'); if (t) t.remove();
    const s = $$('.sheet-bg'); if (s.length) s[s.length - 1].remove();
  });
  addEventListener('scroll', () => { const t = $('#tip'); if (t) t.remove(); }, { passive: true });
  $$('[data-theme-toggle]').forEach(() => 0); paintTheme();
}

/* ---------- bridge graphic ---------- */
export function bridgeSVG(st, labels) {
  const xs = [70, 230, 390, 550, 690], base = 150, deckY = base - 30, W = 760;
  labels = labels || ['Blueprint', 'Customer', 'Numbers', 'Shock', 'Next step'];
  let s = `<svg viewBox="0 0 ${W} 215" role="img" aria-label="Bridge progress: ${st.filter((x) => x === 'done').length} of 4 spans built">`;
  s += `<path d="M0 ${base} H${W}" stroke="var(--line)" stroke-width="3"/>`;
  for (let i = 0; i < 4; i++) {
    const x1 = xs[i], x2 = xs[i + 1], mx = (x1 + x2) / 2, h = (i % 2 ? 58 : 72);
    const d = `M${x1} ${deckY} Q ${mx} ${deckY - h * 1.6} ${x2} ${deckY}`;
    if (st[i] === 'done') s += `<path d="${d}" fill="none" stroke="var(--jac)" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="var(--card)" stroke-width="2" stroke-dasharray="2 14" stroke-linecap="round"/>`;
    else if (st[i] === 'now') s += `<path d="${d}" fill="none" stroke="var(--jac)" stroke-opacity=".35" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="var(--jac)" stroke-width="9" stroke-linecap="round" stroke-dasharray="14 12"><animate attributeName="stroke-dashoffset" from="52" to="0" dur="1.4s" repeatCount="indefinite"/></path>`;
    else s += `<path d="${d}" fill="none" stroke="var(--line)" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 14"/>`;
  }
  const reached = (i) => i === 0 || st[i - 1] === 'done';
  xs.forEach((x, i) => {
    const on = reached(i);
    s += `<rect x="${x - 9}" y="${deckY}" width="18" height="${base - deckY}" rx="4" fill="${on ? 'var(--jac)' : 'var(--card2)'}" stroke="${on ? 'var(--jac)' : 'var(--line)'}" stroke-width="2"/>`;
    s += `<text x="${x}" y="${base + 30}" text-anchor="middle" font-size="13" font-weight="700" fill="${on ? 'var(--text)' : 'var(--muted)'}" font-family="var(--font-body)">${labels[i]}</text>`;
    if (on && i > 0) s += `<path d="m${x - 5} ${deckY + 11} 3.5 3.5 7-8" fill="none" stroke="var(--on-jac)" stroke-width="2.2" stroke-linecap="round"/>`;
  });
  const done = st.filter((x) => x === 'done').length, wx = xs[done];
  s += `<g><circle cx="${wx}" cy="${deckY - 22}" r="15" fill="var(--protea)" opacity=".25"><animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/></circle><circle cx="${wx}" cy="${deckY - 22}" r="9" fill="var(--protea)"/></g>`;
  const fx = xs[4]; s += `<path d="M${fx + 26} ${deckY} V${deckY - 38} l22 8-22 8" fill="${done === 4 ? 'var(--protea)' : 'var(--card2)'}" stroke="${done === 4 ? 'var(--protea)' : 'var(--muted)'}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
  return s + '</svg>';
}
