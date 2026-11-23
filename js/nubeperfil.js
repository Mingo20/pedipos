/* PediPOS · Perfil y secuencia en la nube (Base44 · pedposPerfil)
 * - Bloques de e-NCF reservados en el servidor: dos cajas nunca repiten numero.
 * - Perfil restaurable en un equipo nuevo: RNC + usuario + PIN.
 * El PIN viaja solo como hash PBKDF2-SHA256 y el .p12 nunca se envia en claro.
 */
(function (global) {
  "use strict";
  var URL_DEF = "https://base44.app/api/apps/6a0113bf2d35fdb22cd92a9e/functions/pedposPerfil";

  function S() { return global.PPStore; }
  function db() { return S().db; }
  function guardar() { try { S().save(); } catch (e) {} }

  function conf() {
    var d = db();
    d.nubePerfil = d.nubePerfil || { activo: false, rnc: "", url: URL_DEF, bloques: {} };
    d.nubePerfil.bloques = d.nubePerfil.bloques || {};
    if (!d.nubePerfil.url) d.nubePerfil.url = URL_DEF;
    return d.nubePerfil;
  }

  function post(url, cuerpo) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo)
    }).then(function (r) { return r.json(); });
  }

  /* ---------- PIN ---------- */
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ("00" + b.toString(16)).slice(-2);
    }).join("");
  }
  function desdeHex(h) {
    var a = new Uint8Array(h.length / 2);
    for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16);
    return a;
  }
  function nuevoSalt() {
    var a = new Uint8Array(16);
    (global.crypto || global.msCrypto).getRandomValues(a);
    return hex(a);
  }
  function hashPin(pin, saltHex) {
    var c = global.crypto && global.crypto.subtle;
    if (!c) return Promise.reject(new Error("Este navegador no permite cifrar el PIN"));
    var enc = new TextEncoder();
    return c.importKey("raw", enc.encode(String(pin)), { name: "PBKDF2" }, false, ["deriveBits"])
      .then(function (k) {
        return c.deriveBits({ name: "PBKDF2", salt: desdeHex(saltHex), iterations: 150000, hash: "SHA-256" }, k, 256);
      })
      .then(hex);
  }

  /* ---------- bloques de secuencia ---------- */
  function reservar(clave) {
    var c = conf();
    if (c._pidiendo) return;
    c._pidiendo = true;
    post(c.url, { accion: "secuencia.reservar", rnc: c.rnc, tipo: String(clave).slice(1), cantidad: 50 })
      .then(function (d) {
        if (d && d.ok) {
          c.bloques[clave] = { desde: d.desde, hasta: d.hasta, usado: 0 };
          guardar();
        }
      })
      .catch(function () {})
      .then(function () { c._pidiendo = false; });
  }

  /* Devuelve el siguiente numero del bloque reservado, o null para seguir con el contador local. */
  function tomar(clave, ancho) {
    try {
      var c = conf();
      if (!c.activo || !c.rnc || !c.url) return null;
      var b = c.bloques[clave];
      var capacidad = b ? Number(b.hasta) - Number(b.desde) + 1 : 0;
      if (!b || Number(b.usado || 0) >= capacidad) {
        reservar(clave);
        return null;
      }
      var n = Number(b.desde) + Number(b.usado || 0);
      b.usado = Number(b.usado || 0) + 1;
      if (capacidad - b.usado <= 5) reservar(clave);
      guardar();
      return String(n).padStart(ancho, "0");
    } catch (e) {
      return null;
    }
  }

  function estado() {
    var c = conf();
    return post(c.url, { accion: "secuencia.estado", rnc: c.rnc });
  }

  /* ---------- perfil ---------- */
  function guardarPerfil(pin) {
    var c = conf();
    var d = db();
    var usuarios = (d.users || []).map(function (u) {
      return { uid: u.uid, nombre: u.nombre, rol: u.rol, activo: u.activo !== false, pinHash: u.pinHash || "", pinSalt: u.pinSalt || "" };
    });
    var listos = Promise.all(usuarios.map(function (u) {
      if (u.pinHash && u.pinSalt) return Promise.resolve(u);
      var fuente = (d.users || []).filter(function (x) { return x.uid === u.uid; })[0] || {};
      var claro = fuente.pin || pin;
      if (!claro) return Promise.resolve(u);
      var salt = nuevoSalt();
      return hashPin(claro, salt).then(function (h) {
        u.pinHash = h; u.pinSalt = salt;
        fuente.pinHash = h; fuente.pinSalt = salt;
        return u;
      });
    }));
    return listos.then(function (lista) {
      guardar();
      return post(c.url, {
        accion: "perfil.guardar",
        rnc: c.rnc,
        razonSocial: d.settings.negocio || "",
        ajustes: JSON.stringify(d.settings || {}),
        usuarios: JSON.stringify(lista),
        certificadoHuella: c.huella || ""
      });
    });
  }

  function restaurar(url, rnc, usuario, pin) {
    var u0 = url || URL_DEF;
    return post(u0, { accion: "perfil.obtener", rnc: rnc }).then(function (d) {
      if (!d || !d.ok || !d.perfil) return { ok: false, error: "Ese RNC no tiene perfil guardado en la nube" };
      var p = d.perfil, lista = [];
      try { lista = JSON.parse(p.usuarios || "[]"); } catch (e) {}
      if (!lista.length) return { ok: false, error: "El perfil no tiene usuarios" };
      var u = lista.filter(function (x) {
        return !usuario || String(x.nombre || "").toLowerCase() === String(usuario).toLowerCase();
      })[0] || lista.filter(function (x) { return x.rol === "administrador"; })[0] || lista[0];
      if (!u.pinHash || !u.pinSalt) return { ok: false, error: "Ese usuario no tiene PIN guardado" };
      return hashPin(pin, u.pinSalt).then(function (h) {
        if (h !== u.pinHash) return { ok: false, error: "PIN incorrecto" };
        var d2 = db();
        try { Object.assign(d2.settings, JSON.parse(p.ajustes || "{}")); } catch (e) {}
        d2.users = lista.map(function (x) {
          return {
            uid: x.uid, nombre: x.nombre, rol: x.rol, activo: x.activo !== false,
            pin: x.uid === u.uid ? pin : (x.pin || ""),
            pinHash: x.pinHash || "", pinSalt: x.pinSalt || ""
          };
        });
        var c = conf();
        c.rnc = rnc; c.url = u0;
        guardar();
        return { ok: true, perfil: p };
      });
    });
  }

  var API = { tomar: tomar, reservar: reservar, estado: estado, conf: conf, guardarPerfil: guardarPerfil, restaurar: restaurar, hashPin: hashPin, URL_DEF: URL_DEF };
  global.PPNubePerfil = API;
  /* el contador fiscal consulta PPNube.tomar: se expone aqui para no tocar el otro modulo */
  if (global.PPNube && !global.PPNube.tomar) global.PPNube.tomar = tomar;
})(window);
