/* PediPOS Fiscal · pantalla de facturacion electronica (DGII)
 * Se engancha como pestaña "Fiscal" y guarda todo en el espejo local (PPStore).
 * El comerciante configura una sola vez: RNC, datos, secuencia y certificado.
 */
(function (global) {
  "use strict";

  var S = global.PPStore;
  var db = function () { return S.db; };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function cfg() {
    var d = db();
    d.fiscal = d.fiscal || {
      activo: false, rnc: "", razonSocial: "", nombreComercial: "", direccion: "",
      ambiente: "certecf", tipo: "32", ncf: "", vencimientoSecuencia: "", demo: true,
      p12: "", ultimoError: ""
    };
    d.ecf = d.ecf || [];
    return d.fiscal;
  }
  function guardar() { S.save(); }
  function toast(t) { if (global.toast) global.toast(t); }
  function money(n) { return "RD$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); }
  function fecha(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short" }) + " " +
      d.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  var COLOR = {
    borrador: "#8A93A6", firmado: "#2563EB", enviado: "#B45309",
    aceptado: "#15803D", rechazado: "#B91C1C", error: "#B91C1C", encola: "#6B7280"
  };

  /* ---------- siguiente e-NCF ---------- */
  function siguienteNcf(c) {
    var actual = (c.ncf || "").trim().toUpperCase();
    if (!actual) return "";
    var m = actual.match(/^([A-Z])(\d{2})(\d+)$/);
    if (!m) return actual;
    var serie = m[1], tipo = m[2], num = m[3];
    var sig = String(Number(num) + 1).padStart(num.length, "0");
    return serie + tipo + sig;
  }

  /* ---------- activacion ligada al interruptor ITBIS ----------
   * ITBIS encendido  -> la factura electronica queda activa y se emite al cobrar.
   * ITBIS apagado    -> se desactiva la emision; la venta sigue, pero informal.
   */
  function activo() { return !!cfg().activo; }
  function setActivo(v) {
    var c = cfg(), antes = !!c.activo;
    c.activo = !!v;
    guardar();
    return antes !== c.activo;
  }

  /* ---------- emision ---------- */
  async function emitir(sale, opts) {
    var c0 = cfg();
    if (emisorBloqueado(c0)) {
      toast("Esta secuencia pertenece al equipo " + c0.emisorId + ". Usala desde ese equipo o liberala en Fiscal.");
      return { ok: false, error: "secuencia de otro equipo" };
    }
    var c = cfg();
    opts = opts || {};
    if (!c.activo && !opts.forzar) {
      return { ok: false, error: "La facturacion electronica esta apagada: enciende el ITBIS en el panel de venta" };
    }
    if (!c.rnc) return { ok: false, error: "Falta el RNC del comerciante en Ajustes fiscales" };

    var valores = {
      ncf: c.ncf,
      total: sale.total,
      codigoSeguridad: String(Math.floor(Math.random() * 1e9)).padStart(9, "0")
    };

    var reg = {
      id: "ECF-" + Date.now().toString(36).toUpperCase(),
      fecha: new Date().toISOString(),
      saleId: sale.vid, cliente: sale.cliente || "Consumidor final",
      total: sale.total, itbis: sale.itbis || 0,
      tipo: c.tipo, ncf: valores.ncf, ambiente: c.ambiente,
      estado: "borrador", trackId: "", mensaje: "", codigoSeguridad: valores.codigoSeguridad,
      xml: "", demo: !!c.demo
    };

    try {
      var xml = global.ECF.buildEcf(sale, c);
      reg.xml = xml;
      reg.estado = "firmado";

      if (c.demo) {
        /* flujo completo simulado: firma si hay certificado, si no firma simbologica */
        if (c.p12) {
          try {
            var cred = global.ECF.cargarP12(c.p12, opts.pass || "");
            reg.xml = global.ECF.firmar(xml, cred);
          } catch (e) { reg.mensaje = "Firmado en demo sin certificado valido: " + e.message; }
        }
        var r = global.ECF.demo(opts.forzarRechazo ? "rechazado" : "aceptado");
        reg.trackId = r.trackId; reg.estado = r.estado; reg.mensaje = r.mensaje;
      } else {
        var cred2 = global.ECF.cargarP12(c.p12, opts.pass || "");
        var firmado = global.ECF.firmar(xml, cred2);
        reg.xml = firmado;
        var tk = await global.ECF.token(c, cred2);
        var env = await global.ECF.enviar(c, firmado, tk);
        reg.trackId = env.trackId; reg.mensaje = env.mensaje;
        reg.estado = env.trackId ? "enviado" : "error";
        if (env.trackId) {
          var est = await global.ECF.estado(c, env.trackId, tk);
          reg.estado = est.estado;
          reg.mensaje = est.detalle || reg.mensaje;
        }
      }
    } catch (e) {
      var msg = String(e.message || e);
      var sinRed = /Failed to fetch|NetworkError|Load failed|ERR_NETWORK|ERR_INTERNET|timeout|timed out/i.test(msg);
      reg.estado = sinRed ? "encola" : "error";
      reg.mensaje = sinRed ? "Sin conexion: queda en cola y se envia solo al volver la red" : msg;
      c.ultimoError = sinRed ? "" : msg;
    }

    if (global.PPComprobantes) global.PPComprobantes.add(reg); else { db().ecf = db().ecf || []; db().ecf.unshift(reg); }
    if (reg.estado !== "error" && reg.estado !== "rechazado") c.ncf = siguienteNcf(c);
    guardar();
    return { ok: reg.estado === "aceptado" || reg.estado === "enviado", reg: reg };
  }


  /* ---------- cola de contingencia: reintenta lo que no salio ---------- */
  async function reintentar() {
    var c = cfg();
    var pend = (global.PPComprobantes ? global.PPComprobantes.all() : (db().ecf || [])).filter(function (r) { return r.estado === "encola" || r.estado === "error"; });
    if (!pend.length) return { ok: true, enviados: 0 };
    var cred = null;
    if (!c.demo) {
      try { cred = global.ECF.cargarP12(c.p12, global.__ppFiscalPass || ""); }
      catch (e) { return { ok: false, error: "No se pudo abrir el certificado: " + e.message }; }
    }
    var tk = "";
    if (cred) { try { tk = await global.ECF.token(c, cred); } catch (e) { return { ok: false, error: String(e.message || e) }; } }
    var hechos = 0;
    for (var i = 0; i < pend.length; i++) {
      var r = pend[i];
      try {
        if (c.demo) {
          var d = global.ECF.demo("aceptado");
          r.trackId = d.trackId; r.estado = d.estado; r.mensaje = d.mensaje;
        } else {
          var env = await global.ECF.enviar(c, r.xml, tk);
          r.trackId = env.trackId; r.mensaje = env.mensaje;
          if (env.trackId) {
            var est = await global.ECF.estado(c, env.trackId, tk);
            r.estado = est.estado; r.mensaje = est.detalle || r.mensaje;
          } else { r.estado = "encola"; }
        }
        if (r.estado === "aceptado" || r.estado === "enviado") { hechos++; c.ncf = siguienteNcf(c); }
      } catch (e) { r.mensaje = String(e.message || e); }
    }
    guardar();
    return { ok: true, enviados: hechos };
  }


  /* ---------- identidad del equipo: una secuencia pertenece a un solo emisor ---------- */
  function deviceId() {
    var k = "pedipos.device.v1";
    try {
      var v = localStorage.getItem(k);
      if (!v) { v = "EQ-" + Math.random().toString(36).slice(2, 8).toUpperCase(); localStorage.setItem(k, v); }
      return v;
    } catch (e) { return "EQ-LOCAL"; }
  }
  function emisorBloqueado(c) {
    return !!(c && c.emisorId && c.emisorId !== deviceId());
  }

  /* ---------- vista ---------- */
  function render(view) {
    var c = cfg();
    var lista = global.PPComprobantes ? global.PPComprobantes.all() : (db().ecf || []);
    var ventas = (db().sales || []).slice(0, 5);
    var listo = !!(c.rnc && c.ncf);
    var aceptados = lista.filter(function (x) { return x.estado === "aceptado"; }).length;
    var pendientes = lista.filter(function (x) { return x.estado === "enviado"; }).length;
    var rechazados = lista.filter(function (x) { return x.estado === "rechazado" || x.estado === "error"; }).length;

    view.innerHTML =
      '<div class="ecf-wrap">' +
        '<section class="ecf-hero ' + (c.demo ? "demo" : "prod") + '">' +
          '<div class="ecf-hero-t"><span class="ecf-dot"></span>' +
            (c.demo ? "Modo demostración" : (c.ambiente === "certecf" ? "Certificación DGII" : "Producción DGII")) +
          "</div>" +
          "<h2>Facturación electrónica</h2>" +
          "<p>" + (listo
            ? "Cada venta se emite como e-CF desde esta computadora: la firma y el envio salen de aqui, sin servidores de por medio."
            : "Configura tu RNC y tu secuencia una sola vez. Después solo cobras.") + "</p>" +
          '<div class="ecf-kpis">' +
            '<div><b>' + aceptados + "</b><small>Aceptadas</small></div>" +
            '<div><b>' + pendientes + "</b><small>Enviadas</small></div>" +
            '<div><b>' + rechazados + "</b><small>Con problema</small></div>" +
          "</div>" +
        "</section>" +

        (listo ? "" :
          '<section class="ecf-card">' +
            "<h3>Configuración fiscal</h3>" +
            '<label>RNC del comerciante<input id="f-rnc" inputmode="numeric" placeholder="131234567" value="' + (c.rnc || "") + '"></label>' +
            '<label>Razón social<input id="f-razon" placeholder="Colmado La Esquina SRL" value="' + (c.razonSocial || "") + '"></label>' +
            '<label>Nombre comercial<input id="f-nombre" placeholder="Colmado La Esquina" value="' + (c.nombreComercial || "") + '"></label>' +
            '<label>Dirección<input id="f-dir" placeholder="Calle, sector, provincia" value="' + (c.direccion || "") + '"></label>' +
            '<div class="ecf-two">' +
              '<label>Ambiente<select id="f-amb"><option value="certecf"' + (c.ambiente === "certecf" ? " selected" : "") + '>Certificación</option><option value="testecf"' + (c.ambiente === "testecf" ? " selected" : "") + '>Pruebas (testecf)</option><option value="ecf"' + (c.ambiente === "ecf" ? " selected" : "") + ">Producción</option></select></label>" +
              '<label>Tipo<select id="f-tipo"><option value="32"' + (c.tipo === "32" ? " selected" : "") + '>Consumo (32)</option><option value="31"' + (c.tipo === "31" ? " selected" : "") + ">Crédito fiscal (31)</option></select></label>" +
            "</div>" +
            '<div class="ecf-two">' +
              '<label>Próximo e-NCF<input id="f-ncf" placeholder="E320000000001" value="' + (c.ncf || "") + '"></label>' +
              '<label>Vence secuencia<input id="f-venc" type="date" value="' + (c.vencimientoSecuencia || "") + '"></label>' +
            "</div>" +
            '<label class="ecf-file">Certificado (.p12)<input id="f-p12" type="file" accept=".p12,.pfx"></label>' +
            '<label>Clave del certificado<input id="f-pass" type="password" placeholder="Se pide al firmar"></label>' +
            '<label class="ecf-check"><input id="f-demo" type="checkbox"' + (c.demo ? " checked" : "") + "> Modo demostración (no envía a la DGII)</label>" +
            '<div class="ecf-emi"><span>Equipo emisor: <b>' + (c.emisorId || deviceId()) + "</b></span>" +
              (emisorBloqueado(c) ? '<button class="ecf-mini" id="f-libre">Liberar para este equipo</button>' : "") + "</div>" +
            '<button class="ecf-btn" id="f-save">Guardar configuración</button>' +
          "</section>") +

        '<section class="ecf-card">' +
          "<h3>Emitir ahora</h3>" +
          (ventas.length
            ? '<p class="ecf-muted">Elige la venta que quieres facturar.</p>' +
              '<div class="ecf-sales">' + ventas.map(function (s) {
                return '<button class="ecf-sale" data-sale="' + s.vid + '">' +
                  "<span>" + (s.cliente || "Consumidor final") + "</span>" +
                  "<b>" + money(s.total) + "</b>" +
                  '<small>' + fecha(s.fecha) + " · " + (s.lineas || []).length + " art.</small></button>";
              }).join("") + "</div>"
            : '<p class="ecf-muted">Aún no hay ventas. Cobra una en el talonario y vuelve aquí.</p>') +
          '<button class="ecf-btn ghost" id="f-demo-sale">Probar con una venta de ejemplo</button>' +
          '<p class="ecf-note" id="f-note"></p>' +
        "</section>" +

        '<section class="ecf-card">' +
          "<h3>Comprobantes</h3>" +
          '<div class="ecf-exp"><button class="ecf-mini" id="f-exp-json">Exportar JSON</button>' +
            '<button class="ecf-mini" id="f-exp-csv">Exportar CSV</button>' +
            "<span>" + lista.length + " guardados en este equipo</span></div>" +
          ((lista.filter(function (x) { return x.estado === "encola" || x.estado === "error"; }).length)
            ? '<button class="ecf-btn ghost" id="f-retry" style="margin:0 0 12px">Reintentar ' +
              lista.filter(function (x) { return x.estado === "encola" || x.estado === "error"; }).length +
              " pendiente(s)</button>"
            : "") +
          (lista.length ? '<div class="ecf-list">' + lista.map(function (r) {
            return '<div class="ecf-row" data-id="' + r.id + '">' +
              '<span class="ecf-tag" style="background:' + (COLOR[r.estado] || "#666") + '">' + r.estado + "</span>" +
              "<div><b>" + (r.ncf || "sin e-NCF") + "</b><small>" + fecha(r.fecha) + " · " + money(r.total) +
              (r.trackId ? " · " + r.trackId : "") + "</small></div>" +
              '<button class="ecf-mini" data-xml="' + r.id + '">XML</button>' +
            "</div>";
          }).join("") + "</div>"
          : '<p class="ecf-muted">Todavía no hay comprobantes emitidos.</p>') +
        "</section>" +

        (c.ultimoError ? '<p class="ecf-error">Último error: ' + c.ultimoError + "</p>" : "") +
      "</div>";

    /* guardar configuracion */
    var libre = $("#f-libre", view);
    if (libre) libre.onclick = function () {
      var cc = cfg();
      cc.emisorId = deviceId();
      guardar();
      toast("Secuencia liberada para este equipo");
      if (global.render) global.render();
    };

    var save = $("#f-save", view);
    if (save) save.onclick = function () {
      var ncfNuevo = ($("#f-ncf", view).value || "").trim().toUpperCase();
      c.rnc = global.ECF.rncLimpio($("#f-rnc", view).value);
      c.razonSocial = $("#f-razon", view).value.trim();
      c.nombreComercial = $("#f-nombre", view).value.trim();
      c.direccion = $("#f-dir", view).value.trim();
      c.ambiente = $("#f-amb", view).value;
      c.tipo = $("#f-tipo", view).value;
      c.ncf = ncfNuevo;
      c.vencimientoSecuencia = $("#f-venc", view).value;
      c.demo = $("#f-demo", view).checked;
      var pass = $("#f-pass", view).value;
      if (pass) global.__ppFiscalPass = pass;
      c.activo = !!(c.rnc && c.ncf);
      /* regla de un solo emisor por secuencia: la secuencia queda atada a este equipo */
      if (!c.emisorId) c.emisorId = deviceId();
      if (c.emisorId !== deviceId()) {
        toast("Esta secuencia pertenece a " + c.emisorId + ". Liberala aqui para emitir desde este equipo.");
      }
      guardar();
      if (c.rnc && global.PPEmisores) {
        global.PPEmisores.registrar({
          rnc: c.rnc, razonSocial: c.razonSocial || "", nombreComercial: c.nombreComercial || "",
          ambiente: c.ambiente, secuencia: c.ncf, vencimientoSecuencia: c.vencimientoSecuencia || "",
          certVence: c.certVence || "", emisorId: c.emisorId
        });
      }
      toast(c.activo ? "Configuración fiscal guardada" : "Falta RNC o e-NCF");
      if (global.render) global.render();
    };

    /* certificado */
    var file = $("#f-p12", view);
    if (file) file.onchange = function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        c.p12 = String(fr.result || "").split(",").pop();
        /* se lee el vencimiento del certificado para poder avisar antes de que caduque */
        try {
          var pass0 = global.__ppFiscalPass || ($("#f-pass", view) ? $("#f-pass", view).value : "") || "";
          var cred0 = global.ECF.cargarP12(c.p12, pass0);
          var cert = cred0 && cred0.cert;
          var hasta = cert && cert.validity && cert.validity.notAfter;
          if (hasta) c.certVence = new Date(hasta).toISOString();
        } catch (e) { /* la clave se pide al emitir */ }
        guardar();
        if (c.rnc && global.PPEmisores) {
          global.PPEmisores.registrar({
            rnc: c.rnc, razonSocial: c.razonSocial || "", nombreComercial: c.nombreComercial || "",
            ambiente: c.ambiente, secuencia: c.ncf, vencimientoSecuencia: c.vencimientoSecuencia || "",
            certVence: c.certVence || "", emisorId: c.emisorId || deviceId()
          });
        }
        toast("Certificado cargado");
      };
      fr.readAsDataURL(f);
    };

    /* emitir una venta existente */
    $$(".ecf-sale", view).forEach(function (b) {
      b.onclick = async function () {
        var sale = (db().sales || []).find(function (s) { return s.vid === b.dataset.sale; });
        if (sale) await lanzar(sale, $("#f-note", view), view);
      };
    });

    var demoBtn = $("#f-demo-sale", view);
    if (demoBtn) demoBtn.onclick = async function () {
      await lanzar(ventaEjemplo(), $("#f-note", view), view);
    };

    var eJ = $("#f-exp-json", view), eC = $("#f-exp-csv", view);
    if (eJ) eJ.onclick = function () {
      var n = global.PPComprobantes.exportarJSON();
      toast("Exportados " + n + " comprobantes");
    };
    if (eC) eC.onclick = function () {
      var n = global.PPComprobantes.exportarCSV();
      toast("Exportados " + n + " comprobantes");
    };

    var retry = $("#f-retry", view);
    if (retry) retry.onclick = async function () {
      retry.disabled = true; retry.textContent = "Reintentando…";
      var r = await reintentar();
      toast(r.ok ? "Reintento terminado" : r.error);
      if (global.render) global.render();
    };

    $$(".ecf-mini", view).forEach(function (b) {
      b.onclick = function () {
        var r = (db().ecf || []).find(function (x) { return x.id === b.dataset.xml; });
        if (!r || !r.xml) return toast("Ese comprobante no tiene XML");
        var blob = new Blob([r.xml], { type: "application/xml" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (r.ncf || r.id) + ".xml";
        a.click();
      };
    });
  }

  async function lanzar(sale, nota, view) {
    if (nota) nota.textContent = "Emitiendo…";
    var res = await emitir(sale, { pass: global.__ppFiscalPass || "" });
    if (nota) {
      nota.textContent = res.ok
        ? "Comprobante " + res.reg.ncf + " · " + res.reg.estado.toUpperCase() + (res.reg.trackId ? " · " + res.reg.trackId : "")
        : "No se pudo emitir: " + (res.error || (res.reg && res.reg.mensaje));
    }
    if (global.render) global.render();
    return res;
  }

  function ventaEjemplo() {
    var lineas = [
      { nombre: "Arroz Campo", cant: 2, precio: 45, unidad: "libra", itbis: true },
      { nombre: "Aceite", cant: 1, precio: 180, unidad: "unidad", itbis: true }
    ];
    var subtotal = lineas.reduce(function (s, l) { return s + l.cant * l.precio; }, 0);
    var itbis = Math.round(subtotal * 0.18 * 100) / 100;
    return {
      vid: "DEMO-" + Date.now().toString(36), fecha: new Date().toISOString(),
      lineas: lineas, subtotal: subtotal, itbis: itbis,
      total: Math.round((subtotal + itbis) * 100) / 100, metodo: "efectivo", cliente: "Consumidor final"
    };
  }

  try {
    global.addEventListener("online", function () {
      var pend = (db().ecf || []).filter(function (r) { return r.estado === "encola"; });
      if (pend.length) reintentar().then(function (r) { if (r && r.ok && global.render) global.render(); });
    });
  } catch (e) {}

  /* los comprobantes viven en IndexedDB: se cargan una vez y se refresca la vista */
  if (global.PPComprobantes) {
    global.PPComprobantes.init().then(function (n) {
      if (n && n.length && global.render && global.PPFiscal) {
        try { if (document.querySelector(".ecf-wrap")) global.render(); } catch (e) {}
      }
    });
  }

  global.PPFiscal = {
    render: render, emitir: emitir, cfg: cfg, ventaEjemplo: ventaEjemplo, reintentar: reintentar,
    activo: activo, setActivo: setActivo,
    siguienteNcf: siguienteNcf
  };
})(window);
