/* PediPOS: espejo local de la base. La app siempre lee de aqui; la red solo sincroniza. */
(function () {
  "use strict";
  /* una clave por comercio: el espacio de cada uno queda aislado del resto */
  const KEY = (window.PPTenant ? window.PPTenant.key("pedipos.db.v1") : "pedipos.db.v1");
  /* migracion: el espacio antiguo pasa al comercio por defecto sin perder nada */
  (function migrar() {
    try {
      if (KEY === "pedipos.db.v1") return;
      if (localStorage.getItem(KEY)) return;
      const viejo = localStorage.getItem("pedipos.db.v1");
      if (viejo) localStorage.setItem(KEY, viejo);
    } catch (e) {}
  })();
  const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const SEED_PRODUCTS = [
    { nombre: "Arroz Campo", precio: 45, unidad: "libra", categoria: "Granos", stock: 200, img: "img/productos/arroz.jpg" },
    { nombre: "Habichuelas Rojas", precio: 60, unidad: "libra", categoria: "Granos", stock: 80, img: "img/productos/habichuelas.jpg" },
    { nombre: "Leche Entera", precio: 75, unidad: "unidad", categoria: "Lacteos", stock: 40, img: "img/productos/leche-evap.jpg" },
    { nombre: "Huevos", precio: 8, unidad: "unidad", categoria: "Lacteos", stock: 300, img: "img/productos/huevos.jpg" },
    { nombre: "Pollo", precio: 95, unidad: "libra", categoria: "Carnes", stock: 60, img: "img/productos/pollo.jpg" },
    { nombre: "Aceite", precio: 180, unidad: "unidad", categoria: "Despensa", stock: 25, img: "img/productos/aceite.jpg" },
    { nombre: "Azucar", precio: 40, unidad: "libra", categoria: "Despensa", stock: 120, img: "img/productos/azucar.jpg" },
    { nombre: "Platano", precio: 20, unidad: "unidad", categoria: "Viveres", stock: 150, img: "img/productos/platano.jpg" },
  ];

  function fresh() {
    return {
      v: 1,
      org: "ORG-PEDIPOS",
      session: null,
      products: SEED_PRODUCTS.map((p) => ({ pid: uid("P"), itbis: true, activo: true, ...p })),
      sales: [],
      clients: [],
      providers: [],
      users: [
        { uid: "U-ADMIN", nombre: "Domingo", rol: "administrador", pin: "1234", activo: true },
        { uid: "U-CAJA", nombre: "Caja", rol: "cajero", pin: "0000", activo: true },
      ],
      cart: { lines: [], itbis: true },
      settings: { itbisRate: 0.18, negocio: "Mi negocio", direccion: "", telefono: "", moneda: "RD$", pinReq: false },
      lastPull: 0,
    };
  }

  let db;
  let legado = [];          /* ventas que venian del almacen viejo, pendientes de pasar a IndexedDB */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? JSON.parse(raw) : fresh();
      if (!db || !db.products) db = fresh();
      if (Array.isArray(db.sales) && db.sales.length) legado = db.sales.slice();
      db.sales = [];        /* el espejo en memoria lo llena hydrate() desde IndexedDB */
    } catch (_) {
      db = fresh();
    }
    return db;
  }

  /* El almacen viejo solo guarda productos, clientes, ajustes y carrito.
     Las ventas van a IndexedDB: asi nunca se borra historial para hacer espacio. */
  let warned = false;
  function save() {
    const payload = JSON.stringify({ ...db, sales: [] });
    let ok = false;
    for (let i = 0; i < 2; i++) {
      try {
        localStorage.setItem(KEY, payload);
        ok = true;
        break;
      } catch (e) {
        if (window.PPComprobantes && window.PPComprobantes.borrarTodo && i === 0) {
          /* ultimo recurso: liberar comprobantes duplicados en el almacen viejo */
          try { localStorage.removeItem("pedipos.ecf.v1"); } catch (_) {}
        }
      }
    }
    if (!ok && !warned) {
      warned = true;
      window.dispatchEvent(new CustomEvent("pp:quota"));
    }
    if (window.PPVentas) window.PPVentas.marcar(db.sales);
    return ok;
  }

  /* ---------- arranque: pasa las ventas viejas a IndexedDB y las carga ---------- */
  let hidratado = null;
  function hydrate() {
    if (hidratado) return hidratado;
    if (!window.PPVentas) { db.sales = legado; legado = []; hidratado = Promise.resolve(db.sales); return hidratado; }
    hidratado = window.PPVentas.init().then((enIDB) => {
      const yaHay = Array.isArray(enIDB) && enIDB.length > 0;
      if (legado.length && !yaHay) {
        return window.PPVentas.reemplazar(legado).then(() => {
          legado = [];
          save();                       /* reescribe el almacen viejo sin ventas */
          return window.PPVentas.todas();
        });
      }
      if (legado.length && yaHay) {
        /* habia ventas en los dos lados: se unen sin duplicar */
        const vistos = new Set(enIDB.map((v) => v.vid));
        const extra = legado.filter((v) => v && v.vid && !vistos.has(v.vid));
        legado = [];
        if (extra.length) {
          return window.PPVentas.reemplazar(enIDB.concat(extra)).then(() => window.PPVentas.todas());
        }
      }
      return enIDB;
    }).then((lista) => {
      db.sales = Array.isArray(lista) ? lista : [];
      return db.sales;
    }).catch(() => {
      db.sales = legado.length ? legado : db.sales;
      legado = [];
      return db.sales;
    });
    return hidratado;
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
    load, save, hydrate, uid, round2, totals,
    reset() { db = fresh(); save(); return db; },
  };
  load();
})();
