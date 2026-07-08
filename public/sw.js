const CACHE = 'ptf-v16';

const PRECACHE = [
  '/',
  '/assets/textures/watercolor-paper-dark-green.webp',
  '/assets/watercolor/painted-turtle.webp',
  '/assets/watercolor/floral-border-v2.webp',
  '/assets/watercolor/host-photo.webp',
  '/assets/map-ground-v2.webp',
  // Gallery thumbnails only — full-size photos are cached on demand when
  // a visitor actually opens one, instead of forcing every visitor to
  // download the whole gallery upfront.
  '/assets/photos/general/01-turtles-1-sm.webp',
  '/assets/photos/general/02-turtles-2-sm.webp',
  '/assets/photos/general/03-people-1-sm.webp',
  '/assets/photos/general/04-veggie-garden-1-sm.webp',
  '/assets/photos/general/05-veggie-garden-2-sm.webp',
  '/assets/photos/general/06-veggie-garden-3-sm.webp',
  '/assets/photos/general/07-veggie-garden-4-sm.webp',
  '/assets/photos/general/08-veggie-garden-5-sm.webp',
  '/assets/photos/general/09-veggie-garden-6-sm.webp',
  '/assets/photos/general/10-veggie-garden-7-sm.webp',
  '/assets/photos/general/11-garlic-harvest-sm.webp',
  '/assets/photos/general/12-patio-garden-1-sm.webp',
  '/assets/photos/general/13-patio-garden-2-sm.webp',
  '/assets/photos/general/14-patio-garden-3-sm.webp',
  '/assets/photos/general/15-patio-garden-4-sm.webp',
  '/assets/photos/general/16-patio-garden-5-sm.webp',
  '/assets/photos/general/17-sauna-garden-1-sm.webp',
  '/assets/photos/general/18-sauna-garden-2-sm.webp',
  '/assets/photos/general/19-flower-1-sm.webp',
  '/assets/photos/general/20-flower-3-sm.webp',
  '/assets/photos/general/21-seedlings-sm.webp',
  '/assets/photos/general/22-bouquet-collage-sm.webp',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Let analytics and Google Apps Script calls go straight to the network
  if (url.hostname.includes('google-analytics') ||
      url.hostname.includes('googletagmanager') ||
      url.hostname.includes('script.google.com')) return;

  const isStatic =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/_astro/');

  if (isStatic) {
    // Cache-first: images and built assets never change once deployed
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
  } else {
    // Network-first with cache fallback for the page shell
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
