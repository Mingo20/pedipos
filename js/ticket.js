/* PediPOS: ticket en imagen y salida por impresora termica Bluetooth.
   Se usa desde "Venta registrada", "Ticket del pedido" y "Estado de credito". */
(function () {
  "use strict";

  const ancho = 720;          /* px logicos del lienzo */
  const pad = 54;

  const esc = (s) => String(s == null ? "" : s);

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
    const prod = v.lineas || v.items || [];
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
    const prod = (v.lineas || []).map((l) => izq(cant(l) + " " + (l.unidad || "u") + " " + String(l.nombre || "").slice(0, 18), money(l.total != null ? l.total : (l.cant || 0) * (l.precio || 0))));
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

  window.PPTicket = { lienzoVenta, lienzoEstado, compartir, imprimir, lineasVenta, lineasEstado, conectar };
})();
