/* Armin Studio Service Worker — Stale-While-Revalidate */
const CACHE = 'armin-v3';
const PRECACHE = [
  '/',
  '/index.html',
  '/services.html',
  '/pricing.html',
  '/examples.html',
  '/contact.html',
  '/guide.html',
  '/logo.png',
  '/mobile.css',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  /* Skip cross-origin, non-GET, and browser-extension requests */
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  /* Images — cache-first (long-lived assets) */
  if (req.destination === 'image') {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(res => {
            if (res.ok) c.put(req, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  /* HTML / CSS / JS — Stale-While-Revalidate */
  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res.ok) c.put(req, res.clone());
          return res;
        }).catch(() => cached || new Response('Offline – content unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        }));
        return cached || network;
      })
    )
  );
});
