import { S, BP, LB, D, save, track } from '../../lib/state.js';
import { ic, R, T, tagFor, $, $$, openSheet, copyText, esc } from '../../lib/ui.js';
import { C, M2miss } from '../../lib/shared.js';
import { MX } from '../../lib/missions.js';

export function profileData() {
  const c = C(), p = S.progress, h = S.sim ? S.sim.hist : S.pastHist || [], miss = D(2).admin > 0 || D(2).tools > 0 || D(2).cancel > 0, u = LB.unit;
  const dims = [
    ['Customer understanding', p >= 1 ? 2 : 0, p >= 1 ? 'Customer, problem and offer defined in Mission 1.' : 'Finish Mission 1 to add evidence here.'],
    ['Financial awareness', (S.confirmed || S.demo ? 1 : 0) + (p >= 2 ? 2 : 0) + (miss ? 1 : 0), p >= 2 ? `Full cost per ${u} calculated` + (miss ? ', with a missed cost found.' : '. Missed costs still to check.') : 'Confirm your Blueprint, then finish Mission 2.'],
    ['Operational planning', (p >= 4 ? 3 : 0) + (S.confirmed || S.demo ? 1 : 0), p >= 4 ? 'Capacity known and a low-cost test planned.' : 'Capacity known. No next-step plan yet.'],
    ['Risk awareness', Math.min(5, (p >= 3 ? 2 : 0) + h.length), p >= 3 ? 'One price shock handled' + (h.length ? `, plus ${h.length} simulated decision${h.length > 1 ? 's' : ''}.` : '. More events to practise.') : 'No shocks practised yet.']];
  const gaps = [];
  if (!miss) gaps.push(['Unpaid admin time and tool wear are not counted', 'Find them in Mission 2 or the pricing tool']);
  if (p < 4) gaps.push(['No low-cost test planned yet', 'Plan one in Mission 4']);
  gaps.push(['No evidence of real customer demand yet', 'Ask three customers, then update your numbers']);
  if (!h.some((x) => /cancel/i.test(x.t))) gaps.push(['Cancellation policy not written down', 'Practise the cancellation event']);
  if (Object.values(S.checked).some((v) => !v)) gaps.push(['Some AI estimates are not checked yet', 'Open your Blueprint and check each one against a receipt']);
  return { c, p, h, dims, gaps };
}

