/* PediPOS · Comercios (multi-tenant local)
   Cada comerciante tiene su propio espacio: su clave de almacenamiento, sus ventas,
   su caja y su configuracion. Nada se mezcla con otro comercio del mismo equipo.
   Limite honesto: el aislamiento es por dispositivo/navegador; la separacion en
   servidor exige backend con tenant_id y reglas por fila. */
(function (global) {
  "use strict";
  var LISTA = "pedipos.comercios.v1";
  var ACTIVO = "pedipos.comercio.activo";
  var SESION = "pedipos.comercio.sesion";

  function leer(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  function todos() { return leer(LISTA, []); }
  function actual() { return localStorage.getItem(ACTIVO) || "default"; }
  function comercioActual() { var id = actual(); return todos().filter(function (c) { return c.id === id; })[0] || null; }
  function sesion() { return leer(SESION, null); }

  /* hash sencillo del PIN: nunca se guarda el PIN en claro */
  function hash(txt) {
    var h = 5381, s = String(txt) + "|pedipos";
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function registrar(o) {
    var nombre = String((o && o.nombre) || "").trim();
    if (nombre.length < 2) throw new Error("Escribe el nombre del comercio");
    var pin = String((o && o.pin) || "");
    if (pin.length < 4) throw new Error("El PIN debe tener 4 numeros o mas");
    var lista = todos();
    if (lista.some(function (c) { return c.nombre.toLowerCase() === nombre.toLowerCase(); }))
      throw new Error("Ya existe un comercio con ese nombre en este equipo");
    var id = "C-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var c = { id: id, nombre: nombre, correo: String((o && o.correo) || ""), pin: hash(pin), creado: new Date().toISOString() };
    lista.push(c); escribir(LISTA, lista);
    entrar(id, pin);
    return c;
  }

  function entrar(id, pin) {
    var c = todos().filter(function (x) { return x.id === id; })[0];
    if (!c) throw new Error("Ese comercio no existe en este equipo");
    if (c.pin !== hash(pin)) throw new Error("PIN incorrecto");
    localStorage.setItem(ACTIVO, id);
    escribir(SESION, { id: id, nombre: c.nombre, desde: new Date().toISOString() });
    return c;
  }

  function salir() { try { localStorage.removeItem(SESION); } catch (e) {} }

  /* clave de almacenamiento propia de cada comercio */
  function key(base) { return base + ":" + actual(); }

  global.PPTenant = { todos: todos, actual: actual, comercioActual: comercioActual, sesion: sesion, registrar: registrar, entrar: entrar, salir: salir, key: key };
})(window);
