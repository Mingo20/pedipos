/* PediPOS: service worker. Subir la version en CADA publicacion. */
const V = "pedipos-v9";
const ASSETS = ["./", "index.html", "manifest.json", "icon.svg", "css/app.css", "js/store.js", "js/sync.js", "js/voice.js", "js/extra.js", "js/app.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // API y Puter van directo a la red
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((r) => { if (r && r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(e.request, cp)); } return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
