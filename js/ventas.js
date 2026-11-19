/* PediPOS · Ventas en IndexedDB
 * Las ventas salian del almacen viejo (localStorage, 5-10 MB) y cuando se llenaba
 * el guardado borraba historial para hacer espacio. Aqui viven completas, en el
 * almacen grande del navegador, con espejo en memoria para que la app siga igual.
 */
(function (global) {
  "use strict";
  var DB_NAME = "pedipos_ventas", DB_VER = 1, STORE = "ventas";
  var mem = [], listo = false, promesa = null, timer = null, sucio = false;

  function crearAlmacen(d) {
    if (!d.objectStoreNames.contains(STORE)) {
      var os = d.createObjectStore(STORE, { keyPath: "vid" });
      try { os.createIndex("fecha", "fecha", { unique: false }); } catch (e) {}
    }
  }

  function abrir() {
    if (promesa) return promesa;
    promesa = new Promise(function (res, rej) {
      var r = global.indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = function () { crearAlmacen(r.result); };
      r.onsuccess = function () {
        var d = r.result;
        d.onversionchange = function () { try { d.close(); } catch (e) {} promesa = null; };
        d.onclose = function () { promesa = null; };
        if (!d.objectStoreNames.contains(STORE)) {
          var v = (d.version || 1) + 1;
          d.close();
          var r2 = global.indexedDB.open(DB_NAME, v);
          r2.onupgradeneeded = function () { crearAlmacen(r2.result); };
          r2.onsuccess = function () { res(r2.result); };
          r2.onerror = function () { rej(r2.error); };
          return;
        }
        res(d);
      };
      r.onerror = function () { rej(r.error); };
    });
    return promesa;
  }

  function tx(modo) {
    return abrir().then(function (d) { return d.transaction(STORE, modo).objectStore(STORE); });
  }

  function todas() {
    return tx("readonly").then(function (os) {
      return new Promise(function (res, rej) {
        var q = os.getAll();
        q.onsuccess = function () { res(q.result || []); };
        q.onerror = function () { rej(q.error); };
      });
    });
  }

  /* reescribe el almacen completo: simple y sin riesgo de dejar ventas a medias */
  function reemplazar(arr) {
    var lista = Array.isArray(arr) ? arr.slice() : [];
    return tx("readwrite").then(function (os) {
      return new Promise(function (res, rej) {
        var q = os.clear();
        q.onsuccess = function () {
          if (!lista.length) return res(true);
          var i = 0;
          (function paso() {
            if (i >= lista.length) return res(true);
            var v = lista[i++];
            if (!v || !v.vid) return paso();
            var p = os.put(v);
            p.onsuccess = paso;
            p.onerror = function () { rej(p.error); };
          })();
        };
        q.onerror = function () { rej(q.error); };
      });
    });
  }

  function flush() {
    timer = null;
    if (!sucio) return Promise.resolve(false);
    sucio = false;
    return reemplazar(mem).then(function () { return true; }).catch(function () { return false; });
  }

  /* la app muta db().sales en el sitio: se marca sucio y se escribe agrupado */
  function marcar(arr) {
    if (Array.isArray(arr)) mem = arr;
    sucio = true;
    if (timer) return;
    timer = setTimeout(flush, 700);
  }

  function init() {
    if (listo) return Promise.resolve(mem);
    return todas().then(function (regs) {
      mem = regs;
      listo = true;
      return mem;
    }).catch(function () { listo = true; return mem; });
  }

  function cerrar() {
    if (timer) { clearTimeout(timer); flush(); }
    if (!promesa) return Promise.resolve(false);
    return promesa.then(function (d) {
      try { d.close(); } catch (e) {}
      promesa = null;
      return true;
    }).catch(function () { promesa = null; return false; });
  }

  if (global.addEventListener) {
    global.addEventListener("pagehide", function () { cerrar(); });
    global.addEventListener("online", function () { if (sucio) flush(); });
  }

  global.PPVentas = {
    init: init, todas: todas, reemplazar: reemplazar, marcar: marcar,
    flush: flush, cerrar: cerrar,
    get listo() { return listo; }
  };
})(window);
