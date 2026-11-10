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

  /* ---------- ticket de una venta ---------- */
  function lienzoVenta(v, opts) {
    opts = opts || {};
    const prod = lineasDe(v);
    const filas = prod.length;
    const alto = 470 + filas * 62 + (v.cliente ? 34 : 0) + 120;
    const { c, x } = crearLienzo(alto);

    /* banda superior */
    x.fillStyle = "#0F7C4F";
    x.fillRect(0, 0, ancho, 106);
    texto(x, opts.negocio || "Mi negocio", 56, { alinea: "center", tam: 30, peso: 800, color: "#fff" });
    texto(x, opts.direccion || "", 84, { alinea: "center", tam: 17, color: "#D6F0E2" });

    let y = 150;
    texto(x, v.metodo === "credito" ? "A CREDITO" : "PAGADO", y, { tam: 17, peso: 800, color: v.metodo === "credito" ? "#B8860B" : "#0F7C4F" });
    texto(x, fecha(v.fecha), y, { alinea: "right", tam: 17, color: "#6B747C" });
    y += 30;
    if (v.cliente) {
      texto(x, "CLIENTE", y, { tam: 15, peso: 700, color: "#8B949C" });
      texto(x, v.cliente, y, { alinea: "right", tam: 17, peso: 600 });
      y += 28;
    }
    y += 8;
    linea(x, y, "#E6EBEF");
    y += 30;
    texto(x, "PRODUCTO", y, { tam: 14, peso: 700, color: "#8B949C" });
    texto(x, "TOTAL", y, { alinea: "right", tam: 14, peso: 700, color: "#8B949C" });
    y += 12;

    prod.forEach((l) => {
      y += 30;
      texto(x, l.nombre || l.producto || "Producto", y, { tam: 21, peso: 700 });
      texto(x, money(l.total != null ? l.total : (l.cant || 0) * (l.precio || 0)), y, { alinea: "right", tam: 21, peso: 700 });
      y += 22;
      texto(x, cant(l) + " " + (l.unidad || "unidad") + " · " + money(l.precio) + " c/u", y, { tam: 15, color: "#7B848C" });
      y += 8;
    });

    y += 22;
    linea(x, y, "#E6EBEF");
    y += 32;
    texto(x, "Subtotal", y, { tam: 19, color: "#5B646C" });
    texto(x, money2(v.subtotal), y, { alinea: "right", tam: 19, color: "#5B646C" });
    y += 30;
    texto(x, "ITBIS", y, { tam: 19, color: "#B8860B" });
    texto(x, money2(v.itbis || 0), y, { alinea: "right", tam: 19, color: "#B8860B" });
    y += 40;
    texto(x, "TOTAL", y, { tam: 26, peso: 800 });
    texto(x, money2(v.total), y, { alinea: "right", tam: 26, peso: 800 });
    y += 34;
    if (v.recibido) {
      texto(x, "Recibido", y, { tam: 18, color: "#5B646C" });
      texto(x, money2(v.recibido), y, { alinea: "right", tam: 18, color: "#5B646C" });
      y += 26;
      texto(x, "Cambio", y, { tam: 18, color: "#5B646C" });
      texto(x, money2(v.cambio || 0), y, { alinea: "right", tam: 18, color: "#5B646C" });
    }

    /* pie */
    texto(x, "Gracias por su compra", alto - 52, { alinea: "center", tam: 16, color: "#9AA3AA" });
    return c;
  }

  /* ---------- estado de credito de un cliente ---------- */
  function lienzoEstado(cfg) {
    /* cfg: { negocio, cliente, total, fechaPago, pedidos:[{fecha,total}] } */
    const n = (cfg.pedidos || []).length;
    const alto = 470 + n * 66 + 130;
    const { c, x } = crearLienzo(alto);
    x.fillStyle = "#0F7C4F"; x.fillRect(0, 0, ancho, 106);
    texto(x, cfg.negocio || "Mi negocio", 56, { alinea: "center", tam: 30, peso: 800, color: "#fff" });
    texto(x, "ESTADO DE CREDITO", 84, { alinea: "center", tam: 16, peso: 700, color: "#D6F0E2" });

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
    lineas.titulo.forEach((t) => out.push(...bytes(t + "\n")));
    out.push(0x1b, 0x21, 0x00);            /* normal */
    lineas.sub.forEach((t) => out.push(...bytes(t + "\n")));
    out.push(0x1b, 0x61, 0x00);            /* izquierda */
    out.push(...bytes("-".repeat(32) + "\n"));
    lineas.cuerpo.forEach((t) => out.push(...bytes(t + "\n")));
    out.push(...bytes("-".repeat(32) + "\n"));
    out.push(0x1b, 0x45, 0x01);            /* negrita */
    lineas.total.forEach((t) => out.push(...bytes(t + "\n")));
    out.push(0x1b, 0x45, 0x00);
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

  function lineasVenta(v, negocio, direccion) {
    const prod = lineasDe(v).map((l) => izq(cant(l) + " " + (l.unidad || "u") + " " + String(l.nombre || "").slice(0, 18), money(l.total != null ? l.total : (l.cant || 0) * (l.precio || 0))));
    return {
      titulo: [negocio || "Mi negocio"],
      sub: [direccion || "", fecha(v.fecha), v.cliente ? "Cliente: " + v.cliente : "", v.metodo === "credito" ? "A CREDITO" : "PAGADO"],
      cuerpo: prod,
      total: [izq("Subtotal", money2(v.subtotal)), izq("ITBIS", money2(v.itbis || 0)), izq("TOTAL", money2(v.total))],
    };
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
