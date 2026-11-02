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

  const I = {
    menu: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h11M4 17h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    list: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    box: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    down: '<svg class="chev" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6"/></svg>',
    bike: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l4-8h5l3 8M10 9l-1-3h3"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5C5 4 8.500 4 12 6c3.500-2 7-2 10-.5V19c-3-1.500-6.500-1.500-10.500.500C8.500 17.500 5 17.500 2 19V5.500zM12 6v13.500"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 21V10M12 21V3M19 21v-7"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-11.800 7L4 20l1.100-4A8 8 0 1 1 20 12z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    help: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 1-1 1.700M12 17h.01"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2.100h5c0-.9.400-1.600 1-2.100A6 6 0 0 0 12 3z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.500"/><circle cx="18" cy="20" r="1.500"/><path d="M2 3h3l2.500 12h11l2-8H6"/></svg>',
    users: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 4.500a3.500 3.500 0 0 1 0 7M18 14.500a6.500 6.500 0 0 1 3.500 5.500"/></svg>',
    card: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="M3 10h18"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7"/><circle cx="6.500" cy="18" r="1.800"/><circle cx="16.500" cy="18" r="1.800"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/></svg>',
    print: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    tag: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.500" cy="8.500" r="1.200"/></svg>',
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

  /* ---------- Dock ---------- */
  const TABS = [["panel", "PANEL", I.ticket], ["catalogo", "CATALOGO", I.bike], ["soporte", "SOPORTE", I.book], ["analitica", "ANALITICA", I.chart]];
  function drawDock() {
    $("#dock").classList.toggle("hide", tab === "panel");
    $("#dock").innerHTML = TABS.map(([k, , ic]) => `<button data-t="${k}" class="${tab === k ? "on" : ""}" aria-label="${k}">${ic}</button>`).join("");
    $$("#dock button").forEach((b) => (b.onclick = () => go(b.dataset.t)));
  }
  function go(t) {
    tab = t;
    $("#title").textContent = { panel: "PANEL", catalogo: "CATALOGO", soporte: "SOPORTE", analitica: "ANALITICA", historial: "HISTORIAL", config: "CONFIGURACION" }[t] || t.toUpperCase();
    drawDock(); render(); $("#view").scrollTop = 0;
  }

  /* ---------- Panel ---------- */
  function lineRow(l, i) {
    return `<div class="row"><b>${esc(l.nombre)}</b><input class="q" data-i="${i}" inputmode="decimal" value="${num(l.cant)}" aria-label="Cantidad"><span class="p">${num(l.precio)}</span><span class="t">${money(l.cant * l.precio)}</span></div>`;
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
        <div class="tick-b">${n ? c.lines.map(lineRow).join("") : '<div class="tick-empty">Toca + para agregar productos</div>'}</div>
        <div class="tick-f">
          <div class="itbis-r"><span>ITBIS ${Math.round(rate() * 100)}%</span><button class="sw ${c.itbis ? "on" : ""}" id="swItbis" aria-label="ITBIS"></button></div>
          <div class="line"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
          <div class="line it"><span>ITBIS (${Math.round(rate() * 100)}%)</span><span>+${money(t.itbis)}</span></div>
          <div class="tot"><span>TOTAL A COBRAR</span><b>${money(t.total)}</b></div>
        </div>
        <button class="plus" id="bPlus" aria-label="Agregar">${I.plus}</button>
      </section>
      ${n ? `<button class="cartfab" id="bCart">${I.bag}<b>${n}</b></button>` : `<button class="cartfab" id="bCart">${I.bag}</button>`}
      <div class="act">
        <button class="n" id="bNew">Nueva</button>
        <button class="c ${n ? "go" : ""}" id="bPay" ${n ? "" : "disabled"}>Cobrar</button>
        <div class="mic ${voice.phase === "listening" ? "on" : voice.phase === "wait" ? "wait" : ""}" id="bMic"><i>${I.mic}</i></div>
      </div>`;
    $("#bSearch").onclick = openSearch; $("#bList").onclick = () => openOrder("");
    $("#bPlus").onclick = openSearch; $("#bCart").onclick = openSearch;
    $("#swItbis").onclick = () => { cart().itbis = !cart().itbis; S.save(); render(); };
    $("#bNew").onclick = () => { if (cart().lines.length && !confirm("Descartar la venta actual?")) return; cart().lines = []; S.save(); render(); };
    $("#bPay").onclick = openPay;
    $("#bMic").onclick = toggleVoice;
    $$(".row .q").forEach((inp) => (inp.onchange = () => {
      const v = parseFloat(String(inp.value).replace(",", "."));
      const i = +inp.dataset.i;
      if (!(v > 0)) cart().lines.splice(i, 1); else cart().lines[i].cant = v;
      S.save(); render();
    }));
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
  function sheet(html, onClose) {
    closeSheet();
    const m = document.createElement("div"); m.className = "mask"; m.id = "mask";
    const s = document.createElement("section"); s.className = "sheet"; s.id = "sheet";
    s.innerHTML = '<div class="grip"></div>' + html;
    $("#layer").append(m, s);
    m.onclick = () => { closeSheet(); onClose && onClose(); };
    return s;
  }
  function closeSheet() { $("#layer").innerHTML = ""; }

  /* ----- Buscar producto ----- */
  function openSearch() {
    const s = sheet(`<div class="sh-h"><h2>Agregar producto</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="search">${I.search}<input id="q" placeholder="Buscar producto" autocomplete="off"></div>
      <div id="res"></div>`);
    $("#x", s).onclick = closeSheet;
    const q = $("#q", s), res = $("#res", s);
    const draw = () => {
      const t = window.PPVoice.norm(q.value);
      const list = db().products.filter((p) => p.activo !== false && (!t || window.PPVoice.norm(p.nombre).includes(t))).slice(0, 40);
      res.innerHTML = list.length ? list.map((p) => `<div class="prod"><div class="nm"><b>${esc(p.nombre)}</b><span>${money(p.precio)} c/u &middot; ${esc(p.unidad)}</span></div><button class="add" data-p="${p.pid}">${I.plus.replace(/width="48" height="48"/, 'width="28" height="28"')}</button></div>`).join("") : '<div class="empty">No encontramos ese producto. Puedes crearlo en Catalogo.</div>';
      $$(".add", res).forEach((b) => (b.onclick = () => { const p = db().products.find((x) => x.pid === b.dataset.p); addLine(p, 1); toast(p.nombre + " agregado"); render(); }));
    };
    q.oninput = draw; draw(); setTimeout(() => q.focus(), 120);
  }

  /* ----- Lista de pedido con IA ----- */
  let orderRec = false;
  function openOrder(initial) {
    const s = sheet(`<div class="sh-h"><h2>Lista de pedido</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="ia">${I.spark}<span>IA DeepSeek activa &mdash; procesamiento sem&aacute;ntico con tus productos</span></div>
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
    const s = sheet(`<div class="sh-h"><button class="sh-x" id="b">${I.back}</button><h2>Confirmar pedido</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="cnt">${lines.length} producto${lines.length === 1 ? "" : "s"} detectado${lines.length === 1 ? "" : "s"}</div>
      ${lines.map((l, i) => `<div class="item"><div class="ic">${I.box}</div><div class="nm"><b>${esc(l.nombre)}</b><span>${money(l.precio)} c/u &middot; ${esc(l.unidad)}</span></div><input class="qty" data-i="${i}" inputmode="decimal" value="${num(l.cant)}"></div>`).join("")}
      ${r.missing && r.missing.length ? `<div class="miss">No encontre: ${r.missing.map(esc).join(", ")}. Agregalo desde Catalogo.</div>` : ""}
      <button class="big" id="ok" ${lines.length ? "" : "disabled"} style="width:100%;margin-top:6px">${I.check} Agregar al talonario</button>`);
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
    if (!window.PPVoice.supportsDictation()) return openOrder("");
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
  function renderListen() {
    let el = $("#listen");
    if (voice.phase !== "listening") { el && el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = "listen"; el.className = "listen"; document.body.append(el); }
    el.innerHTML = `<i class="rd"></i><div class="tx"><b>ESCUCHANDO</b><span>${esc(voice.text || 'Dicta tu pedido: "dos leches, media libra..."')}</span></div><button class="stop" id="stp" aria-label="Detener"><i></i></button>`;
    $("#stp").onclick = () => window.PPVoice.stopDictation();
  }
  function showProc() {
    const d = document.createElement("div"); d.id = "proc"; d.className = "proc"; d.innerHTML = '<span class="spin"></span> Procesando audio...'; document.body.append(d);
  }

  /* ----- Cobro ----- */
  function openPay() {
    const t = tot();
    const s = sheet(`<div class="sh-h"><h2>Cobrar</h2><button class="sh-x" id="x">${I.x}</button></div>
      <div class="receipt"><div class="r"><span>Subtotal</span><span>${money2(t.subtotal)}</span></div><div class="r"><span>ITBIS</span><span>${money2(t.itbis)}</span></div><div class="r t"><span>TOTAL</span><span>${money2(t.total)}</span></div></div>
      <label class="field"><span>Metodo de pago</span><select id="met"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option><option value="credito">A credito</option></select></label>
      <label class="field" id="recw"><span>Efectivo recibido</span><input id="rec" inputmode="decimal" placeholder="${num(t.total)}"></label>
      <label class="field"><span>Cliente (opcional)</span><input id="cli" placeholder="Nombre"></label>
      <div id="chg" class="cnt"></div>
      <button class="big" id="done" style="width:100%">${I.check} Confirmar cobro</button>`);
    $("#x", s).onclick = closeSheet;
    const met = $("#met", s), rec = $("#rec", s), chg = $("#chg", s);
    const upd = () => {
      $("#recw", s).style.display = met.value === "efectivo" ? "block" : "none";
      const r = parseFloat(String(rec.value).replace(",", "."));
      chg.textContent = met.value === "efectivo" && r >= t.total ? "Devuelta: " + money2(r - t.total) : "";
    };
    met.onchange = upd; rec.oninput = upd; upd();
    $("#done", s).onclick = () => {
      const sale = {
        vid: S.uid("V"), fecha: new Date().toISOString(),
        lineas: cart().lines.map((l) => ({ ...l })),
        subtotal: t.subtotal, itbis: t.itbis, total: t.total, aplica_itbis: cart().itbis,
        metodo: met.value, cajero: (db().session && db().session.nombre) || "Caja", cliente: $("#cli", s).value.trim(),
      };
      db().sales.push(sale);
      for (const l of sale.lineas) { const p = db().products.find((x) => x.pid === l.pid); if (p && typeof p.stock === "number") { p.stock = S.round2(p.stock - l.cant); window.PPSync.saveProduct(p); } }
      cart().lines = []; S.save(); window.PPSync.saveSale(sale);
      receipt(sale);
    };
  }
  function receipt(sale) {
    const s = sheet(`<div class="ok-big"><div class="tk">${I.ok}</div><h2>Venta registrada</h2><div class="cnt">${new Date(sale.fecha).toLocaleString("es-DO")}</div></div>
      <div class="receipt">${sale.lineas.map((l) => `<div class="r"><span>${num(l.cant)} x ${esc(l.nombre)}</span><span>${money(l.cant * l.precio)}</span></div>`).join("")}
      <div class="r"><span>Subtotal</span><span>${money2(sale.subtotal)}</span></div><div class="r"><span>ITBIS</span><span>${money2(sale.itbis)}</span></div><div class="r t"><span>TOTAL</span><span>${money2(sale.total)}</span></div></div>
      <div class="sh-f"><button class="m" id="pr" aria-label="Imprimir">${I.print}</button><button class="big" id="wa">${I.wa} Enviar por WhatsApp</button></div>
      <button class="btn sec" id="nw" style="margin-top:14px">Nueva venta</button>`);
    $("#pr", s).onclick = () => window.print();
    $("#wa", s).onclick = () => {
      const txt = ["*" + db().settings.negocio + "*", ...sale.lineas.map((l) => num(l.cant) + " x " + l.nombre + " = " + money(l.cant * l.precio)), "Subtotal: " + money2(sale.subtotal), "ITBIS: " + money2(sale.itbis), "*TOTAL: " + money2(sale.total) + "*"].join("\n");
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
      <div id="cl"></div><button class="btn" id="newp" style="margin-top:8px">+ Crear producto</button>`;
    const draw = () => {
      const t = window.PPVoice.norm(catQ);
      const l = db().products.filter((p) => p.activo !== false && (!catCat || p.categoria === catCat) && (!t || window.PPVoice.norm(p.nombre).includes(t)));
      $("#cl").innerHTML = l.length ? l.map((p) => `<div class="prod"><div class="nm"><b>${esc(p.nombre)}</b><span>${esc(p.categoria || "General")} &middot; ${esc(p.unidad)}${typeof p.stock === "number" ? " &middot; stock " + num(p.stock) : ""}</span></div><span class="pr">${money(p.precio)}</span><button class="add" data-e="${p.pid}" aria-label="Editar">${I.tag.replace(/width="32" height="32"/, 'width="26" height="26"')}</button></div>`).join("") : '<div class="empty">Sin productos. Crea el primero.</div>';
      $$("[data-e]").forEach((b) => (b.onclick = () => editProduct(db().products.find((p) => p.pid === b.dataset.e))));
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
      <button class="btn" id="sv">Guardar</button>${n ? "" : '<button class="btn red" id="dl" style="margin-top:10px">Eliminar</button>'}`);
    $("#x", s).onclick = closeSheet;
    $("#sv", s).onclick = () => {
      const nom = $("#fn", s).value.trim(), pr = parseFloat(String($("#fp", s).value).replace(",", "."));
      if (!nom || !(pr >= 0)) return toast("Falta el nombre o el precio");
      Object.assign(p, { nombre: nom, precio: pr, unidad: $("#fu", s).value, categoria: $("#fc", s).value.trim(), stock: parseFloat($("#fs", s).value) || 0 });
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
    const sh = (ic, t, p) => `<div class="sec-h"><div class="ib">${I[ic]}</div><div><h2>${t}</h2><p>${p}</p></div></div>`;
    $("#view").innerHTML =
      sh("book", "Documentacion Oficial", "Manual completo organizado por categorias") +
      DOC.map(([ic, t, items]) => `<div class="acc"><button><span class="ib">${I[ic]}</span><b>${t}</b>${I.chev}</button><ul>${items.map((x) => `<li>${I.chev.replace(/width="26" height="26"/, 'width="20" height="20"')}${x}</li>`).join("")}</ul></div>`).join("") +
      sh("bulb", "Consejos y Trucos", "Recomendaciones para mejorar tu productividad") +
      TIPS.map(([ic, t, p]) => `<div class="tip"><div class="ib">${I[ic]}</div><b>${t}</b><p>${p}</p></div>`).join("") +
      sh("help", "Preguntas Frecuentes", "Respuestas a las dudas mas comunes sobre PediPOS") +
      FAQ.map(([q, a]) => `<div class="faq"><button><span>${q}</span>${I.down}</button><div class="a">${a}</div></div>`).join("") +
      sh("bolt", "Guias rapidas", "Accesos directos a las tareas mas comunes") +
      QUICK.map(([ic, t, p]) => `<button class="quick"><div class="ib">${I[ic]}</div><div style="flex:1"><b>${t}</b><span>${p}</span></div>${I.chev}</button>`).join("") +
      `<div class="info blue"><div class="ib">${I.clock}</div><b>Horario de atencion</b><span>Lun a Sab &middot; 8:00 AM - 8:00 PM</span></div>
       <div class="info green"><div class="ib">${I.ok}</div><b>Estado del servicio</b><span id="svc">&#9679; Operativo</span></div>` +
      sh("globe", "Contacto con PediPOS", "Informacion institucional y canales oficiales") +
      `<div class="contact"><small>PEDIPOS</small><p>Sistema de gestion de pedidos para colmados, mini markets y almacenes. Disenado para la velocidad operativa del comercio dominicano.</p>
       <small>CONTACTO DIRECTO</small><p>WhatsApp: 829-646-9885<br>domingoguerra688@gmail.com</p>
       <div class="cbtn"><a href="https://wa.me/18296469885" target="_blank" rel="noopener" style="background:#22C55E">${I.wa} WhatsApp</a><a href="mailto:domingoguerra688@gmail.com" style="background:#A855F7">${I.mail} Correo</a></div></div>`;
    $$(".acc>button").forEach((b) => (b.onclick = () => b.parentElement.classList.toggle("open")));
    $$(".faq>button").forEach((b) => (b.onclick = () => b.parentElement.classList.toggle("open")));
    $$(".quick").forEach((b, i) => (b.onclick = () => { if (i === 0) go("panel"); else if (i === 1 || i === 2) toast("Disponible en la siguiente version"); else toast("Disponible en la siguiente version"); }));
    const svc = $("#svc"); svc.textContent = window.PPSync.state.online ? "\u25CF Operativo" : "\u25CF Sin conexion (modo local)";
  }

  /* ---------- Menu lateral ---------- */
  function openMenu() {
    const s = sheet(`<div class="sh-h"><h2>${esc(db().settings.negocio)}</h2><button class="sh-x" id="x">${I.x}</button></div>
      ${[["panel", "Panel de venta"], ["catalogo", "Catalogo"], ["historial", "Historial de ventas"], ["analitica", "Analitica"], ["soporte", "Soporte"], ["config", "Configuracion"]].map(([k, t]) => `<button class="quick" data-g="${k}"><div style="flex:1"><b>${t}</b></div>${I.chev}</button>`).join("")}`);
    $("#x", s).onclick = closeSheet;
    $$("[data-g]", s).forEach((b) => (b.onclick = () => { closeSheet(); go(b.dataset.g); }));
  }
  function renderHistorial() {
    const L = db().sales.slice().reverse();
    $("#view").innerHTML = L.length ? L.map((s) => `<div class="card"><div class="line" style="margin:0"><span>${new Date(s.fecha).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" })}</span><b style="color:var(--ink)">${money2(s.total)}</b></div><div class="cnt" style="margin:6px 0 0">${esc(s.metodo)}${s.cliente ? " &middot; " + esc(s.cliente) : ""}</div></div>`).join("") : '<div class="empty">Aun no hay ventas.</div>';
  }
  function renderConfig() {
    const st = db().settings;
    $("#view").innerHTML = `<div class="card"><label class="field"><span>Nombre del negocio</span><input id="cn" value="${esc(st.negocio)}"></label>
      <label class="field"><span>ITBIS (%)</span><input id="ci" inputmode="decimal" value="${Math.round(st.itbisRate * 100)}"></label>
      <button class="btn" id="cs">Guardar</button></div>
      <div class="card"><h3>Sincronizacion</h3><div class="cnt" id="syn"></div><button class="btn sec" id="sy">Sincronizar ahora</button></div>`;
    $("#cs").onclick = () => { st.negocio = $("#cn").value.trim() || "Mi negocio"; const r = parseFloat($("#ci").value); if (r >= 0 && r <= 100) st.itbisRate = r / 100; S.save(); toast("Guardado"); };
    const paint = () => ($("#syn") && ($("#syn").textContent = (window.PPSync.state.online ? "Conectado" : "Sin conexion") + " · " + window.PPSync.state.pending + " pendiente(s)"));
    paint(); $("#sy").onclick = async () => { await window.PPSync.flush(); await window.PPSync.pull(); paint(); toast("Sincronizado"); };
  }

  function render() {
    if (tab === "panel") renderPanel();
    else if (tab === "catalogo") renderCatalogo();
    else if (tab === "soporte") renderSoporte();
    else if (tab === "analitica") renderAnalitica();
    else if (tab === "historial") renderHistorial();
    else if (tab === "config") renderConfig();
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
  $("#btnMenu").onclick = openMenu;
  $("#btnBell").onclick = () => toast(window.PPSync.state.pending ? window.PPSync.state.pending + " envio(s) pendiente(s)" : "Todo al dia");
  $("#btnAvatar").onclick = () => go("config");
  go("panel"); netbar(); window.PPSync.start();
})();
