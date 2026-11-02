/* PediPOS: sincronizacion con la base central. Cola persistente en IndexedDB, reintento y fusion segura. */
(function () {
  "use strict";
  const EP = "https://nuevo-agente-49974e4b.base44.app/functions/pedposSync";
  const KEY = "pp_Xk7-Qm2RvLd9aNwT4hYsBc8ZpE3uJfG";
  const DB_NAME = "pedipos-queue", STORE = "q";
  const S = () => window.PPStore;

  /* ---------- IndexedDB (la cola NO va en localStorage: se llenaria) ---------- */
  let idb;
  function open() {
    if (idb) return idb;
    idb = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "n", autoIncrement: true });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return idb;
  }
  const tx = (mode) => open().then((d) => d.transaction(STORE, mode).objectStore(STORE));
  const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
  const qAll = async () => wrap((await tx("readonly")).getAll());
  const qAdd = async (item) => wrap((await tx("readwrite")).add(item));
  const qDel = async (n) => wrap((await tx("readwrite")).delete(n));

  /* ---------- Llamada a la puerta ---------- */
  async function call(action, payload) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(EP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: KEY, action, org: S().db.org, ...payload }),
        signal: ctl.signal,
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "error");
      return j;
    } finally { clearTimeout(timer); }
  }

  /* ---------- Cola con envio inmediato y reintento ---------- */
  let sending = false;
  const state = { online: navigator.onLine, pending: 0 };
  const emit = () => window.dispatchEvent(new CustomEvent("pp:sync", { detail: { ...state } }));

  async function flush() {
    if (sending) return;
    sending = true;
    try {
      let items = await qAll();
      state.pending = items.length; emit();
      for (const it of items) {
        try { await call(it.action, it.payload); }
        catch (e) { state.online = false; break; } // se queda en cola
        await qDel(it.n);
        state.online = true;
        state.pending = Math.max(0, state.pending - 1); emit();
      }
    } catch (_) { /* IndexedDB no disponible */ }
    finally { sending = false; emit(); }
  }

  async function enqueue(action, payload) {
    try { await qAdd({ action, payload, t: Date.now() }); } catch (_) {}
    state.pending++; emit();
    flush();
  }

  /* ---------- Fusion al bajar ---------- */
  async function pull() {
    let j;
    try { j = await call("pull", {}); }
    catch (_) { state.online = false; emit(); return false; }
    state.online = true;

    const pend = await qAll().catch(() => []);
    const pendProd = new Set(pend.filter((x) => x.action === "saveProduct").map((x) => x.payload.product.pid));
    const pendSale = new Set(pend.filter((x) => x.action === "saveSale").map((x) => x.payload.sale.vid));
    const gone = new Set(j.deleted || []);
    const db = S().db;

    /* productos: lo pendiente local manda; el resto lo decide la nube */
    const local = new Map(db.products.map((p) => [p.pid, p]));
    const merged = [];
    for (const p of j.products || []) merged.push(pendProd.has(p.pid) && local.has(p.pid) ? local.get(p.pid) : p);
    for (const p of db.products) {
      if (pendProd.has(p.pid) && !merged.some((m) => m.pid === p.pid)) merged.push(p);
    }
    /* si la nube esta vacia (primer arranque) se conserva el catalogo local y se sube */
    if (!(j.products || []).length && db.products.length) {
      for (const p of db.products) if (!gone.has(p.pid)) enqueue("saveProduct", { product: p });
    } else {
      db.products = merged.filter((p) => !gone.has(p.pid));
    }

    /* ventas: se unen por id logico */
    const sales = new Map();
    for (const s of j.sales || []) sales.set(s.vid, s);
    for (const s of db.sales) if (pendSale.has(s.vid) || !sales.has(s.vid)) sales.set(s.vid, s);
    db.sales = [...sales.values()].filter((s) => !gone.has(s.vid)).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

    db.users = j.users || db.users;
    db.lastPull = j.t;
    S().save();
    emit();
    window.dispatchEvent(new CustomEvent("pp:data"));
    return true;
  }

  /* ---------- Tiempo real sin websockets ---------- */
  function start() {
    addEventListener("online", () => { state.online = true; emit(); flush().then(pull); });
    addEventListener("offline", () => { state.online = false; emit(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { flush(); pull(); } });
    setInterval(() => { if (!document.hidden) { flush(); pull(); } }, 30000);
    qAll().then((i) => { state.pending = i.length; emit(); }).catch(() => {});
    flush().then(pull);
  }

  window.PPSync = {
    state, start, flush, pull, call,
    saveProduct: (p) => enqueue("saveProduct", { product: p }),
    deleteProduct: (pid) => enqueue("deleteProduct", { pid }),
    saveSale: (s) => enqueue("saveSale", { sale: s }),
    voidSale: (vid) => enqueue("voidSale", { vid }),
  };
})();
