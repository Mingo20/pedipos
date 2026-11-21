/* PediPOS · Avisos del negocio
   Se revisan al abrir la app, al volver a ella y cada minuto mientras esta abierta.
   Usa notificaciones del sistema cuando el comerciante las autoriza y, si no,
   muestra el mismo aviso dentro de la app.
   Limite real: con la app cerrada no hay aviso (eso exige un servidor push). */
(function () {
  var CLAVE = "pp:avisos:v1";
  var sonando = false;

  function fiscalCfg() {
    try {
      var d = window.PPStore && window.PPStore.db;
      return (d && d.fiscal) || null;
    } catch (e) { return null; }
  }
  function hoyISO() { return new Date().toISOString().slice(0, 10); }
  function leidos() { try { return JSON.parse(localStorage.getItem(CLAVE) || "{}"); } catch (e) { return {}; } }
  function guardar(o) { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {} }
  function yaHoy(k) { return leidos()[k] === hoyISO(); }
  function marcar(k) { var l = leidos(); l[k] = hoyISO(); guardar(l); }

  function permiso() { return ("Notification" in window) ? Notification.permission : "no"; }

  function pedirPermiso() {
    if (!("Notification" in window)) return Promise.resolve("no");
    if (Notification.permission !== "default") return Promise.resolve(Notification.permission);
    try {
      return Notification.requestPermission().then(function (r) {
        if (r === "granted" && window.toast) window.toast("Avisos activados");
        return r;
      });
    } catch (e) { return Promise.resolve("no"); }
  }

  function mostrar(titulo, cuerpo, tag, alTocar) {
    if (permiso() !== "granted") return Promise.resolve(false);
    return navigator.serviceWorker.getRegistration().then(function (reg) {
      if (reg && reg.showNotification) {
        return reg.showNotification(titulo, {
          body: cuerpo, tag: tag, renotify: true, icon: "img/logo-96.png",
          badge: "img/logo-96.png", data: { tag: tag, ir: (alTocar || "") }
        }).then(function () { return true; });
      }
      var n = new Notification(titulo, { body: cuerpo, tag: tag, icon: "img/logo-96.png" });
      n.onclick = function () { window.focus(); if (alTocar && window.go) window.go(alTocar); };
      return true;
    }).catch(function () { return false; });
  }

  /* ---------- a) cobros vencidos y por vencer ---------- */
  function cobros() {
    var S = window.PPStore; if (!S || !S.db) return [];
    var base = new Date(); base.setHours(0, 0, 0, 0);
    var out = [];
    (S.db.sales || []).forEach(function (v) {
      if (v.metodo !== "credito" || v.pagada || !v.fecha_pago) return;
      var f = new Date(String(v.fecha_pago) + "T00:00:00");
      if (isNaN(f.getTime())) return;
      var dif = Math.round((f - base) / 86400000);
      if (dif <= 1) out.push({ dias: dif, v: v });
    });
    return out;
  }

  /* ---------- b) comprobantes rechazados ---------- */
  function rechazados() {
    if (!window.PPComprobantes || !window.PPComprobantes.all) return Promise.resolve([]);
    var r;
    try { r = window.PPComprobantes.all(); } catch (e) { return Promise.resolve([]); }
    var filtrar = function (todos) {
      return (todos || []).filter(function (x) {
        var e = String(x.estado || "").toLowerCase();
        return e === "rechazado" || e === "error";
      });
    };
    return (r && typeof r.then === "function") ? r.then(filtrar).catch(function () { return []; }) : Promise.resolve(filtrar(r));
  }

  /* ---------- c) secuencia y certificado ---------- */
  function fiscal() {
    var S = window.PPStore; if (!S || !S.db) return [];
    var f = (S.db.settings || {}).fiscal || {};
    var avisos = [], hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (f.vencimientoSecuencia) {
      var v = new Date(f.vencimientoSecuencia + "T00:00:00");
      var d = Math.round((v - hoy) / 86400000);
      if (!isNaN(d) && d >= 0 && d <= 15) avisos.push("La secuencia e-NCF vence en " + d + " dia(s)");
    }
    if (f.certVence) {
      var c = new Date(f.certVence + "T00:00:00");
      var dc = Math.round((c - hoy) / 86400000);
      if (!isNaN(dc) && dc >= 0 && dc <= 30) avisos.push("El certificado vence en " + dc + " dia(s)");
    }
    return avisos;
  }

  /* ---------- d) respaldo ---------- */
  function respaldo() {
    if (!window.PPRespaldo || !window.PPRespaldo.estado) return null;
    var e = window.PPRespaldo.estado();
    if (!e.conectado) return e.total > 0 ? { motivo: "sin conectar", total: e.total } : null;
    if (!e.ultimo) return e.total > 0 ? { motivo: "nunca", total: e.total } : null;
    var horas = (Date.now() - new Date(e.ultimo).getTime()) / 3600000;
    if (horas > 24) return { motivo: "vencido", horas: Math.floor(horas), pendientes: e.pendientes };
    return null;
  }

  /* ---------- f) bienvenida y consejo semanal ---------- */
  var CONSEJOS = [
    "Marca tus ítems mas vendidos como favoritos: cobras con un toque.",
    "Registra el WhatsApp de cada cliente y le envias el comprobante al instante.",
    "Dicta la venta por voz y confirma el cobro en un clic.",
    "Revisa la analitica al cerrar: sabes cuanto ganaste y cuanto fiaste.",
    "El respaldo en Drive se hace solo; revisa que diga Conectado.",
    "Pon fecha de cobro a los creditos y la app te avisa antes."
  ];
  function consejo() {
    var l = leidos(), ult = l["semana"] ? new Date(l["semana"]) : null;
    if (ult && (Date.now() - ult.getTime()) < 7 * 86400000) return null;
    var i = Math.floor(Date.now() / (7 * 86400000)) % CONSEJOS.length;
    return CONSEJOS[i];
  }

  /* ---------- repaso completo ---------- */
  function revisar() {
    if (sonando) return Promise.resolve();
    sonando = true;
    var tareas = [];

    var cs = cobros();
    if (cs.length && !yaHoy("cobros")) {
      var vencidos = cs.filter(function (x) { return x.dias < 0; }).length;
      var hoyMismo = cs.filter(function (x) { return x.dias === 0; }).length;
      var partes = [];
      if (vencidos) partes.push(vencidos + " vencido" + (vencidos === 1 ? "" : "s"));
      if (hoyMismo) partes.push(hoyMismo + " para hoy");
      var proximos = cs.filter(function (x) { return x.dias === 1; }).length;
      if (proximos) partes.push(proximos + " para manana");
      tareas.push(mostrar("Cobros pendientes", partes.join(" · ") + ". Toca para ver la lista.", "cobros", "clientes")
        .then(function (ok) { if (ok) marcar("cobros"); }));
    }

    tareas.push(rechazados().then(function (rs) {
      if (!rs.length || yaHoy("rechazos")) return;
      return mostrar("Comprobante rechazado", rs.length + " comprobante(s) con problema. Corrigelo antes de seguir emitiendo.", "rechazos", "fiscal")
        .then(function (ok) { if (ok) marcar("rechazos"); });
    }));

    var fs = fiscal();
    if (fs.length && !yaHoy("fiscal")) {
      tareas.push(mostrar("Facturacion electronica", fs.join(" · "), "fiscal", "fiscal")
        .then(function (ok) { if (ok) marcar("fiscal"); }));
    }

    var r = respaldo();
    if (r && !yaHoy("respaldo")) {
      var txt = r.motivo === "sin conectar" ? "Sin respaldo conectado: " + r.total + " comprobante(s) solo en este equipo."
        : r.motivo === "nunca" ? "Nunca se ha respaldado: " + r.total + " comprobante(s) en riesgo."
        : "Hace " + r.horas + " horas sin respaldar" + (r.pendientes ? " y " + r.pendientes + " pendiente(s)" : "") + ".";
      tareas.push(mostrar("Respaldo en Drive", txt + " Toca para resolverlo.", "respaldo", "config")
        .then(function (ok) { if (ok) marcar("respaldo"); }));
    }

    /* vencimiento del certificado digital: avisa con 30 dias o menos */
    var cf = fiscalCfg();
    if (cf && cf.certVence && !yaHoy("certvence")) {
      var dias = Math.ceil((new Date(String(cf.certVence).length <= 10 ? cf.certVence + "T00:00:00" : cf.certVence).getTime() - Date.now()) / 86400000);
      if (dias <= 30) {
        var txtc = dias < 0 ? "El certificado digital vencio hace " + Math.abs(dias) + " dia(s). Los envios a la DGII fallaran."
          : dias === 0 ? "El certificado digital vence hoy."
          : "Al certificado digital le quedan " + dias + " dia(s).";
        tareas.push(mostrar("Certificado digital", txtc + " Renuevalo con tu entidad certificadora.", "certvence", "fiscal")
          .then(function (ok) { if (ok) marcar("certvence"); }));
      }
    }

    var c = consejo();
    if (c && !yaHoy("consejo")) {
      tareas.push(mostrar("Consejo de la semana", c, "consejo", "panel")
        .then(function (ok) { if (ok) { var l = leidos(); l["semana"] = new Date().toISOString(); guardar(l); marcar("consejo"); } }));
    }

    return Promise.all(tareas).then(function () { sonando = false; }, function () { sonando = false; });
  }

  var timer = null;
  function arrancar() {
    revisar();
    if (timer) clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) revisar(); }, 60000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) revisar(); });
  }

  window.PPAvisos = { revisar: revisar, pedirPermiso: pedirPermiso, permiso: permiso, arrancar: arrancar };
})();
