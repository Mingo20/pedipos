/* PediPOS · Nube y consumo
   1) El comerciante elige donde se guardan las facturas electronicas: Puter Drive o Google Drive.
   2) Pantalla de consumo: IA, almacenamiento, creditos gratuitos, modelos usados y plan actual. */
(function (global) {
  "use strict";
  var S = global.PPStore;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Modelos que PediPOS usa de verdad. Solo estos se muestran. */
  var MODELOS = [
    { id: "deepseek-chat", etiqueta: "DeepSeek Chat", uso: "Pedidos por voz y explicacion de rechazos" }
  ];
  var CREDITOS_GRATIS = 1000;

  function db() { return S.db; }
  function ajustes() {
    var d = db();
    d.settings = d.settings || {};
    d.settings.nube = d.settings.nube || { destino: "google" };
    return d.settings.nube;
  }
  function destino() { return ajustes().destino || "google"; }
  function setDestino(v) { ajustes().destino = (v === "puter" ? "puter" : "google"); S.save(); }

  /* ---------- contador de llamadas por modelo ---------- */
  function ia() {
    var d = db();
    d.ia = d.ia || { llamadas: {} };
    d.ia.llamadas = d.ia.llamadas || {};
    return d.ia;
  }
  function contar(modelo) {
    var k = modelo || "deepseek-chat";
    var o = ia();
    o.llamadas[k] = (Number(o.llamadas[k]) || 0) + 1;
    o.ultima = new Date().toISOString();
    try { S.save(); } catch (e) {}
  }
  function llamadasDe(k) { return Number(ia().llamadas[k]) || 0; }

  /* envuelve puter.ai.chat una sola vez para contar sin tocar el resto del codigo */
  function engancharContador() {
    var P = global.puter;
    if (!P || !P.ai || P.ai.__ppContado) return;
    var orig = P.ai.chat;
    if (typeof orig !== "function") return;
    P.ai.chat = function () {
      var args = arguments;
      var modelo = "deepseek-chat";
      for (var i = 0; i < args.length; i++) {
        var a = args[i];
        if (a && typeof a === "object" && a.model) { modelo = a.model; break; }
      }
      try { contar(modelo); } catch (e) {}
      return orig.apply(P.ai, args);
    };
    P.ai.__ppContado = true;
  }

  /* ---------- guardar una factura en la nube elegida ---------- */
  async function guardarFactura(nombre, contenido, tipo) {
    var donde = destino();
    if (donde === "puter") {
      var P = global.puter;
      if (!P || !P.fs) throw new Error("Puter no esta disponible");
      var ruta = "PediPOS/facturas/" + nombre;
      await P.fs.write(ruta, contenido, { createMissingParents: true });
      return { ok: true, destino: "puter", ruta: ruta };
    }
    return { ok: false, destino: "google", pendiente: true };
  }

  global.PPNube = { destino: destino, setDestino: setDestino, guardarFactura: guardarFactura, contar: contar, MODELOS: MODELOS, engancharContador: engancharContador };
})(window);

