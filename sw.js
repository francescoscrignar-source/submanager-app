const CACHE_NAME = "subsapp-cache-v1";
const ASSETS = [
"./",
"./index.html",
"./styles.css",
"./app.js",
"./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
);
});

self.addEventListener("activate", (event) => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
)
);
});

self.addEventListener("fetch", (event) => {
event.respondWith(
caches.match(event.request).then((cached) => {
return cached || fetch(event.request).then((resp) => {
// cache update (best effort)
const copy = resp.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(()=>{});
return resp;
}).catch(() => cached);
})
);
});
