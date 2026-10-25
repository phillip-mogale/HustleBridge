export const ICONS = {
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 missions:'<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>',
 sim:'<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>',
 price:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
 profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6 8-6s7 1.5 8 6"/>',
 opps:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
 moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
 check:'<path d="m5 12 5 5 9-10"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 arch:'<path d="M2 19c3-9 7-12 10-12s7 3 10 12"/><path d="M2 19h20M7 19v-6M12 19V7M17 19v-6"/>',
 spark:'<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',
 send:'<path d="m4 12 16-8-6 16-3-7z"/>',
 ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 warn:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
 pitch:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
 copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
 download:'<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>'
};
export const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
/** Gradients the logo uses. Rendered once per page by Base.astro (never display:none, or the fills would vanish). */
export const LOGO_DEFS = '<linearGradient id="hbL" gradientUnits="userSpaceOnUse" x1="0" y1="205" x2="0" y2="783"><stop offset="0" stop-color="#E4D9FF"/><stop offset=".22" stop-color="#B79DFF"/><stop offset=".55" stop-color="#6B3FD4"/><stop offset="1" stop-color="#2A1566"/></linearGradient><linearGradient id="hbR" gradientUnits="userSpaceOnUse" x1="0" y1="246" x2="0" y2="772"><stop offset="0" stop-color="#FFD6E5"/><stop offset=".25" stop-color="#FF9EC0"/><stop offset=".58" stop-color="#EE4A80"/><stop offset="1" stop-color="#A3174F"/></linearGradient><linearGradient id="hbRing" gradientUnits="userSpaceOnUse" x1="160" y1="0" x2="864" y2="0"><stop offset="0" stop-color="#6B3FD4"/><stop offset=".45" stop-color="#B79DFF"/><stop offset=".55" stop-color="#FF9EC0"/><stop offset="1" stop-color="#EE4A80"/></linearGradient><linearGradient id="hbFade" gradientUnits="userSpaceOnUse" x1="0" y1="430" x2="0" y2="700"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="hbM" maskUnits="userSpaceOnUse" x="100" y="100" width="800" height="700"><rect x="100" y="100" width="800" height="700" fill="url(#hbFade)"/></mask><linearGradient id="hbSide" gradientUnits="userSpaceOnUse" x1="305" y1="782" x2="825" y2="418"><stop offset="0" stop-color="#6B3FD4"/><stop offset=".4" stop-color="#B79DFF"/><stop offset=".75" stop-color="#FF9EC0"/><stop offset="1" stop-color="#FFE0EA"/></linearGradient><linearGradient id="hbRim" gradientUnits="userSpaceOnUse" x1="125" y1="778" x2="825" y2="418"><stop offset="0" stop-color="#B79DFF"/><stop offset=".5" stop-color="#E4D9FF"/><stop offset="1" stop-color="#FFB3CC"/></linearGradient><linearGradient id="hbD" gradientUnits="userSpaceOnUse" x1="400" y1="640" x2="760" y2="410"><stop offset="0" stop-color="#FF6F9D"/><stop offset="1" stop-color="#FFC2D6"/></linearGradient><linearGradient id="hbGlow" gradientUnits="userSpaceOnUse" x1="125" y1="778" x2="470" y2="540"><stop offset="0" stop-color="#8B63F0" stop-opacity=".85"/><stop offset=".6" stop-color="#6B3FD4" stop-opacity=".18"/><stop offset="1" stop-color="#6B3FD4" stop-opacity="0"/></linearGradient><radialGradient id="hbSun" gradientUnits="userSpaceOnUse" cx="700" cy="385" r="42"><stop offset="0" stop-color="#FFE9F0" stop-opacity=".95"/><stop offset="1" stop-color="#FF9EC0" stop-opacity="0"/></radialGradient>';
export const LOGO = '<svg viewBox="114 74 760 760" width="38" height="38" aria-hidden="true" focusable="false"><g mask="url(#hbM)"><circle cx="512" cy="476" r="352" fill="none" stroke="url(#hbRing)" stroke-width="12"/></g><path d="M272 270L396 208Q404 204 404 213V770Q404 783 391 783H285Q272 783 272 770Z" fill="url(#hbL)"/><path d="M272 270L396 208Q404 204 404 213V420Q330 380 272 470Z" fill="#fff" opacity=".22"/><path d="M602 322L736 250Q748 244 748 257V760Q748 772 736 772H614Q602 772 602 760Z" fill="url(#hbR)"/><path d="M602 322L736 250Q748 244 748 257V430Q660 470 602 600Z" fill="#fff" opacity=".18"/><circle cx="700" cy="385" r="42" fill="url(#hbSun)"/><path d="M825 418C660 435 440 575 375 783H305C410 545 650 415 825 418Z" fill="url(#hbSide)"/><path d="M125 778C240 560 430 365 825 418C650 415 410 545 305 779Z" fill="var(--lg-road,#1B1030)"/><path d="M125 778C240 560 430 365 825 418C650 415 410 545 305 779Z" fill="url(#hbGlow)"/><path d="M125 778C240 560 430 365 825 418" fill="none" stroke="url(#hbRim)" stroke-width="7" stroke-linecap="round"/><g fill="url(#hbD)"><path transform="translate(372 580) rotate(-38) skewX(-22)" d="M-44 -11H44V11H-44Z"/><path transform="translate(470 504) rotate(-31) skewX(-24)" d="M-37 -8.7H37V8.7H-37Z"/><path transform="translate(553 462) rotate(-22) skewX(-24)" d="M-31 -7H31V7H-31Z"/><path transform="translate(626 438) rotate(-15) skewX(-24)" d="M-26 -5.5H26V5.5H-26Z"/><path transform="translate(690 424) rotate(-9) skewX(-24)" d="M-22 -4.2H22V4.2H-22Z"/><path transform="translate(748 418) rotate(-3) skewX(-24)" d="M-18 -2.8H18V2.8H-18Z"/></g></svg>';