/* ---------- Pantalla de consumo (se usa desde Configuracion) ---------- */
(function (global) {
  "use strict";
  var S = global.PPStore;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var usd = function (mc) { return "$" + (Number(mc || 0) / 1e8).toFixed(2); };

  function barra(pct, color) {
    return '<div class="pp-bar"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%;background:' + (color || "#0B8F5F") + '"></i></div>';
  }
  function mb(n) {
    var b = Number(n) || 0;
    if (b > 1048576) return (b / 1048576).toFixed(1) + " MB";
    if (b > 1024) return (b / 1024).toFixed(0) + " KB";
    return b + " B";
  }

  async function usoAlmacenamiento(P) {
    try {
      if (P.fs && typeof P.fs.usage === "function") {
        var u = await P.fs.usage();
        return { usado: Number(u.used || u.usage || 0), total: Number(u.total || u.capacity || 0) || null };
      }
      var st = await P.fs.stat("PediPOS");
      return { usado: Number((st && st.size) || 0), total: null };
    } catch (e) { return null; }
  }

  function htmlVacio(msg, boton) {
    return '<div class="pp-card"><h3>Consumo de la infraestructura</h3><p class="cnt">' + msg + "</p>" +
      (boton || "") + "</div>";
  }

  async function render(view) {
    var P = global.puter;
    var dest = global.PPNube.destino();
    var cab = '<div class="pp-head"><button class="pp-back" id="ppBack" aria-label="Volver">' + ((global.PPUI || {}).I || {}).chev + "</button>" +
      "<div><h2>Mi consumo en Puter</h2><p>Todo lo que PediPOS usa de la infraestructura, en un solo lugar.</p></div></div>";

    var cuerpo = "";
    if (!P || !P.auth) {
      cuerpo = htmlVacio("Puter no esta disponible en este navegador. La infraestructura de PediPOS necesita conexion para la voz y los avisos con IA.");
    } else {
      var dentro = false;
      try { dentro = !!P.auth.isSignedIn(); } catch (e) { dentro = false; }
      if (dentro && typeof dentro.then === "function") dentro = await dentro;
      if (!dentro) {
        cuerpo = htmlVacio("Para ver el consumo real hay que entrar con la cuenta de Puter. Es la misma cuenta que sostiene la infraestructura que ya usa la app.",
          '<button class="btn" id="ppIn">Conectar con Puter</button>');
      } else {
        cuerpo = await panelReal(P, dest);
      }
    }
    view.innerHTML = '<div class="pp-wrap">' + cab + cuerpo + "</div>";
    var b = $("#ppBack", view);
    if (b) b.onclick = function () { if (global.PPUI && global.PPUI.volverConfig) global.PPUI.volverConfig(); };
    var inn = $("#ppIn", view);
    if (inn) inn.onclick = async function () {
      inn.disabled = true; inn.textContent = "Conectando...";
      try { await P.auth.signIn(); render(view); } catch (e) { inn.disabled = false; inn.textContent = "Conectar con Puter"; }
    };
    var plan = $("#ppPlan", view);
    if (plan) plan.onclick = function () {
      var caja = $("#ppFrame", view);
      if (!caja) return;
      caja.hidden = false;
      caja.innerHTML = '<div class="pp-frame-h"><b>Planes de Puter</b><button class="pp-x" id="ppCerrar">Cerrar</button></div>' +
        '<iframe src="https://puter.com/dashboard" title="Planes de Puter" referrerpolicy="no-referrer"></iframe>' +
        '<p class="cnt" style="font-size:11.5px;margin:8px 0 0">Si el panel no carga aqui, usa <a href="https://puter.com/dashboard" target="_blank" rel="noopener">abrir en una ventana</a>.</p>';
      var c = $("#ppCerrar", caja); if (c) c.onclick = function () { caja.hidden = true; };
      caja.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    var upd = $("#ppUpd", view);
    if (upd) upd.onclick = function () { render(view); };
  }

  async function panelReal(P, dest) {
    var u = {}, al = {}, user = {};
    try { u = (await P.auth.getMonthlyUsage()) || {}; } catch (e) { u = {}; }
    al = u.allowanceInfo || {};
    try { user = (P.auth.getUser && P.auth.getUser()) || {}; } catch (e) { user = {}; }
    if (user && typeof user.then === "function") { try { user = await user; } catch (e) { user = {}; } }

    var total = Number(al.monthUsageAllowance || 0);
    var queda = Number(al.remaining || 0);
    var usado = Math.max(0, total - queda);
    var pctIA = total > 0 ? Math.min(100, Math.round((usado / total) * 100)) : 0;
    var creditoTotal = Math.max(CREDITOS_GLOBAL(), 1);
    var pctCred = Math.min(100, Math.round((usado / creditoTotal) * 100));

    var alm = await usoAlmacenamiento(P);
    var pctAlm = alm && alm.total ? Math.min(100, Math.round((alm.usado / alm.total) * 100)) : 0;

    var nombrePlan = String(user.plan || user.plan_name || "").toLowerCase();
    var esGratis = !nombrePlan || /free|gratis|basic/.test(nombrePlan) || user.is_free === true;
    var planTxt = esGratis ? "Plan de infraestructura gratis" : "Plan " + (user.plan || user.plan_name);

    var modelos = (global.PPNube.MODELOS || []).map(function (m) {
      var n = Number((((global.PPStore.db.ia || {}).llamadas || {})[m.id]) || 0);
      return '<div class="pp-mod"><div><b>' + m.etiqueta + '</b><small>' + m.uso + "</small></div>" +
        '<span class="pp-n">' + n + (n === 1 ? " llamada" : " llamadas") + "</span></div>";
    }).join("");

    return '<div class="pp-grid">' +
      '<div class="pp-card pp-plan"><small>Estas usando ahora</small><b>' + planTxt + "</b>" +
        '<p class="cnt" style="font-size:12px;margin:6px 0 0">' + (esGratis
          ? "Incluye 1,000 creditos gratuitos de la infraestructura. Al agotarlos, la voz y los avisos con IA se pausan hasta que subas de plan."
          : "Los consumos se descuentan de la infraestructura de la cuenta.") + "</p>" +
        '<button class="btn" id="ppPlan">Actualizar mi plan</button></div>' +

      '<div class="pp-card"><h3>Consumo de IA</h3>' +
        '<div class="pp-num"><span>Gastado este mes</span><b>' + usd(usado) + "</b></div>" +
        '<div class="pp-num"><span>Disponible</span><b class="ok">' + usd(queda) + "</b></div>" +
        barra(pctIA) +
        '<p class="cnt" style="font-size:11.5px">' + pctIA + "% del permiso mensual de IA usado.</p></div>" +

      '<div class="pp-card"><h3>Almacenamiento</h3>' +
        '<div class="pp-num"><span>Usado por PediPOS</span><b>' + (alm ? mb(alm.usado) : "sin dato") + "</b></div>" +
        '<div class="pp-num"><span>Capacidad</span><b>' + (alm && alm.total ? mb(alm.total) : "la de la cuenta") + "</b></div>" +
        barra(pctAlm, "#1E7BD6") +
        '<p class="cnt" style="font-size:11.5px">' + (alm && alm.total ? pctAlm + "% del almacenamiento usado." : "PediPOS guarda sus facturas en " + (dest === "puter" ? "Puter Drive" : "Google Drive") + ".") + "</p></div>" +

      '<div class="pp-card"><h3>Creditos gratuitos</h3>' +
        '<div class="pp-num"><span>Incluidos</span><b>1,000</b></div>' +
        '<div class="pp-num"><span>Consumidos</span><b>' + usd(usado) + "</b></div>" +
        barra(pctCred, "#E8A33D") +
        '<p class="cnt" style="font-size:11.5px">Los 1,000 creditos son de la infraestructura gratuita de Puter.</p></div>' +

      '<div class="pp-card pp-wide"><h3>Modelos que usa PediPOS</h3>' +
        (modelos || '<p class="cnt">Todavia no hay llamadas registradas.</p>') +
        '<p class="cnt" style="font-size:11.5px;margin-top:8px">Solo se muestran los modelos que la app usa de verdad, con el numero de llamadas hechas desde este equipo.</p></div>' +
      "</div>" +
      '<div class="pp-frame" id="ppFrame" hidden></div>' +
      '<div class="pp-foot"><button class="btn sec" id="ppUpd">Actualizar datos</button></div>';
  }

  function CREDITOS_GLOBAL() { return 1000; }

  global.PPConsumo = { render: render };
})(window);