export default {
  render() {
    const { c, p, h, dims, gaps } = profileData(), st = S.setup || {}, u = LB.unit, pips = (n) => Array.from({ length: 5 }, (_, i) => `<span class="pip ${i < n ? 'on' : ''}"></span>`).join('');
    return `<div class="card snap" style="margin-top:8px"><svg class="seal" viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="44" fill="none" stroke="var(--jac)" stroke-width="3" stroke-dasharray="3 6"/><circle cx="48" cy="48" r="34" fill="var(--jac-soft)"/><path d="M26 58c5-14 12-20 22-20s17 6 22 20M26 58h44M33 58V48M48 58V38M63 58V48" fill="none" stroke="var(--jac)" stroke-width="3.5" stroke-linecap="round"/></svg>
  <div><h1 class="h-page" style="margin-top:0;font-size:clamp(1.7rem,3.4vw,2.4rem)">${esc(S.name || 'Your')}${S.name ? "'s" : ''} Venture Readiness Profile</h1><p class="p-page" style="margin-top:8px">${esc(S.meta.name)}. ${esc(st.stage || 'Operating')}. ${esc(st.province || '')}. Built from ${S.evidence} piece${S.evidence === 1 ? '' : 's'} of evidence, each one linked to something you entered or decided.</p>
  <div class="cta-row" style="margin-top:16px"><button class="btn sm" id="summ">${ic('profile')}One-page summary</button><button class="btn ghost sm" style="color:var(--text)" id="print">${ic('download')}Print or save as PDF</button><button class="btn ghost sm" style="color:var(--text)" data-go="pitch">Prepare a pitch</button></div></div></div>
 <div class="callout pink" style="margin-top:16px">${ic('info')}<span>This profile is a record of practice and preparation. It is not a credit score, a qualification or a promise of funding.</span></div>
 <p class="fine" style="margin-top:20px">Each square is one piece of proof you saved. It is a record of practice, not a score. See ${T('readiness', 'what readiness means')}.</p>
 <div class="dims">${dims.map((d) => `<div class="dim"><h4>${d[0]}</h4><div class="pips" role="img" aria-label="${d[1]} of 5 pieces of evidence">${pips(d[1])}</div><p>${d[2]}</p></div>`).join('')}</div>
 <div class="grid2"><section class="card"><h3>Financial assumptions</h3><ul class="list">
   <li><div class="grow">Price per ${u}<small>Stated in your Blueprint</small></div><b class="num">${R(BP.price)}</b>${tagFor.self}</li>
   <li><div class="grow">Full cost per ${u}<small>Includes your own hours</small></div><b class="num">${R(c.cost + M2miss())}</b>${tagFor.sim}</li>
   <li><div class="grow">Billable hours a month<small>${S.checked.hours ? 'Your estimate, checked' : 'AI estimate, not yet checked'}</small></div><b class="num">${BP.hours}</b>${S.checked.hours ? tagFor.self : tagFor.est}</li>
   <li><div class="grow">Cost you had missed<small>Your own ${BP.hoursPerJob} hours${M2miss() > 0 ? ' and more' : ''}</small></div><b class="num">${R(c.labour + M2miss())}</b>${tagFor.sim}</li></ul></section>
  <section class="card"><h3>Simulation record</h3>${(p >= 3 || h.length) ? `<ul class="list">${p >= 3 ? `<li><span class="dot now">${ic('sim')}</span><div class="grow"><b>Supplier price rise</b><small>You set ${R(D(3).price || BP.price)} a ${u}. ${D(3).why ? 'You said: "' + esc(D(3).why) + '"' : ''}</small></div>${tagFor.sim}</li>` : ''}${h.map((x) => `<li><span class="dot now">${ic('sim')}</span><div class="grow"><b>${esc(x.c)}</b><small>${esc(x.t)}${x.why ? ' You said: "' + esc(x.why) + '"' : ''}</small></div>${tagFor.sim}</li>`).join('')}</ul>` : `<div class="empty">${ic('sim')}<b>No decisions yet</b><p>Respond to an event in the simulation and your choice, its calculated effect and your reasoning appear here.</p><button class="btn sm" data-go="simulation">Open simulation</button></div>`}</section></div>
 <div class="grid2"><section class="card"><h3>Readiness gaps</h3><ul class="list">${gaps.map((g) => `<li><span class="dot lock">${ic('info')}</span><div class="grow">${g[0]}<small>${g[1]}</small></div></li>`).join('')}</ul></section>
  <section class="card"><h3>Suggested next steps</h3><ul class="list">${p < 4 ? `<li><span class="dot now">${ic('arrow')}</span><div class="grow">Finish Mission ${p + 1}<small>${MX[p + 1].name}</small></div><button class="btn sm" data-go="mission" data-arg="${p + 1}">Open</button></li>` : ''}<li><span class="dot now">${ic('arrow')}</span><div class="grow">Browse support that fits your stage<small>Filtered for ${(st.stage || 'operating').toLowerCase()} businesses</small></div><button class="btn sm" data-go="opportunities">Open</button></li><li><span class="dot now">${ic('arrow')}</span><div class="grow">Draft your pitch outline<small>Built from this profile</small></div><button class="btn sm" data-go="pitch">Open</button></li></ul></section></div>
 <section class="card" style="margin-top:20px"><h3>How sure are you about your numbers now?</h3><p class="sub">Rate from 1 (guessing) to 5 (checked with receipts). You rated ${S.rating0} on your first day.</p><div class="rating" id="rate">${[1, 2, 3, 4, 5].map((n) => `<button aria-pressed="${S.rating === n}" data-r="${n}">${n}</button>`).join('')}</div><p class="fine" id="rate-note"></p></section>`;
  },
  mount() {
    const note = () => { const d = S.rating - S.rating0; $('#rate-note').innerHTML = `Self-reported. ${d > 0 ? `Up ${d} since day one.` : d < 0 ? `Down ${-d} since day one.` : 'Same as day one.'} ${tagFor.self}`; }; note();
    $$('#rate button').forEach((b) => (b.onclick = () => { S.rating = +b.dataset.r; save(); track('rating_after', { v: S.rating }); $$('#rate button').forEach((x) => x.setAttribute('aria-pressed', x === b)); note(); }));
    $('#print').onclick = () => print();
    $('#summ').onclick = () => {
      const { c, p, dims, gaps } = profileData(), st = S.setup || {}, u = LB.unit, head = `${S.name ? S.name + "'s " : ''}Venture Readiness Profile`;
      const txt = `${head}\n${S.meta.name} | ${st.stage || 'Operating'} | ${st.province || ''}\n\nPrice per ${u}: ${R(BP.price)}\nFull cost per ${u}: ${R(c.cost + M2miss())} (includes own hours)\nCapacity: ${c.cap} ${LB.units} a month\nSpans built: ${p} of 4\n\nEvidence\n${dims.map((d) => `- ${d[0]}: ${d[1]} of 5. ${d[2]}`).join('\n')}\n\nGaps\n${gaps.map((g) => `- ${g[0]}`).join('\n')}\n\nThis profile is a record of practice and preparation. It is not a credit score, a qualification or a promise of funding.`;
      const sh = openSheet('One-page summary', `<div class="doc"><h4>${esc(head)}</h4><p class="sub">${esc(S.meta.name)}. ${esc(st.stage || 'Operating')}. ${esc(st.province || '')}.</p>
    <div class="kpis" style="margin-top:14px"><div class="kpi"><span>Price per ${u}</span><b>${R(BP.price)}</b></div><div class="kpi"><span>Full cost per ${u}</span><b>${R(c.cost + M2miss())}</b></div></div>
    <h5>Evidence</h5><ul class="list">${dims.map((d) => `<li><div class="grow">${d[0]}<small>${d[2]}</small></div><b class="num">${d[1]}/5</b></li>`).join('')}</ul>
    <h5>Gaps</h5><ul class="list">${gaps.map((g) => `<li><div class="grow">${g[0]}</div></li>`).join('')}</ul>
    <p class="fine">Self-reported, simulated and verified items are labelled in the full profile. This is a record of practice, not a credit score or a promise of funding.</p></div>
    <div class="cta-row"><button class="btn" id="cp">${ic('copy')}Copy summary</button></div>`, 'wide');
      $('#cp', sh.w).onclick = () => copyText(txt, 'Summary copied. Paste it into an email or message.');
    };
  }
};
