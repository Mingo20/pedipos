/* PediPOS · Pantallas del certificado en la nube (v2.14.0)
   Reemplaza el prompt() del navegador por ventanas propias que funcionan en cualquier movil.
     pedirResguardo(p12b64, clave)  -> consentimiento + frase, y sube el certificado cifrado
     bloqueNube(contenedor)         -> tarjeta "Certificado en la nube" dentro de Nube y perfil
     restaurarConFrase(rnc)         -> pide la frase, restaura y instala el certificado en este equipo */
(function (global) {
  "use strict";

  function UI() { return global.PPUI; }
  function esc(s) { return UI().esc(s); }
  function toast(t) { UI().toast(t); }
  function $(s, r) { return (r || document).querySelector(s); }
  function db() { return UI().db(); }

  /* ---------- configuracion fiscal del equipo (donde vive el .p12 ya instalado) ---------- */
  function fiscal() {
    var d = db();
    d.fiscal = d.fiscal || {};
    return d.fiscal;
  }

  function textoConsentimiento() {
    return "Autorizo a PediPOS a guardar una copia de mi certificado digital, cifrada en este equipo con mi frase. " +
      "PediPOS no conoce mi frase y no puede abrir el certificado: si la olvido, no se puede recuperar. " +
      "Puedo pedir que se borre en cualquier momento.";
  }

  /* ---------- 1. subir el certificado a la nube ---------- */
  function pedirResguardo(p12b64, claveP12, alTerminar) {
    var I = UI().I;
    var s = UI().sheet(
      '<div class="sh-h"><h2>Guardar mi certificado</h2><button class="sh-x" id="ncX">' + I.xDown + '</button></div>' +
      '<p class="cnt" style="margin:0 0 10px">Asi podras recuperarlo si cambias de telefono, sin pedirselo otra vez a tu prestadora.</p>' +
      '<label class="field"><span>Frase de proteccion (8 o mas caracteres)</span><input id="ncF1" type="password" autocomplete="new-password" placeholder="Una frase que recuerdes"></label>' +
      '<label class="field"><span>Repite la frase</span><input id="ncF2" type="password" autocomplete="new-password"></label>' +
      '<label class="cfg-consent"><input id="ncOk" type="checkbox"><span>' + esc(textoConsentimiento()) + '</span></label>' +
      '<p class="cnt" id="ncMsg" style="color:#B3261E;min-height:18px;margin:6px 0 0"></p>' +
      '<div class="sh-f solo"><button class="big" id="ncGo">' + I.check + ' <span class="bl">Guardar cifrado</span></button></div>' +
      '<button class="btn sec" id="ncNo" style="margin-top:8px">Ahora no, dejarlo solo en este equipo</button>');
    var msg = function (t) { var m = $("#ncMsg", s); if (m) m.textContent = t || ""; };
    var cerrar = function () { UI().closeSheet(); };
    $("#ncX", s).onclick = cerrar;
    $("#ncNo", s).onclick = function () { cerrar(); toast("El certificado quedo solo en este equipo"); if (alTerminar) alTerminar({ ok: false, omitido: true }); };
    $("#ncGo", s).onclick = function () {
      var f1 = $("#ncF1", s).value, f2 = $("#ncF2", s).value;
      if (!f1 || f1.length < 8) return msg("La frase debe tener al menos 8 caracteres");
      if (f1 !== f2) return msg("Las dos frases no coinciden");
      if (!$("#ncOk", s).checked) return msg("Marca la casilla para dar tu consentimiento");
      var b = $("#ncGo", s); b.disabled = true; msg("Cifrando y guardando...");
      global.PPNubeCert.guardar(p12b64, claveP12, f1, true).then(function (r) {
        b.disabled = false;
        if (!r.ok) return msg(r.error);
        cerrar();
        toast(r.vencido ? "Guardado. Ojo: tu certificado ya esta vencido" : "Certificado guardado, cifrado");
        if (alTerminar) alTerminar(r);
      });
    };
    return s;
  }

  /* ---------- 2. tarjeta dentro de Nube y perfil ---------- */
  function bloqueNube(cont) {
    if (!cont) return;
    var c = global.PPNubePerfil ? global.PPNubePerfil.conf() : {};
    var f = fiscal();
    var tiene = !!f.p12;
    cont.innerHTML =
      '<h3 style="margin:0 0 6px">Certificado digital</h3>' +
      '<p class="cnt">' + (c.certNube
        ? 'Tu certificado esta guardado en la nube, cifrado. Si cambias de telefono, lo recuperas con tu RNC y tu frase.'
        : 'Guarda una copia cifrada de tu certificado para recuperarla si cambias de telefono.') + '</p>' +
      '<div class="line" style="font-size:13px"><span>En este equipo</span><b>' + (tiene ? "cargado" : "sin cargar") + '</b></div>' +
      '<div class="line" style="font-size:13px"><span>En la nube</span><b>' + (c.certNube ? "guardado" : "sin guardar") + '</b></div>' +
      '<label class="btn sec" style="display:block;text-align:center;margin-top:10px">' + (c.certNube ? "Subir otro certificado (.p12)" : "Subir mi certificado (.p12)") +
      '<input id="ncFile" type="file" accept=".p12,.pfx" hidden></label>' +
      (c.certNube ? '<button class="btn sec" id="ncRest" style="margin-top:8px">Recuperar mi certificado</button>' : "");
    var file = $("#ncFile", cont);
    if (file) file.onchange = function () {
      var fl = file.files && file.files[0]; if (!fl) return;
      var clave = global.prompt ? "" : "";
      pedirClaveP12(function (claveP12) {
        var fr = new FileReader();
        fr.onload = function () {
          var b64 = String(fr.result || "").split(",").pop();
          var p = global.PPNubeCert.probarFirma(b64, claveP12);
          if (!p.ok) return toast(p.error);
          /* queda instalado en este equipo y se ofrece guardarlo en la nube */
          f.p12 = b64; global.__ppFiscalPass = claveP12;
          try { global.PPStore.save(); } catch (e) {}
          pedirResguardo(b64, claveP12, function () { bloqueNube(cont); });
        };
        fr.readAsDataURL(fl);
      });
    };
    var rest = $("#ncRest", cont);
    if (rest) rest.onclick = function () { restaurarConFrase(c.rnc, function () { bloqueNube(cont); }); };
  }

  /* pide la clave del archivo .p12 en una ventana propia */
  function pedirClaveP12(alAceptar) {
    var I = UI().I;
    var s = UI().sheet(
      '<div class="sh-h"><h2>Clave del certificado</h2><button class="sh-x" id="cpX">' + I.xDown + '</button></div>' +
      '<p class="cnt" style="margin:0 0 10px">Es la clave que te dio tu prestadora junto con el archivo .p12.</p>' +
      '<label class="field"><span>Clave del .p12</span><input id="cpClave" type="password" autocomplete="off"></label>' +
      '<div class="sh-f solo"><button class="big" id="cpGo">' + I.check + ' <span class="bl">Continuar</span></button></div>');
    $("#cpX", s).onclick = function () { UI().closeSheet(); };
    $("#cpGo", s).onclick = function () { var v = $("#cpClave", s).value; UI().closeSheet(); alAceptar(v); };
  }

  /* ---------- 3. recuperar en un equipo nuevo ---------- */
  function restaurarConFrase(rnc, alTerminar) {
    var I = UI().I;
    if (!rnc) return toast("Falta el RNC del comercio");
    var s = UI().sheet(
      '<div class="sh-h"><h2>Recuperar mi certificado</h2><button class="sh-x" id="rcX">' + I.xDown + '</button></div>' +
      '<p class="cnt" style="margin:0 0 10px">Escribe la frase de proteccion que creaste al guardarlo.</p>' +
      '<label class="field"><span>Frase de proteccion</span><input id="rcF" type="password" autocomplete="off"></label>' +
      '<p class="cnt" id="rcMsg" style="color:#B3261E;min-height:18px;margin:6px 0 0"></p>' +
      '<div class="sh-f solo"><button class="big" id="rcGo">' + I.check + ' <span class="bl">Recuperar</span></button></div>');
    var msg = function (t) { var m = $("#rcMsg", s); if (m) m.textContent = t || ""; };
    $("#rcX", s).onclick = function () { UI().closeSheet(); };
    $("#rcGo", s).onclick = function () {
      var fr = $("#rcF", s).value; if (!fr) return msg("Escribe tu frase");
      var b = $("#rcGo", s); b.disabled = true; msg("Buscando y comprobando tu certificado...");
      global.PPNubeCert.restaurar(rnc, fr).then(function (r) {
        b.disabled = false;
        if (!r.ok) return msg(r.error);
        /* solo con todo verificado se instala en este equipo */
        var f = fiscal(); f.p12 = r.p12; f.certVence = r.vence ? new Date(r.vence).toISOString() : f.certVence;
        global.__ppFiscalPass = r.clave || "";
        var c = global.PPNubePerfil.conf(); c.certNube = true; c.huella = r.huella;
        try { global.PPStore.save(); } catch (e) {}
        UI().closeSheet();
        toast(r.vencido ? "Recuperado, pero esta vencido. Pide uno nuevo" : "Certificado recuperado y listo para firmar");
        if (alTerminar) alTerminar(r);
      });
    };
  }

  global.PPNubeCertUI = { pedirResguardo: pedirResguardo, bloqueNube: bloqueNube, restaurarConFrase: restaurarConFrase, pedirClaveP12: pedirClaveP12 };
})(window);
