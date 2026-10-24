const CACHE_NAME = 'dapur-mom-fitri-v6.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './style.css',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  './Panduan_Visual_Lumpia_Sayur_Sosis.jpg',
  './Panduan_Visual_Lumpia_Ubi_Ungu_Keju.jpg',
  './Panduan_Visual_Roti_Goreng_Collins.jpg',
  './Panduan_Visual_Trio_Gorengan_Lengkap.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && e.request.method === 'GET') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedRes) => {
          return cachedRes || caches.match('./index.html');
        });
      })
  );
});
