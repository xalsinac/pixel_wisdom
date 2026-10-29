// Aumentamos la versión para forzar la actualización
const CACHE_NAME = 'pixel-wisdom-v4';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Fuerza al nuevo SW a instalarse inmediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        'index.html',
        'manifest.json',
        'icon-192.png',
        'icon-512.png'
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
  e.respondWith(
    caches.match(e.request).then((res) => {
      // Devuelve la caché si existe, si no, va a internet
      return res || fetch(e.request);
    }).catch(() => {
      return caches.match('index.html');
    })
  );
});