const CACHE_NAME = 'orders-app-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the app shell so users always get the latest version when online,
// falling back to the cached copy when offline. Firebase requests pass straight through.
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // let Firebase/CDN requests go straight to network

  event.respondWith(
    fetch(req)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
  );
});
