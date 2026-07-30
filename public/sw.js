/*
 * Basit app-shell service worker'i. Amac: PWA olarak kurulabilmek ve temel
 * cevrimdisi dayaniklilik. Statik/gezinme istekleri icin "network-first,
 * cache-fallback"; API cagrilari asla cache'lenmez (her zaman canli).
 */
const CACHE = "tare-v1";
const SHELL = ["/", "/products", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Farkli origin (fontlar, Unsplash gorselleri) ve API'ye dokunma.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Sayfa gezinmeleri: once ag, olmazsa cache, o da yoksa /offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(async () =>
          (await caches.match(req)) || (await caches.match("/offline")) || Response.error(),
        ),
    );
    return;
  }

  // Statik varliklar: once ag, basarisizsa cache.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req)),
  );
});
