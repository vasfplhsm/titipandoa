/* Build substitutes a content-derived revision and only same-origin public files. */
const VERSION = "__VERSION__";
const FILES = __PRECACHE__;
const ROOT = new URL("./", self.location.href);
const PREFIX = "titipandoa-shell-" + ROOT.pathname.replaceAll("/", "_") + "-";
const CACHE = PREFIX + VERSION;
const SHELL = new URL("index.html", ROOT).href;
const allowed = new Set(FILES.map((file) => new URL(file, ROOT).href));
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(
        FILES.map(
          (file) =>
            new Request(new URL(file, ROOT), {
              cache: "reload",
              credentials: "same-origin",
            }),
        ),
      );
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CACHE_STATUS")
    event.ports?.[0]?.postMessage({ version: VERSION, ready: true });
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(ROOT.pathname)
  )
    return;
  // Never cache APIs, credentials, private records, query responses or third-party traffic.
  if (
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/functions/")
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) return response;
        } catch {}
        const cache = await caches.open(CACHE);
        return (
          (await cache.match(SHELL)) ||
          new Response(
            '<!doctype html><meta name="viewport" content="width=device-width"><h1>Tumpang Doa</h1><p>Buka aplikasi sekali dalam talian untuk menyiapkan simpanan luar talian.</p>',
            {
              status: 503,
              headers: { "Content-Type": "text/html;charset=utf-8" },
            },
          )
        );
      })(),
    );
    return;
  }
  if (allowed.has(url.href))
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const saved = await cache.match(url.href);
        if (saved) return saved;
        const response = await fetch(request);
        if (response.ok) await cache.put(url.href, response.clone());
        return response;
      })(),
    );
});