export const ROUTES = {
  landing: '/', login: '/login', setup: '/setup', start: '/start', blueprint: '/blueprint', dashboard: '/dashboard',
  missions: '/missions', simulation: '/simulation', pricing: '/pricing', insights: '/insights', profile: '/profile',
  opportunities: '/opportunities', pitch: '/pitch', preferences: '/settings', about: '/about', privacy: '/privacy', offline: '/offline'
};
export const NAVG = [
  [null, [['dashboard', 'Home', 'home']]],
  ['Practise', [['missions', 'Missions', 'missions'], ['simulation', 'Simulate', 'sim']]],
  ['Understand', [['pricing', 'Pricing', 'price'], ['insights', 'Insights', 'chart']]],
  ['Connect', [['profile', 'Profile', 'profile'], ['opportunities', 'Support', 'opps'], ['pitch', 'Pitch', 'pitch']]]
];
export const NAV = NAVG.flatMap((g) => g[1]);
export const NAV2 = [['preferences', 'Settings', 'gear'], ['about', 'About and privacy', 'info']];
export const TABS = ['dashboard', 'missions', 'simulation', 'pricing'];
export const TITLES = {
  insights: 'Insights', dashboard: 'Home', missions: 'Missions', mission: 'Mission', simulation: 'Living simulation', pricing: 'Pricing tool',
  profile: 'Venture Readiness Profile', opportunities: 'Support hub', pitch: 'Pitch preparation', preferences: 'Settings', about: 'About',
  privacy: 'Privacy', offline: 'Offline', login: 'Welcome', setup: 'Get started', start: 'Get started', blueprint: 'Your Business Blueprint'
};
export const route = (v, arg) => (v === 'mission' ? '/missions/' + (arg || 1) : v === 'login' && arg === 'in' ? '/login?mode=in' : ROUTES[v] || '/');
