import { ic, GLOSS, $$ } from '../../lib/ui.js';
const tabs2 = (a) => `<div class="seg" style="max-width:340px" role="tablist"><button role="tab" aria-selected="${a === 'about'}" data-go="about">About</button><button role="tab" aria-selected="${a === 'privacy'}" data-go="privacy">Privacy</button></div>`;
const back = () => `<button class="back" id="backbtn">${ic('arrow')}Back</button>`;
const wire = () => { const b = document.getElementById('backbtn'); if (b) b.onclick = () => { if (document.referrer && new URL(document.referrer).origin === location.origin && !/\/(about|privacy)$/.test(document.referrer)) history.back(); else location.href = '/'; }; };

export const about = {
  render() {
    return `${back()}${tabs2('about')}<h1 class="h-page" style="margin-top:20px">A safer place to practise.</h1>
 <p class="p-page">Testing a business idea in the real world costs money before it earns any. HustleBridge lets you run your business on paper first, with your own numbers, so a mistake costs you nothing.</p>
 <div class="grid2"><section class="card"><h3>What it is</h3><ul class="list"><li>A practice space for your own business</li><li>A pricing tool that shows what each job really costs</li><li>A record of what you have practised, with clear labels</li><li>A guide to real support you can prepare for</li></ul></section>
  <section class="card"><h3>What it is not</h3><ul class="list"><li>A generic online course</li><li>A loan provider or a marketplace</li><li>A credit score or a qualification</li><li>A promise that a business will succeed</li></ul></section></div>
 <div class="callout" style="margin-top:20px">${ic('info')}<span><b>The rule we follow.</b> The AI configures and explains. The calculator works it out. You decide.</span></div>
 <section class="card" style="margin-top:20px"><h3>Plain words</h3><dl class="gloss">${Object.values(GLOSS).map((g) => `<dt>${g[0]}</dt><dd>${g[1]}</dd>`).join('')}</dl></section>
 <div class="grid3"><div class="card"><span class="tag sim">Practise</span><p class="sub" style="margin-top:10px">Missions and a living simulation tailored to your Blueprint.</p></div><div class="card"><span class="tag sim">Understand</span><p class="sub" style="margin-top:10px">Costs, margin, break-even and capacity in plain language.</p></div><div class="card"><span class="tag sim">Connect</span><p class="sub" style="margin-top:10px">A readiness profile and real, sourced support options.</p></div></div>`;
  }, mount: wire
};
export const privacy = {
  render() {
    return `${back()}${tabs2('privacy')}<h1 class="h-page" style="margin-top:20px">Your data, in plain words.</h1>
 <p class="p-page">We keep what we need to make HustleBridge work for your business, and nothing more. We never ask for a street address, ID number or bank details. Last updated 25 October 2026.</p>
 <section class="card" style="margin-top:20px"><h3>What we store</h3><div class="tbl"><table class="cmp" style="margin-top:12px"><tr><th>What</th><th>Why</th><th>Who sees it</th></tr>
  <tr><td>First name and email</td><td>Sign in and greet you</td><td>Only you</td></tr><tr><td>Province or town</td><td>Show support near you</td><td>Only you</td></tr><tr><td>Your Blueprint and numbers</td><td>Tailor missions and the simulation</td><td>Only you</td></tr><tr><td>Missions and decisions</td><td>Build your profile</td><td>Only you</td></tr><tr><td>Practice measures, such as ratings and when you confirmed a Blueprint</td><td>Learn whether the app helps</td><td>The pilot team, as counts</td></tr></table></div>
  <p class="fine">Without an account, everything stays on your own device. Each signed-in person can only read their own records.</p></section>
 <div class="grid2"><section class="card"><h3>About the AI</h3><ul class="list"><li>It drafts your Blueprint and explains results in plain language.</li><li>Only the text you type into the guide chat is sent to the AI service. Do not type ID numbers or bank details.</li><li>It never does the arithmetic. Tested formulas do.</li><li>Estimates from the AI are always labelled for you to check.</li><li>Keys stay on our servers and never reach your phone.</li></ul></section>
  <section class="card"><h3>Your controls</h3><ul class="list"><li>Edit your Blueprint any time.</li><li>Export your data as a file.</li><li>Delete everything with one confirmation.</li><li>We never apply, pay or invest for you.</li></ul><button class="btn sm" data-go="preferences" style="margin-top:14px">Open settings</button></section></div>
 <div class="callout pink" style="margin-top:20px">${ic('warn')}<span>Be careful of anyone who asks you to pay to unlock funding. HustleBridge never asks for payment and only links to official sources.</span></div>`;
  }, mount: wire
};
