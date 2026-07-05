const CACHE = 'ptf-v3';

const PRECACHE = [
  '/',
  '/assets/textures/watercolor-paper-dark-green.webp',
  '/assets/watercolor/painted-turtle.webp',
  '/assets/watercolor/floral-border-v2.webp',
  '/assets/watercolor/host-photo.webp',
  '/assets/map-ground-v2.webp',
  '/assets/photos/general/turtle-1.webp',
  '/assets/photos/general/turtle-2.webp',
  '/assets/photos/general/dog-1.webp',
  '/assets/photos/general/dog-2.webp',
  '/assets/photos/general/harvest-1.webp',
  '/assets/photos/general/flower-1.webp',
  '/assets/photos/general/flower-2.webp',
  '/assets/photos/general/flower-3.webp',
  '/assets/photos/general/garden-1.webp',
  '/assets/photos/general/garden-2.webp',
  '/assets/photos/general/hosts-1.webp',
  '/assets/photos/general/hosts-2.webp',
  '/assets/photos/general/garden-3.webp',
  '/assets/photos/general/before-1.webp',
  '/assets/photos/general/before-2.webp',
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
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/images/');

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
