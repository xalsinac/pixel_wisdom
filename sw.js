// Aumentamos la versión para forzar la actualización
const CACHE_NAME = 'pixel-wisdom-v5';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Fuerza al nuevo SW a instalarse inmediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Avoid caching the same URL twice: './' and 'index.html' resolve to
      // the same resource when the app is hosted at the scope root.
      return cache.addAll([
        './index.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png',
        './quotes.csv'
      ]);
    })
  );
});

// ¡NUEVO!: Este evento limpia la basura y arregla la pantalla oscura en Firefox
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma el control de la página al instante
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Refresh the catalogue from the network when available, while keeping the
  // most recent version available offline.
  if (new URL(e.request.url).pathname.endsWith('/quotes.csv')) {
    e.respondWith(
      fetch(e.request).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(e.request, response.clone());
        }
        return response;
      }).catch(async () => (await caches.match(e.request)) || Response.error())
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request)).catch(async () => {
      // Only serve the app shell for page navigations, never for failed
      // scripts, images, or other asset requests.
      if (e.request.mode === 'navigate') {
        return (await caches.match('./index.html')) || Response.error();
      }
      return Response.error();
    })
  );
});
