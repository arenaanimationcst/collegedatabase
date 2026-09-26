// Bump this version number any time you want to force every installed copy to pick up
// a fresh app shell immediately (rarely needed now that fetch is network-first below,
// and now that registration itself never trusts the HTTP cache for this file either).
const CACHE_NAME = 'arena-college-directory-v3';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting(); // take over immediately instead of waiting for all tabs to close
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // control open tabs right away, not just future ones
});

// Firestore/Firebase calls always go straight to network — never cache live data.
// Everything else is NETWORK-FIRST: always try to fetch the latest version from GitHub;
// only fall back to the cached copy if there's no internet connection at all.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('googleapis.com') || url.includes('gstatic.com')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Placeholder for future push notifications (needs a backend/Cloud Function to actually send pushes).
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  const title = data.title || 'Arena College Directory';
  const options = { body: data.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
  event.waitUntil(self.registration.showNotification(title, options));
});
