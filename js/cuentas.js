/* PediPOS · Pagos y abonos en IndexedDB
 * Los pagos vivian dentro del cliente, y la sincronizacion reemplazaba el cliente
 * desde la nube cada 30 segundos: el pago se registraba y desaparecia. Aqui viven
 * aparte, con su fecha, monto y saldo, y nada de la nube los puede borrar.
 */
(function (global) {
  "use strict";
  var DB_NAME = "pedipos_cuentas", DB_VER = 1, STORE = "pagos";
  var mem = [], listo = false, promesa = null;

  function crearAlmacen(d) {
    if (!d.objectStoreNames.contains(STORE)) {
      var os = d.createObjectStore(STORE, { keyPath: "id" });
      try { os.createIndex("cliente_id", "cliente_id", { unique: false }); } catch (e) {}
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

  function cerrar() {
    if (!promesa) return Promise.resolve(false);
    return promesa.then(function (d) { try { d.close(); } catch (e) {} promesa = null; return true; })
      .catch(function () { promesa = null; return false; });
  }
  if (global.addEventListener) global.addEventListener("pagehide", function () { cerrar(); });

  function todas() {
    return tx("readonly").then(function (os) {
      return new Promise(function (res, rej) {
        var q = os.getAll();
        q.onsuccess = function () { res(q.result || []); };
        q.onerror = function () { rej(q.error); };
      });
    });
  }

  function guardar(p) {
    if (!p || !p.id) return Promise.resolve(false);
    return tx("readwrite").then(function (os) {
      return new Promise(function (res, rej) {
        var q = os.put(p);
        q.onsuccess = function () { res(true); };
        q.onerror = function () { rej(q.error); };
      });
    });
  }

  function borrar(id) {
    return tx("readwrite").then(function (os) {
      return new Promise(function (res, rej) {
        var q = os.delete(id);
        q.onsuccess = function () { res(true); };
        q.onerror = function () { rej(q.error); };
      });
    });
  }

  /* arranque: carga en memoria e importa los pagos que quedaron dentro de los clientes */
  function init() {
    if (listo) return Promise.resolve(mem);
    return todas().then(function (regs) {
      mem = regs || [];
      /* migracion: pagos guardados dentro del cliente antes de existir este almacen */
      try {
        var db = global.PPStore && global.PPStore.db;
        var clientes = (db && db.clients) || [];
        var conocidos = new Set(mem.map(function (p) { return p.id; }));
        var nuevos = [];
        clientes.forEach(function (c) {
          (Array.isArray(c.pagos) ? c.pagos : []).forEach(function (g) {
            if (!g || !g.id || conocidos.has(g.id)) return;
            conocidos.add(g.id);
            nuevos.push({
              id: g.id, cliente_id: c.cid, fecha: g.fecha, monto: Number(g.monto) || 0,
              nota: g.nota || "", saldoAntes: g.saldoAntes, saldoDespues: g.saldoDespues
            });
          });
        });
        if (nuevos.length) {
          mem = mem.concat(nuevos);
          nuevos.forEach(function (p) { guardar(p).catch(function () {}); });
        }
      } catch (e) {}
      mem.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
      listo = true;
      return mem;
    }).catch(function () { listo = true; return mem; });
  }

  function all() { return mem.slice(); }

  function add(p) {
    if (!p || !p.id) return p;
    var i = mem.findIndex(function (x) { return x.id === p.id; });
    if (i >= 0) mem[i] = p; else mem.unshift(p);
    mem.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    guardar(p).catch(function () {});
    return p;
  }

  function deCliente(cid) {
    return mem.filter(function (p) { return p.cliente_id === cid; })
      .sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  }

  function totalDe(cid) {
    return deCliente(cid).reduce(function (x, p) { return x + (Number(p.monto) || 0); }, 0);
  }

  function quitar(id) {
    mem = mem.filter(function (p) { return p.id !== id; });
    borrar(id).catch(function () {});
  }

  global.PPCuentas = {
    init: init, all: all, add: add, deCliente: deCliente, totalDe: totalDe,
    quitar: quitar, cerrar: cerrar
  };
})(window);
