// E-panda Racing Team — Service Worker
// Pages: network-first, fall back to cache after 2.5s or on failure.
// Assets: cache-first with background refresh.
// Bump CACHE whenever style.css / script.js / HTML content changes.
const CACHE = 'epanda-v8';

const CORE = [
  './',
  'index.html',
  'about.html',
  'memories.html',
  'gallery.html',
  'sponsors.html',
  '404.html',
  'assets/style.css?v=8',
  'assets/script.js?v=8',
  'assets/fonts/space-grotesk-latin-wght-normal.woff2',
  '车队logo/c62cd015cc3be12a70797cce63b0ef20.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const networkPromise = caches.open(CACHE).then((cache) =>
    fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null)
  );
  event.waitUntil(networkPromise);

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: true }) ||
                     await cache.match('index.html');

      if (!cached) return (await networkPromise) || Response.error();

      const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
      const fresh = await Promise.race([networkPromise, timeout]);
      return fresh || cached;
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    return cached || (await networkPromise) || Response.error();
  })());
});
