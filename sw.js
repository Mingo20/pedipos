/* PediPOS service worker: red primero para tener siempre la ultima version, cache como respaldo sin internet. */
const V = "pedipos-v31";
const ASSETS = ["./", "index.html", "manifest.json", "img/logo-96.png", "img/logo-192.png", "img/logo-512.png", "img/logo-maskable-512.png",
  "css/app.css?v=31", "js/store.js?v=31", "js/sync.js?v=31", "js/voice.js?v=31", "js/extra.js?v=31", "js/app.js?v=31"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting()));
});
/* la pagina puede pedir activar de inmediato una version que esta esperando */
self.addEventListener("message", (e) => { if (e.data === "activar") self.skipWaiting(); });

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* red primero: si hay internet, siempre lo ultimo; si no, lo guardado */
  e.respondWith(
    fetch(req, { cache: "no-store" })
      .then((res) => {
        const copy = res.clone();
        caches.open(V).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
