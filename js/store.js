/* PediPOS: espejo local de la base. La app siempre lee de aqui; la red solo sincroniza. */
(function () {
  "use strict";
  const KEY = "pedipos.db.v1";
  const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const SEED_PRODUCTS = [
    { nombre: "Arroz Campo", precio: 45, unidad: "libra", categoria: "Granos", stock: 200 },
    { nombre: "Habichuelas Rojas", precio: 60, unidad: "libra", categoria: "Granos", stock: 80 },
    { nombre: "Leche Entera", precio: 75, unidad: "unidad", categoria: "Lacteos", stock: 40 },
    { nombre: "Huevos", precio: 8, unidad: "unidad", categoria: "Lacteos", stock: 300 },
    { nombre: "Pollo", precio: 95, unidad: "libra", categoria: "Carnes", stock: 60 },
    { nombre: "Aceite", precio: 180, unidad: "unidad", categoria: "Despensa", stock: 25 },
    { nombre: "Azucar", precio: 40, unidad: "libra", categoria: "Despensa", stock: 120 },
    { nombre: "Platano", precio: 20, unidad: "unidad", categoria: "Viveres", stock: 150 },
  ];

  function fresh() {
    return {
      v: 1,
      org: "ORG-PEDIPOS",
      session: null,
      products: SEED_PRODUCTS.map((p) => ({ pid: uid("P"), itbis: true, activo: true, ...p })),
      sales: [],
      users: [],
      cart: { lines: [], itbis: true },
      settings: { itbisRate: 0.18, negocio: "Mi negocio", moneda: "RD$" },
      lastPull: 0,
    };
  }

  let db;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? JSON.parse(raw) : fresh();
      if (!db || !db.products) db = fresh();
    } catch (_) {
      db = fresh();
    }
    return db;
  }

  /* Guardado resistente a cuota llena: si revienta, recorta ventas antiguas y reintenta. */
  let warned = false;
  function save() {
    for (let i = 0; i < 4; i++) {
      try {
        localStorage.setItem(KEY, JSON.stringify(db));
        return true;
      } catch (e) {
        if (db.sales.length > 50) db.sales = db.sales.slice(-Math.floor(db.sales.length * 0.7));
        else break;
      }
    }
    if (!warned) {
      warned = true;
      window.dispatchEvent(new CustomEvent("pp:quota"));
    }
    return false;
  }

  /* ---------- Dinero y totales ---------- */
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  function totals(cart, rate) {
    const subtotal = round2(cart.lines.reduce((s, l) => s + l.cant * l.precio, 0));
    const itbis = cart.itbis ? round2(subtotal * rate) : 0;
    return { subtotal, itbis, total: round2(subtotal + itbis) };
  }

  window.PPStore = {
    get db() { return db || load(); },
    load, save, uid, round2, totals,
    reset() { db = fresh(); save(); return db; },
  };
  load();
})();
