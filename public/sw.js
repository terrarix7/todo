// Development service worker for testing
const CACHE_NAME = 'todos-dev-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Try to fetch from network
        return fetch(event.request).catch((error) => {
          console.log('Fetch failed; returning offline page instead.', error);
          
          // For navigation requests, return the cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // For other requests, just reject
          throw error;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});