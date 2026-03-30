/**
 * Generates service worker configuration for PWA caching
 * Called during build to create sw.js
 */

Deno.serve(async (req) => {
  const swCode = `
const CACHE_NAME = 'balance-v1';
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/Home',
  '/Social',
  '/Progress',
  '/Profile'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching critical assets');
      return Promise.all(
        CRITICAL_ASSETS.map(url => 
          cache.add(url).catch(() => console.log(\`[SW] Failed to cache \${url}\`))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (url.pathname.includes('/api/')) {
    return event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});
  `;

  return Response.json({
    serviceWorker: swCode,
    message: "Add this code to public/sw.js for PWA offline support"
  });
});