/* PediPOS · Certificado digital restaurable (v2.14.0)
   El .p12 se cifra EN EL EQUIPO del comerciante (AES-256-GCM, clave derivada de una frase con PBKDF2) y solo el
   paquete cifrado viaja al servidor. El servidor nunca ve la frase ni el certificado en claro.
   Flujo:
     guardar(p12, claveP12, frase, vence) -> cifra, pide consentimiento y sube a PpPerfil
     restaurar(rnc, frase)               -> baja el paquete, lo descifra y VERIFICA que el certificado firma
   Si algo falla, nada queda a medias: el certificado actual del equipo no se toca hasta que la verificacion pasa. */
(function (global) {
  "use strict";

  var ITER = 210000;

  function aB64(u8) { var s = ""; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function deB64(b) { var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }

  function llaveDe(frase, sal) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(frase), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: sal, iterations: ITER, hash: "SHA-256" }, base,
        { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }

  function cifrar(texto, frase) {
    var sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return llaveDe(frase, sal).then(function (k) {
      return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(texto));
    }).then(function (ct) { return { datos: aB64(new Uint8Array(ct)), sal: aB64(sal), iv: aB64(iv) }; });
  }

  function descifrar(paquete, frase) {
    return llaveDe(frase, deB64(paquete.sal)).then(function (k) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(paquete.iv) }, k, deB64(paquete.datos));
    }).then(function (pt) { return new TextDecoder().decode(pt); });
  }

  /* Huella corta del certificado para comprobar que es el mismo despues de restaurar. */
  function huella(p12b64) {
    return crypto.subtle.digest("SHA-256", deB64(p12b64)).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("").slice(0, 16);
    });
  }

  function url() {
    var n = global.PPNubePerfil;
    return (n && n.conf().url) || (n && n.URL_DEF);
  }
  function post(cuerpo) {
    return fetch(url(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })
      .then(function (r) { return r.json(); });
  }

  /* Comprueba que el certificado abre con su clave y que de verdad FIRMA (no basta con que descifre). */
  function probarFirma(p12b64, claveP12) {
    var E = global.ECF;
    if (!E || !E.cargarP12) return { ok: false, error: "No esta disponible el modulo de firma" };
    try {
      var cred = E.cargarP12(p12b64, claveP12 || "");
      var md = cred.forge.md.sha256.create();
      md.update("prueba-de-firma-pedipos", "utf8");
      var firma = cred.key.sign(md);
      if (!firma || !firma.length) return { ok: false, error: "El certificado no pudo firmar" };
      var hasta = cred.cert && cred.cert.validity && cred.cert.validity.notAfter;
      var vencido = hasta ? new Date(hasta).getTime() < Date.now() : false;
      return { ok: true, vence: hasta ? new Date(hasta).toISOString().slice(0, 10) : "", vencido: vencido };
    } catch (e) {
      var m = String((e && e.message) || e);
      if (/mac|password|pkcs12|decrypt/i.test(m)) return { ok: false, error: "La clave del certificado es incorrecta" };
      return { ok: false, error: "El archivo no es un certificado valido (" + m.slice(0, 60) + ")" };
    }
  }

  /* ---------- guardar ---------- */
  function guardar(p12b64, claveP12, frase, consentimiento) {
    var c = global.PPNubePerfil && global.PPNubePerfil.conf();
    if (!c || !c.rnc) return Promise.resolve({ ok: false, error: "Falta el RNC del comercio en Nube y perfil" });
    if (!consentimiento) return Promise.resolve({ ok: false, error: "Falta el consentimiento para guardar el certificado cifrado" });
    if (!frase || String(frase).length < 8) return Promise.resolve({ ok: false, error: "La frase debe tener al menos 8 caracteres" });
    var prueba = probarFirma(p12b64, claveP12);
    /* se avisa del vencimiento, pero un certificado vencido tambien se puede respaldar para no perderlo */
    if (!prueba.ok) return Promise.resolve(prueba);
    return Promise.all([cifrar(JSON.stringify({ p12: p12b64, clave: claveP12 || "", guardado: new Date().toISOString() }), frase), huella(p12b64)])
      .then(function (r) {
        var pq = r[0], h = r[1];
        return post({
          accion: "perfil.guardar", rnc: c.rnc,
          razonSocial: (global.PPUI && global.PPUI.db().settings.negocio) || "",
          ajustes: JSON.stringify((global.PPUI && global.PPUI.db().settings) || {}),
          usuarios: JSON.stringify(((global.PPUI && global.PPUI.db().users) || []).map(function (u) {
            return { uid: u.uid, nombre: u.nombre, rol: u.rol, activo: u.activo !== false, pinHash: u.pinHash || "", pinSalt: u.pinSalt || "" };
          })),
          certificadoCifrado: pq.datos, certificadoSalt: pq.sal, certificadoIv: pq.iv, certificadoHuella: h,
          certificadoVence: prueba.vence, consentimiento: true
        }).then(function (d) {
          if (!d || !d.ok) return { ok: false, error: (d && d.error) || "El servidor no guardo el certificado" };
          c.certNube = true; c.huella = h;
          try { global.PPStore.save(); } catch (e) {}
          return { ok: true, huella: h, vence: prueba.vence, vencido: prueba.vencido, version: d.version };
        });
      }).catch(function (e) { return { ok: false, error: "No se pudo guardar: " + ((e && e.message) || e) }; });
  }

  /* ---------- restaurar ---------- */
  function restaurar(rnc, frase) {
    return post({ accion: "perfil.obtener", rnc: rnc }).then(function (d) {
      if (!d || !d.ok || !d.perfil) return { ok: false, error: (d && d.error) || "Ese RNC no tiene perfil guardado" };
      var p = d.perfil;
      if (!p.certificadoCifrado) return { ok: false, error: "Este perfil no tiene un certificado guardado. Sube el .p12 de nuevo." };
      return descifrar({ datos: p.certificadoCifrado, sal: p.certificadoSalt, iv: p.certificadoIv }, frase).then(function (txt) {
        var o; try { o = JSON.parse(txt); } catch (e) { return { ok: false, error: "El certificado guardado esta danado" }; }
        var prueba = probarFirma(o.p12, o.clave);
        if (!prueba.ok) return prueba;
        return huella(o.p12).then(function (h) {
          if (p.certificadoHuella && h !== p.certificadoHuella) return { ok: false, error: "El certificado restaurado no coincide con el que se guardo" };
          /* recien aqui, con todo verificado, se instala en este equipo */
          var f = global.PPFiscalConf ? global.PPFiscalConf() : null;
          return { ok: true, p12: o.p12, clave: o.clave || "", huella: h, vence: prueba.vence, vencido: prueba.vencido, instalar: f };
        });
      }, function () { return { ok: false, error: "La frase es incorrecta" }; });
    }).catch(function (e) { return { ok: false, error: "No se pudo restaurar: " + ((e && e.message) || e) }; });
  }

  global.PPNubeCert = { guardar: guardar, restaurar: restaurar, probarFirma: probarFirma, cifrar: cifrar, descifrar: descifrar, huella: huella };
})(window);
