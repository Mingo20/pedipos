/* PediPOS: interfaz. Lee siempre del espejo local; la red solo sincroniza. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const S = window.PPStore, db = () => S.db;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "RD$" + Math.round(Number(n) || 0).toLocaleString("es-DO");
  const money2 = (n) => "RD$" + (Number(n) || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (n) => (Math.round(n * 100) / 100).toString();

  /* Las ventas pueden venir con las lineas como lista o como texto JSON (al bajar de la nube). */
  function lineasDe(s) {
    let L = s && s.lineas;
    if (typeof L === "string") { try { L = JSON.parse(L); } catch (_) { L = []; } }
    return Array.isArray(L) ? L : [];
  }

  const I = {
    menu: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h11M4 17h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    list: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    box: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    down: '<svg class="chev" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6"/></svg>',
    bike: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l4-8h5l3 8M10 9l-1-3h3"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5C5 4 8.500 4 12 6c3.500-2 7-2 10-.5V19c-3-1.500-6.500-1.500-10.500.500C8.500 17.500 5 17.500 2 19V5.500zM12 6v13.500"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 21V10M12 21V3M19 21v-7"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-11.800 7L4 20l1.100-4A8 8 0 1 1 20 12z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    help: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 1-1 1.700M12 17h.01"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2.100h5c0-.9.400-1.600 1-2.100A6 6 0 0 0 12 3z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.500"/><circle cx="18" cy="20" r="1.500"/><path d="M2 3h3l2.500 12h11l2-8H6"/></svg>',
    users: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 4.500a3.500 3.500 0 0 1 0 7M18 14.500a6.500 6.500 0 0 1 3.500 5.500"/></svg>',
    cam: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h3l2-2h8l2 2h3v11H3z"/><circle cx="12" cy="13" r="3.2"/></svg>',
    card: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="M3 10h18"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7"/><circle cx="6.500" cy="18" r="1.800"/><circle cx="16.500" cy="18" r="1.800"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/></svg>',
    print: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    truck2: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h12v9H2zM14 10h4l3 3v3h-7"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>',
    group: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.2A5 5 0 0 1 21.5 20"/></svg>',
    bagnav: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    userplus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="8" r="3.5"/><path d="M3 20a7 7 0 0 1 14 0M19 8v6M16 11h6"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>',
    order: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.5" cy="13.5" r="1.2"/></svg>',
    tag: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.500" cy="8.500" r="1.200"/></svg>',
  };

  /* ---------- Estado de interfaz ---------- */
  let tab = "panel";
  let voice = { phase: "idle", text: "" };
  const cart = () => db().cart;

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
  }
  const rate = () => db().settings.itbisRate;
  const tot = () => S.totals(cart(), rate());

  /* ---------- Confirmacion tactil: sonido corto + vibracion ---------- */
  let AC = null;
  function beep() {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
      o.type = "sine"; o.frequency.setValueAtTime(880, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.14);
    } catch (_) {}
  }
  function vibrar(ms) { try { navigator.vibrate && navigator.vibrate(ms || 14); } catch (_) {} }
  function tap() { beep(); vibrar(14); }

  /* ---------- Tarjeta de producto (catalogo y agregar producto) ---------- */
  function fotoDe(p) {
    if (p && p.img) return `<img src="${esc(p.img)}" alt="">`;
    return I.box;   /* sin foto: icono de caja */
  }
  function pcard(p, extra) {
    return `<button class="pcard" data-p="${esc(p.pid)}" ${extra || ""}>
      <span class="ph">${fotoDe(p)}</span>
      <b class="nm">${esc(p.nombre)}</b>
      <span class="pr">${money(p.precio)}</span>
      <span class="un">${esc(p.unidad || "unidad")}</span>
    </button>`;
  }

  /* ---------- Dock ---------- */
  const TABS = [["clientes", "Clientes", "group"], ["proveedores", "Proveedor", "truck2"], ["panel", "Talonario", "ticket"], ["historial", "Pedidos", "bagnav"], ["analitica", "Analitica", "chart"]];
  function drawDock() {
    const d = $("#dock");
    /* el panel de venta tiene su propia barra inferior: ahi el dock no aparece */
    if (tab === "panel") { d.classList.add("hide"); d.innerHTML = ""; document.body.classList.remove("has-dock"); return; }
    d.classList.remove("hide");
    document.body.classList.add("has-dock");
    d.innerHTML = TABS.map(([k, lb, ic]) => k === "panel"
      ? `<button data-t="${k}" class="mid ${tab === k ? "on" : ""}" aria-label="${lb}"><span class="orb">${I[ic]}</span></button>`
      : `<button data-t="${k}" class="${tab === k ? "on" : ""}" aria-label="${lb}">${I[ic]}<small>${lb}</small></button>`).join("");
    $$("#dock button").forEach((b) => (b.onclick = () => go(b.dataset.t)));
  }
  const TITULOS = { panel: "PANEL", catalogo: "CATALOGO", soporte: "SOPORTE", analitica: "ANALITICA", historial: "PEDIDOS", config: "CONFIGURACION", clientes: "CLIENTES", proveedores: "PROVEEDORES" };
  function go(t) {
    const cambio = t !== tab;
    tab = t;
    $("#title").textContent = TITULOS[t] || t.toUpperCase();
    drawDock(); render(); $("#view").scrollTop = 0;
    if (cambio) {
      const v = $("#view"); v.classList.remove("vin"); void v.offsetWidth; v.classList.add("vin");
    }
  }

  /* ---------- Panel ---------- */
  let manual = false;
  function manualRow() {
    return `<div class="row man" id="mrow"><input class="nm" id="mnm" placeholder="Producto" autocomplete="off" enterkeyhint="next"><input id="mq" inputmode="decimal" placeholder="Cant." value="1" enterkeyhint="next"><input id="mp" inputmode="decimal" placeholder="Precio" enterkeyhint="done"><span class="t" id="mt">RD$0</span></div>`;
  }
  /* Guarda el producto escrito a mano: entra al talonario y, si no existe, al catalogo como disponible. */
  function commitManual() {
    const nom = ($("#mnm").value || "").trim();
    const q = parseFloat(String($("#mq").value).replace(",", ".")) || 0;
    const p = parseFloat(String($("#mp").value).replace(",", ".")) || 0;
    if (!nom && !($("#mp").value || "").trim()) { manual = false; render(); return; }
    if (!nom) { toast("Escribe el nombre del producto"); $("#mnm").focus(); return; }
    if (!(q > 0)) { toast("Pon la cantidad"); $("#mq").focus(); return; }
    if (!(p >= 0) || !(($("#mp").value || "").trim())) { toast("Pon el precio"); $("#mp").focus(); return; }
    const key = window.PPVoice.norm(nom);
    let prod = db().products.find((x) => window.PPVoice.norm(x.nombre) === key);
    if (!prod) {
      /* sin stock declarado: no se descuenta inventario en la venta */
      prod = { pid: S.uid("P"), nombre: nom, precio: p, unidad: "unidad", categoria: "General", itbis: true, activo: true, manual: true };
      db().products.push(prod); window.PPSync.saveProduct(prod);
    } else if (prod.activo === false) { prod.activo = true; window.PPSync.saveProduct(prod); }
    /* el precio escrito manda en esta venta, sin alterar el precio guardado del catalogo */
    const ex = cart().lines.find((l) => l.pid === prod.pid && l.precio === p);
    if (ex) ex.cant = S.round2(ex.cant + q);
    else cart().lines.push({ pid: prod.pid, nombre: prod.nombre, precio: p, unidad: prod.unidad, cant: q });
    manual = false; S.save(); render();
    toast(prod.manual && !ex ? nom + " agregado al catalogo" : nom + " agregado");
  }
  function bindManual() {
    const f = ["#mnm", "#mq", "#mp"].map((s) => $(s));
    const upd = () => { const q = parseFloat(String(f[1].value).replace(",", ".")) || 0, p = parseFloat(String(f[2].value).replace(",", ".")) || 0; $("#mt").textContent = money(q * p); };
    f.forEach((el, i) => {
      el.oninput = upd;
      el.onkeydown = (e) => { if (e.key !== "Enter") return; e.preventDefault(); if (i < 2) f[i + 1].focus(); else commitManual(); };
    });
    /* al salir de toda la fila se guarda solo (si hay datos) */
    $("#mrow").addEventListener("focusout", () => setTimeout(() => {
      if (!manual || !$("#mrow") || $("#mrow").contains(document.activeElement)) return;
      if (($("#mnm").value || "").trim() && ($("#mp").value || "").trim()) commitManual();
    }, 180));
    upd();
  }
  function lineRow(l, i) {
    return `<div class="row" data-i="${i}"><b>${esc(l.nombre)}</b><input class="q" data-i="${i}" inputmode="decimal" value="${num(l.cant)}" aria-label="Cantidad"><input class="p" data-i="${i}" inputmode="decimal" value="${num(l.precio)}" aria-label="Precio"><span class="t">${money(l.cant * l.precio)}</span></div>`;
  }

  /* Deslizar una fila del talonario a cualquier lado para eliminarla. */
  function bindSwipeRows() {
    $$("#tickb .row[data-i]").forEach((row) => {
      let x0 = 0, y0 = 0, dx = 0, activo = false, vertical = false;
      row.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; activo = true; vertical = false;
        row.classList.add("drag");
      }, { passive: true });
      row.addEventListener("touchmove", (e) => {
        if (!activo) return;
        const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
        if (!vertical && Math.abs(my) > Math.abs(mx) && Math.abs(my) > 12) { vertical = true; activo = false; row.classList.remove("drag"); row.style.transform = ""; row.style.opacity = ""; return; }
        if (vertical) return;
        dx = mx;
        row.style.transform = `translateX(${dx}px)`;
        row.style.opacity = String(Math.max(0.3, 1 - Math.abs(dx) / 220));
      }, { passive: true });
      const soltar = () => {
        if (!activo) return;
        activo = false; row.classList.remove("drag");
        if (Math.abs(dx) > 64) {
          const i = +row.dataset.i;
          row.classList.add("gone");
          vibrar(18);
          setTimeout(() => {
            cart().lines.splice(i, 1); S.save(); render();
            toast("Producto quitado del talonario");
          }, 170);
        } else { row.style.transform = ""; row.style.opacity = ""; }
        dx = 0;
      };
      row.addEventListener("touchend", soltar);
      row.addEventListener("touchcancel", soltar);
    });
  }
  function renderPanel() {
    const c = cart(), t = tot(), n = c.lines.length;
    $("#view").innerHTML = `
      <div class="pair">
        <button class="pill" id="bSearch">${I.search} Buscar</button>
        <button class="pill" id="bList">${I.list} Lista</button>
      </div>
      <section class="tick">
        <div class="tick-h"><span>PRODUCTO</span><span>CANTIDAD</span><span>PRECIO</span><span>TOTAL</span></div>
        <div class="tick-b" id="tickb">${n ? c.lines.map(lineRow).join("") : (manual ? "" : '<div class="tick-empty">Toca + para agregar productos</div>')}${manual ? manualRow() : ""}</div>
        <div class="tick-f">
          <div class="itbis-r"><span>ITBIS ${Math.round(rate() * 100)}%</span><button class="sw ${c.itbis ? "on" : ""}" id="swItbis" aria-label="ITBIS"></button></div>
          <div class="line"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
          <div class="line it"><span>ITBIS (${Math.round(rate() * 100)}%)</span><span>+${money(t.itbis)}</span></div>
          <div class="tot"><span>TOTAL A COBRAR</span><b>${money(t.total)}</b></div>
        </div>
        <button class="plus" id="bPlus" aria-label="Agregar">${I.plus}</button>
      </section>
      <div class="act">
        <button class="n" id="bNew">Nueva</button>
        <button class="c ${n ? "go" : ""}" id="bPay" ${n ? "" : "disabled"}>Cobrar</button>
        <div class="mic ${voice.phase === "listening" || voice.phase === "recording" ? "on" : voice.phase === "wait" ? "wait" : ""}" id="bMic"><i>${I.mic}</i></div>
      </div>`;
    $("#bSearch").onclick = openSearch; $("#bList").onclick = () => openOrder("");
    $("#bPlus").onclick = () => { manual = true; render(); const f = $("#mnm"); f && f.focus(); };
    if (manual) bindManual();
    $("#swItbis").onclick = () => { cart().itbis = !cart().itbis; S.save(); render(); };
    $("#bNew").onclick = () => { if (cart().lines.length && !confirm("Descartar la venta actual?")) return; cart().lines = []; manual = false; S.save(); render(); };
    $("#bPay").onclick = openPay;
    $("#bMic").onclick = () => { if (voice.phase === "recording") { voice.phase = "wait"; render(); showProc(); finishWhisper(); } else toggleVoice(); };
    $$(".row .q").forEach((inp) => (inp.onchange = () => {
      const v = parseFloat(String(inp.value).replace(",", "."));
      const i = +inp.dataset.i;
      if (!(v > 0)) cart().lines.splice(i, 1); else cart().lines[i].cant = v;
      S.save(); render();
    }));
    /* el precio tambien se puede corregir en la misma fila */
    $$(".row .p").forEach((inp) => (inp.onchange = () => {
      const v = parseFloat(String(inp.value).replace(",", "."));
      const i = +inp.dataset.i;
      if (!(v >= 0)) { render(); return toast("Precio no valido"); }
      cart().lines[i].precio = v; S.save(); render();
    }));
    bindSwipeRows();
    renderListen();
  }

  function addLine(p, cant) {
    const c = cart();
    const ex = c.lines.find((l) => l.pid === p.pid);
    if (ex) ex.cant = S.round2(ex.cant + cant);
    else c.lines.push({ pid: p.pid, nombre: p.nombre, precio: p.precio, unidad: p.unidad, cant });
    S.save();
  }

  /* ---------- Hojas ---------- */
  /* Icono segun el titulo de cada ventana (tambien aplica a las hojas de extra.js). */
  const ICONO_HOJA = [
    [/^agregar producto|^buscar/i, "search"], [/lista de pedido/i, "list"], [/confirmar pedido/i, "check"],
    [/^cobrar/i, "wallet"], [/venta registrada/i, "ok"], [/detalle del pedido/i, "order"],
    [/nuevo cliente|editar cliente/i, "userplus"], [/abono/i, "wallet"], [/proveedor/i, "truck2"],
    [/crear producto|editar producto/i, "box"], [/entrar a la caja/i, "users"],
  ];
  function iconoDe(t) { for (const [re, k] of ICONO_HOJA) if (re.test(t)) return k; return null; }
  function decorar(s) {
    $$(".sh-h h2", s).forEach((h) => {
      if (h.querySelector(".hi")) return;
      const k = iconoDe(h.textContent.trim()) || (/^[A-Za-z]/.test(h.textContent) ? "home" : null);
      if (k && I[k]) h.insertAdjacentHTML("afterbegin", `<span class="hi">${I[k]}</span>`);
    });
    /* el boton cerrar de cualquier hoja usa el cierre animado */
    $$(".sh-x", s).forEach((b) => {
      if (/✕/.test(b.textContent) || b.id === "x") b.addEventListener("click", (e) => { e.stopImmediatePropagation(); closeSheet(); }, true);
    });
  }
  function sheet(html, onClose) {
    closeSheet(true);
    const m = document.createElement("div"); m.className = "mask"; m.id = "mask";
    const s = document.createElement("section"); s.className = "sheet"; s.id = "sheet";
    s.innerHTML = '<div class="grip"></div>' + html;
    $("#layer").append(m, s);
    decorar(s);
    const t0 = Date.now();
    /* el mismo toque que abre la hoja no debe cerrarla */
    m.onclick = () => { if (Date.now() - t0 < 320) return; closeSheet(); onClose && onClose(); };
    return s;
  }
  /* Cierre con desvanecimiento. closeSheet(true) cierra de golpe (cuando se reemplaza por otra hoja). */
  function closeSheet(ya) {
    const layer = $("#layer");
    if (ya === true || !layer.firstChild) { layer.innerHTML = ""; return; }
    const sh = $("#sheet"), mk = $("#mask");
    if (!sh || sh.classList.contains("out")) return;
    sh.classList.add("out"); mk && mk.classList.add("out");
    setTimeout(() => { if (sh.classList.contains("out")) layer.innerHTML = ""; }, 230);
  }

  /* ----- Buscar producto: tarjetas en dos columnas ----- */
  function openSearch() {
    const s = sheet(`<div class="sh-h"><h2>Agregar producto</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="search">${I.search}<input id="q" placeholder="Buscar producto" autocomplete="off"></div>
      <div class="pgrid" id="res"></div>`);
    $("#x", s).onclick = closeSheet;
    const q = $("#q", s), res = $("#res", s);
    const ponerContadores = () => {
      const c = cart();
      $$(".pcard", res).forEach((el) => {
        const enCarrito = c.lines.filter((l) => l.pid === el.dataset.p).reduce((x, l) => x + l.cant, 0);
        let b = el.querySelector(".cntb");
        if (enCarrito > 0) {
          if (!b) { b = document.createElement("i"); b.className = "cntb"; el.append(b); }
          b.textContent = num(enCarrito); el.classList.add("in");
        } else { b && b.remove(); el.classList.remove("in"); }
      });
    };
    const draw = () => {
      const t = window.PPVoice.norm(q.value);
      const list = db().products.filter((p) => p.activo !== false && (!t || window.PPVoice.norm(p.nombre).includes(t))).slice(0, 60);
      res.innerHTML = list.length ? list.map((p) => pcard(p)).join("") : '<div class="empty">No encontramos ese producto. Puedes crearlo en Catalogo.</div>';
      $$(".pcard", res).forEach((el) => (el.onclick = () => {
        const p = db().products.find((x) => x.pid === el.dataset.p);
        if (!p) return;
        addLine(p, 1);
        tap();                                     /* vibra y suena en cada toque */
        el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit");
        ponerContadores();
        render();
        const live = $("#res"); if (live) ponerContadores();
      }));
      ponerContadores();
    };
    q.oninput = draw; draw(); setTimeout(() => q.focus(), 120);
  }

  /* ----- Lista de pedido con IA ----- */
  let orderRec = false;
  function openOrder(initial) {
    const s = sheet(`<div class="sh-h"><h2>Lista de pedido</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="ia">${I.spark}<span>DeepSeek para procesar</span></div>
      <textarea class="ta" id="ta" placeholder="Escribe o dicta: dos leches, media libra de arroz...">${esc(initial || "")}</textarea>
      <div class="sh-f"><button class="m" id="m" aria-label="Dictar">${I.mic}</button><button class="big" id="go">${I.spark} Procesar pedido</button></div>`, () => { window.PPVoice.stopDictation(); orderRec = false; });
    $("#x", s).onclick = () => { window.PPVoice.stopDictation(); closeSheet(); };
    const ta = $("#ta", s), go = $("#go", s), m = $("#m", s);
    m.onclick = () => {
      if (orderRec) { window.PPVoice.stopDictation(); return; }
      orderRec = window.PPVoice.startDictation((t) => (ta.value = t), () => { orderRec = false; m.classList.remove("on"); },
        () => { orderRec = false; m.classList.remove("on"); toast("El dictado no esta disponible. Escribe el pedido."); });
      if (orderRec) m.classList.add("on");
    };
    go.onclick = async () => {
      const text = ta.value.trim();
      if (!text) return toast("Escribe o dicta un pedido");
      window.PPVoice.stopDictation();
      go.disabled = true; go.innerHTML = '<span class="bar" id="bar" style="width:4%"></span><span class="spin" style="border-color:#fff;border-top-color:transparent"></span><span id="pc">Procesando... 4%</span>';
      const r = await window.PPVoice.interpret(text, db().products, (p) => { const b = $("#bar"), c = $("#pc"); if (b) b.style.width = p + "%"; if (c) c.textContent = "Procesando... " + p + "%"; });
      confirmOrder(r);
    };
  }

  function confirmOrder(r) {
    const lines = r.lines.map((l) => ({ ...l }));
    const s = sheet(`<div class="sh-h compacta"><button class="sh-x" id="b">${I.back}</button><h2>Confirmar pedido</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="cnt">${lines.length} producto${lines.length === 1 ? "" : "s"} detectado${lines.length === 1 ? "" : "s"}</div>
      ${lines.map((l, i) => `<div class="item"><div class="nm"><b>${esc(l.nombre)}</b><span>${money(l.precio)} c/u &middot; ${esc(l.unidad)}</span></div><input class="qty" data-i="${i}" inputmode="decimal" value="${num(l.cant)}"></div>`).join("")}
      ${r.missing && r.missing.length ? `<div class="miss">No encontre: ${r.missing.map(esc).join(", ")}. Agregalo desde Catalogo.</div>` : ""}
      <button class="big" id="ok" ${lines.length ? "" : "disabled"} style="width:100%;margin-top:6px">Agregar al talonario</button>`);
    $("#x", s).onclick = closeSheet; $("#b", s).onclick = () => openOrder("");
    $$(".qty", s).forEach((i) => (i.onchange = () => { const v = parseFloat(String(i.value).replace(",", ".")); if (v > 0) lines[+i.dataset.i].cant = v; }));
    $("#ok", s).onclick = () => {
      for (const l of lines) { const p = db().products.find((x) => x.pid === l.pid); if (p) addLine(p, l.cant); }
      closeSheet(); toast(lines.length + " producto" + (lines.length === 1 ? "" : "s") + " agregado" + (lines.length === 1 ? "" : "s")); render();
    };
  }

  /* ----- Voz directa desde el boton negro ----- */
  function toggleVoice() {
    if (voice.phase === "listening") { window.PPVoice.stopDictation(); return; }
    if (!window.PPVoice.supportsDictation()) return whisperMode();
    voice = { phase: "listening", text: "" }; renderListen(); render();
    window.PPVoice.startDictation((t) => { voice.text = t; renderListen(); },
      async (finalText) => {
        const text = (finalText || voice.text || "").trim();
        voice = { phase: "idle", text: "" };
        if (!text) { render(); return; }
        voice.phase = "wait"; render(); showProc();
        const r = await window.PPVoice.interpret(text, db().products);
        voice = { phase: "idle", text: "" }; $("#proc") && $("#proc").remove(); render(); confirmOrder(r);
      },
      (e) => { voice = { phase: "idle", text: "" }; render(); toast(e === "not-allowed" ? "Permite el microfono para dictar" : "No se pudo escuchar. Prueba escribiendo."); openOrder(""); });
  }
  /* Graba con el movil y transcribe con Whisper de Puter (se usa cuando el navegador no dicta). */
  async function whisperMode() {
    if (!window.PPVoice.canRecord()) return openOrder("");
    if (voice.phase === "recording") { voice.phase = "wait"; render(); showProc(); return finishWhisper(); }
    try {
      await window.PPVoice.startRecording();
      voice = { phase: "recording", text: "" }; renderListen(); render();
    } catch (e) {
      voice = { phase: "idle", text: "" }; render(); openOrder("");
      toast("Sin acceso al microfono. Escribe el pedido.");
    }
  }
  async function finishWhisper() {
    voice.phase = "wait"; render(); showProc();
    let text = "";
    try { text = await window.PPVoice.recordAndTranscribe(); } catch (_) { text = ""; }
    $("#proc") && $("#proc").remove();
    voice = { phase: "idle", text: "" }; render();
    if (!text) return toast("No se pudo transcribir. Escribe el pedido.");
    showProc();
    const r = await window.PPVoice.interpret(text, db().products);
    $("#proc") && $("#proc").remove();
    confirmOrder(r);
  }

  function renderListen() {
    let el = $("#listen");
    if (voice.phase !== "listening" && voice.phase !== "recording") { el && el.remove(); return; }
    const rec = voice.phase === "recording";
    const lab = rec ? "GRABANDO" : "ESCUCHANDO";
    const txt = voice.text || (rec ? "Habla y toca detener al terminar" : "Dicta: \"dos leches, media libra de arroz\"");
    if (!el) {
      el = document.createElement("div"); el.id = "listen"; el.className = "listen";
      el.innerHTML = '<div class="wave"><i></i><i></i><i></i><i></i><i></i></div><div class="tx"><b></b><span></span></div><button class="stop" id="stp" aria-label="Detener"><i></i></button>';
      document.body.append(el);
      $("#stp").onclick = () => { if (voice.phase === "recording") { voice.phase = "wait"; finishWhisper(); } else window.PPVoice.stopDictation(); };
    }
    /* se actualiza solo el texto: la tarjeta no parpadea mientras se dicta */
    el.querySelector(".tx b").textContent = lab;
    const sp = el.querySelector(".tx span"); sp.textContent = txt; sp.style.color = voice.text ? "#14171c" : "";
  }
  function showProc() {
    const d = document.createElement("div"); d.id = "proc"; d.className = "proc"; d.innerHTML = '<span class="spin"></span> Procesando...'; document.body.append(d);
  }

  /* ----- Cobro ----- */
  function clientOpts(sel) {
    return (db().clients || []).filter((c) => c.activo !== false).map((c) => `<option value="${esc(c.cid)}" ${c.cid === sel ? "selected" : ""}>${esc(c.nombre)}${window.PPExtra && window.PPExtra.deudaDe(c.cid) > 0 ? " · debe " + money(window.PPExtra.deudaDe(c.cid)) : ""}</option>`).join("");
  }
  function openPay() {
    const t = tot();
    const s = sheet(`<div class="sh-h"><h2>Cobrar</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="receipt"><div class="r"><span>Subtotal</span><span>${money2(t.subtotal)}</span></div><div class="r"><span>ITBIS</span><span>${money2(t.itbis)}</span></div><div class="r t"><span>TOTAL</span><span>${money2(t.total)}</span></div></div>
      <label class="field"><span>Metodo de pago</span><select id="met"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option><option value="credito">A credito (fiado)</option></select></label>
      <label class="field" id="recw"><span>Efectivo recibido</span><input id="rec" inputmode="decimal" placeholder="${num(t.total)}"></label>
      <div class="field"><span id="clilbl">Cliente (opcional)</span>
        <div class="cliwrap"><select id="cli2"><option value="">Sin cliente</option>${clientOpts("")}</select>
        <button type="button" class="cliplus" id="cliplus" aria-label="Nuevo cliente">${I.userplus}</button></div>
        <div id="newcli" hidden style="margin-top:10px;display:none">
          <input id="ncn" placeholder="Nombre del cliente" autocomplete="off" style="width:100%;height:46px;border:1.5px solid var(--g-line);border-radius:14px;padding:0 14px;font-size:15px;margin-bottom:8px;outline:none">
          <input id="nct" inputmode="tel" placeholder="Telefono (opcional)" style="width:100%;height:46px;border:1.5px solid var(--g-line);border-radius:14px;padding:0 14px;font-size:15px;margin-bottom:8px;outline:none">
          <div style="display:flex;gap:10px"><button type="button" class="btn sec" id="ncx" style="flex:1">Cancelar</button><button type="button" class="btn" id="ncs" style="flex:1">Guardar y vincular</button></div>
        </div></div>
      <div id="chg" class="cnt"></div>
      <button class="big" id="done" style="width:100%">${I.check} Confirmar cobro</button>`);
    $("#x", s).onclick = () => closeSheet();
    const met = $("#met", s), rec = $("#rec", s), chg = $("#chg", s), cli = $("#cli2", s), done = $("#done", s);
    /* A credito exige cliente: sin cliente el boton queda inhabilitado. */
    const upd = () => {
      const cred = met.value === "credito";
      $("#recw", s).style.display = met.value === "efectivo" ? "block" : "none";
      const r = parseFloat(String(rec.value).replace(",", "."));
      chg.textContent = met.value === "efectivo" && r >= t.total ? "Devuelta: " + money2(r - t.total) : "";
      $("#clilbl", s).textContent = cred ? "Cliente (obligatorio para fiar)" : "Cliente (opcional)";
      const falta = cred && !cli.value;
      done.disabled = falta;
      let h = $("#credhint", s);
      if (falta) {
        if (!h) { h = document.createElement("div"); h.id = "credhint"; h.className = "hint"; h.textContent = "Para vender a credito, elige o crea un cliente con el (+)."; done.before(h); }
      } else if (h) h.remove();
    };
    met.onchange = upd; rec.oninput = upd; cli.onchange = upd;
    /* (+) crea un cliente nuevo y lo vincula a esta venta sin salir del cobro */
    const nb = $("#newcli", s);
    const showNew = (v) => { nb.style.display = v ? "block" : "none"; if (v) setTimeout(() => $("#ncn", s).focus(), 60); };
    $("#cliplus", s).onclick = () => showNew(nb.style.display === "none");
    $("#ncx", s).onclick = () => showNew(false);
    $("#ncs", s).onclick = () => {
      const nom = $("#ncn", s).value.trim();
      if (!nom) { toast("Escribe el nombre del cliente"); $("#ncn", s).focus(); return; }
      const dup = (db().clients || []).find((c) => window.PPVoice.norm(c.nombre) === window.PPVoice.norm(nom));
      let c = dup;
      if (!c) {
        c = { cid: S.uid("C"), nombre: nom, telefono: $("#nct", s).value.trim(), direccion: "", nota: "", limite_credito: 0, activo: true };
        (db().clients = db().clients || []).push(c); S.save(); window.PPSync.saveCliente(c);
      }
      cli.innerHTML = '<option value="">Sin cliente</option>' + clientOpts(c.cid);
      cli.value = c.cid; showNew(false); $("#ncn", s).value = ""; $("#nct", s).value = "";
      toast(dup ? "Cliente existente vinculado" : "Cliente creado y vinculado"); upd();
    };
    upd();
    $("#done", s).onclick = () => {
      if (met.value === "credito" && !$("#cli2", s).value) return toast("Elige el cliente para fiar");
      const sale = {
        vid: S.uid("V"), fecha: new Date().toISOString(),
        lineas: cart().lines.map((l) => ({ ...l })),
        subtotal: t.subtotal, itbis: t.itbis, total: t.total, aplica_itbis: cart().itbis,
        metodo: met.value, cajero: (db().session && db().session.nombre) || "Caja",
        recibido: (() => { const r = parseFloat(String(rec.value || "").replace(",", ".")); return isFinite(r) ? r : 0; })(),
        cambio: (() => { const r = parseFloat(String(rec.value || "").replace(",", ".")); return isFinite(r) && r >= t.total ? S.round2(r - t.total) : 0; })(),
        cliente_id: $("#cli2", s).value || "", cliente: (() => { const c = (db().clients || []).find((x) => x.cid === $("#cli2", s).value); return c ? c.nombre : ""; })(),
      };
      db().sales.push(sale);
      for (const l of lineasDe(sale)) { const p = db().products.find((x) => x.pid === l.pid); if (p && typeof p.stock === "number") { p.stock = S.round2(p.stock - l.cant); window.PPSync.saveProduct(p); } }
      cart().lines = []; S.save(); window.PPSync.saveSale(sale);
      receipt(sale);
    };
  }
  function receipt(sale) {
    const s = sheet(`<div class="ok-big"><div class="tk">${I.ok}</div><h2>Venta registrada</h2><div class="cnt">${new Date(sale.fecha).toLocaleString("es-DO")}</div></div>
      <div class="receipt">${lineasDe(sale).map((l) => `<div class="r"><span>${num(l.cant)} x ${esc(l.nombre)}</span><span>${money(l.cant * l.precio)}</span></div>`).join("")}
      <div class="r"><span>Subtotal</span><span>${money2(sale.subtotal)}</span></div><div class="r"><span>ITBIS</span><span>${money2(sale.itbis)}</span></div><div class="r t"><span>TOTAL</span><span>${money2(sale.total)}</span></div></div>
      <div class="sh-f"><button class="m" id="pr" aria-label="Imprimir">${I.print}</button><button class="big" id="wa">${I.wa} Enviar por WhatsApp</button></div>
      <button class="btn sec" id="nw" style="margin-top:14px">Nueva venta</button>`);
    $("#pr", s).onclick = async () => {
      try {
        const via = await window.PPExtra.imprimir(sale);
        toast(via === "bt" ? "Enviado a la impresora" : "Abriendo impresion");
      } catch (e) { toast(String(e.message || e)); }
    };
    $("#wa", s).onclick = () => {
      const txt = ["*" + db().settings.negocio + "*", ...lineasDe(sale).map((l) => num(l.cant) + " x " + l.nombre + " = " + money(l.cant * l.precio)), "Subtotal: " + money2(sale.subtotal), "ITBIS: " + money2(sale.itbis), "*TOTAL: " + money2(sale.total) + "*"].join("\n");
      window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
    };
    $("#nw", s).onclick = () => { closeSheet(); render(); };
  }

  /* ---------- Catalogo ---------- */
  let catQ = "", catCat = "";
  function renderCatalogo() {
    const cats = [...new Set(db().products.map((p) => p.categoria).filter(Boolean))];
    $("#view").innerHTML = `<div class="search">${I.search}<input id="cq" placeholder="Buscar en el catalogo" value="${esc(catQ)}"></div>
      <div class="chips"><button class="chip ${catCat ? "" : "on"}" data-c="">Todos</button>${cats.map((c) => `<button class="chip ${catCat === c ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <div class="pgrid" id="cl"></div>
      <button class="fab" id="newp" aria-label="Crear producto">${I.plus}</button>`;
    const draw = () => {
      const t = window.PPVoice.norm(catQ);
      const l = db().products.filter((p) => p.activo !== false && (!catCat || p.categoria === catCat) && (!t || window.PPVoice.norm(p.nombre).includes(t)));
      $("#cl").innerHTML = l.length ? l.map((p) => pcard(p, `title="${esc(p.categoria || "General")}"`)).join("") : '<div class="empty">Sin productos. Crea el primero con el boton +.</div>';
      $$("#cl .pcard").forEach((el) => (el.onclick = () => { tap(); editProduct(db().products.find((p) => p.pid === el.dataset.p)); }));
    };
    $("#cq").oninput = (e) => { catQ = e.target.value; draw(); };
    $$(".chip").forEach((c) => (c.onclick = () => { catCat = c.dataset.c; renderCatalogo(); }));
    $("#newp").onclick = () => editProduct(null);
    draw();
  }
  function editProduct(p) {
    const n = !p; p = p || { pid: S.uid("P"), nombre: "", precio: 0, unidad: "unidad", categoria: "", stock: 0, itbis: true, activo: true };
    const s = sheet(`<div class="sh-h"><h2>${n ? "Crear producto" : "Editar producto"}</h2><button class="sh-x" id="x">${I.x}</button></div>
      <label class="field"><span>Nombre</span><input id="fn" value="${esc(p.nombre)}"></label>
      <label class="field"><span>Mi precio (RD$)</span><input id="fp" inputmode="decimal" value="${p.precio || ""}"></label>
      <label class="field"><span>Unidad</span><select id="fu">${["unidad", "libra", "onza", "litro", "funda", "caja", "docena"].map((u) => `<option ${u === p.unidad ? "selected" : ""}>${u}</option>`).join("")}</select></label>
      <label class="field"><span>Categoria</span><input id="fc" value="${esc(p.categoria)}"></label>
      <label class="field"><span>Stock</span><input id="fs" inputmode="decimal" value="${p.stock || 0}"></label>
      <div class="field"><span>Foto del producto</span>
        <div class="upimg"><span class="pv" id="pv">${fotoDe(p)}</span>
          <label class="btn gris" style="margin:0;flex:1">Elegir foto<input type="file" accept="image/*" capture="environment" id="fi" hidden></label>
          <button class="btn gris" id="fq" style="margin:0" ${p.img ? "" : "hidden"}>Quitar</button>
        </div>
      </div>
      <button class="btn" id="sv">Guardar</button>${n ? "" : '<button class="btn red" id="dl" style="margin-top:10px">Eliminar</button>'}`);
    $("#x", s).onclick = closeSheet;
    /* foto opcional: se guarda comprimida y se usa en las tarjetas */
    let img = p.img || "";
    const fi = $("#fi", s);
    fi.onchange = () => {
      const f = fi.files && fi.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => {
          const max = 420, k = Math.min(1, max / Math.max(im.width, im.height));
          const cv = document.createElement("canvas");
          cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
          cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
          img = cv.toDataURL("image/jpeg", 0.7);
          $("#pv", s).innerHTML = `<img src="${img}" alt="">`;
          $("#fq", s).hidden = false;
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
    $("#fq", s).onclick = () => { img = ""; $("#pv", s).innerHTML = I.box; $("#fq", s).hidden = true; };
    $("#sv", s).onclick = () => {
      const nom = $("#fn", s).value.trim(), pr = parseFloat(String($("#fp", s).value).replace(",", "."));
      if (!nom || !(pr >= 0)) return toast("Falta el nombre o el precio");
      Object.assign(p, { nombre: nom, precio: pr, unidad: $("#fu", s).value, categoria: $("#fc", s).value.trim(), stock: parseFloat($("#fs", s).value) || 0, img });
      if (n) db().products.push(p);
      S.save(); window.PPSync.saveProduct(p); closeSheet(); toast("Producto guardado"); render();
    };
    const dl = $("#dl", s);
    if (dl) dl.onclick = () => { db().products = db().products.filter((x) => x.pid !== p.pid); S.save(); window.PPSync.deleteProduct(p.pid); closeSheet(); toast("Producto eliminado"); render(); };
  }

  /* ---------- Analitica ---------- */
  function renderAnalitica() {
    const sales = db().sales, today = new Date().toISOString().slice(0, 10);
    const hoy = sales.filter((s) => String(s.fecha).slice(0, 10) === today);
    const sum = (a, k) => a.reduce((x, s) => x + (Number(s[k]) || 0), 0);
    const byProd = {};
    for (const s of sales) { let L = s.lineas; if (typeof L === "string") { try { L = JSON.parse(L); } catch (_) { L = []; } } for (const l of L) byProd[l.nombre] = (byProd[l.nombre] || 0) + l.cant * l.precio; }
    const top = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 6), mx = top.length ? top[0][1] : 1;
    const ticket = sales.length ? sum(sales, "total") / sales.length : 0;
    $("#view").innerHTML = `<div class="kpis">
      <div class="kpi"><small>Ventas hoy</small><b>${money(sum(hoy, "total"))}</b></div>
      <div class="kpi"><small>Tickets hoy</small><b>${hoy.length}</b></div>
      <div class="kpi"><small>ITBIS hoy</small><b>${money(sum(hoy, "itbis"))}</b></div>
      <div class="kpi"><small>Ticket promedio</small><b>${money(ticket)}</b></div></div>
      <div class="card"><h3>Productos mas vendidos</h3>${top.length ? top.map(([n, v]) => `<div class="bar-r"><span>${esc(n)}</span><i><u style="width:${Math.max(6, v / mx * 100)}%"></u></i><em>${money(v)}</em></div>`).join("") : '<div class="empty" style="padding:24px">Aun no hay ventas.</div>'}</div>
      <div class="card"><h3>Ultimas ventas</h3>${sales.length ? sales.slice(-8).reverse().map((s) => `<div class="bar-r" style="grid-template-columns:1fr auto"><span>${new Date(s.fecha).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })} &middot; ${esc(s.metodo)}</span><em>${money(s.total)}</em></div>`).join("") : '<div class="empty" style="padding:24px">Sin ventas registradas.</div>'}</div>`;
  }

  /* ---------- Soporte ---------- */
  const DOC = [
    ["book", "Introduccion a PediPOS", ["Que es PediPOS?", "Requisitos del sistema", "Planes y precios"]],
    ["bolt", "Primeros pasos", ["Crear tu cuenta", "Configurar tu negocio", "Navegacion principal"]],
    ["cart", "Flujo completo de una venta", ["Venta manual", "Venta desde catalogo", "Venta por voz", "Lista de Pedido IA", "Cobro en efectivo", "Cobro a credito"]],
    ["users", "Gestion de clientes", ["Registrar clientes", "Historial de compras", "Registrar pagos", "Enviar WhatsApp"]],
    ["card", "Gestion de creditos", ["Crear credito", "Fecha de cobro", "Avisos de vencimiento", "Cobrar deuda"]],
    ["truck", "Gestion de proveedores", ["Registrar proveedores", "Pagos y cargos", "Historial de movimientos"]],
    ["box", "Gestion del catalogo", ["Mis productos (favoritos)", "Catalogo global", "Mi Precio", "Crear productos"]],
    ["chart", "Analitica", ["KPIs en tiempo real", "Productos mas vendidos", "Deuda con proveedores"]],
    ["gear", "Configuracion", ["Datos del negocio", "Logo", "Ubicacion", "ITBIS"]],
    ["wa", "Integracion con WhatsApp", ["Facturas por WhatsApp", "Recordatorios de cobro"]],
    ["print", "Impresion Bluetooth", ["Impresoras compatibles", "Configurar conexion", "Imprimir ticket"]],
    ["mic", "Venta por voz", ["Whisper + DeepSeek", "Conectar Puter", "Cache inteligente"]],
    ["spark", "Lista de Pedido con IA", ["Texto a productos", "Cache de intenciones", "Productos no encontrados"]],
    ["bulb", "Buenas practicas", ["Organizar favoritos", "Registrar clientes", "Revisar analitica diaria"]],
    ["help", "Solucion de problemas", ["No conecta microfono", "No imprime", "Puter no conecta"]],
  ];
  const TIPS = [["bolt", "Vende mas rapido", "Usa favoritos para acceder a tus productos mas vendidos con un solo toque."], ["box", "Organiza tu catalogo", "Marca los productos frecuentes; apareceran en 'Mis productos' al instante."], ["list", "Uso de Lista de Pedido", "Escribe varios productos en texto libre y la IA los agrega todos a la vez."], ["mic", "Uso de venta por voz", "Dicta el pedido en lenguaje natural. La IA transcribe e interpreta automaticamente."], ["users", "Gestion de clientes", "Registra cada cliente con WhatsApp para enviar facturas y recordar cobros."], ["card", "Organizacion de creditos", "Asigna fecha de cobro y recibe avisos antes del vencimiento."], ["globe", "Portal Global de Suplidores", "Usa el catalogo global compartido para mantener precios consistentes."]];
  const FAQ = [["Como hago una venta manual?", "Toca + en el Panel, busca el producto, ajusta la cantidad y toca Cobrar."], ["Como vendo desde el catalogo?", "Abre Catalogo, toca el producto y se agrega al talonario."], ["Como funciona la venta por voz?", "Toca el microfono negro y dicta, por ejemplo: dos libras y media de arroz. La IA interpreta y te pide confirmar."], ["Que es la Lista de Pedido con IA?", "Una caja de texto donde escribes o dictas varios productos a la vez. La IA los cruza con tu catalogo."], ["Como comparto una factura por WhatsApp?", "Al cobrar toca Enviar por WhatsApp. Se abre el chat con el detalle de la venta."], ["Puedo enviar facturas en texto?", "Si. El detalle se envia como mensaje de texto ordenado."], ["Puedo enviar facturas en imagen?", "Puedes imprimir o guardar el ticket como imagen desde el boton de impresion."], ["Como funcionan los creditos?", "Elige A credito al cobrar, asigna cliente y fecha de cobro."], ["Como activo el ITBIS?", "En el Panel, el interruptor ITBIS 18% aplica o quita el impuesto de la venta."], ["Como registro un cliente?", "Al cobrar escribe el nombre del cliente. En Gestion de clientes guardas su WhatsApp."], ["Funciona sin internet?", "Si. Todo se guarda en tu telefono y sube solo cuando vuelve la conexion."]];
  const QUICK = [["cart", "Crear una venta", "Agrega productos y cobra en segundos."], ["users", "Registrar un cliente", "Guarda nombre, WhatsApp y direccion."], ["truck", "Registrar un proveedor", "Agrega proveedores con saldo inicial."], ["box", "Registrar una compra", "Registra movimientos de proveedor."], ["list", "Compartir una factura", "Envia facturas por WhatsApp."], ["print", "Imprimir factura", "Conecta tu impresora Bluetooth."], ["card", "Registrar credito", "Vende a credito con fecha de cobro."], ["tag", "Cobrar una deuda", "Registra pagos de clientes."], ["wa", "Configurar WhatsApp", "Conecta tu numero de WhatsApp."], ["print", "Configurar impresion", "Configura impresora termica ESC/POS."]];
  function renderSoporte() {
    $("#view").innerHTML = `
      <div class="hx-hero">
        <div class="hx-tt"><div class="hx-ic">${I.help}</div><div><h2>Centro de ayuda</h2><p>Todo lo que necesitas para operar PediPOS</p></div></div>
        <div class="hx-srch">${I.search}<input id="sq" placeholder="Buscar en la ayuda" autocomplete="off"></div>
        <div class="hx-st"><span class="dot" id="svcdot"></span><span id="svc">Operativo</span></div>
      </div>

      <h3 class="hx-h">Accesos rapidos</h3>
      <div class="hx-grid" id="hxq">${QUICK.map(([ic, t, p], i) => `<button class="hx-card" data-q="${i}"><span class="hx-ib">${I[ic]}</span><b>${t}</b><span>${p}</span></button>`).join("")}</div>

      <h3 class="hx-h">Guias por tema</h3>
      <div class="hx-list" id="hxd">${DOC.map(([ic, t, items], i) => `<div class="hx-acc" data-tema="${esc(t + " " + items.join(" "))}"><button class="hx-acc-b"><span class="hx-ib sm">${I[ic]}</span><b>${t}</b><i class="hx-n">${items.length}</i>${I.chev}</button><ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>

      <h3 class="hx-h">Preguntas frecuentes</h3>
      <div class="hx-list" id="hxf">${FAQ.map(([q, r], i) => `<div class="hx-faq" data-tema="${esc(q + " " + r)}"><button class="hx-faq-b"><span>${q}</span>${I.down}</button><div class="hx-a">${r}</div></div>`).join("")}</div>

      <h3 class="hx-h">Soporte directo</h3>
      <div class="hx-contact">
        <div class="hx-ct"><span class="hx-ib">${I.wa}</span><div><b>WhatsApp</b><span>829-646-9885</span></div></div>
        <div class="hx-ct"><span class="hx-ib">${I.mail}</span><div><b>Correo</b><span>domingoguerra688@gmail.com</span></div></div>
        <div class="hx-ct"><span class="hx-ib">${I.clock}</span><div><b>Horario</b><span>Lun a Sab &middot; 8:00 AM a 8:00 PM</span></div></div>
        <div class="hx-btns"><a href="https://wa.me/18296469885" target="_blank" rel="noopener" class="hx-b1">${I.wa} Escribir por WhatsApp</a><a href="mailto:domingoguerra688@gmail.com" class="hx-b2">${I.mail} Enviar correo</a></div>
      </div>
      <p class="hx-foot">PediPOS &middot; Sistema de gestion de pedidos para colmados, mini markets y almacenes. Hecho para el comercio dominicano.</p>`;

    /* acordeones */
    $$(".hx-acc-b").forEach((b) => (b.onclick = () => b.parentElement.classList.toggle("open")));
    $$(".hx-faq-b").forEach((b) => (b.onclick = () => b.parentElement.classList.toggle("open")));

    /* accesos rapidos */
    const GUIA = {
      "Crear una venta": () => go("panel"),
      "Registrar un cliente": () => go("clientes"),
      "Registrar un proveedor": () => go("proveedores"),
      "Registrar una compra": () => go("proveedores"),
      "Compartir una factura": () => go("historial"),
      "Imprimir factura": () => go("config"),
      "Registrar credito": () => go("clientes"),
      "Cobrar una deuda": () => go("clientes"),
      "Configurar WhatsApp": () => go("config"),
      "Configurar impresion": () => go("config"),
    };
    $$(".hx-card").forEach((b) => (b.onclick = () => {
      const t = QUICK[+b.dataset.q][1], f = GUIA[t];
      if (f) f(); else toast("Esta guia llega pronto");
    }));

    /* buscador: filtra temas y preguntas */
    const sq = $("#sq");
    sq.oninput = () => {
      const q = window.PPVoice.norm(sq.value);
      let sede = 0;
      $$("#hxd .hx-acc").forEach((el) => {
        const hit = !q || window.PPVoice.norm(el.dataset.tema).includes(q);
        el.style.display = hit ? "" : "none";
        if (hit && q) { el.classList.add("open"); sede++; }
        if (!q) el.classList.remove("open");
      });
      $$("#hxf .hx-faq").forEach((el) => {
        const hit = !q || window.PPVoice.norm(el.dataset.tema).includes(q);
        el.style.display = hit ? "" : "none";
        if (hit && q) { el.classList.add("open"); sede++; }
        if (!q) el.classList.remove("open");
      });
      $$("#hxq .hx-card").forEach((el) => {
        const t = window.PPVoice.norm(el.querySelector("b").textContent + " " + el.querySelector("span:last-child").textContent);
        el.style.display = !q || t.includes(q) ? "" : "none";
      });
      let vacio = $("#hxnone");
      if (q && !sede) {
        if (!vacio) { vacio = document.createElement("div"); vacio.id = "hxnone"; vacio.className = "empty"; vacio.textContent = "No encontramos resultados. Escribenos por WhatsApp."; $("#hxd").after(vacio); }
      } else if (vacio) vacio.remove();
    };

    /* estado real del servicio */
    const on = window.PPSync.state.online;
    $("#svc").textContent = on ? "Servicio operativo" : "Sin conexion (modo local)";
    $("#svcdot").classList.toggle("off", !on);
  }

  /* ---------- Menu lateral ---------- */
  function openMenu() {
    const items = [["panel", "Panel de venta", "ticket"], ["clientes", "Clientes y creditos", "group"], ["catalogo", "Catalogo", "box"], ["proveedores", "Proveedores", "truck2"],
      ["historial", "Pedidos", "bagnav"], ["analitica", "Analitica", "chart"], ["soporte", "Soporte", "help"], ["config", "Configuracion", "gear"]];
    const s = sheet(`<div class="sh-h"><h2>Men&uacute; de Navegaci&oacute;n</h2><button class="sh-x" id="x">${I.x}</button></div>
      ${items.map(([k, t, ic]) => `<button class="mnu" data-g="${k}"><span class="mi">${I[ic]}</span><span>${t}</span>${I.chev}</button>`).join("")}`);
    $("#x", s).onclick = () => closeSheet();
    $$("[data-g]", s).forEach((b) => (b.onclick = () => { closeSheet(true); go(b.dataset.g); }));
  }
  /* ---------- Pedidos: listado con filtros ---------- */
  let pedFiltro = 8;
  function renderHistorial() {
    const all = db().sales.slice().reverse();
    const L = all.slice(0, pedFiltro);
    const chip = (n, t) => `<button class="chip ${pedFiltro === n ? "on" : ""}" data-f="${n}">${t}</button>`;
    $("#view").innerHTML = `<div class="filt">${chip(4, "Ultimos 4")}${chip(8, "Ultimos 8")}${chip(9999, "Por fecha")}</div>` +
      (L.length ? L.map((s) => {
        const est = s.metodo === "credito" ? "A credito" : "Pagado";
        return `<button class="ord" data-v="${esc(s.vid)}">
          <div class="ord-t"><b>${esc(s.cliente || "Sin cliente")}</b><span class="badge ${s.metodo === "credito" ? "cred" : ""}">${est}</span></div>
          <div class="ord-b"><span>${new Date(s.fecha).toLocaleString("es-DO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span><b>${money(s.total)}</b></div>
        </button>`;
      }).join("") : '<div class="card"><div class="cnt">Todavia no hay pedidos. Registra el primero desde el panel.</div></div>');
    $$(".filt .chip", $("#view")).forEach((c) => (c.onclick = () => { pedFiltro = parseInt(c.dataset.f, 10); renderHistorial(); }));
    $$(".ord", $("#view")).forEach((b) => (b.onclick = () => openDetalle(db().sales.find((x) => x.vid === b.dataset.v))));
  }

  /* ---------- Detalle del pedido ---------- */
  function openDetalle(s) {
    if (!s) return;
    const st = db().settings;
    const lineas = lineasDe(s).map((l) => `<div class="dl"><div><b>${esc(l.nombre)}</b><span>${num(l.cant)} ${esc(l.unidad || "unid.")} &middot; ${money(l.precio)} c/u</span></div><b>${money(l.cant * l.precio)}</b></div>`).join("");
    const pagado = s.metodo !== "credito";
    const sh = sheet(`<div class="sh-h"><h2>Detalle del pedido</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="mch"><b>${esc(st.negocio || "Mi negocio")}</b><span>${esc(st.direccion || "Sin direccion registrada")}</span><span>${esc(st.telefono || "")}</span></div>
      <div class="strow"><span class="stt ${pagado ? "" : "cred"}">${pagado ? I.ok : I.card} ${pagado ? "PAGADO" : "A CREDITO"}</span><span class="cnt">${new Date(s.fecha).toLocaleString("es-DO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></div>
      <div class="dlh"><span>PRODUCTO</span><span>TOTAL</span></div>
      <div class="dls">${lineas}</div>
      <div class="dsum">
        <div class="r"><span>Subtotal</span><span>${money2(s.subtotal)}</span></div>
        <div class="r it"><span>ITBIS (${Math.round((s.aplica_itbis ? rate() : 0) * 100)}%)</span><span>${money2(s.itbis)}</span></div>
        <div class="r tot"><span>TOTAL</span><span>${money2(s.total)}</span></div>
        ${s.recibido ? `<div class="r"><span>Recibido</span><span>${money2(s.recibido)}</span></div><div class="r chg"><span>Cambio</span><span>${money2(s.cambio || 0)}</span></div>` : ""}
      </div>
      ${s.foto ? `<img class="comp" src="${s.foto}" alt="Comprobante">` : ""}
      <div class="sh-f"><button class="m" id="cam" aria-label="Adjuntar comprobante">${I.cam}</button>
        <button class="big" id="send">${I.wa} Enviar</button>
        <button class="big dark" id="prt">${I.print} Imprimir</button></div>`);
    $("#x", sh).onclick = closeSheet;
    $("#send", sh).onclick = () => {
      const txt = ["*" + (db().settings.negocio || "Mi negocio") + "*", ...lineasDe(s).map((l) => num(l.cant) + " x " + l.nombre + " = " + money(l.cant * l.precio)),
        "Subtotal: " + money2(s.subtotal), "ITBIS: " + money2(s.itbis), "TOTAL: " + money2(s.total)].join("\n");
      window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
    };
    $("#prt", sh).onclick = async () => {
      try { const via = await window.PPExtra.imprimir(s); toast(via === "bt" ? "Enviado a la impresora" : "Abriendo impresion"); }
      catch (e) { toast(String(e.message || e)); }
    };
    $("#cam", sh).onclick = () => window.PPExtra.adjuntarComprobante(s, openDetalle);
  }
  function renderConfig() {
    const st = db().settings;
    $("#view").innerHTML = `<div class="card"><label class="field"><span>Nombre del negocio</span><input id="cn" value="${esc(st.negocio)}"></label>
      <label class="field"><span>Direccion del negocio</span><input id="cd" value="${esc(st.direccion || "")}" placeholder="Calle, numero, sector"></label>
      <label class="field"><span>Telefono del negocio</span><input id="ct2" value="${esc(st.telefono || "")}" placeholder="8090000000"></label>
      <label class="field"><span>ITBIS (%)</span><input id="ci" inputmode="decimal" value="${Math.round(st.itbisRate * 100)}"></label>
      <button class="btn" id="cs">Guardar</button></div>
      <div class="card"><h3>Caja y acceso</h3>
        <div class="line" style="font-size:13px"><span>Sesion</span><b>${db().session ? esc(db().session.nombre + " · " + db().session.rol) : "sin iniciar"}</b></div>
        <label class="field" style="margin-top:8px"><span>Pedir PIN al abrir</span><select id="cr"><option value="0" ${st.pinReq ? "" : "selected"}>No</option><option value="1" ${st.pinReq ? "selected" : ""}>Si</option></select></label>
        <button class="btn sec" id="cses">${db().session ? "Cerrar sesion" : "Iniciar sesion"}</button>
        <button class="btn sec" id="cbm" style="margin-top:8px">Emparejar impresora Bluetooth</button>
        <div class="cnt" style="font-size:11.5px;margin-top:6px" id="bti">${localStorage.getItem("pedipos.printer") ? "Impresora: " + esc(localStorage.getItem("pedipos.printer")) : "Sin impresora emparejada"}</div>
      </div>
      <div class="card"><h3>Sincronizacion</h3><div class="cnt" id="syn"></div><button class="btn sec" id="sy">Sincronizar ahora</button></div>`;
    $("#cr").onchange = (e) => { st.pinReq = e.target.value === "1"; S.save(); toast(st.pinReq ? "Se pedira PIN al abrir" : "Sin PIN al abrir"); };
    $("#cses").onclick = () => { if (db().session) { db().session = null; S.save(); toast("Sesion cerrada"); render(); } else loginScreen(); };
    $("#cbm").onclick = async () => {
      try { const n = await window.PPExtra.btConectar(); toast("Impresora: " + n); render(); }
      catch (e) { toast(String(e.message || e)); }
    };
    $("#cs").onclick = () => { st.negocio = $("#cn").value.trim() || "Mi negocio"; st.direccion = ($("#cd") ? $("#cd").value.trim() : ""); st.telefono = ($("#ct2") ? $("#ct2").value.trim() : ""); const r = parseFloat($("#ci").value); if (r >= 0 && r <= 100) st.itbisRate = r / 100; S.save(); toast("Guardado"); };
    const paint = () => ($("#syn") && ($("#syn").textContent = (window.PPSync.state.online ? "Conectado" : "Sin conexion") + " · " + window.PPSync.state.pending + " pendiente(s)"));
    paint(); $("#sy").onclick = async () => { await window.PPSync.flush(); await window.PPSync.pull(); paint(); toast("Sincronizado"); };
  }

  function render() {
    if (tab === "panel") renderPanel();
    else if (tab === "catalogo") renderCatalogo();
    else if (tab === "soporte") renderSoporte();
    else if (tab === "analitica") renderAnalitica();
    else if (tab === "clientes") renderClientes();
    else if (tab === "proveedores") renderProveedores();
    else if (tab === "historial") renderHistorial();
    else if (tab === "config") renderConfig();
  }

  /* ---------- Acceso con PIN ---------- */
  function loginScreen() {
    const users = db().users || [];
    const s = sheet(`<div class="sh-h"><h2>Entrar a la caja</h2></div>
      <p class="cnt" style="margin:0 0 10px">Elige tu usuario y escribe el PIN.</p>
      <label class="field"><span>Usuario</span><select id="lu">${users.map((u) => `<option value="${esc(u.uid)}">${esc(u.nombre)} · ${esc(u.rol)}</option>`).join("")}</select></label>
      <label class="field"><span>PIN</span><input id="lp" inputmode="numeric" type="password" maxlength="6" placeholder="••••"></label>
      <button class="btn" id="lin">Entrar</button>
      <p class="cnt" style="margin-top:10px;font-size:11.5px">PIN inicial: 1234 (administrador) o 0000 (caja). Cambialo en Configuracion.</p>`);
    const go2 = () => {
      const uid = s.querySelector("#lu").value, pin = s.querySelector("#lp").value.trim();
      const u = users.find((x) => x.uid === uid);
      if (!u || String(u.pin || "") !== pin) return toast("PIN incorrecto");
      if (u.activo === false) return toast("Usuario inactivo");
      db().session = { uid: u.uid, nombre: u.nombre, rol: u.rol };
      S.save(); closeSheet(); toast("Bienvenido, " + u.nombre); render();
    };
    s.querySelector("#lin").onclick = go2;
    s.querySelector("#lp").oninput = (e) => { if (e.target.value.length >= 4) go2(); };
  }

  /* ---------- Tarjeta de instalacion (fija arriba hasta deslizarla o descargar) ---------- */
  const INS_OFF = "pedipos.install.off", INS_DONE = "pedipos.install.done";
  const esStandalone = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true;
  function esIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function esAndroid() { return /android/i.test(navigator.userAgent); }

  function initInstall() {
    const bar = $("#instbar");
    if (!bar) return;
    /* ya instalada, o descartada hace poco: no se muestra */
    if (esStandalone() || localStorage.getItem(INS_DONE)) return;
    if (Number(localStorage.getItem(INS_OFF) || 0) > Date.now() - 7 * 864e5) return;

    const sub = $("#instsub");
    if (sub && esIOS() && !window.__ppInstallPrompt) sub.textContent = "Toca Descargar y sigue 2 pasos";

    const cerrar = (anim) => {
      if (anim === false) { bar.hidden = true; return; }
      bar.classList.add("out");
      setTimeout(() => { bar.hidden = true; bar.classList.remove("out"); }, 230);
    };
    const descartar = () => { localStorage.setItem(INS_OFF, String(Date.now())); cerrar(); };

    /* --- deslizar a los lados para ocultarla --- */
    let x0 = 0, y0 = 0, dx = 0, arrastrando = false;
    bar.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; arrastrando = true;
      bar.classList.add("drag");
    }, { passive: true });
    bar.addEventListener("touchmove", (e) => {
      if (!arrastrando) return;
      const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 12) { arrastrando = false; bar.classList.remove("drag"); bar.style.transform = ""; return; }
      dx = mx;
      bar.style.transform = "translateX(" + dx + "px)";
      bar.style.opacity = String(Math.max(.25, 1 - Math.abs(dx) / 260));
    }, { passive: true });
    const soltar = () => {
      if (!arrastrando) return;
      arrastrando = false; bar.classList.remove("drag");
      if (Math.abs(dx) > 70) { bar.style.transform = ""; bar.style.opacity = ""; descartar(); }
      else { bar.style.transform = ""; bar.style.opacity = ""; }
      dx = 0;
    };
    bar.addEventListener("touchend", soltar);
    bar.addEventListener("touchcancel", soltar);

    /* --- boton Descargar --- */
    $("#instbtn").onclick = async () => {
      const p = window.__ppInstallPrompt;
      if (!p) return guiaInstalar();
      let r = null;
      try {
        p.prompt();
        /* si el navegador no responde (o cancela en silencio), a los 2.5 s se muestran los pasos */
        r = await Promise.race([p.userChoice, new Promise((ok) => setTimeout(() => ok(null), 2500))]);
      } catch (_) { r = null; }
      if (r && r.outcome === "accepted") {
        window.__ppInstallPrompt = null; localStorage.setItem(INS_DONE, "1");
        cerrar(); toast("Instalando PediPOS..."); return;
      }
      if (r && r.outcome === "dismissed") { toast("Toca Descargar cuando quieras instalarla"); return; }
      guiaInstalar();
    };

    /* aparece sola, sin empujar el contenido de golpe */
    bar.hidden = false;
    bar.classList.add("vin");
    setTimeout(() => bar.classList.remove("vin"), 400);
  }

  /* Instrucciones cuando el telefono no ofrece el aviso automatico (iPhone, o Chrome sin aviso). */
  function guiaInstalar() {
    const pasos = esIOS()
      ? ["Abre esta pagina en Safari.", "Toca el boton Compartir (el cuadro con la flecha hacia arriba).", "Elige Anadir a pantalla de inicio y confirma con Anadir."]
      : esAndroid()
        ? ["Abre el menu del navegador (los tres puntos arriba a la derecha).", "Toca Instalar aplicacion o Anadir a pantalla principal.", "Confirma con Instalar."]
        : ["Abre el menu del navegador.", "Busca Instalar aplicacion o Anadir a pantalla principal.", "Confirma con Instalar."];
    const s = sheet(`<div class="sh-h"><h2>Instalar PediPOS</h2><button class="sh-x" id="x">${I.x}</button></div>
      <p class="cnt" style="margin:0 0 12px">Queda como una app en tu telefono y abre sin internet.</p>
      <div class="iguide">${pasos.map((t, i) => `<div class="st"><span class="n">${i + 1}</span><p>${esc(t)}</p></div>`).join("")}</div>
      <button class="big" id="iok" style="width:100%;margin-top:16px">${I.check} Entendido</button>`);
    $("#x", s).onclick = () => closeSheet();
    /* cerrar la guia no borra la tarjeta: sigue arriba hasta deslizarla o instalar */
    $("#iok", s).onclick = () => closeSheet();
  }

  /* ---------- Conexion y arranque ---------- */
  function netbar() {
    const b = $("#netbar"), st = window.PPSync.state;
    if (!st.online) { b.hidden = false; b.className = "netbar"; b.textContent = "Sin conexion. Sigues vendiendo; todo se guarda en tu telefono." + (st.pending ? " (" + st.pending + " por enviar)" : ""); }
    else if (st.pending) { b.hidden = false; b.className = "netbar ok"; b.textContent = "Enviando " + st.pending + " pendiente(s)..."; }
    else b.hidden = true;
  }
  window.addEventListener("pp:sync", netbar);
  window.addEventListener("pp:data", () => { if (!document.getElementById("sheet") && voice.phase === "idle" && tab !== "panel") render(); });
  window.addEventListener("pp:quota", () => toast("Espacio casi lleno. Se libero historial antiguo."));
  window.PPUI = { sheet, closeSheet, toast, render, go, I, money, money2, esc, cart, tot, rate, db, initInstall, guiaInstalar };
  $("#btnMenu").onclick = openMenu;
  $("#btnBell").onclick = () => toast(window.PPSync.state.pending ? window.PPSync.state.pending + " envio(s) pendiente(s)" : "Todo al dia");
  go("panel"); netbar(); window.PPSync.start(); initInstall();
  addEventListener("pp:installable", () => { const b = $("#instbar"); if (b && b.hidden && !localStorage.getItem(INS_DONE)) { localStorage.removeItem(INS_OFF); b.hidden = false; } });
  addEventListener("pp:installed", () => { localStorage.setItem(INS_DONE, "1"); const b = $("#instbar"); if (b) { b.hidden = true; } toast("PediPOS instalada"); });
  if (db().settings.pinReq && !db().session) setTimeout(loginScreen, 260);
})();
