
/* KNOQ-TESTING v34.2: offline shell only.
   Never caches Supabase/customer requests. */

const CACHE = 'knoq-testing-v34-2-shell';
const ROOT = new URL('./', self.location.href);
const PAGE = new URL('index.html', ROOT).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    const response = await fetch(
      new Request(PAGE, { cache: 'reload' })
    );

    if (!response.ok) {
      throw new Error('HTML fetch failed: ' + response.status);
    }

    await cache.put(PAGE, response);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.mode !== 'navigate' ||
      request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== ROOT.origin ||
      !(url.pathname === ROOT.pathname ||
        url.pathname === ROOT.pathname + 'index.html')) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    try {
      const network = await fetch(request);

      if (network.ok) {
        await cache.put(PAGE, network.clone());
      }

      return network;
    } catch (error) {
      const saved = await cache.match(PAGE);

      if (saved) return saved;

      throw error;
    }
  })());
});
