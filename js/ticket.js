/* PediPOS: ticket en imagen y salida por impresora termica Bluetooth.
   Se usa desde "Venta registrada", "Ticket del pedido" y "Estado de credito". */
(function () {
  "use strict";

  const ancho = 720;          /* px logicos del lienzo */
  const pad = 54;

  const esc = (s) => String(s == null ? "" : s);

  /* Las ventas guardadas pueden traer las lineas como texto JSON: se normalizan siempre. */
  function lineasDe(v) {
    let l = v && (v.lineas != null ? v.lineas : v.items);
    if (typeof l === "string") { try { l = JSON.parse(l); } catch (_) { l = []; } }
    return Array.isArray(l) ? l : [];
  }

  function crearLienzo(alto) {
    /* el documento siempre tiene proporcion de celular: nunca queda cuadrado ni tipo hoja */
    alto = Math.max(Math.round(alto), Math.round(ancho * 16 / 9));
    const c = document.createElement("canvas");
    const dpr = 2;
    c.width = ancho * dpr;
    c.height = alto * dpr;
    const x = c.getContext("2d");
    x.scale(dpr, dpr);
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, ancho, alto);
    return { c, x };
  }

  function texto(x, t, y, o) {
    o = o || {};
    x.fillStyle = o.color || "#111417";
    x.font = (o.peso || 400) + " " + (o.tam || 22) + "px " + (o.fuente || "system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
    x.textAlign = o.alinea || "left";
    x.textBaseline = "alphabetic";
    x.fillText(esc(t), o.x != null ? o.x : (o.alinea === "center" ? ancho / 2 : o.alinea === "right" ? ancho - pad : pad), y);
  }

  function linea(x, y, color, grosor) {
    x.strokeStyle = color || "#E6EBEF";
    x.lineWidth = grosor || 1.5;
    x.beginPath();
    x.moveTo(pad, y);
    x.lineTo(ancho - pad, y);
    x.stroke();
  }

  /* Parte el texto largo en varias lineas segun el ancho disponible. */
  function partir(x, t, max) {
    const palabras = String(t || "").split(/\s+/);
    const out = [];
    let actual = "";
    for (const p of palabras) {
      const prueba = actual ? actual + " " + p : p;
      if (x.measureText(prueba).width > max && actual) { out.push(actual); actual = p; }
      else actual = prueba;
    }
    if (actual) out.push(actual);
    return out.length ? out : [""];
  }

  /* ---------- ticket de una venta: recibo monocromo ---------- */
  const NEGRO = "#111417";
  const GRIS = "#5A636A";
  const TENUE = "#8A939A";
  const LINEA = "#C9D0D6";

  function fechaRecibo(f) {
    const d = new Date(f || Date.now());
    const M = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const h = d.getHours();
    const hh = h % 12 === 0 ? 12 : h % 12;
    const mm = String(d.getMinutes()).padStart(2, "0");
    return M[d.getMonth()] + " " + String(d.getDate()).padStart(2, "0") + " " + d.getFullYear() + " " + hh + ":" + mm + (h < 12 ? "AM" : "PM");
  }

  function nombrePago(m) {
    if (m === "credito") return "CREDITO";
    if (m === "tarjeta") return "TARJETA";
    if (m === "transferencia") return "TRANSFERENCIA";
    return "EFECTIVO";
  }

  function lienzoVenta(v, opts) {
    opts = opts || {};
    const prod = lineasDe(v);
    const alto = 700 + prod.length * 64 + (v.cliente ? 34 : 0) + (v.recibido ? 70 : 0);
    const { c, x } = crearLienzo(alto);

    /* cabecera: solo texto negro, sin fondos de color */
    let y = 64;
    const centro = ancho / 2;
    x.font = "800 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    x.fillStyle = NEGRO;
    x.textAlign = "center";
    const neg = (opts.negocio || "Mi negocio");
    const lineasNeg = partir(x, neg.toUpperCase(), ancho - pad * 2);
    lineasNeg.slice(0, 2).forEach((l) => { x.fillText(l, centro, y); y += 36; });

    if (opts.direccion) {
      x.font = "400 19px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      partir(x, opts.direccion, ancho - pad * 2).slice(0, 2).forEach((l) => { x.fillText(l, centro, y); y += 24; });
    }
    if (opts.telefono) {
      x.fillText(opts.telefono, centro, y); y += 24;
    }
    if (opts.web) {
      x.fillText(opts.web, centro, y); y += 24;
    }

    /* fecha grande centrada, como en el recibo termico */
    x.font = "600 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    x.fillStyle = GRIS;
    x.fillText(fechaRecibo(v.fecha), centro, y + 10);
    y += 32;

    /* datos de la operacion */
    const filas = [];
    filas.push(["Orden", String(v.vid || v.folio || "-")]);
    filas.push(["Fecha", new Date(v.fecha || Date.now()).toLocaleString("es-DO", { day: "numeric", month: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })]);
    if (v.cliente) filas.push(["Cliente", v.cliente]);
    filas.push(["Pago", nombrePago(v.metodo)]);
    if (v.cajero) filas.push(["Cajero", v.cajero]);
    if (v.metodo === "credito" && v.fecha_pago) filas.push(["Vence", new Date(v.fecha_pago + "T12:00:00").toLocaleDateString("es-DO")]);

    y += 16;
    linea(x, y, LINEA); y += 34;
    filas.forEach(([k, val]) => {
      texto(x, k, y, { tam: 18, color: GRIS });
      texto(x, val, y, { alinea: "right", tam: 18, peso: 600, color: NEGRO });
      y += 27;
    });

    /* productos */
    y += 8;
    linea(x, y, LINEA); y += 28;
    texto(x, "CANT", y, { tam: 13, peso: 700, color: TENUE });
    texto(x, "PRODUCTO", y, { x: pad + 62, tam: 13, peso: 700, color: TENUE });
    texto(x, "TOTAL", y, { alinea: "right", tam: 13, peso: 700, color: TENUE });
    y += 10;

    prod.forEach((l) => {
      y += 32;
      texto(x, cant(l), y, { tam: 18, peso: 600, color: GRIS });
      const nom = String(l.nombre || l.producto || "Producto");
      texto(x, nom.length > 26 ? nom.slice(0, 25) + "." : nom, y, { x: pad + 62, tam: 18, peso: 600, color: NEGRO });
      texto(x, money(l.total != null ? l.total : (l.cant || 0) * (l.precio || 0)), y, { alinea: "right", tam: 18, peso: 600, color: NEGRO });
      y += 21;
      texto(x, (l.unidad ? l.unidad : "unidad") + " · " + money(l.precio) + " c/u", y, { x: pad + 62, tam: 14, color: TENUE });
      y += 10;
    });

    /* totales */
    y += 10;
    linea(x, y, LINEA); y += 32;
    const fila = (k, val, peso, color, tam) => {
      texto(x, k, y, { tam: tam || 18, color: color || GRIS, peso: peso || 400 });
      texto(x, val, y, { alinea: "right", tam: tam || 18, color: color || GRIS, peso: peso || 400 });
      y += 28;
    };
    fila("Subtotal", money2(v.subtotal));
    fila("ITBIS", money2(v.itbis || 0));
    if (v.descuento) fila("Descuento", "-" + money2(v.descuento));
    y += 4;
    fila("TOTAL", money2(v.total), 800, NEGRO, 25);
    if (v.recibido) {
      fila("Recibido", money2(v.recibido));
      fila("Cambio", money2(v.cambio || 0));
    }

    /* firma y texto legal */
    y += 18;
    linea(x, y, LINEA, 1.2); y += 30;
    texto(x, "FIRMA", y, { tam: 13, peso: 700, color: TENUE });
    y += 26;
    texto(x, "Acepto pagar el total indicado conforme", y, { alinea: "center", tam: 15, color: GRIS }); y += 21;
    texto(x, "al acuerdo comercial del negocio.", y, { alinea: "center", tam: 15, color: GRIS }); y += 34;
    texto(x, "Gracias por su compra", y, { alinea: "center", tam: 19, peso: 700, color: NEGRO }); y += 26;
    texto(x, "Este documento no es un comprobante fiscal", y, { alinea: "center", tam: 13, color: TENUE });
    return c;
  }

  /* ---------- estado de credito: mismo formato de recibo ---------- */
  function lienzoEstado(cfg) {
    /* cfg: { negocio, direccion, telefono, cliente, total, fechaPago, periodo, pedidos:[{fecha,hora,total}] } */
    const pedidos = cfg.pedidos || [];
    const alto = 900 + pedidos.length * 74;
    const { c, x } = crearLienzo(alto);
    const centro = ancho / 2;

    let y = 64;
    x.font = "800 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    x.fillStyle = NEGRO;
    x.textAlign = "center";
    partir(x, String(cfg.negocio || "Mi negocio").toUpperCase(), ancho - pad * 2).slice(0, 2).forEach((l) => { x.fillText(l, centro, y); y += 36; });
    x.font = "400 19px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    if (cfg.direccion) partir(x, cfg.direccion, ancho - pad * 2).slice(0, 2).forEach((l) => { x.fillText(l, centro, y); y += 24; });
    if (cfg.telefono) { x.fillText(cfg.telefono, centro, y); y += 24; }

    texto(x, "ESTADO DE CREDITO", y + 8, { alinea: "center", tam: 17, peso: 800, color: NEGRO });
    y += 34;
    texto(x, fechaRecibo(new Date().toISOString()), y + 4, { alinea: "center", tam: 15, color: GRIS });
    y += 30;

    /* total a pagar, en grande y centrado como el recibo */
    y += 14;
    linea(x, y, LINEA); y += 44;
    texto(x, "TOTAL A PAGAR", y, { alinea: "center", tam: 14, peso: 800, color: TENUE });
    y += 46;
    texto(x, money2(cfg.total), y, { alinea: "center", tam: 44, peso: 800, color: NEGRO });
    y += 34;
    linea(x, y, LINEA); y += 36;

    const filas = [];
    if (cfg.cliente) filas.push(["Cliente", cfg.cliente]);
    if (cfg.fechaPago) filas.push(["Pago prometido", cfg.fechaPago]);
    if (cfg.periodo) filas.push(["Periodo", cfg.periodo]);
    filas.push(["Pedidos", String(pedidos.length)]);
    filas.forEach(([k, val]) => {
      texto(x, k, y, { tam: 18, color: GRIS });
      texto(x, val, y, { alinea: "right", tam: 18, peso: 600, color: NEGRO });
      y += 28;
    });

    /* tabla de pedidos */
    y += 10;
    linea(x, y, LINEA); y += 28;
    texto(x, "FECHA", y, { tam: 13, peso: 700, color: TENUE });
    texto(x, "MONTO", y, { alinea: "right", tam: 13, peso: 700, color: TENUE });
    pedidos.forEach((p) => {
      y += 32;
      texto(x, p.fecha, y, { tam: 18, peso: 600, color: NEGRO });
      texto(x, money2(p.total), y, { alinea: "right", tam: 18, peso: 600, color: NEGRO });
      y += 21;
      texto(x, p.hora || "", y, { tam: 14, color: TENUE });
      y += 12;
    });

    y += 12;
    linea(x, y, LINEA); y += 34;
    texto(x, "TOTAL", y, { tam: 22, peso: 800 });
    texto(x, money2(cfg.total), y, { alinea: "right", tam: 22, peso: 800 });

    /* firma y pie */
    y += 40;
    linea(x, y, LINEA, 1.2); y += 30;
    texto(x, "FIRMA", y, { tam: 13, peso: 700, color: TENUE }); y += 26;
    texto(x, "Acepto pagar el total indicado conforme", y, { alinea: "center", tam: 15, color: GRIS }); y += 21;
    texto(x, "al acuerdo comercial del negocio.", y, { alinea: "center", tam: 15, color: GRIS }); y += 34;
    texto(x, "Gracias por su preferencia", y, { alinea: "center", tam: 19, peso: 700, color: NEGRO }); y += 26;
    texto(x, "Este documento no es un comprobante fiscal", y, { alinea: "center", tam: 13, color: TENUE });
    return c;
  }

  /* ---------- envio directo por WhatsApp (abre el chat, sin menu de Android) ---------- */
  /* numero dominicano de 10 digitos -> 1 + numero; si viene con + o 1 se respeta */
  function waNumero(tel) {
    let n = String(tel || "").replace(/[^0-9]/g, "");
    if (!n) return "";
    if (n.length === 11 && n.charAt(0) === "1") return n;
    if (n.length === 10) return "1" + n;
    return n;
  }

  /* arma el texto del ticket en 32 columnas para pegarlo en WhatsApp */
  function textoPlano(bloque) {
    const L = [].concat(bloque.titulo || [], bloque.sub || [], ["-".repeat(32)], bloque.cuerpo || [], ["-".repeat(32)], bloque.total || []);
    if (bloque.pie && bloque.pie.length) L.push("", ...bloque.pie);
    return L.map((l) => String(l).replace(/\s+$/, "")).join("\n");
  }

  function enviarWhatsApp(texto, telefono) {
    const num = waNumero(telefono);
    const url = "https://wa.me/" + (num ? num : "") + "?text=" + encodeURIComponent(texto);
    const v = window.open(url, "_blank");
    if (!v) window.location.href = url;
    return num ? "chat" : "lista";
  }

  /* ---------- envío como imagen por WhatsApp ---------- */
  async function compartir(canvas, nombre) {
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png", 0.95));
    if (!blob) throw new Error("sin imagen");
    const file = new File([blob], nombre, { type: "image/png" });
    /* en el telefono se abre el menu de compartir: el usuario elige WhatsApp */
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: nombre });
        return "compartido";
      } catch (e) {
        if (e && e.name === "AbortError") return "cancelado";
      }
    }
    /* respaldo: se descarga la imagen y se abre WhatsApp */
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "descargado";
  }

  /* ---------- impresora termica por Bluetooth (ESC/POS) ---------- */
  let aparato = null, caract = null;

  const SERVICIOS = [
    "000018f0-0000-1000-8000-00805f9b34fb",   /* impresoras genericas */
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",   /* ISSC / Microchip */
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  ];

  async function conectar() {
    if (!navigator.bluetooth) throw new Error("Este navegador no permite Bluetooth. Usa Chrome en Android.");
    if (aparato && aparato.gatt && aparato.gatt.connected && caract) return caract;
    aparato = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICIOS });
    const server = await aparato.gatt.connect();
    for (const uuid of SERVICIOS) {
      try {
        const s = await server.getPrimaryService(uuid);
        const cs = await s.getCharacteristics();
        const c = cs.find((k) => k.properties.write || k.properties.writeWithoutResponse) || cs[0];
        if (c) { caract = c; return c; }
      } catch (_) { /* se prueba el siguiente */ }
    }
    const todos = await server.getPrimaryServices();
    for (const s of todos) {
      const cs = await s.getCharacteristics();
      const c = cs.find((k) => k.properties.write || k.properties.writeWithoutResponse);
      if (c) { caract = c; return c; }
    }
    throw new Error("La impresora no acepta datos");
  }

  /* Texto ESC/POS: 32 caracteres por linea, tipico de 58 mm. */
  function escpos(lineas) {
    const out = [];
    out.push(0x1b, 0x40);                  /* inicializar */
    out.push(0x1b, 0x61, 0x01);            /* centrar */
    out.push(0x1b, 0x21, 0x10);            /* doble alto */
    (lineas.titulo || []).forEach((t) => out.push(...bytes(t + "\n")));
    out.push(0x1b, 0x21, 0x00);            /* normal */
    (lineas.sub || []).forEach((t) => out.push(...bytes(t + "\n")));
    out.push(0x1b, 0x61, 0x00);            /* izquierda */
    out.push(...bytes("-".repeat(32) + "\n"));
    (lineas.cuerpo || []).forEach((t) => out.push(...bytes(t + "\n")));
    out.push(...bytes("-".repeat(32) + "\n"));
    out.push(0x1b, 0x45, 0x01);            /* negrita */
    (lineas.total || []).forEach((t) => out.push(...bytes(t + "\n")));
    out.push(0x1b, 0x45, 0x00);
    if (lineas.pie && lineas.pie.length) {
      out.push(...bytes("\n"));
      out.push(0x1b, 0x61, 0x01);
      lineas.pie.forEach((t) => out.push(...bytes(t + "\n")));
      out.push(0x1b, 0x61, 0x00);
    }
    out.push(...bytes("\n\n\n"));
    out.push(0x1d, 0x56, 0x42, 0x00);      /* cortar papel */
    return new Uint8Array(out);
  }

  function bytes(t) {
    const a = [];
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      const cp = ch.charCodeAt(0);
      a.push(cp < 128 ? cp : 63);          /* lo que no es ASCII se cambia por ? */
    }
    return a;
  }

  const izq = (a, b) => {
    a = String(a); b = String(b);
    const hueco = 32 - a.length - b.length;
    return a + (hueco > 0 ? " ".repeat(hueco) : " ") + b;
  };

  async function imprimir(lineas) {
    const c = await conectar();
    const data = escpos(lineas);
    const trozo = 120;
    for (let i = 0; i < data.length; i += trozo) {
      const parte = data.slice(i, i + trozo);
      if (c.properties.writeWithoutResponse && c.writeValueWithoutResponse) await c.writeValueWithoutResponse(parte);
      else await c.writeValue(parte);
      await new Promise((r) => setTimeout(r, 24));
    }
    return true;
  }

  function lineasVenta(v, negocio, direccion, telefono) {
    const W = 32;
    const centrar = (s) => {
      s = String(s || "").slice(0, W);
      const hueco = Math.max(0, W - s.length);
      return " ".repeat(Math.floor(hueco / 2)) + s;
    };
    const corto = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "." : s; };

    const titu = [centrar(String(negocio || "Mi negocio").toUpperCase())];
    const sub = [];
    if (direccion) sub.push(centrar(direccion));
    if (telefono) sub.push(centrar(telefono));
    sub.push(centrar(fechaRecibo(v.fecha)));

    const cuerpo = [];
    cuerpo.push(izq("Orden:", String(v.vid || v.folio || "-")));
    const d = new Date(v.fecha || Date.now());
    const hh = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
    cuerpo.push(izq("Fecha:", String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear() + " " + hh + ":" + String(d.getMinutes()).padStart(2, "0") + (d.getHours() < 12 ? "AM" : "PM")));
    if (v.cliente) cuerpo.push(izq("Cliente:", corto(v.cliente, 18)));
    cuerpo.push(izq("Pago:", nombrePago(v.metodo)));
    cuerpo.push("");
    cuerpo.push("CANT PRODUCTO              TOTAL");
    lineasDe(v).forEach((l) => {
      const n = corto(l.nombre || l.producto || "Producto", 17).padEnd(17);
      const cantTxt = String(cant(l)).padEnd(4);
      const tot = money(l.total != null ? l.total : (l.cant || 0) * (l.precio || 0));
      cuerpo.push((cantTxt + n).slice(0, W - tot.length).padEnd(W - tot.length) + tot);
    });
    if (v.recibido) {
      cuerpo.push(izq("Recibido:", money2(v.recibido)));
      cuerpo.push(izq("Cambio:", money2(v.cambio || 0)));
    }

    const total = [];
    total.push(izq("Subtotal:", money2(v.subtotal)));
    total.push(izq("ITBIS:", money2(v.itbis || 0)));
    total.push(izq("TOTAL:", money2(v.total)));

    return { titulo: titu, sub, cuerpo, total, pie: ["FIRMA: ______________________", "Acepto pagar el total indicado", "conforme al acuerdo comercial.", "  Gracias por su compra"] };
  }

  function lineasEstado(cfg) {
    const centrar = (s) => { s = String(s || "").slice(0, 32); const h = Math.max(0, 32 - s.length); return " ".repeat(Math.floor(h / 2)) + s; };
    const sub = [];
    if (cfg.direccion) sub.push(centrar(cfg.direccion));
    if (cfg.telefono) sub.push(centrar(cfg.telefono));
    sub.push(centrar(new Date().toLocaleDateString("es-DO")));
    const cuerpo = ["ESTADO DE CREDITO", ""];
    if (cfg.cliente) cuerpo.push(izq("Cliente:", String(cfg.cliente).slice(0, 20)));
    if (cfg.fechaPago) cuerpo.push(izq("Pago:", cfg.fechaPago));
    if (cfg.periodo) cuerpo.push(izq("Periodo:", String(cfg.periodo).slice(0, 20)));
    cuerpo.push("");
    cuerpo.push("FECHA                   MONTO");
    (cfg.pedidos || []).forEach((p) => cuerpo.push(izq(p.fecha, money2(p.total))));
    return {
      titulo: [centrar(String(cfg.negocio || "Mi negocio").toUpperCase())],
      sub,
      cuerpo,
      total: [izq("TOTAL A PAGAR:", money2(cfg.total))],
      pie: ["FIRMA: ______________________", "Acepto pagar el total indicado", "conforme al acuerdo comercial.", "  Gracias por su preferencia"],
    };
  }


  const cant = (l) => {
    const n = Number(l.cant != null ? l.cant : l.cantidad || 0);
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
  };
  const money = (n) => "RD$" + Math.round(Number(n) || 0).toLocaleString("es-DO");
  const money2 = (n) => "RD$" + (Number(n) || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fecha = (f) => {
    const d = new Date(f || Date.now());
    return d.toLocaleDateString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric" }) + " - " + d.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
  };

  /* ---------- ventana de impresora (propia, sin dialogos del navegador) ---------- */
  const ICO = {
    print: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2.4"/><path d="M7 14h10v6H7z"/><circle cx="17" cy="12" r=".6" fill="currentColor"/></svg>',
    bt: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l10 10-5 4V3l5 4L7 17"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.6 4.6L19 7.5"/></svg>',
    err: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.2"/></svg>',
  };

  function cerrarVentana() {
    const d = document.getElementById("prtWin");
    if (!d) return;
    d.classList.remove("on");
    setTimeout(() => d.remove(), 240);
  }

  function ventana(cfg) {
    const prev = document.getElementById("prtWin");
    if (prev) prev.remove();
    const d = document.createElement("div");
    d.id = "prtWin";
    d.className = "prtwin";
    d.innerHTML = '<div class="pw-m"></div><div class="pw-c" role="dialog" aria-modal="true">' +
      '<div class="pw-i ' + (cfg.tono || "") + '"><span class="pw-ring"></span>' + cfg.icono + "</div>" +
      "<h3>" + cfg.titulo + "</h3>" +
      (cfg.sub ? '<div class="pw-sub">' + cfg.sub + "</div>" : "") +
      "<p>" + (cfg.texto || "") + "</p>" +
      (cfg.nota ? '<div class="pw-nota">' + cfg.nota + "</div>" : "") +
      (cfg.pasos ? '<ol class="pw-pasos">' + cfg.pasos.map((x) => "<li>" + x + "</li>").join("") + "</ol>" : "") +
      '<div class="pw-b">' + (cfg.botones || []).map((b, i) =>
        '<button class="pw-btn ' + (b.tipo || "") + '" data-i="' + i + '">' + b.texto + "</button>").join("") + "</div></div>";
    document.body.append(d);
    requestAnimationFrame(() => d.classList.add("on"));
    d.querySelector(".pw-m").onclick = () => { if (cfg.cerrable !== false) cerrarVentana(); };
    (cfg.botones || []).forEach((b, i) => {
      const el = d.querySelector('[data-i="' + i + '"]');
      if (el) el.onclick = () => b.alHacer && b.alHacer();
    });
    return d;
  }

  /* Flujo completo: ofrece conectar, conecta, imprime y informa. */
  function imprimirConVentana(lineas, etiqueta) {
    etiqueta = etiqueta || "ticket";
    const conectada = aparato && aparato.gatt && aparato.gatt.connected && caract;
    const lanzar = async () => {
      ventana({
        icono: ICO.bt, tono: "carga", titulo: "Buscando impresoras", sub: "Paso 1 de 2",
        texto: "Elige tu impresora en la lista. Si el telefono pide activar Bluetooth, toca Permitir.",
        cerrable: false, botones: [],
      });
      try {
        await conectar();
        const nombre = (aparato && aparato.name) || "la impresora";
        ventana({
          icono: ICO.print, tono: "carga", titulo: "Imprimiendo",
          texto: "Enviando el " + etiqueta + " a " + nombre + "...", cerrable: false, botones: [],
        });
        await imprimir(lineas);
        ventana({
          icono: ICO.ok, tono: "ok", titulo: "Listo",
          texto: "El " + etiqueta + " se envio a " + nombre + ".",
          botones: [{ texto: "Aceptar", tipo: "prim", alHacer: cerrarVentana }],
        });
        setTimeout(cerrarVentana, 2200);
      } catch (e) {
        const msg = String((e && e.message) || e || "");
        const cancelo = /cancel|chosen|seleccion/i.test(msg) || (e && e.name === "NotFoundError");
        if (cancelo) { cerrarVentana(); return; }
        ventana({
          icono: ICO.err, tono: "err", titulo: "No se pudo imprimir",
          texto: msg || "Revisa que la impresora este encendida y cerca.",
          botones: [
            { texto: "Cerrar", alHacer: cerrarVentana },
            { texto: "Reintentar", tipo: "prim", alHacer: lanzar },
          ],
        });
      }
    };
    if (conectada) { lanzar(); return; }
    if (!navigator.bluetooth) {
      ventana({
        icono: ICO.err, tono: "err", titulo: "Bluetooth no disponible",
        texto: "Este navegador no permite conectar impresoras. Abre PediPOS en Chrome desde un telefono Android.",
        botones: [{ texto: "Entendido", tipo: "prim", alHacer: cerrarVentana }],
      });
      return;
    }
    ventana({
      icono: ICO.print, titulo: "Conectar impresora", sub: "Bluetooth · 58 mm",
      texto: "Vincula tu impresora termica una sola vez y despues imprime con un toque.",
      pasos: [
        "Enciende la impresora y activa su Bluetooth.",
        "Toca <b>Buscar impresora</b> y elige la tuya en la lista.",
        "Acepta el aviso de Bluetooth del telefono.",
      ],
      nota: "El aviso de activar Bluetooth lo muestra el navegador: es normal y hay que tocar Permitir. Ninguna pagina web puede cambiar ese mensaje.",
      botones: [
        { texto: "Ahora no", alHacer: cerrarVentana },
        { texto: "Buscar impresora", tipo: "prim", alHacer: lanzar },
      ],
    });
  }

  /* ================= Mensajes de WhatsApp =================
     Mismo ancho que la impresora (32 columnas) y mismas estructuras:
     titulo centrado, separadores, etiqueta con valor a la derecha, tabla y despedida. */

  const W32 = 32;
  const raya = "-".repeat(W32);
  const centrar32 = (s) => {
    s = String(s || "").slice(0, W32);
    return " ".repeat(Math.max(0, Math.floor((W32 - s.length) / 2))) + s;
  };
  const fila32 = (etiqueta, valor) => {
    const izq = etiqueta + ":";
    const der = String(valor == null ? "" : valor);
    if (izq.length + der.length + 1 > W32) return izq + " " + der;
    return izq + " ".repeat(W32 - izq.length - der.length) + der;
  };
  const corto32 = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "." : s; };

  function fechaCorta(f) {
    const d = new Date(f || Date.now());
    const h = d.getHours();
    const hh = h % 12 === 0 ? 12 : h % 12;
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear() +
      " | " + hh + ":" + String(d.getMinutes()).padStart(2, "0") + " " + (h < 12 ? "a. m." : "p. m.");
  }

  const pagos32 = (m) => {
    if (m === "credito") return "Crédito";
    if (m === "tarjeta") return "Tarjeta";
    if (m === "transferencia") return "Transferencia";
    return "Efectivo";
  };

  /* envuelve el mensaje para que WhatsApp lo muestre monoespaciado */
  const enBloque = (lineas) => "```\n" + lineas.join("\n").replace(/\s+$/, "") + "\n```";

  /* ---- 1) TICKET DEL PEDIDO ---- */
  function waTicket(v) {
    const L = [centrar32("TICKET DEL PEDIDO"), raya];
    L.push(fila32("FECHA", fechaCorta(v.fecha)));
    L.push("");
    if (v.cliente) L.push(fila32("Cliente", corto32(v.cliente, 20)));
    L.push(fila32("Pago", pagos32(v.metodo)));
    L.push("");
    L.push("CANT PRODUCTO            TOTAL");
    lineasDe(v).forEach((l) => {
      const cnt = String(cant(l)).padEnd(4);
      const nom = corto32(l.nombre || l.producto || "Producto", 17).padEnd(17);
      const monto = money(l.total != null ? l.total : (cant(l) * (l.precio || 0)));
      L.push((cnt + nom).slice(0, W32 - monto.length).padEnd(W32 - monto.length) + monto);
    });
    L.push(raya);
    L.push(fila32("Subtotal", money2(v.subtotal)));
    L.push(fila32("ITBIS", money2(v.itbis || 0)));
    L.push(fila32("TOTAL", money2(v.total)));
    L.push("");
    L.push(raya);
    L.push("");
    L.push(centrar32("Gracias por su compra"));
    return enBloque(L);
  }

  /* ---- 2) PAGO A PROVEEDOR ---- */
  function waPagoProveedor(negocio, p, g, saldo) {
    const L = [centrar32("PAGO A PROVEEDOR"), raya];
    L.push(fila32("Proveedor", corto32(p.nombre, 20)));
    L.push(fila32("Fecha", fechaCorta(g.fecha)));
    L.push("");
    L.push(fila32("Nota", corto32(g.nota || "Pago", 22)));
    L.push(fila32("Monto", money2(g.monto)));
    L.push("");
    L.push(raya);
    L.push(centrar32("Gracias por su confianza"));
    return enBloque(L);
  }

  /* ---- 3) COMPRA A PROVEEDOR ---- */
  function waCompraProveedor(negocio, p, c, saldo) {
    const total = Number(c.total) || 0;
    const pagado = Number(c.pagado) || 0;
    const pend = Math.max(0, total - pagado);
    const L = [centrar32("COMPRA A PROVEEDOR"), raya];
    L.push(fila32("Proveedor", corto32(p.nombre, 20)));
    L.push(fila32("Fecha", fechaCorta(c.fecha)));
    L.push(fila32("Concepto", corto32(c.concepto || "Compra", 22)));
    L.push("");
    L.push(fila32("Monto", money2(total)));
    L.push(fila32("Pagado", money2(pagado)));
    L.push(fila32("Pendiente", money2(pend)));
    L.push(fila32("Saldo con usted", money2(saldo)));
    L.push("");
    L.push(raya);
    L.push(centrar32("Gracias por su confianza"));
    return enBloque(L);
  }

  /* ---- 4) PAGO REGISTRADO DEL CLIENTE ---- */
  function waPagoCliente(negocio, c, g, saldo) {
    const L = [centrar32("PAGO REGISTRADO"), raya];
    L.push(fila32("Cliente", corto32(c.nombre, 20)));
    L.push(fila32("Fecha", fechaCorta(g.fecha)));
    L.push("");
    L.push(fila32("Monto", money2(g.monto)));
    L.push("");
    L.push(fila32("Saldo actual", money2(saldo)));
    L.push("");
    L.push(raya);
    L.push(centrar32(saldo > 0 ? "Gracias por su abono" : "Su cuenta está al día"));
    return enBloque(L);
  }

  window.PPTicket = { waTicket, waPagoProveedor, waCompraProveedor, waPagoCliente, waNumero, textoPlano, enviarWhatsApp, lienzoVenta, lienzoEstado, compartir, imprimir, lineasVenta, lineasEstado, conectar, imprimirConVentana };
})();
