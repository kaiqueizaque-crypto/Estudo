const APP_VERSION = "v1.0";
const CACHE_NAME = "estudos-cache-" + APP_VERSION;
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./logo2.ico"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // network-first for dynamic: try network, fallback to cache
  event.respondWith(
    fetch(event.request).then(resp => {
      // update cache for GET same-origin
      if(event.request.method === "GET" && event.request.url.startsWith(location.origin)){
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return resp;
    }).catch(()=> caches.match(event.request).then(r => r || caches.match('./') ))
  );
});
