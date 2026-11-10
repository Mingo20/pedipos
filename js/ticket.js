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

  /* ---------- estado de credito de un cliente ---------- */
  function lienzoEstado(cfg) {
    /* cfg: { negocio, cliente, total, fechaPago, pedidos:[{fecha,total}] } */
    const n = (cfg.pedidos || []).length;
    const alto = 470 + n * 66 + 130;
    const { c, x } = crearLienzo(alto);
    texto(x, String(cfg.negocio || "Mi negocio").toUpperCase(), 62, { alinea: "center", tam: 30, peso: 800, color: NEGRO });
    texto(x, "ESTADO DE CREDITO", 90, { alinea: "center", tam: 16, peso: 700, color: GRIS });

    let y = 158;
    texto(x, "TOTAL A PAGAR", y, { tam: 15, peso: 800, color: "#8B949C" });
    y += 44;
    texto(x, money2(cfg.total), y, { tam: 40, peso: 800 });
    y += 32;
    if (cfg.fechaPago) texto(x, "Fecha de pago: " + cfg.fechaPago, y, { tam: 16, color: "#7B848C" });
    y += 26;
    if (cfg.cliente) texto(x, "Cliente: " + cfg.cliente, y, { tam: 16, color: "#5B646C" });
    y += 28;
    linea(x, y); y += 30;

    texto(x, "PEDIDOS A CREDITO (" + n + ")", y, { tam: 14, peso: 800, color: "#8B949C" });
    (cfg.pedidos || []).forEach((p) => {
      y += 34;
      texto(x, p.fecha, y, { tam: 19, peso: 700 });
      texto(x, money2(p.total), y, { alinea: "right", tam: 19, peso: 700, color: "#B3261E" });
      y += 24;
      texto(x, p.hora || "", y, { tam: 15, color: "#7B848C" });
      y += 4;
    });
    y += 26;
    linea(x, y); y += 30;
    texto(x, "Periodo: " + (cfg.periodo || ""), y, { tam: 15, color: "#7B848C" });
    texto(x, "Gracias por su preferencia", alto - 44, { alinea: "center", tam: 15, color: "#9AA3AA" });
    return c;
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
    return {
      titulo: [cfg.negocio || "Mi negocio"],
      sub: ["ESTADO DE CREDITO", cfg.cliente ? "Cliente: " + cfg.cliente : "", cfg.fechaPago ? "Pago: " + cfg.fechaPago : ""],
      cuerpo: (cfg.pedidos || []).map((p) => izq(p.fecha, money2(p.total))),
      total: [izq("TOTAL A PAGAR", money2(cfg.total))],
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
      "<p>" + (cfg.texto || "") + "</p>" +
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
        icono: ICO.bt, tono: "carga", titulo: "Conectando",
        texto: "Elige tu impresora en la lista que se abre.", cerrable: false, botones: [],
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
      icono: ICO.print, titulo: "Conectar impresora",
      texto: "Todavia no hay una impresora termica vinculada.",
      pasos: ["Enciende la impresora", "Activa el Bluetooth del telefono", "Toca Buscar y elige tu impresora"],
      botones: [
        { texto: "Ahora no", alHacer: cerrarVentana },
        { texto: "Buscar", tipo: "prim", alHacer: lanzar },
      ],
    });
  }

  window.PPTicket = { lienzoVenta, lienzoEstado, compartir, imprimir, lineasVenta, lineasEstado, conectar, imprimirConVentana };
})();
