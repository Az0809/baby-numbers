const CACHE_PREFIX = "baby-numbers-";
const AUDIO_VERSION = "2026-08-21-v1";
const CACHE_NAME = `${CACHE_PREFIX}v8-local-audio`;
const AUDIO_FILES = Array.from(
  { length: 100 },
  (_, index) => `/audio/numbers/${index + 1}.mp3?v=${AUDIO_VERSION}`
);
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg", ...AUDIO_FILES];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

async function cacheResponse(request, response) {
  if (response && response.ok && response.type !== "opaque" && request.method === "GET") {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function getFullAudioResponse(request) {
  const cacheKey = new Request(request.url, { method: "GET" });
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const response = await fetch(cacheKey);
  if (response.ok) await cache.put(cacheKey, response.clone());
  return response;
}

async function respondToAudioRangeRequest(request) {
  const rangeHeader = request.headers.get("range");
  const response = await getFullAudioResponse(request);
  if (!rangeHeader || !response.ok) return response;

  const bytes = await response.arrayBuffer();
  const total = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match || total === 0) return response;

  let start;
  let end;
  if (match[1] === "") {
    const suffixLength = Number(match[2]);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return response;
    start = Math.max(total - suffixLength, 0);
    end = total - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? total - 1 : Number(match[2]);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || end < start) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` }
    });
  }

  end = Math.min(end, total - 1);
  const body = bytes.slice(start, end + 1);
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Content-Length", String(body.byteLength));
  headers.set("Content-Type", response.headers.get("Content-Type") || "audio/mpeg");

  return new Response(body, {
    status: 206,
    statusText: "Partial Content",
    headers
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/audio/numbers/") && request.headers.has("range")) {
    event.respondWith(respondToAudioRangeRequest(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(async () => await caches.match(request)
          || await caches.match("/")
          || new Response("离线状态下暂时无法打开页面", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          }))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cached) => cached
        || fetch(request)
          .then((response) => cacheResponse(request, response))
          .catch(() => new Response("资源暂时不可用", { status: 503 })))
  );
});
