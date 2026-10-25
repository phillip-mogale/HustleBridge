/* HustleBridge service worker. Generated at build time by scripts/make-sw.mjs: VERSION and PRECACHE are filled in
   so every deploy gets a new cache name and a judge's phone never keeps an old version. */
const VERSION = '__VERSION__';
const CACHE = 'hb-' + VERSION;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('hb-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin !== location.origin) {
    // Fonts only: cache-first. Never touch anything else cross-origin.
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit))));
    return;
  }
  if (url.pathname.startsWith('/api/')) return; // never cache Supabase or AI responses
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    // Pages: network first, so a deploy shows after one refresh; cache is the offline fallback.
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req).then((hit) => hit || caches.match(url.pathname.replace(/\/$/, '') || '/').then((h2) => h2 || caches.match('/offline')))));
    return;
  }
  // Static assets (hashed filenames): cache first.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; })));
});
