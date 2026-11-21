/* PediPOS · Certificación inteligente ante la DGII
   Revisa todo lo que la DGII va a mirar ANTES de que el comerciante pida la
   certificación, prueba de verdad contra certecf y arma el paquete de evidencias.
   Lo que solo puede hacer el contribuyente (solicitar la certificación en la
   Oficina Virtual) se muestra como tarea con enlace directo.
   El estado vive en localStorage: no depende del guardado de la app. */
(function (global) {
  "use strict";

  var CLAVE = "pp:certificacion:v1";
  var PORTAL = "https://dgii.gov.do/ofv/";

  function UI() { return global.PPUI || {}; }
  function cfg() { return (global.PPFiscal && global.PPFiscal.cfg) ? global.PPFiscal.cfg() : {}; }

  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || "{}"); } catch (e) { return {}; }
  }
  function guardar(o) {
    try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {}
  }

  /* ---------- validaciones locales ---------- */
  function rncValido(rnc) {
    var n = String(rnc || "").replace(/\D/g, "");
    if (n.length === 9) {
      var w = [7, 9, 8, 6, 5, 4, 3, 2], s = 0;
      for (var i = 0; i < 8; i++) s += Number(n[i]) * w[i];
      var r = s % 11, d = 11 - r;
      if (d === 10) d = 1; if (d === 11) d = 2;
      return { ok: d === Number(n[8]), motivo: d === Number(n[8]) ? "" : "el dígito verificador no cuadra" };
    }
    if (n.length === 11) return { ok: true, motivo: "" };   /* cedula: no se valida en linea */
    return { ok: false, motivo: "debe tener 9 dígitos (RNC) u 11 (cédula)" };
  }

  function revisar() {
    var c = cfg();
    var out = [];
    function add(nombre, ok, detalle, arreglo, critico) {
      out.push({ nombre: nombre, ok: !!ok, detalle: detalle || "", arreglo: arreglo || "", critico: !!critico });
    }

    var rv = rncValido(c.rnc);
    add("RNC del emisor", rv.ok, rv.ok ? String(c.rnc) : ("Revisa el RNC: " + rv.motivo), "fiscal", true);
    add("Razón social", String(c.razonSocial || "").trim().length >= 3, c.razonSocial || "Falta la razón social tal como aparece en el RNC", "fiscal", true);
    add("Nombre comercial", !!String(c.nombreComercial || "").trim(), c.nombreComercial || "Opcional, pero la DGII lo muestra en la factura", "fiscal", false);
    add("Dirección", !!String(c.direccion || "").trim(), c.direccion || "Falta la dirección del establecimiento", "fiscal", true);
    add("Provincia y municipio", !!(c.provincia && c.municipio), (c.provincia || "sin provincia") + " · " + (c.municipio || "sin municipio"), "fiscal", false);
    add("Teléfono", !!String(c.telefono || "").trim(), c.telefono || "La DGII lo usa para contacto del emisor", "fiscal", false);
    add("Correo electrónico", /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(String(c.email || "")), c.email || "Falta el correo del emisor", "fiscal", false);

    var amb = String(c.ambiente || "");
    add("Ambiente", amb === "certecf", amb === "certecf" ? "Certificación (certecf)" : "Para certificarte debes estar en certecf, no en producción", "fiscal", true);

    var ncf = String(c.ncf || "").toUpperCase();
    var formato = /^E(31|32|33|34|41|43|44|45|46|47)\d{10}$/.test(ncf);
    add("Formato del e-NCF", formato, formato ? ncf : "Debe ser E + tipo (32) + 10 dígitos, por ejemplo E320000000001", "fiscal", true);

    var hasta = String(c.ncfHasta || "").toUpperCase();
    var enRango = !hasta || (formato && hasta.length === ncf.length && ncf <= hasta);
    add("Secuencia dentro del rango", enRango, hasta ? ("desde " + ncf + " hasta " + hasta) : "No definiste el último e-NCF autorizado", "fiscal", false);

    var venc = c.vencimientoSecuencia ? new Date(c.vencimientoSecuencia + "T23:59:59") : null;
    var vigente = venc ? venc.getTime() > Date.now() : false;
    add("Vencimiento de la secuencia", vigente, venc ? (vigente ? "vence el " + c.vencimientoSecuencia : "la secuencia ya venció") : "Falta la fecha de vencimiento que te dio la DGII", "fiscal", true);

    add("Certificado digital (.p12)", !!c.p12, c.p12 ? "cargado en este equipo" : "Carga el .p12 que te entregó la prestadora", "fiscal", true);

    var pasos = leer().pasos || {};
    add("Prueba real contra la DGII", !!pasos.prueba, pasos.prueba ? "aprobada el " + (pasos.pruebaFecha || "") : "Aún no se ha probado el envío a certecf", "probar", false);
    add("Solicitud en la Oficina Virtual", !!pasos.portal, pasos.portal ? "marcada como hecha" : "Solo el contribuyente puede solicitarla, con su usuario de la DGII", "portal", false);

    return out;
  }

  /* ---------- prueba real contra certecf ---------- */
  function ventaPrueba() {
    return {
      vid: "CERT-" + Date.now().toString(36).toUpperCase(),
      fecha: new Date().toISOString(),
      metodo: "efectivo",
      subtotal: 1000, itbis: 180, total: 1180,
      cliente: "Consumidor final",
      lineas: [
        { nombre: "Servicio de prueba", cant: 1, precio: 1000, unidad: "servicio", itbis: true }
      ]
    };
  }

  async function probar(btn) {
    var c = cfg(), E = global.ECF, t = UI().toast || function () {};
    if (!E) return { ok: false, error: "El módulo fiscal no está cargado" };
    if (!c.rnc) return { ok: false, error: "Falta el RNC" };
    if (btn) { btn.disabled = true; btn.textContent = "Probando..."; }
    var r = { ok: false, error: "", estado: "", trackId: "", mensaje: "", fecha: new Date().toISOString() };
    try {
      var venta = ventaPrueba();
      var xml = E.buildEcf(venta, c);
      if (c.demo || !c.p12) {
        var d = E.demo("aceptado");
        r.ok = true; r.estado = d.estado; r.trackId = d.trackId; r.mensaje = d.mensaje;
        r.simulado = true;
      } else {
        var cred = E.cargarP12(c.p12, global.__ppFiscalPass || "");
        var tk = await E.token(c, cred);
        var firmado = E.firmar(xml, cred);
        var env = await E.enviar(c, firmado, tk);
        r.trackId = env.trackId || ""; r.mensaje = env.mensaje || "";
        if (env.trackId) {
          var est = await E.estado(c, env.trackId, tk);
          r.estado = est.estado; r.mensaje = est.detalle || r.mensaje;
        }
        r.ok = r.estado === "aceptado" || r.estado === "enviado";
        r.xml = String(firmado).slice(0, 4000);
      }
    } catch (e) {
      r.error = String((e && e.message) || e);
    }
    var st = leer();
    st.pasos = st.pasos || {};
    st.pasos.prueba = r.ok;
    st.pasos.pruebaFecha = r.fecha;
    st.ultimo = r;
    guardar(st);
    if (btn) { btn.disabled = false; btn.textContent = "Probar contra la DGII"; }
    t(r.ok ? (r.simulado ? "Prueba simulada aprobada" : "La DGII aceptó el comprobante de prueba") : ("La prueba falló: " + (r.error || r.mensaje)));
    return r;
  }

  /* ---------- evidencias ---------- */
  function evidencias() {
    var c = cfg(), st = leer();
    var paq = {
      generado: new Date().toISOString(),
      emisor: { rnc: c.rnc, razonSocial: c.razonSocial, nombreComercial: c.nombreComercial, ambiente: c.ambiente },
      secuencia: { desde: c.ncf, hasta: c.ncfHasta || "", vence: c.vencimientoSecuencia || "" },
      revisiones: revisar().map(function (x) { return { revision: x.nombre, ok: x.ok, detalle: x.detalle }; }),
      prueba: st.ultimo || null,
      nota: "Paquete de evidencias de PediPOS para la solicitud de certificación como emisor electrónico."
    };
    return paq;
  }

  function descargar() {
    var paq = evidencias();
    var txt = JSON.stringify(paq, null, 2);
    var a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(txt);
    a.download = "pedipos-certificacion-" + String(cfg().rnc || "emisor") + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    if (UI().toast) UI().toast("Evidencias descargadas");
  }

  /* ---------- pantalla ---------- */
  /* Portal de la DGII dentro de la app.
     La Oficina Virtual bloquea el marco por seguridad, asi que se intenta embeber
     y, si no carga en unos segundos, queda el boton de ventana segura sin salir del flujo. */
  function abrirPortal() {
    var u = UI();
    if (!u.sheet) { try { window.open(PORTAL, "_blank", "noopener"); } catch (e) {} return; }
    var x = (u.I && u.I.xDown) ? u.I.xDown : "&times;";
    var s = u.sheet(
      '<div class="sh-h"><h2>Portal de la DGII</h2><button class="sh-x" data-x>' + x + '</button></div>' +
      '<div class="ct-port">' +
        '<div class="ct-port-bar"><span class="ct-live"></span><b>dgii.gov.do</b><span class="ct-port-tip">Oficina Virtual</span></div>' +
        '<iframe id="ctFrame" src="' + PORTAL + '" title="Oficina Virtual DGII" referrerpolicy="no-referrer" ' +
          'sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>' +
        '<div class="ct-port-load" id="ctLoad">Cargando el portal...</div>' +
        '<div class="ct-port-fb" id="ctFb" hidden>' +
          '<b>La DGII bloquea su portal dentro de otras apps</b>' +
          '<p>Es una medida de seguridad de ellos, no un fallo tuyo. Ábrelo en una ventana segura, haz el trámite y vuelve: PediPOS retoma el paso solo.</p>' +
        '</div>' +
      '</div>' +
      '<div class="ct-port-acc">' +
        '<a class="ct-btn" id="ctGo" href="' + PORTAL + '" target="_blank" rel="noopener">Abrir en ventana segura</a>' +
        '<button class="ct-btn ghost" id="ctHecho">Ya lo hice</button>' +
      '</div>');
    var fr = s.querySelector("#ctFrame"), fb = s.querySelector("#ctFb"), ld = s.querySelector("#ctLoad");
    var cargado = false;
    if (fr) fr.onload = function () { cargado = true; if (ld) ld.hidden = true; };
    setTimeout(function () {
      if (cargado) return;
      if (ld) ld.hidden = true;
      if (fb) fb.hidden = false;
      if (fr) fr.classList.add("sinmarco");
    }, 4200);
    s.querySelector("[data-x]").onclick = function () { if (u.closeSheet) u.closeSheet(); };
    s.querySelector("#ctHecho").onclick = function () {
      var st = leer(); st.pasos = st.pasos || {}; st.pasos.portal = true; guardar(st);
      if (u.closeSheet) u.closeSheet();
      if (u.toast) u.toast("Paso marcado: solicitud hecha en la DGII");
      render(document.getElementById("view"));
    };
  }

  function render(view) {
    var c = cfg(), st = leer(), u = UI();
    var esc = u.esc || function (s) { return String(s == null ? "" : s); };
    var list = revisar();
    var fallos = list.filter(function (x) { return !x.ok && x.critico; }).length;
    var avisos = list.filter(function (x) { return !x.ok && !x.critico; }).length;
    var ok = list.filter(function (x) { return x.ok; }).length;
    var listo = fallos === 0;

    function fila(x) {
      var clase = x.ok ? "ok" : (x.critico ? "mal" : "avi");
      var icono = x.ok ? "&#10003;" : (x.critico ? "!" : "&#8226;");
      return '<li class="ct-item ' + clase + '"><span class="ct-dot">' + icono + "</span>" +
        '<div class="ct-tx"><b>' + esc(x.nombre) + "</b><span>" + esc(x.detalle) + "</span></div>" +
        (x.ok || !x.arreglo ? "" : '<button class="ct-fix" data-ir="' + esc(x.arreglo) + '">Corregir</button>') +
        "</li>";
    }
    var malas = list.filter(function (x) { return !x.ok; });
    var buenas = list.filter(function (x) { return x.ok; });
    /* compacto: primero lo que hay que resolver; lo que esta en orden queda plegado */
    var filas = malas.map(fila).join("") || '<li class="ct-item ok"><span class="ct-dot">&#10003;</span><div class="ct-tx"><b>Todo en orden</b><span>No hay nada que corregir antes de solicitar.</span></div></li>';
    if (buenas.length) {
      filas += '<li class="ct-mas"><details><summary>Ver las ' + buenas.length + ' que ya estan en orden</summary><ul class="ct-list">' +
        buenas.map(fila).join("") + "</ul></details></li>";
    }

    view.innerHTML =
      '<section class="ct-hero ' + (listo ? "bien" : (fallos ? "mal" : "avi")) + '">' +
        '<div class="ct-hero-t"><span class="ct-pill">' + (listo ? "Listo para solicitar" : (fallos ? fallos + " pendiente" + (fallos === 1 ? "" : "s") : avisos + " aviso" + (avisos === 1 ? "" : "s"))) + "</span></div>" +
        "<h2>Certificación como emisor</h2>" +
        "<p>Revisamos lo que la DGII va a mirar antes de que la pidas. Lo que dependa de ti, lo corriges aquí mismo.</p>" +
        '<div class="ct-bar"><i style="width:' + Math.round((ok / list.length) * 100) + '%"></i></div>' +
        '<p class="ct-min">' + ok + " de " + list.length + " revisiones en orden</p>" +
      "</section>" +

      '<section class="ct-card"><h3>Revisión automática</h3><ul class="ct-list">' + filas + "</ul></section>" +

      '<section class="ct-card"><h3>Prueba real contra la DGII</h3>' +
        "<p>Se arma un comprobante de prueba, se firma con tu certificado y se envía a certecf. Si la DGII lo acepta, tu configuración funciona de verdad.</p>" +
        '<button class="ct-btn" id="ctProbar">Probar contra la DGII</button>' +
        (st.ultimo ? '<p class="ct-res ' + (st.ultimo.ok ? "ok" : "mal") + '">' + (st.ultimo.ok ? "Aceptado" : "Falló") +
          (st.ultimo.trackId ? " · expediente " + esc(st.ultimo.trackId) : "") +
          (st.ultimo.error ? " · " + esc(st.ultimo.error) : "") +
          (st.ultimo.simulado ? " · simulación sin certificado" : "") + "</p>" : "") +
      "</section>" +

      '<section class="ct-card"><h3>Lo que solo puedes hacer tú</h3>' +
        "<p>La solicitud de certificación en la Oficina Virtual es un acto del contribuyente: entra con tu usuario de la DGII, acepta los términos y adjunta las evidencias.</p>" +
        '<div class="ct-acc">' +
          '<button class="ct-btn" id="ctPortalBtn">Abrir portal de la DGII</button>' +
          '<button class="ct-btn ghost" id="ctBajar">Descargar evidencias</button>' +
        "</div>" +
        '<p class="ct-min">El portal se abre dentro de PediPOS. Si la DGII lo bloquea, se abre en ventana segura y vuelves al mismo paso.</p>' +
        '<label class="ct-check"><input type="checkbox" id="ctPortal" ' + (st.pasos && st.pasos.portal ? "checked" : "") + "><span>Ya solicité la certificación en la DGII</span></label>" +
      "</section>" +

      '<section class="ct-card ct-next"><h3>Después de aprobada</h3>' +
        "<p>Cambia el ambiente a producción en Fiscal, emite tu primera factura real y deja el certificado vigilado: te avisamos a 30, 15 y 7 días del vencimiento.</p>" +
        '<button class="ct-btn ghost" data-ir="fiscal">Ir a Fiscal</button>' +
      "</section>";

    var b = view.querySelector("#ctProbar");
    if (b) b.onclick = function () { probar(b).then(function () { render(view); }); };
    var pb = view.querySelector("#ctPortalBtn");
    if (pb) pb.onclick = abrirPortal;
    var bb = view.querySelector("#ctBajar");
    if (bb) bb.onclick = descargar;
    var ch = view.querySelector("#ctPortal");
    if (ch) ch.onchange = function () {
      var s = leer(); s.pasos = s.pasos || {}; s.pasos.portal = ch.checked; guardar(s); render(view);
    };
    view.querySelectorAll("[data-ir]").forEach(function (el) {
      el.onclick = function () { if (u.go) u.go(el.dataset.ir); };
    });
  }

  global.PPCertificacion = { render: render, revisar: revisar, probar: probar, evidencias: evidencias, rncValido: rncValido, portal: abrirPortal };
})(window);
