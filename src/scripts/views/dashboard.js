import { S, BP, LB, save, ago } from '../../lib/state.js';
import { ic, R, T, tagFor, $, toast, esc } from '../../lib/ui.js';
import { bridgeSVG } from '../../lib/ui.js';
import { C, mstat, cash, run, patternInfo, guestSheet } from '../../lib/shared.js';
import { MX } from '../../lib/missions.js';
import { spark } from './insights.js';

const kindIcon = { self: ['done', 'check'], sim: ['now', 'sim'], ver: ['done', 'check'], proj: ['now', 'sim'] };
let deferred = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; const b = $('#inst'); if (b) b.hidden = false; });
export async function installApp() { if (!deferred) { toast('Use your browser menu and choose "Add to home screen".', 'info'); return; } deferred.prompt(); await deferred.userChoice; deferred = null; }

export default {
  render() {
    const c = C(), gap = BP.price - c.cost, p = S.progress, n = Math.min(p, 3) + 1, M = MX[n], u = LB.unit;
    const greet = p >= 4 ? 'the bridge is built.' : p === 0 ? 'let us lay the first span.' : p === 1 ? 'one span down.' : p === 2 ? 'two spans down.' : 'one span to go.';
    const log = S.log.slice(0, 4), draw = S.ins ? S.ins.draw : Math.round(BP.target / 2 / 100) * 100, fs = cash('sup', draw, 6), rw = run('sup', draw), pat = patternInfo();
    return `${S.guest ? `<div class="card install" id="guestbar"><span class="dot now">${ic('lock')}</span><div class="grow"><b>Your progress is saved on this phone only</b><small>Create a free account to keep it safe and open it on any device.</small></div><button class="btn sm" id="gsave">Save progress</button></div>` : ''}${S.hideInstall ? '' : `<div class="card install" id="install" ${deferred ? '' : 'hidden'}><span class="dot now">${ic('arch')}</span><div class="grow"><b>Install HustleBridge on your phone</b><small>Open it like any app and keep practising with no signal.</small></div><button class="btn sm" id="inst">Install</button><button class="btn ghost sm" id="inst-no" style="color:var(--text)">Not now</button></div>`}
 <h1 class="h-page">Hi ${esc(S.name || 'there')}, ${greet}</h1>
 <p class="p-page">${p >= 4 ? 'Your profile is ready. Pick a support option and prepare your application.' : 'Each mission you finish lays a span and adds evidence to your profile.'}</p>
 <section class="card bridge-card" aria-label="Your progress"><div class="bscroll">${bridgeSVG(mstat())}</div>
  <div class="stats-inline"><div><b class="num">${S.evidence}</b><span>pieces of ${T('evidence', 'evidence')}</span></div><div><b class="num">${p}/4</b><span>spans built</span></div><div><b class="num">${Object.values(S.checked).filter(Boolean).length}/4</b><span>estimates checked</span></div><div><b class="num">${S.streak}</b><span>day practice streak</span></div></div></section>
 <div class="grid2">
  <section class="card next"><div class="ring"></div><span class="kicker">${p >= 4 ? 'All missions done' : 'Next mission, about ' + M.time}</span><h3>${p >= 4 ? 'Review your profile' : 'Mission ' + n + ': ' + M.name}</h3><p>${p >= 4 ? 'See what you understand, what you have only assumed, and what to do next.' : M.blurb}</p><button class="btn" data-go="${p >= 4 ? 'profile' : 'mission'}" data-arg="${n}">${p >= 4 ? 'Open my profile' : (p === 0 ? 'Start mission 1' : 'Continue mission')}${ic('arrow')}</button></section>
  <section class="card"><div class="row-between"><h3>Today's five minutes</h3>${tagFor.sim}</div><p class="sub">A short event that fits your business.</p>
   <div class="callout pink" style="margin-top:16px">${ic('warn')}<span><b>${S.sim && S.sim.ev > 0 ? 'Your next event is waiting.' : `Your ${LB.supplier} raises prices.`}</b> How do you respond? You will see the effect on your ${LB.clients}, margin and cash.</span></div>
   <button class="btn sm" style="margin-top:16px" data-go="simulation">Start practice</button></section>
 </div>
 <div class="grid2">
  <section class="card"><div class="row-between"><h3>Looking ahead</h3>${tagFor.proj}</div><p class="sub">Your cash over 6 months if your supplier raises prices and you absorb it.</p><div style="margin-top:12px">${spark(fs)}</div>
   <p style="margin-top:10px;font-weight:600">${rw === null ? 'Your cash holds, even with a supplier rise.' : `At ${R(draw)} a month, your cash would run out in about ${rw} month${rw === 1 ? '' : 's'}.`}</p><button class="btn ghost sm" data-go="insights" style="margin-top:12px;color:var(--text)">Open insights</button></section>
  <section class="card"><div class="row-between"><h3>Pattern spotted</h3>${tagFor.proj}</div>${pat.msg ? `<div class="callout" style="margin-top:14px">${ic('spark')}<span><b>${pat.msg}</b> ${pat.tip}</span></div><button class="btn ghost sm" data-go="insights" style="margin-top:12px;color:var(--text)">See the full pattern</button>` : `<div class="empty">${ic('sim')}<b>Two decisions needed</b><p>Respond to two events in the simulation and your decision pattern appears here.</p></div>`}</section>
 </div>
 <div class="grid2">
  <section class="card"><h3>Your numbers</h3><p class="sub">From your ${T('blueprint', 'Business Blueprint')}.</p><ul class="list">
   <li><div class="grow">Price you charge<small>Stated by you</small></div><b class="num">${R(BP.price)}</b></li>
   <li><div class="grow">Full cost per ${u}<small>Calculated, includes your time</small></div><b class="num">${R(c.cost)}</b></li>
   <li><div class="grow">Gap per ${u}<small>Calculated</small></div><b class="num" style="color:var(${gap < 0 ? '--protea' : '--mint'})">${R(gap)}</b></li></ul>
   <button class="btn ghost sm" style="margin-top:14px;color:var(--text)" data-go="pricing">Open pricing tool</button></section>
  <section class="card"><h3>Recent evidence</h3>${log.length ? `<ul class="list">${log.map((x) => `<li><span class="dot ${kindIcon[x.k][0]}">${ic(kindIcon[x.k][1])}</span><div class="grow">${esc(x.t)}<small>${ago(x.at)}</small></div>${tagFor[x.k]}</li>`).join('')}</ul>` : `<div class="empty">${ic('spark')}<b>Nothing saved yet</b><p>Finish a mission or make a decision in the simulation, and it appears here as evidence.</p></div>`}</section>
 </div>`;
  },
  mount() {
    const i = $('#inst'); if (i) { i.onclick = installApp; $('#inst-no').onclick = () => { S.hideInstall = true; save(); $('#install').remove(); }; }
    const g = $('#gsave'); if (g) g.onclick = guestSheet;
  }
};
