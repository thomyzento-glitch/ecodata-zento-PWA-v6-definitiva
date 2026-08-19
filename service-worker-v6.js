const CACHE_NAME = "ecodata-zento-v6";
const BASE = "./";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=6",
  "./app.js?v=6",
  "./manifest.json",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/logo-zento-header.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type: "window", includeUncontrolled: true}))
      .then(clients => clients.forEach(client => client.postMessage({type: "APP_UPDATED", version: "v6"})))
  );
});

function isCore(request) {
  const p = new URL(request.url).pathname;
  return /\/(index\.html|style\.css|app\.js|manifest\.json|service-worker-v6\.js)$/.test(p);
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate" || isCore(event.request)) {
    event.respondWith(
      fetch(event.request, {cache: "no-store"})
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
