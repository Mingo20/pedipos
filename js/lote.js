/* PediPOS · Set de pruebas DGII: carga el Excel del set, arma y firma los e-CF,
   los envia en orden a certecf y muestra el resultado de cada registro. */
(function (global) {
  "use strict";
  var S = global.PPStore, db = function () { return S.db; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function cfg() { return (global.PPFiscal && global.PPFiscal.cfg) ? global.PPFiscal.cfg() : {}; }
  function aviso(m) { var t = (global.PPUI || {}).toast; if (t) t(m); else console.log(m); }

  /* ---------- CSV ---------- */
  function parseCSV(txt) {
    txt = String(txt || "").replace(/^\uFEFF/, "");
    var sep = (txt.split("\n")[0].split(";").length > txt.split("\n")[0].split(",").length) ? ";" : ",";
    var filas = [], campo = "", fila = [], comillas = false;
    for (var i = 0; i < txt.length; i++) {
      var c = txt[i];
      if (comillas) {
        if (c === '"' && txt[i + 1] === '"') { campo += '"'; i++; }
        else if (c === '"') comillas = false;
        else campo += c;
      } else if (c === '"') comillas = true;
      else if (c === sep) { fila.push(campo); campo = ""; }
      else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
      else if (c !== "\r") campo += c;
    }
    if (campo.length || fila.length) { fila.push(campo); filas.push(fila); }
    return filas.filter(function (f) { return f.some(function (x) { return String(x).trim() !== ""; }); });
  }

  /* ---------- XLSX (zip + xml, sin librerias externas) ---------- */
  async function descomprimir(buf) {
    var u = new Uint8Array(buf), dv = new DataView(buf), out = {}, i = 0;
    while (i < u.length - 4) {
      if (dv.getUint32(i, true) !== 0x04034b50) break;
      var metodo = dv.getUint16(i + 8, true);
      var comp = dv.getUint32(i + 18, true);
      var nLen = dv.getUint16(i + 26, true), eLen = dv.getUint16(i + 28, true);
      var nombre = new TextDecoder().decode(u.subarray(i + 30, i + 30 + nLen));
      var ini = i + 30 + nLen + eLen, datos = u.subarray(ini, ini + comp);
      if (comp > 0) {
        if (metodo === 0) out[nombre] = datos;
        else if (metodo === 8 && typeof DecompressionStream !== "undefined") {
          try {
            var ds = new DecompressionStream("deflate-raw");
            var flujo = new Blob([datos]).stream().pipeThrough(ds);
            out[nombre] = new Uint8Array(await new Response(flujo).arrayBuffer());
          } catch (e) { /* entrada no descomprimible: se omite */ }
        }
      }
      i = ini + comp;
    }
    return out;
  }

  function textoDe(u8) { return u8 ? new TextDecoder().decode(u8) : ""; }

  function filasDeXlsx(files) {
    var doc = new DOMParser();
    var compartidos = [];
    if (files["xl/sharedStrings.xml"]) {
      var sx = doc.parseFromString(textoDe(files["xl/sharedStrings.xml"]), "application/xml");
      compartidos = Array.prototype.map.call(sx.getElementsByTagName("si"), function (si) {
        return Array.prototype.map.call(si.getElementsByTagName("t"), function (t) { return t.textContent; }).join("");
      });
    }
    var hoja = Object.keys(files).filter(function (n) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(n); }).sort()[0];
    if (!hoja) return [];
    var wx = doc.parseFromString(textoDe(files[hoja]), "application/xml");
    return Array.prototype.map.call(wx.getElementsByTagName("row"), function (r) {
      var celdas = [];
      Array.prototype.forEach.call(r.getElementsByTagName("c"), function (c) {
        var t = c.getAttribute("t"), v = c.getElementsByTagName("v")[0];
        var val = v ? v.textContent : "";
        if (t === "s") val = compartidos[Number(val)] || "";
        else if (t === "inlineStr") {
          var is = c.getElementsByTagName("t")[0];
          val = is ? is.textContent : "";
        }
        var ref = c.getAttribute("r") || "";
        var col = ref.replace(/[0-9]/g, "");
        var idx = 0;
        for (var k = 0; k < col.length; k++) idx = idx * 26 + (col.charCodeAt(k) - 64);
        celdas[idx - 1] = val;
      });
      return celdas;
    });
  }

  async function leer(file) {
    if (/\.csv$/i.test(file.name)) return parseCSV(await file.text());
    if (/\.xlsx$/i.test(file.name)) return filasDeXlsx(await descomprimir(await file.arrayBuffer()));
    if (/\.xls$/i.test(file.name)) throw new Error("El formato .xls viejo no se puede leer. Abrelo en Excel y guardalo como .xlsx o .csv.");
    throw new Error("Usa el Excel (.xlsx) o un CSV.");
  }

  /* ---------- Mapeo de columnas del set de pruebas ---------- */
  var CLAVES = [
    ["ncf", /(^|\s)(e-?ncf|ncf|comprobante)/i],
    ["rnc", /(rnc|cedula|documento)/i],
    ["total", /(monto|total|importe|valor)/i],
    ["tipo", /(tipo)/i],
    ["nombre", /(nombre|razon|cliente|descrip)/i],
    ["itbis", /(itbis)/i]
  ];
  function mapear(filas) {
    if (!filas.length) return { cols: {}, datos: [] };
    var cab = filas[0].map(function (x) { return String(x || "").trim(); });
    var cols = {};
    cab.forEach(function (h, i) {
      CLAVES.forEach(function (par) { if (!(par[0] in cols) && par[1].test(h)) cols[par[0]] = i; });
    });
    return { cols: cols, cab: cab, datos: filas.slice(1) };
  }

  function filaVenta(f, cols, c) {
    var val = function (k) { var i = cols[k]; return i === undefined ? "" : String(f[i] === undefined ? "" : f[i]).trim(); };
    var total = Number(String(val("total")).replace(/[^0-9.]/g, "")) || 0;
    var itbis = Number(String(val("itbis")).replace(/[^0-9.]/g, ""));
    if (!itbis) itbis = Math.round(total * 0.18 / 1.18 * 100) / 100;
    var subtotal = Math.round((total - itbis) * 100) / 100;
    return {
      ncf: val("ncf"), rnc: val("rnc"), tipo: val("tipo"),
      nombre: val("nombre") || "Prueba set DGII",
      total: total, itbis: itbis, subtotal: subtotal,
      lineas: [{ nombre: val("nombre") || "Producto de prueba", cant: 1, precio: subtotal || total }]
    };
  }

  /* ---------- Proceso por lote ---------- */
  var estado = { corriendo: false, hechos: 0, total: 0, resultados: [] };

  async function procesar(filas, cols, alAvanzar) {
    var c = cfg(), E = global.ECF;
    if (!E) throw new Error("El motor e-CF no esta cargado.");
    if (!c.p12) throw new Error("Carga tu certificado .p12 en Fiscal antes de probar.");
    var pass = global.__ppFiscalPass || "";
    var cred;
    try { cred = E.cargarP12(c.p12, pass); }
    catch (e) { throw new Error("No se pudo abrir el certificado. Revisa la contrasena en Fiscal."); }
    var tk;
    try { tk = await E.token(c, cred); }
    catch (e) { throw new Error("La DGII no entrego el token: " + (e.message || e)); }

    estado.corriendo = true; estado.hechos = 0; estado.total = filas.length; estado.resultados = [];
    for (var i = 0; i < filas.length; i++) {
      var v = filaVenta(filas[i], cols, c);
      var res = { fila: i + 2, ncf: v.ncf, total: v.total, estado: "error", trackId: "", mensaje: "", xml: "" };
      try {
        if (!v.ncf) throw new Error("La fila no trae e-NCF");
        var cfgFila = Object.assign({}, c, { ncf: v.ncf });
        var xml = E.buildEcf({ lineas: v.lineas, subtotal: v.subtotal, itbis: v.itbis, total: v.total }, cfgFila);
        var firmado = E.firmar(xml, cred);
        res.xml = String(firmado);
        var r = await E.enviar(cfgFila, firmado, tk);
        res.estado = r.estado === "enviado" ? "enviado" : "error";
        res.trackId = r.trackId || "";
        res.mensaje = r.mensaje || "";
      } catch (e) {
        res.mensaje = String(e.message || e);
      }
      estado.resultados.push(res);
      estado.hechos++;
      if (alAvanzar) alAvanzar(estado);
    }
    estado.corriendo = false;
    var d = db(); d.fiscal = d.fiscal || {};
    d.fiscal.lote = { fecha: new Date().toISOString(), archivo: "", resultados: estado.resultados };
    S.save();
    return estado.resultados;
  }

  /* ---------- Pantalla ---------- */
  function render(view) {
    var d = db(); d.fiscal = d.fiscal || {};
    var previos = (d.fiscal.lote && d.fiscal.lote.resultados) || [];
    view.innerHTML =
      '<div class="lote-wrap">' +
        '<div class="lote-h">' +
          '<button class="lote-back" id="loteBack" aria-label="Volver">' + ((global.PPUI && global.PPUI.I && global.PPUI.I.back) || "&larr;") + '</button>' +
          '<div><h2>Set de pruebas DGII</h2><p>Sube el Excel del set y la app arma, firma y envia los e-CF uno por uno.</p></div>' +
        '</div>' +
        '<div class="lote-card">' +
          '<label class="lote-drop" id="loteDrop">' +
            '<input type="file" id="loteFile" accept=".xlsx,.csv" hidden>' +
            '<b>Selecciona el Excel del set</b><span id="loteName">.xlsx o .csv que te dio la DGII</span>' +
          '</label>' +
          '<div class="lote-info" id="loteInfo">Aun no hay archivo cargado.</div>' +
          '<button class="lote-btn" id="loteRun" disabled>Procesar registros</button>' +
          '<div class="lote-prog" id="loteProg" hidden><div class="lote-bar"><i id="loteBar"></i></div><span id="lotePct">0%</span></div>' +
        '</div>' +
        '<div id="loteRes"></div>' +
      '</div>';

    $("#loteBack", view).onclick = function () { if (global.PPUI) global.PPUI.go("fiscal"); };

    var filas = null, cols = null;
    var inp = $("#loteFile", view);
    inp.onchange = async function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      $("#loteName", view).textContent = f.name + " · " + Math.round(f.size / 1024) + " KB";
      try {
        var t = await leer(f);
        var m = mapear(t);
        filas = m.datos; cols = m.cols;
        var faltan = ["ncf", "total"].filter(function (k) { return !(k in cols); });
        $("#loteInfo", view).innerHTML = faltan.length
          ? '<span class="lote-warn">No encontre la columna ' + faltan.join(" ni ") + '. Revisa que la primera fila tenga los titulos.</span>'
          : "Detectados <b>" + filas.length + "</b> registros. Columnas: " + m.cab.filter(Boolean).slice(0, 6).join(" · ");
        $("#loteRun", view).disabled = faltan.length > 0 || !filas.length;
      } catch (e) {
        $("#loteInfo", view).innerHTML = '<span class="lote-warn">' + e.message + "</span>";
        $("#loteRun", view).disabled = true;
      }
    };

    $("#loteRun", view).onclick = async function () {
      var b = this; b.disabled = true;
      $("#loteProg", view).hidden = false;
      try {
        await procesar(filas, cols, function (st) {
          var pct = Math.round(st.hechos / st.total * 100);
          $("#loteBar", view).style.width = pct + "%";
          $("#lotePct", view).textContent = pct + "%  ·  " + st.hechos + "/" + st.total;
          pintarResultados(view, st.resultados);
        });
        aviso("Set procesado: " + estado.resultados.length + " registros");
      } catch (e) {
        aviso(String(e.message || e));
      }
      b.disabled = false;
    };

    if (previos.length) pintarResultados(view, previos);
  }

  function pintarResultados(view, lista) {
    var cont = $("#loteRes", view);
    if (!cont) return;
    var ok = lista.filter(function (r) { return r.estado === "enviado"; }).length;
    cont.innerHTML =
      '<div class="lote-res-h"><b>' + lista.length + " registros</b><span>" + ok + " enviados · " + (lista.length - ok) + " con problema</span></div>" +
      '<div class="lote-tabla">' +
        lista.map(function (r, i) {
          return '<div class="lote-row ' + (r.estado === "enviado" ? "ok" : "mal") + '">' +
            '<span class="lote-n">' + (i + 1) + "</span>" +
            '<div class="lote-d"><b>' + (r.ncf || "sin e-NCF") + "</b><small>" + (r.trackId ? "track " + r.trackId : (r.mensaje || "")) + "</small></div>" +
            '<span class="lote-est">' + r.estado + "</span>" +
            (r.xml ? '<button class="lote-x" data-x="' + i + '">XML</button>' : "") +
          "</div>";
        }).join("") +
      "</div>";
    $$("[data-x]", cont).forEach(function (b) {
      b.onclick = function () {
        var r = lista[Number(b.dataset.x)];
        var blob = new Blob([r.xml], { type: "application/xml" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (r.ncf || "ecf") + ".xml";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      };
    });
  }

  global.PPLote = { render: render, procesar: procesar, leer: leer, mapear: mapear };
})(window);
