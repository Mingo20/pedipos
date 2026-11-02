/* PediPOS service worker: red primero para tener siempre la ultima version, cache como respaldo sin internet. */
const V = "pedipos-v13";
const ASSETS = ["./", "index.html", "manifest.json", "icon.svg",
  "css/app.css?v=13", "js/store.js?v=13", "js/sync.js?v=13", "js/voice.js?v=13", "js/extra.js?v=13", "js/app.js?v=13"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting()));
});

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
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(V).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
