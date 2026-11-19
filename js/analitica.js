/* PediPOS · Analitica: panel compacto con periodo, KPIs dinamicos y graficos SVG
 * Horizontal en PC (rejilla de dos columnas), vertical en el telefono.
 */
(function (global) {
  "use strict";
  var S = global.PPStore;
  var db = function () { return S.db; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var money = function (n) {
    var v = Number(n) || 0;
    return "RD$" + v.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  var moneyCorto = function (n) {
    var v = Number(n) || 0;
    if (Math.abs(v) >= 1e6) return "RD$" + (v / 1e6).toFixed(1) + "M";
    if (Math.abs(v) >= 1e3) return "RD$" + (v / 1e3).toFixed(1) + "k";
    return "RD$" + v.toFixed(0);
  };

  var periodo = 7;   /* 1 = hoy, 7, 30, 0 = todo */

  function lineas(s) {
    var L = s.lineas;
    if (typeof L === "string") { try { L = JSON.parse(L); } catch (e) { L = []; } }
    return Array.isArray(L) ? L : [];
  }
  function diasAtras(n) {
    var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1)); return d;
  }
  function ventasFiltradas() {
    var todas = (db().sales || []);
    if (!periodo) return todas;
    var desde = periodo === 1 ? new Date(new Date().setHours(0, 0, 0, 0)) : diasAtras(periodo);
    return todas.filter(function (s) { return new Date(s.fecha) >= desde; });
  }


  /* ---------- datos de ejemplo (solo para mostrar el panel con vida) ---------- */
  function demoVentas(nDias) {
    var prods = (db().products || []).map(function (p) { return { n: p.nombre, p: p.precio }; });
    if (!prods.length) prods = [{ n: "Arroz Campo", p: 45 }, { n: "Aceite", p: 180 }, { n: "Habichuelas Rojas", p: 60 },
      { n: "Leche Entera", p: 75 }, { n: "Pollo", p: 95 }, { n: "Huevos", p: 8 }, { n: "Azucar", p: 40 }, { n: "Platano", p: 20 }];
    var clientes = ["Consumidor final", "Colmado La Esquina", "Sra. Martinez", "Jose Perez", "Mini Market El Sol", "Dona Rosa"];
    var metodos = ["efectivo", "efectivo", "efectivo", "tarjeta", "credito"];
    var out = [], hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    for (var d = nDias - 1; d >= 0; d--) {
      var base = 3 + Math.round(Math.abs(Math.sin(d * 1.7)) * 6);
      for (var i = 0; i < base; i++) {
        var f = new Date(hoy); f.setDate(f.getDate() - d); f.setHours(8 + ((i * 3 + d) % 11), (i * 17) % 60, 0, 0);
        var lineas = [], sub = 0, nl = 1 + (i % 3);
        for (var k = 0; k < nl; k++) {
          var pr = prods[(i + k + d) % prods.length], cant = 1 + ((i + k) % 3);
          lineas.push({ nombre: pr.n, cant: cant, precio: pr.p });
          sub += cant * pr.p;
        }
        var itbis = Math.round(sub * 0.18 * 100) / 100;
        out.push({
          vid: "DEMO" + d + "-" + i, fecha: f.toISOString(), lineas: lineas, subtotal: sub, itbis: itbis,
          total: Math.round((sub + itbis) * 100) / 100,
          metodo: metodos[(i + d) % metodos.length], cliente: clientes[(i + d) % clientes.length]
        });
      }
    }
    return out;
  }
  function demoFiltrado() {
    var todas = demoVentas(Math.max(periodo || 30, 30));
    if (!periodo) return todas;
    var desde = periodo === 1 ? new Date(new Date().setHours(0, 0, 0, 0)) : diasAtras(periodo);
    return todas.filter(function (s) { return new Date(s.fecha) >= desde; });
  }

  /* ---------- graficos SVG ---------- */
  function area(serie, etiquetas) {
    /* en pantallas angostas se rotula cada N dias para que no se amontone */
    if (etiquetas && etiquetas.length > 8 && (global.innerWidth || 400) < 560) {
      var salto = Math.ceil(etiquetas.length / 6);
      etiquetas = etiquetas.map(function (t, i) { return i % salto === 0 ? t : ""; });
    }
    var w = 620, h = 150, pad = 6;
    var max = Math.max.apply(null, serie.concat([1]));
    var n = serie.length;
    var paso = n > 1 ? (w - pad * 2) / (n - 1) : 0;
    var pts = serie.map(function (v, i) {
      var x = pad + i * paso;
      var y = h - pad - (v / max) * (h - pad * 2);
      return [x, y];
    });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var areaD = d + " L" + (pad + (n - 1) * paso).toFixed(1) + " " + (h - pad) + " L" + pad + " " + (h - pad) + " Z";
    var puntos = pts.map(function (p, i) {
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.4" class="an-pt"><title>' +
        esc((etiquetas && etiquetas[i]) || "") + ": " + money(serie[i]) + "</title></circle>";
    }).join("");
    return '<svg class="an-svg" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" role="img">' +
      '<defs><linearGradient id="anGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#1F9D5C" stop-opacity=".28"/><stop offset="100%" stop-color="#1F9D5C" stop-opacity="0"/>' +
      "</linearGradient></defs>" +
      '<path d="' + areaD + '" fill="url(#anGrad)"/>' +
      '<path d="' + d + '" fill="none" stroke="#1F9D5C" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>' +
      puntos + "</svg>" +
      '<div class="an-x">' + (etiquetas || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>";
  }

  function barras(datos) {
    var max = Math.max.apply(null, datos.map(function (d) { return d.v; }).concat([1]));
    return '<div class="an-bars">' + datos.map(function (d) {
      return '<div class="an-brow"><span>' + esc(d.k) + '</span><i><u style="width:' +
        Math.max(3, (d.v / max) * 100).toFixed(1) + '%"></u></i><em>' + (d.t || moneyCorto(d.v)) + "</em></div>";
    }).join("") + "</div>";
  }

  function dona(partes) {
    var total = partes.reduce(function (a, p) { return a + p.v; }, 0) || 1;
    var r = 54, c = 2 * Math.PI * r, acc = 0;
    var colores = ["#1F9D5C", "#0B2545", "#FF6A13", "#8A93A6"];
    var arcos = partes.map(function (p, i) {
      var frac = p.v / total, dash = frac * c;
      var el = '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + colores[i % colores.length] +
        '" stroke-width="18" stroke-dasharray="' + dash.toFixed(2) + " " + (c - dash).toFixed(2) +
        '" stroke-dashoffset="' + (-acc).toFixed(2) + '" transform="rotate(-90 70 70)"><title>' +
        esc(p.k) + ": " + money(p.v) + "</title></circle>";
      acc += dash; return el;
    }).join("");
    return '<div class="an-dona"><svg viewBox="0 0 140 140" class="an-dona-svg">' +
      '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#EDF0F4" stroke-width="18"/>' + arcos + "</svg>" +
      '<div class="an-leyenda">' + partes.map(function (p, i) {
        return '<div><i style="background:' + colores[i % colores.length] + '"></i><span>' + esc(p.k) +
          "</span><b>" + Math.round((p.v / total) * 100) + "%</b></div>";
      }).join("") + "</div></div>";
  }

  /* ---------- vista ---------- */
  function render(view) {
    var hayReales = ((db().sales || []).length > 0);
    var usandoDemo = !hayReales;
    var sales = usandoDemo ? demoFiltrado() : ventasFiltradas();
    var sum = function (a, k) { return a.reduce(function (x, s) { return x + (Number(s[k]) || 0); }, 0); };
    var total = sum(sales, "total"), itbis = sum(sales, "itbis"), tickets = sales.length;
    var articulos = 0, porDia = {}, porHora = new Array(24).fill(0), metodos = {}, prods = {}, clientes = {};
    sales.forEach(function (s) {
      var f = new Date(s.fecha);
      var key = f.toISOString().slice(0, 10);
      porDia[key] = (porDia[key] || 0) + (Number(s.total) || 0);
      porHora[f.getHours()] += Number(s.total) || 0;
      var m = s.metodo || "efectivo";
      metodos[m] = (metodos[m] || 0) + (Number(s.total) || 0);
      if (s.cliente) clientes[s.cliente] = (clientes[s.cliente] || 0) + (Number(s.total) || 0);
      lineas(s).forEach(function (l) {
        articulos += Number(l.cant) || 0;
        prods[l.nombre] = (prods[l.nombre] || 0) + (Number(l.cant) || 0) * (Number(l.precio) || 0);
      });
    });

    var dias = periodo || 14;
    var etiquetas = [], serie = [];
    for (var i = dias - 1; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var k = d.toISOString().slice(0, 10);
      etiquetas.push(d.toLocaleDateString("es-DO", { day: "2-digit", month: "short" }).replace(".", ""));
      serie.push(porDia[k] || 0);
    }
    if (periodo === 0) { etiquetas = etiquetas.slice(-14); serie = serie.slice(-14); }

    var topProds = Object.keys(prods).map(function (k) { return { k: k, v: prods[k] }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
    var topCli = Object.keys(clientes).map(function (k) { return { k: k, v: clientes[k] }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
    var horasTop = [];
    for (var hh = 0; hh < 24; hh++) if (porHora[hh]) horasTop.push({ k: (hh % 12 || 12) + (hh < 12 ? "a" : "p"), v: porHora[hh] });
    horasTop = horasTop.sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
    var met = Object.keys(metodos).map(function (k) { return { k: k.charAt(0).toUpperCase() + k.slice(1), v: metodos[k] }; });
    var credito = sales.filter(function (s) { return s.metodo === "credito"; }).reduce(function (a, s) { return a + (Number(s.total) || 0); }, 0);
    var promedio = tickets ? total / tickets : 0;
    var maxDia = Math.max.apply(null, serie.concat([0]));
    var mejorDia = serie.indexOf(maxDia);
    var vsAnterior = (function () {
      if (!periodo || usandoDemo) return null;
      var desde = diasAtras(periodo), hasta = diasAtras(1);
      var prev = (db().sales || []).filter(function (s) {
        var f = new Date(s.fecha); return f >= desde && f < hasta;
      }).reduce(function (a, s) { return a + (Number(s.total) || 0); }, 0);
      if (!prev) return null;
      return Math.round(((total - prev) / prev) * 100);
    })();

    var KPIS = [
      ["Ventas", money(total), vsAnterior === null ? "en el periodo" : (vsAnterior >= 0 ? "+" : "") + vsAnterior + "% vs anterior", vsAnterior],
      ["Tickets", String(tickets), "transacciones", null],
      ["ITBIS", money(itbis), "impuesto generado", null],
      ["A credito", money(credito), "pendiente de cobro", null]
    ];

    view.innerHTML =
      '<div class="an-wrap">' +
        '<div class="an-head">' +
          '<div class="an-tabs" role="tablist">' +
            [[1, "Hoy"], [7, "7 dias"], [30, "30 dias"], [0, "Todo"]].map(function (p) {
              return '<button class="an-tab ' + (periodo === p[0] ? "on" : "") + '" data-p="' + p[0] + '">' + p[1] + "</button>";
            }).join("") +
          "</div>" +
          (usandoDemo ? '<span class="an-demo">datos de ejemplo</span>' : "") +
        "</div>" +

        '<div class="an-kpis">' + KPIS.map(function (k) {
          var tono = k[3] === null || k[3] === undefined ? "" : (k[3] >= 0 ? "up" : "down");
          return '<div class="an-kpi"><small>' + k[0] + "</small><b>" + k[1] + "</b><span class=\"" + tono + '">' + k[2] + "</span></div>";
        }).join("") + "</div>" +

        '<div class="an-grid">' +
          '<section class="an-card wide">' +
            "<h3>Ventas por dia</h3>" +
            (serie.some(function (v) { return v; }) ? area(serie, etiquetas) : '<div class="an-vacio">Sin ventas en este periodo.</div>') +
            (mejorDia >= 0 && maxDia ? '<p class="an-pie">Mejor dia: ' + esc(etiquetas[mejorDia]) + " con " + money(maxDia) + "</p>" : "") +
          "</section>" +

          '<section class="an-card">' +
            "<h3>Metodos de pago</h3>" +
            (met.length ? dona(met) : '<div class="an-vacio">Sin datos.</div>') +
          "</section>" +

          '<section class="an-card">' +
            "<h3>Productos que mas venden</h3>" +
            (topProds.length ? barras(topProds) : '<div class="an-vacio">Sin ventas registradas.</div>') +
          "</section>" +

          '<section class="an-card">' +
            "<h3>Horas con mas movimiento</h3>" +
            (horasTop.length ? barras(horasTop) : '<div class="an-vacio">Sin datos de horario.</div>') +
          "</section>" +

          '<section class="an-card">' +
            "<h3>Mejores clientes</h3>" +
            (topCli.length ? barras(topCli) : '<div class="an-vacio">Aun no hay clientes con compras.</div>') +
          "</section>" +

          '<section class="an-card wide">' +
            "<h3>Ultimos movimientos</h3>" +
            (sales.length ? '<div class="an-mov">' + sales.slice(-8).reverse().map(function (s) {
              return '<div class="an-mrow"><span>' + new Date(s.fecha).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" }) +
                "</span><b>" + esc(s.cliente || "Consumidor final") + "</b><i>" + esc(s.metodo || "") +
                "</i><em>" + money(s.total) + "</em></div>";
            }).join("") + "</div>" : '<div class="an-vacio">Sin ventas registradas.</div>') +
          "</section>" +
        "</div>" +
      "</div>";

    $$(".an-tab", view).forEach(function (b) {
      b.onclick = function () { periodo = Number(b.dataset.p); render(view); };
    });
  }

  global.PPAnalitica = { render: render };
})(window);
