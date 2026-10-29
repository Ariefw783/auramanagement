// ==============================================================
// DAPUR MOM FITRI - SERVICE WORKER (NETWORK-FIRST STRATEGY)
// ==============================================================
const CACHE_NAME = 'dapur-mom-fitri-v7.0.0';
const APP_BUILD_TIME = '29/10/2026 16:30 WIB';

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
  './Panduan_Visual_Trio_Gorengan_Lengkap.jpg',
  './Panduan_Visual_Stik_Sosis_Panir.jpg'
];

// Install: Cache critical assets immediately & skip waiting
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: Clean up previous caches & claim clients immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'APP_UPDATED',
            version: CACHE_NAME,
            buildTime: APP_BUILD_TIME
          });
        });
      });
    })
  );
});

// Message listener: Allow client to force skipWaiting
self.addEventListener('message', (e) => {
  if (e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Fetch: Pure Network First Strategy
// Always attempt to fetch the freshest version from the network.
// If successful, update the cache with the new response.
// If network is offline or fails, serve from the local cache.
self.addEventListener('fetch', (e) => {
  // Hanya proses HTTP/HTTPS GET requests
  if (e.request.method !== 'GET') return;

  const url = e.request.url;
  // Lewati skema selain HTTP/HTTPS
  if (!url.startsWith('http')) return;

  // JANGAN intervensi request Firebase, Firestore, Google APIs streaming / channel
  // (Mencegah browser freeze atau halaman loading terus-menerus)
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebaseio.com') ||
      url.includes('identitytoolkit') ||
      url.includes('googleapis.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
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
