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
    { id: "deepseek-chat", etiqueta: "DeepSeek Chat", uso: "Interpreta los pedidos dictados y explica rechazos" },
    { id: "whisper", etiqueta: "Whisper", uso: "Transcribe la voz del comerciante a texto" }
  ];
  var CREDITOS_GRATIS = 1000;

  function db() { return S.db; }
  function ajustes() {
    var d = db();
    d.settings = d.settings || {};
    d.settings.nube = d.settings.nube || { destino: "puter" };
    return d.settings.nube;
  }

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
    /* la transcripcion de voz usa Whisper: se cuenta aparte, con su propio nombre */
    if (typeof P.ai.speech2txt === "function") {
      var origS2T = P.ai.speech2txt;
      P.ai.speech2txt = function () {
        try { contar("whisper"); } catch (e) {}
        return origS2T.apply(P.ai, arguments);
      };
    }
    P.ai.__ppContado = true;
  }

  /* ---------- guardar una factura en la nube elegida ---------- */
  async function guardarFactura(nombre, contenido, tipo) {
    var donde = destino();
    if (donde === "puter") {
      var P = global.puter;
      if (!P || !P.fs) throw new Error("Puter no esta disponible");
      var f = new Date();
      var anio = String(f.getFullYear()), mes = ("0" + (f.getMonth() + 1)).slice(-2);
      var carpeta = "PediPOS/facturas/" + anio + "/" + mes;
      try { await P.fs.mkdir(carpeta, { createMissingParents: true }); } catch (e) {}
      var ruta = carpeta + "/" + nombre;
      await P.fs.write(ruta, contenido, { createMissingParents: true, overwrite: true });
      return { ok: true, destino: "puter", ruta: ruta };
    }
    return { ok: false, destino: "google", pendiente: true };
  }

  /* ---------- Boveda del certificado digital ----------
     El .p12 (clave privada + certificado) y su clave se suben a Puter SIEMPRE cifrados
     con AES-GCM en este equipo. La frase de proteccion no se guarda en ningun sitio:
     sin ella, el archivo en la nube no sirve a nadie. */
  function aB64(u8) { var s = ""; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function deB64(b) { var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  async function llaveDe(frase, sal) {
    var enc = new TextEncoder();
    var base = await crypto.subtle.importKey("raw", enc.encode(frase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: sal, iterations: 210000, hash: "SHA-256" }, base,
      { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function cifrar(texto, frase) {
    var sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    var k = await llaveDe(frase, sal);
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(texto)));
    return JSON.stringify({ v: 1, alg: "AES-256-GCM+PBKDF2-SHA256", sal: aB64(sal), iv: aB64(iv), datos: aB64(ct) });
  }
  async function descifrar(json, frase) {
    var o = JSON.parse(json), k = await llaveDe(frase, deB64(o.sal));
    var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(o.iv) }, k, deB64(o.datos));
    return new TextDecoder().decode(pt);
  }
  var RUTA_CERT = "PediPOS/certificado/certificado.p12.enc";
  async function guardarCertificado(p12base64, claveP12, frase) {
    var P = global.puter;
    if (!P || !P.fs) throw new Error("Puter no esta disponible");
    if (!frase || frase.length < 8) throw new Error("La frase de proteccion debe tener al menos 8 caracteres");
    var paquete = await cifrar(JSON.stringify({ p12: p12base64, clave: claveP12 || "", guardado: new Date().toISOString() }), frase);
    try { await P.fs.mkdir("PediPOS/certificado", { createMissingParents: true }); } catch (e) {}
    await P.fs.write(RUTA_CERT, paquete, { createMissingParents: true, overwrite: true });
    return { ok: true, ruta: RUTA_CERT };
  }
  async function recuperarCertificado(frase) {
    var P = global.puter;
    if (!P || !P.fs) throw new Error("Puter no esta disponible");
    var blob = await P.fs.read(RUTA_CERT);
    var txt = typeof blob === "string" ? blob : await blob.text();
    return JSON.parse(await descifrar(txt, frase));
  }
  async function hayCertificado() {
    try { var P = global.puter; if (!P || !P.fs) return false; await P.fs.stat(RUTA_CERT); return true; } catch (e) { return false; }
  }

  /* donde se guardan las facturas: lo elige el comerciante en Sincronizacion */
  function destino() {
    var d = ajustes().destino;
    return (d === "google") ? "google" : "puter";
  }
  function setDestino(n) { ajustes().destino = (n === "google") ? "google" : "puter"; S.save(); }

  global.PPNube = { guardarCertificado: guardarCertificado, recuperarCertificado: recuperarCertificado, hayCertificado: hayCertificado, destino: destino, setDestino: setDestino, guardarFactura: guardarFactura, contar: contar, MODELOS: MODELOS, engancharContador: engancharContador };
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
    var b = Number(n) || 0, f = function (x) { return x.toFixed(2).replace(".", ","); };
    if (b >= 1073741824) return f(b / 1073741824) + " GB";
    if (b >= 1048576) return f(b / 1048576) + " MB";
    if (b >= 1024) return f(b / 1024) + " KB";
    return b + (b === 1 ? " byte" : " bytes");
  }
  var CAP_GRATIS = 25 * 1048576;     /* almacenamiento del plan gratuito de Puter */

  async function tamanoCarpeta(P, ruta) {
    var total = 0;
    try {
      var items = await P.fs.readdir(ruta);
      for (var i = 0; i < items.length; i++) {
        var it = items[i], p = ruta + "/" + it.name;
        if (it.is_dir || it.isDir) total += await tamanoCarpeta(P, p);
        else {
          try { var st = await P.fs.stat(p, { return_size: true }); total += Number((st && st.size) || 0); } catch (e) {}
        }
      }
    } catch (e) {}
    return total;
  }

  async function usoAlmacenamiento(P) {
    var usado = 0, total = null;
    /* capacidad de la cuenta: se prueban las vias que expone Puter */
    var intentos = [
      function () { return P.fs.usage && P.fs.usage(); },
      function () { return P.fs.getUsage && P.fs.getUsage(); },
      function () { return P.auth.getStorageUsage && P.auth.getStorageUsage(); }
    ];
    for (var i = 0; i < intentos.length; i++) {
      try {
        var u = await intentos[i]();
        if (u) {
          usado = Number(u.used || u.usage || u.usedBytes || 0) || usado;
          total = Number(u.total || u.capacity || u.quota || u.limit || 0) || total;
          if (total) break;
        }
      } catch (e) {}
    }
    /* lo que ocupa realmente PediPOS, sumando la carpeta de facturas */
    var propio = await tamanoCarpeta(P, "PediPOS");
    if (!usado) usado = propio;
    if (!total) {
      try {
        var mu = await P.auth.getMonthlyUsage();
        var al = (mu && mu.allowanceInfo) || {};
        total = Number(al.storageAllowance || al.storageTotal || 0) || null;
        if (!usado) usado = Number(al.storageUsed || 0) || 0;
      } catch (e) {}
    }
    return { usado: usado, total: total, propio: propio };
  }

  function htmlVacio(msg, boton) {
    return '<div class="pp-card"><h3>Consumo de la infraestructura</h3><p class="cnt">' + msg + "</p>" +
      (boton || "") + "</div>";
  }

  /* Llamadas de cada servicio segun la cuenta de Puter; si no hay dato, las locales. */
  function usoDeApi(u, tipo) {
    var usage = (u && u.usage) || {};
    var keys = Object.keys(usage);
    var pat = tipo === "chat" ? /chat/i : /speech|transcri|whisper|txt2speech/i;
    for (var i = 0; i < keys.length; i++) {
      if (!pat.test(keys[i])) continue;
      var it = usage[keys[i]] || {};
      return { count: Number(it.count || 0), cost: Number(it.cost || 0) };
    }
    return null;
  }

  function filaServicio(nombre, detalle, usado, quedan) {
    var txt = usado === 1 ? "1 llamada" : usado + " llamadas";
    var dis = (quedan === null || quedan === undefined) ? "sin dato de disponibilidad"
      : (quedan === 1 ? "queda 1 llamada" : "quedan " + quedan + " llamadas");
    return '<div class="pp-srv"><div class="pp-srv-t"><b>' + nombre + '</b><span>' + txt + "</span></div>" +
      '<small>' + detalle + " &middot; " + dis + "</small></div>";
  }

  /* La pantalla se pinta al instante; lo de Puter llega despues, sin retrasar nada. */
  function render(view, opts) {
    opts = opts || {};
    var volver = (typeof opts.volver === "function") ? opts.volver : function () {
      if (global.PPUI && global.PPUI.volverConfig) global.PPUI.volverConfig();
    };
    var cab = '<div class="pp-head"><button class="pp-back" id="ppBack" aria-label="Volver">' + ((global.PPUI || {}).I || {}).chev + "</button>" +
      "<div><h2>Mi consumo en Puter</h2><p>Todo lo que PediPOS usa de la infraestructura, en un solo lugar.</p></div></div>";
    view.innerHTML = '<div class="pp-wrap">' + cab +
      '<div id="ppBody"><div class="pp-card"><p class="cnt">Leyendo tu consumo...</p></div></div></div>';
    var b = $("#ppBack", view);
    if (b) b.onclick = volver;
    cargar(view, volver);
  }

  async function cargar(view, volver) {
    var cuerpo = "";
    try { cuerpo = await cuerpoDePanel(); }
    catch (e) { cuerpo = htmlVacio("No se pudo leer el consumo ahora mismo. Revisa tu conexion e intenta de nuevo."); }
    var caja = $("#ppBody", view);
    if (!caja) return;
    caja.innerHTML = cuerpo;

    var inn = $("#ppIn", view);
    if (inn) inn.onclick = async function () {
      inn.disabled = true; inn.textContent = "Conectando...";
      try { await global.puter.auth.signIn(); render(view, { volver: volver }); }
      catch (e) { inn.disabled = false; inn.textContent = "Conectar con Puter"; }
    };
    var plan = $("#ppPlan", view);
    if (plan) plan.onclick = function () { window.open("https://puter.com/dashboard#billing", "_blank", "noopener"); };
    var ver = $("#ppVerFac", view);
    if (ver) ver.onclick = function () { window.open("https://puter.com/dashboard#files", "_blank", "noopener"); };
    var upd = $("#ppUpd", view);
    if (upd) upd.onclick = function () { render(view, { volver: volver }); };
  }

  async function cuerpoDePanel() {
    var P = global.puter;
    if (!P || !P.auth) {
      return htmlVacio("Puter no esta disponible en este navegador. La infraestructura de PediPOS necesita conexion para la voz y los avisos con IA.");
    }
    var dentro = false;
    try { dentro = !!P.auth.isSignedIn(); } catch (e) { dentro = false; }
    if (dentro && typeof dentro.then === "function") dentro = await dentro;
    if (!dentro) {
      return htmlVacio("Para ver el consumo real hay que entrar con la cuenta de Puter. Es la misma cuenta que sostiene la infraestructura que ya usa la app.",
        '<button class="btn" id="ppIn">Conectar con Puter</button>');
    }
    return await panelReal(P);
  }

  async function panelReal(P) {
    var u = {}, al = {}, user = {};
    try { u = (await P.auth.getMonthlyUsage()) || {}; } catch (e) { u = {}; }
    al = u.allowanceInfo || {};
    try { user = (P.auth.getUser && P.auth.getUser()) || {}; } catch (e) { user = {}; }
    if (user && typeof user.then === "function") { try { user = await user; } catch (e) { user = {}; } }

    var total = Number(al.monthUsageAllowance || 0);
    var queda = Number(al.remaining || 0);
    var usado = Math.max(0, total - queda);
    var creditoTotal = Math.max(CREDITOS_GLOBAL(), 1);
    var creditosUsados = total > 0 ? Math.min(creditoTotal, Math.round((usado / total) * creditoTotal)) : 0;
    var pctCred = Math.min(100, Math.round((creditosUsados / creditoTotal) * 100));

    var alm = await usoAlmacenamiento(P);
    var capAlm = (alm && alm.total) ? alm.total : CAP_GRATIS;
    var usadoAlm = alm ? (alm.usado || alm.propio || 0) : 0;
    var pctAlmReal = capAlm > 0 ? (usadoAlm / capAlm) * 100 : 0;
    var pctAlm = Math.min(100, pctAlmReal);
    var pctAlmTxt = pctAlmReal > 0 && pctAlmReal < 1 ? "<1" : String(Math.round(pctAlmReal));

    var nombrePlan = String(user.plan || user.plan_name || "").toLowerCase();
    var esGratis = !nombrePlan || /free|gratis|basic/.test(nombrePlan) || user.is_free === true;
    var planTxt = esGratis ? "Plan de infraestructura gratis" : "Plan " + (user.plan || user.plan_name);

    /* llamadas y disponibilidad de los dos servicios que usa la app */
    var chat = usoDeApi(u, "chat"), voz = usoDeApi(u, "voz");
    var nChat = chat ? chat.count : llamadasDe("deepseek-chat");
    var nVoz = voz ? voz.count : llamadasDe("whisper");
    var qChat = (chat && chat.count > 0 && chat.cost > 0) ? Math.floor(queda / (chat.cost / chat.count)) : null;
    var qVoz = (voz && voz.count > 0 && voz.cost > 0) ? Math.floor(queda / (voz.cost / voz.count)) : null;

    return '<div class="pp-grid">' +
      '<div class="pp-card pp-plan"><small>Estas usando ahora</small><b>' + planTxt + "</b>" +
        '<p class="cnt" style="font-size:12px;margin:6px 0 0">' + (esGratis
          ? "Incluye 1,000 creditos gratuitos de la infraestructura. Al agotarlos, la voz y los avisos con IA se pausan hasta que subas de plan."
          : "Los consumos se descuentan de la infraestructura de la cuenta.") + "</p>" +
        '<button class="btn" id="ppPlan">Actualizar mi plan</button></div>' +

      '<div class="pp-card"><h3>Puter Drive</h3>' +
        '<p class="cnt" style="font-size:12px;margin:0 0 10px">Aqui se archivan tus facturas electronicas y el certificado del negocio, cifrado, en tu propia cuenta. Desde el Drive puedes abrirlos o descargarlos cuando quieras.</p>' +
        '<button class="btn sec" id="ppVerFac">Ver mi Drive</button></div>' +

      '<div class="pp-card pp-uso"><h3>Almacenamiento</h3>' +
        '<p class="pp-sub"><b>' + pctAlmTxt + '%</b> &middot; ' + mb(alm ? (alm.usado || alm.propio || 0) : 0) + ' usado de ' + mb(capAlm) + '</p>' +
        barra(pctAlm, "#1E7BD6") +
        '<details class="pp-det"><summary>Detalles de uso</summary>' +
          '<div class="pp-num"><span>Facturas y certificado (PediPOS)</span><b>' + mb(alm ? (alm.propio || 0) : 0) + '</b></div>' +
          '<div class="pp-num"><span>Total en tu cuenta</span><b>' + mb(alm ? (alm.usado || 0) : 0) + '</b></div>' +
          '<div class="pp-num"><span>Capacidad del plan</span><b>' + mb(capAlm) + '</b></div></details></div>' +

      '<div class="pp-card pp-uso"><h3>Creditos mensuales</h3>' +
        '<p class="pp-sub"><b>' + pctCred + '%</b> &middot; ' + creditosUsados + ' usado de ' + creditoTotal + ' creditos</p>' +
        barra(pctCred, pctCred >= 90 ? "#D64545" : "#C4A81F") +
        filaServicio("DeepSeek Chat", "Interpreta los pedidos dictados", nChat, qChat) +
        filaServicio("Whisper", "Transcribe la voz a texto", nVoz, qVoz) +
        '<p class="cnt" style="font-size:11.5px;margin:8px 0 0">Las llamadas son las del mes en curso; la disponibilidad se estima con los creditos que te quedan.</p>' +
      "</div>" +
      "</div>" +
      '<div class="pp-foot"><button class="btn sec" id="ppUpd">Actualizar datos</button></div>';
  }

  function CREDITOS_GLOBAL() { return 1000; }

  global.PPConsumo = { render: render };
})(window);
