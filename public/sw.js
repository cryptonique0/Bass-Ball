/* Bass Ball Service Worker - PWA Offline & Caching */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `bb-cache:${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      const respClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
      return response;
    }).catch(() => new Response('Offline', { status: 503 }));
  });
}

function networkFirst(request) {
  return fetch(request).then((response) => {
    const respClone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
    return response;
  }).catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 })));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET
  if (request.method !== 'GET') return;

  // Bypass for admin/api paths
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/admin')) return;

  // Strategy selection
  if (url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.match(/\.(css|js|json)$/)) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|woff2|woff|ttf|eot)$/)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Bass Ball Notification';
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    tag: data.tag || 'bass-ball',
    data: data.data || {},
    badge: data.badge || '/icons/icon-192.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Background sync stub
self.addEventListener('sync', (event) => {
  if (event.tag && event.tag.startsWith('bb-sync')) {
    event.waitUntil(Promise.resolve());
  }
});
