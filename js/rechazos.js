/* PediPOS · Rechazos de la DGII
   Convierte un rechazo tecnico en una explicacion en español y una accion concreta.
   El texto lo redacta DeepSeek (Puter) usando el catalogo como contexto, con cache
   local para no gastar dos veces en el mismo error. Si Puter no esta, el catalogo
   responde solo: la pantalla nunca queda vacia. */
(function (global) {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CACHE = "pp:rechazos:cache:v1";

  /* Motivos frecuentes. No es la tabla oficial de la DGII: son patrones de mensaje
     con la causa probable y lo que el comerciante debe hacer. */
  var CATALOGO = [
    { re: /rnc|cedula|c[eé]dula|comprador/i, causa: "El RNC o el nombre del comprador no es valido o no esta activo.",
      accion: "Corrige el RNC y el nombre del comprador, y reenvia.", campo: "comprador" },
    { re: /secuencia|ncf|autorizaci[oó]n|vencid/i, causa: "La secuencia e-NCF esta vencida, agotada o no autorizada para este RNC.",
      accion: "Renueva la secuencia en la DGII y actualiza el proximo e-NCF en Configuracion fiscal.", campo: "secuencia" },
    { re: /firma|certificado|sello|signature|pkcs/i, causa: "El certificado digital no corresponde al RNC o ya vencio.",
      accion: "Carga el certificado vigente del comerciante en Configuracion fiscal.", campo: "certificado" },
    { re: /monto|total|itbis|impuesto|descuento/i, causa: "Los totales del comprobante no cuadran con las lineas o con el ITBIS.",
      accion: "Revisa la venta: precios, cantidades e ITBIS de cada item.", campo: "venta" },
    { re: /fecha|periodo|vigencia/i, causa: "La fecha de emision esta fuera del rango que acepta la DGII.",
      accion: "Verifica la fecha y hora del equipo y reenvia.", campo: "ninguno" },
    { re: /duplicad|ya existe|registrad/i, causa: "Ese e-NCF ya fue usado en otro comprobante.",
      accion: "Avanza el proximo e-NCF en Configuracion fiscal y reenvia con el nuevo.", campo: "secuencia" },
    { re: /token|autentic|ambiente|semilla|401|403/i, causa: "La DGII no acepto el acceso: token vencido o ambiente equivocado.",
      accion: "Revisa el ambiente (certificacion o produccion) y reenvia.", campo: "ambiente" },
    { re: /red|network|tiempo|timeout|fetch/i, causa: "No se pudo completar la conexion con la DGII.",
      accion: "Espera a que vuelva el internet y reenvia.", campo: "ninguno" }
  ];

  function base(msg) {
    var t = String(msg || "");
    for (var i = 0; i < CATALOGO.length; i++) if (CATALOGO[i].re.test(t)) return CATALOGO[i];
    return { causa: "La DGII devolvio un motivo que no esta en el catalogo.", accion: "Reenvia una vez; si vuelve, escribele a soporte con el codigo.", campo: "ninguno" };
  }
  function leerCache() { try { return JSON.parse(localStorage.getItem(CACHE) || "{}"); } catch (e) { return {}; } }
  function guardarCache(k, v) { var c = leerCache(); c[k] = v; try { localStorage.setItem(CACHE, JSON.stringify(c)); } catch (e) {} }
  function clave(r) { return String((r.mensaje || "") + "|" + (r.ncf || "")).slice(0, 180); }

  function explicar(r) {
    var b = base(r.mensaje);
    var c = leerCache()[clave(r)];
    return { motivo: String(r.mensaje || "sin detalle"), causa: b.causa, accion: b.accion, campo: b.campo, ia: c || "" };
  }

  /* Traduccion con DeepSeek via Puter. Devuelve null si no se puede. */
  async function conIA(r) {
    var k = clave(r);
    var c = leerCache()[k];
    if (c) return c;
    if (!global.puter || !global.puter.ai || !global.puter.ai.chat) return null;
    var b = base(r.mensaje);
    var prompt = "Eres el asistente de un colmado dominicano. La DGII rechazo una factura electronica.\n" +
      "Motivo tecnico: " + String(r.mensaje || "").slice(0, 300) + "\n" +
      "Causa probable: " + b.causa + "\n" +
      "Responde SOLO con dos frases en español sencillo, sin tecnicismos y sin repetir el motivo: " +
      "la primera dice que paso, la segunda que debe hacer el comerciante.";
    try {
      var res = await global.puter.ai.chat(prompt, false, { model: "deepseek-chat" });
      var txt = String((res && (res.message && res.message.content || res.text || res)) || "").trim();
      txt = txt.replace(/^["']|["']$/g, "").slice(0, 400);
      if (txt) { guardarCache(k, txt); return txt; }
    } catch (e) {}
    return null;
  }

  function fecha(f) { try { return new Date(f).toLocaleString("es-DO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
  function money(v) { return global.PPUI ? global.PPUI.money(v) : "RD$" + v; }
  function esc(s) { return global.PPUI ? global.PPUI.esc(s) : String(s == null ? "" : s); }

  function lista() {
    if (!global.PPComprobantes) return [];
    try { return (global.PPComprobantes.all() || []).filter(function (r) {
      var e = String(r.estado || "").toLowerCase();
      return e === "rechazado" || e === "error";
    }); } catch (e) { return []; }
  }

  function render(view) {
    var regs = lista();
    var cards = regs.map(function (r) {
      var x = explicar(r);
      return '<article class="rc-card" data-id="' + esc(r.id) + '">' +
        '<header class="rc-h"><span class="rc-pill">Rechazado</span>' +
          '<b>' + esc(r.ncf || "sin e-NCF") + '</b><span class="rc-m">' + money(r.total) + '</span></header>' +
        '<p class="rc-f">' + esc(fecha(r.fecha)) + (r.trackId ? ' · ' + esc(r.trackId) : '') + '</p>' +
        '<div class="rc-b"><span class="rc-lb">Que paso</span><p class="rc-txt" data-ia="' + esc(r.id) + '">' + esc(x.ia || x.causa) + '</p></div>' +
        '<div class="rc-b"><span class="rc-lb">Que hacer</span><p class="rc-txt">' + esc(x.accion) + '</p></div>' +
        '<p class="rc-code"><span>Motivo DGII</span> ' + esc(x.motivo) + '</p>' +
        '<div class="rc-acc">' +
          '<button class="rc-btn" data-fix="' + esc(r.id) + '">Corregir y reenviar</button>' +
          (r.xml ? '<button class="rc-mini" data-xml="' + esc(r.id) + '">Ver XML</button>' : '') +
        '</div></article>';
    }).join("");

    view.innerHTML =
      '<section class="rc-hero"><div class="rc-hero-t"><span class="rc-dot"></span>Facturacion electronica</div>' +
        '<h2>Rechazos</h2><p>Un rechazo no anula la venta: el cobro ya se hizo. Aqui se corrige y se reenvia.</p>' +
        '<div class="rc-kpis"><div><b>' + regs.length + '</b><small>Por resolver</small></div>' +
        '<div><b>' + (global.PPComprobantes ? (global.PPComprobantes.all() || []).filter(function (r) { return r.estado === "aceptado"; }).length : 0) + '</b><small>Aceptadas</small></div></div>' +
      '</section>' +
      (regs.length ? '<div class="rc-list">' + cards + '</div>'
        : '<div class="rc-empty"><b>Todo en orden</b><p>No hay comprobantes rechazados. Si aparece uno, aqui veras que paso y como resolverlo.</p></div>');

    $$("[data-fix]", view).forEach(function (b) {
      b.onclick = function () { abrirCorreccion(b.getAttribute("data-fix")); };
    });
    $$("[data-xml]", view).forEach(function (b) {
      b.onclick = function () { verXml(b.getAttribute("data-xml")); };
    });
    /* la explicacion con IA llega despues, sin bloquear la pantalla */
    regs.forEach(function (r) {
      var x = explicar(r);
      if (x.ia) return;
      conIA(r).then(function (txt) {
        if (!txt) return;
        var el = $('[data-ia="' + r.id + '"]');
        if (el) { el.textContent = txt; el.classList.add("ia"); }
      });
    });
  }

  function abrirCorreccion(id) {
    var r = (global.PPComprobantes.all() || []).filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var x = explicar(r);
    var campos = "";
    if (x.campo === "comprador") {
      campos = '<label class="field"><span>RNC del comprador</span><input id="rcRnc" inputmode="numeric" placeholder="131234567"></label>' +
        '<label class="field"><span>Nombre o razon social</span><input id="rcNom" placeholder="Empresa SRL"></label>';
    }
    var nota = x.campo === "secuencia" || x.campo === "certificado" || x.campo === "ambiente"
      ? '<button class="btn sec" id="rcIr">Ir a Configuracion fiscal</button>' : "";
    var s = global.PPUI.sheet('<div class="sh-h"><h2>Corregir y reenviar</h2><button class="sh-x" id="rcX">' + (global.PPUI.I.xDown || "x") + '</button></div>' +
      '<p class="cnt">' + esc(x.causa) + '</p>' + campos + nota +
      '<div class="sh-f solo"><button class="big" id="rcOk">Reenviar ahora</button></div>');
    $("#rcX", s).onclick = global.PPUI.closeSheet;
    var ir = $("#rcIr", s);
    if (ir) ir.onclick = function () { global.PPUI.closeSheet(); global.PPUI.go("fiscal"); };
    $("#rcOk", s).onclick = async function () {
      var btn = this; btn.disabled = true; btn.textContent = "Reenviando...";
      var cambios = {};
      if (x.campo === "comprador") {
        cambios.compradorRnc = ($("#rcRnc", s) || {}).value || "";
        cambios.compradorNombre = ($("#rcNom", s) || {}).value || "";
      }
      var res = await reenviar(r, cambios);
      global.PPUI.closeSheet();
      global.PPUI.toast(res && res.ok ? "Reenviado a la DGII" : ("No se pudo: " + ((res && res.error) || "error")));
      if (global.render) global.render();
    };
  }

  async function reenviar(r, cambios) {
    if (global.PPFiscal && global.PPFiscal.reenviar) {
      return global.PPFiscal.reenviar(r.id, cambios);
    }
    return { ok: false, error: "El modulo fiscal no expone reenvio" };
  }

  function verXml(id) {
    var r = (global.PPComprobantes.all() || []).filter(function (x) { return x.id === id; })[0];
    if (!r || !r.xml) return;
    var s = global.PPUI.sheet('<div class="sh-h"><h2>XML del comprobante</h2><button class="sh-x" id="rcX2">' + (global.PPUI.I.xDown || "x") + '</button></div>' +
      '<pre class="rc-xml">' + esc(r.xml) + '</pre>');
    $("#rcX2", s).onclick = global.PPUI.closeSheet;
  }

  global.PPRechazos = { render: render, explicar: explicar, conIA: conIA, catalogo: base, reenviar: reenviar, abrirCorreccion: abrirCorreccion };
})(window);
