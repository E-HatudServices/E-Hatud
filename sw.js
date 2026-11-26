const CACHE_NAME = "e-hatud-v3";
const ASSETS_TO_CACHE = [
  "./",
  "./costumer.html",
  "./admin.html",
  "./rider.html",
  "./costumer-manifest.json",
  "./admin-manifest.json",
  "./rider-manifest.json",
  "./customer-icon-192.png",
  "./customer-icon-512.png",
  "./admin-icon-192.png",
  "./admin-icon-512.png",
  "./rider-icon-192.png",
  "./rider-icon-512.png"
];

function getFallbackPage(pathname) {
  if (pathname.endsWith("/admin.html")) return "./admin.html";
  if (pathname.endsWith("/rider.html")) return "./rider.html";
  return "./costumer.html";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS_TO_CACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first para kanunay bag-o ang page/file inig refresh
  event.respondWith(
    fetch(req, { cache: "no-store" })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          return caches.match(getFallbackPage(url.pathname));
        }
        return undefined;
      })
  );
});