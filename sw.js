// Service Worker for Enkerra ang' Baby Shop
const CACHE_NAME = 'enkerra-baby-shop-v2';

// Files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // '/icon-192.png',   // uncomment if you add these icons
  // '/icon-512.png',
];

// Install – precache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate – clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch – cache first, then network for offline support
self.addEventListener('fetch', event => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  // Let firebase / emailjs calls pass through to network
  if (
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firestore') ||
    event.request.url.includes('emailjs')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return cached response if exists, otherwise fetch from network
      return cachedResponse || fetch(event.request).then(networkResponse => {
        // Cache valid responses for later
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback – you could return a custom offline page here
      });
    })
  );
});
