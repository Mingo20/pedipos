/* PediPOS · Comprobantes en IndexedDB
 * Los XML firmados no caben en localStorage (5-10 MB): a 1.000 facturas diarias
 * se llenaba en dos o tres dias y la app dejaba de guardar. Aqui viven en
 * IndexedDB, con espejo en memoria para que el resto del codigo siga igual.
 * Incluye exportacion completa (JSON y CSV) e importacion para auditar.
 */
(function (global) {
  "use strict";
  var DB_NAME = "pedipos_comprobantes", DB_VER = 1, STORE = "comprobantes";
  var mem = [], listo = false, promesa = null;

  function crearAlmacen(d) {
    if (!d.objectStoreNames.contains(STORE)) {
      var os = d.createObjectStore(STORE, { keyPath: "id" });
      try { os.createIndex("estado", "estado", { unique: false }); } catch (e) {}
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
        /* si otra pestana pide subir la version, se suelta la conexion o queda bloqueada */
        d.onversionchange = function () { try { d.close(); } catch (e) {} promesa = null; };
        d.onclose = function () { promesa = null; };
        /* si la base quedo creada sin el almacen, se reabre con una version nueva */
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

  /* suelta la conexion: no se dejan ventanas de IndexedDB abiertas */
  function cerrar() {
    if (!promesa) return Promise.resolve(false);
    return promesa.then(function (d) {
      try { d.close(); } catch (e) {}
      promesa = null;
      return true;
    }).catch(function () { promesa = null; return false; });
  }

  if (global.addEventListener) {
    global.addEventListener("pagehide", function () { cerrar(); });
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

  function guardar(reg) {
    if (!reg || !reg.id) return Promise.resolve(false);
    return tx("readwrite").then(function (os) {
      return new Promise(function (res, rej) {
        var q = os.put(reg);
        q.onsuccess = function () { res(true); };
        q.onerror = function () { rej(q.error); };
      });
    });
  }

  function borrarTodo() {
    return tx("readwrite").then(function (os) {
      return new Promise(function (res, rej) {
        var q = os.clear();
        q.onsuccess = function () { res(true); };
        q.onerror = function () { rej(q.error); };
      });
    });
  }

  /* ---------- arranque: carga en memoria y migra lo que estaba en localStorage ---------- */
  function init() {
    if (listo) return Promise.resolve(mem);
    return todas().then(function (regs) {
      mem = regs.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
      /* migracion desde el almacenamiento viejo */
      var viejos = (global.PPStore && global.PPStore.db && global.PPStore.db.ecf) || [];
      if (Array.isArray(viejos) && viejos.length) {
        var pend = viejos.map(function (r) { return guardar(r); });
        return Promise.all(pend).then(function () {
          viejos.forEach(function (r) { if (!mem.some(function (m) { return m.id === r.id; })) mem.push(r); });
          mem.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
          /* liberar el espacio del almacenamiento viejo */
          try { global.PPStore.db.ecf = []; global.PPStore.save(); } catch (e) {}
          listo = true; return mem;
        });
      }
      listo = true; return mem;
    }).catch(function () { listo = true; return mem; });
  }

  function all() { return mem.slice(); }
  function add(reg) {
    mem.unshift(reg);
    guardar(reg).catch(function () {});
    return reg;
  }
  function update(reg) {
    var i = mem.findIndex(function (m) { return m.id === reg.id; });
    if (i >= 0) mem[i] = reg; else mem.unshift(reg);
    guardar(reg).catch(function () {});
    return reg;
  }
  function count() { return mem.length; }

  /* ---------- exportacion ---------- */
  function descargar(nombre, texto, tipo) {
    var blob = new Blob([texto], { type: tipo || "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function exportarJSON() {
    var cfg = (global.PPFiscal && global.PPFiscal.cfg) ? global.PPFiscal.cfg() : {};
    var payload = {
      tipo: "pedipos.comprobantes", version: 1, exportado: new Date().toISOString(),
      emisor: {
        rnc: cfg.rnc || "", razonSocial: cfg.razonSocial || "", nombreComercial: cfg.nombreComercial || "",
        ambiente: cfg.ambiente || "", emisorId: cfg.emisorId || "", secuencia: cfg.ncf || "",
        vencimientoSecuencia: cfg.vencimientoSecuencia || ""
      },
      total: mem.length,
      comprobantes: mem
    };
    var d = new Date().toISOString().slice(0, 10);
    descargar("comprobantes-" + (cfg.rnc || "pedipos") + "-" + d + ".json", JSON.stringify(payload, null, 1));
    return mem.length;
  }

  function exportarCSV() {
    var cab = ["fecha", "encf", "tipo", "estado", "total", "itbis", "trackId", "mensaje"];
    var filas = mem.map(function (r) {
      return [r.fecha || "", r.encf || "", r.tipo || "", r.estado || "", r.total || 0, r.itbis || 0, r.trackId || "",
        String(r.mensaje || "").replace(/;/g, ",")].join(";");
    });
    descargar("comprobantes-" + new Date().toISOString().slice(0, 10) + ".csv", cab.join(";") + "\n" + filas.join("\n"), "text/csv;charset=utf-8");
    return mem.length;
  }

  /* ---------- importacion (para el panel del dueno) ---------- */
  function importar(texto) {
    var data = JSON.parse(texto);
    var regs = Array.isArray(data) ? data : (data.comprobantes || []);
    var emisor = (data && data.emisor) || {};
    return Promise.all(regs.map(function (r) { return guardar(r); })).then(function () {
      regs.forEach(function (r) { if (!mem.some(function (m) { return m.id === r.id; })) mem.push(r); });
      mem.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
      return { importados: regs.length, emisor: emisor };
    });
  }

  global.PPComprobantes = {
    cerrar: cerrar,
    init: init, all: all, add: add, update: update, actualizar: update, count: count,
    exportarJSON: exportarJSON, exportarCSV: exportarCSV, importar: importar, borrarTodo: borrarTodo
  };
})(window);
