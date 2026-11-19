/* PediPOS · Panel de emisores
 * Vista del dueno: que comerciante tiene el certificado vencido, la secuencia
 * agotada o comprobantes rechazados. Funciona sin servidor: el comerciante
 * exporta su archivo y aqui se importa para revisarlo.
 */
(function (global) {
  "use strict";
  var KEY = "pedipos.emisores.v1";

  function leer() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { return []; }
  }
  function escribir(lista) {
    try { localStorage.setItem(KEY, JSON.stringify(lista.slice(0, 200))); } catch (e) {}
  }
  function hoy() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }

  function registrar(em) {
    if (!em || !em.rnc) return null;
    var lista = leer();
    var i = lista.findIndex(function (x) { return x.rnc === em.rnc; });
    var reg = Object.assign({ actualizado: new Date().toISOString() }, i >= 0 ? lista[i] : {}, em);
    if (i >= 0) lista[i] = reg; else lista.unshift(reg);
    escribir(lista);
    return reg;
  }

  function vencido(fecha) {
    if (!fecha) return false;
    var d = new Date(fecha);
    return !isNaN(d) && d < hoy();
  }

  function estadoDe(em) {
    var regs = (global.PPComprobantes ? global.PPComprobantes.all() : []).filter(function (r) {
      return !em.rnc || !r.rnc || r.rnc === em.rnc;
    });
    var rechazados = regs.filter(function (r) { return r.estado === "rechazado" || r.estado === "error"; }).length;
    var cola = regs.filter(function (r) { return r.estado === "encola"; }).length;
    var aceptados = regs.filter(function (r) { return r.estado === "aceptado" || r.estado === "enviado"; }).length;
    return { rechazados: rechazados, cola: cola, aceptados: aceptados, total: regs.length,
      certVencido: vencido(em.certVence), secuenciaVencida: vencido(em.vencimientoSecuencia) };
  }

  function money(n) { return "RD$" + (Number(n) || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function render(view) {
    var lista = leer();
    var cfg = (global.PPFiscal && global.PPFiscal.cfg) ? global.PPFiscal.cfg() : {};
    /* el equipo actual siempre aparece, aunque no se haya importado nada */
    if (cfg.rnc && !lista.some(function (x) { return x.rnc === cfg.rnc; })) {
      registrar({
        rnc: cfg.rnc, razonSocial: cfg.razonSocial || "", nombreComercial: cfg.nombreComercial || "",
        ambiente: cfg.ambiente || "", secuencia: cfg.ncf || "", vencimientoSecuencia: cfg.vencimientoSecuencia || "",
        certVence: cfg.certVence || "", emisorId: cfg.emisorId || ""
      });
      lista = [{
        rnc: cfg.rnc, razonSocial: cfg.razonSocial || "", nombreComercial: cfg.nombreComercial || "",
        ambiente: cfg.ambiente || "", secuencia: cfg.ncf || "", vencimientoSecuencia: cfg.vencimientoSecuencia || "",
        certVence: cfg.certVence || "", emisorId: cfg.emisorId || "", actualizado: new Date().toISOString()
      }].concat(lista);
    }

    var avisos = [];
    lista.forEach(function (em) {
      var e = estadoDe(em);
      var quien = em.nombreComercial || em.razonSocial || em.rnc;
      if (e.certVencido) avisos.push({ t: "rojo", m: quien + ": certificado vencido, no puede emitir" });
      if (e.secuenciaVencida) avisos.push({ t: "rojo", m: quien + ": la secuencia de e-NCF esta vencida" });
      if (e.rechazados) avisos.push({ t: "ambar", m: quien + ": " + e.rechazados + " comprobante(s) rechazado(s)" });
      if (e.cola) avisos.push({ t: "ambar", m: quien + ": " + e.cola + " en cola por falta de conexion" });
    });
    var resp = (global.PPRespaldo && global.PPRespaldo.estado) ? global.PPRespaldo.estado() : null;
    if (resp && resp.total) {
      if (!resp.conectado) avisos.push({ t: "ambar", m: "Sin respaldo: " + resp.total + " comprobante(s) solo en este equipo" });
      else if (resp.pendientes) avisos.push({ t: "ambar", m: "Drive: " + resp.pendientes + " comprobante(s) sin respaldar" });
      else if (resp.conError) avisos.push({ t: "rojo", m: "Drive: " + resp.conError + " comprobante(s) no se pudieron subir" });
    }

    view.innerHTML = '<div class="em-wrap">' +
      '<div class="em-head"><h2>Emisores</h2>' +
        '<div class="em-acc">' +
          '<button class="em-btn" id="em-imp">Importar archivo</button>' +
          '<button class="em-btn ghost" id="em-exp">Exportar los mios</button>' +
        "</div></div>" +
      '<p class="em-sub">Cada comerciante emite desde su equipo. Importa su archivo para revisar el estado sin servidores de por medio.</p>' +
      tarjetaRespaldo() +
      (avisos.length ? '<div class="em-alertas">' + avisos.map(function (a) {
        return '<div class="em-al ' + a.t + '">' + a.m + "</div>";
      }).join("") + "</div>" : '<div class="em-ok">Todo al dia: sin certificados vencidos ni rechazos pendientes.</div>') +
      (lista.length ? '<div class="em-grid">' + lista.map(function (em) {
        var e = estadoDe(em);
        var cert = em.certVence ? new Date(em.certVence).toLocaleDateString("es-DO") : "sin dato";
        return '<section class="em-card">' +
          '<div class="em-tt"><b>' + (em.nombreComercial || em.razonSocial || "Emisor") + "</b><span>" + (em.rnc || "") + "</span></div>" +
          '<div class="em-tags">' +
            '<i class="' + (e.certVencido ? "mal" : "bien") + '">Certificado: ' + cert + "</i>" +
            '<i class="' + (e.secuenciaVencida ? "mal" : "bien") + '">Secuencia: ' + (em.secuencia || "sin dato") + "</i>" +
            '<i class="bien">' + (em.ambiente || "ambiente sin definir") + "</i>" +
          "</div>" +
          '<div class="em-nums">' +
            "<div><small>Aceptados</small><b>" + e.aceptados + "</b></div>" +
            "<div><small>Rechazados</small><b class=\"" + (e.rechazados ? "mal" : "") + '">' + e.rechazados + "</b></div>" +
            "<div><small>En cola</small><b class=\"" + (e.cola ? "mal" : "") + '">' + e.cola + "</b></div>" +
          "</div>" +
          '<p class="em-pie">Actualizado: ' + (em.actualizado ? new Date(em.actualizado).toLocaleString("es-DO") : "sin dato") + "</p>" +
        "</section>";
      }).join("") + "</div>" : '<div class="em-vacio">Aun no hay emisores registrados. Configura uno en Fiscal o importa un archivo.</div>') +
      '<input type="file" id="em-file" accept=".json" hidden>' +
    "</div>";

    enlazarRespaldo(view);
    var file = view.querySelector("#em-file");
    view.querySelector("#em-imp").onclick = function () { file.click(); };
    file.onchange = function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var data = JSON.parse(String(rd.result));
          var em = (data && data.emisor) || {};
          global.PPComprobantes.importar(String(rd.result)).then(function (r) {
            if (em && em.rnc) registrar(em);
            render(view);
            if (global.toast) global.toast("Importados " + r.importados + " comprobantes");
          });
        } catch (e) {
          if (global.toast) global.toast("El archivo no es un respaldo valido");
        }
      };
      rd.readAsText(f);
      file.value = "";
    };
    view.querySelector("#em-exp").onclick = function () {
      var n = global.PPComprobantes.exportarJSON();
      if (global.toast) global.toast("Exportados " + n + " comprobantes");
    };
  }

  /* ---------- respaldo en el Drive del comerciante ---------- */
  function tarjetaRespaldo() {
    var R = global.PPRespaldo;
    if (!R) return "";
    var e = R.estado();
    var fecha = e.ultimo ? new Date(e.ultimo).toLocaleString("es-DO") : "nunca";
    var estado = e.conectado
      ? '<i class="bien">Conectado' + (e.email ? ": " + e.email : "") + "</i>"
      : '<i class="mal">Sin conectar</i>';
    var cifras = e.conectado
      ? '<div class="em-nums">' +
          "<div><small>Respaldados</small><b>" + e.respaldados + "</b></div>" +
          "<div><small>Pendientes</small><b class=\"" + (e.pendientes ? "mal" : "") + '">' + e.pendientes + "</b></div>" +
          "<div><small>Total</small><b>" + e.total + "</b></div>" +
        "</div>" +
        '<p class="em-pie">Ultimo respaldo: ' + fecha + (e.error ? " - " + e.error : "") + "</p>"
      : "";
    var alta = e.clienteId ? "" :
      '<div class="dr-alta"><label class="dr-lb">ID de cliente de Google</label>' +
        '<div class="dr-fila"><input id="dr-id" placeholder="1234-abc.apps.googleusercontent.com" autocapitalize="off" spellcheck="false">' +
        '<button class="em-btn" id="dr-save">Guardar</button></div>' +
        '<p class="em-pie">Se crea en Google Cloud, en Credenciales, como aplicacion web, autorizando este sitio.</p></div>';
    var botones = e.conectado
      ? '<div class="em-acc"><button class="em-btn" id="dr-now">Respaldar ahora</button>' +
        '<button class="em-btn ghost" id="dr-res">Restaurar</button>' +
        '<button class="em-btn ghost" id="dr-off">Desconectar</button></div>'
      : '<div class="em-acc"><button class="em-btn" id="dr-on"' + (e.clienteId ? "" : " disabled") + '>Conectar Drive</button></div>';
    return '<section class="em-card dr-card">' +
      '<div class="em-tt"><b>Respaldo en Drive</b><span>los XML en el Drive del comerciante</span></div>' +
      '<div class="em-tags">' + estado + '<i class="bien">Permiso minimo: solo lo que crea la app</i></div>' +
      alta + cifras + botones +
    "</section>";
  }

  function enlazarRespaldo(view) {
    var R = global.PPRespaldo;
    if (!R) return;
    var id = view.querySelector("#dr-id");
    var save = view.querySelector("#dr-save");
    if (save) save.onclick = function () {
      var v = (id && id.value || "").trim();
      if (!v) { if (global.toast) global.toast("Pega el ID de cliente de Google"); return; }
      R.setClienteId(v);
      render(view);
      if (global.toast) global.toast("ID guardado: ya puedes conectar");
    };
    var on = view.querySelector("#dr-on");
    if (on) on.onclick = async function () {
      on.disabled = true; on.textContent = "Conectando...";
      await R.conectar();
      render(view);
    };
    var off = view.querySelector("#dr-off");
    if (off) off.onclick = async function () { await R.desconectar(); render(view); };
    var now = view.querySelector("#dr-now");
    if (now) now.onclick = async function () {
      now.disabled = true; now.textContent = "Subiendo...";
      await R.respaldarAhora();
      render(view);
    };
    var res = view.querySelector("#dr-res");
    if (res) res.onclick = async function () {
      res.disabled = true; res.textContent = "Buscando...";
      await R.restaurar();
      render(view);
    };
  }

  global.PPEmisores = { render: render, registrar: registrar, leer: leer, estadoDe: estadoDe };
})(window);
