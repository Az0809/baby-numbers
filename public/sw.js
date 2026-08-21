const CACHE_PREFIX = "baby-numbers-";
const CACHE_NAME = `${CACHE_PREFIX}v4`;
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
async function cacheResponse(request, response) {
  if (response && response.ok && response.type !== "opaque" && request.method === "GET") {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => cacheResponse(request, response)).catch(async () => await caches.match(request) || await caches.match("/") || new Response("离线状态下暂时无法打开页面", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(request, response)).catch(() => new Response("资源暂时不可用", { status: 503 }))));
});
