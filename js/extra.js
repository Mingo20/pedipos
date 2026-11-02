/* PediPOS: clientes y creditos, proveedores, PIN e impresion termica.
   Se carga despues de app.js y se engancha a las funciones de la interfaz. */
(function () {
  "use strict";

  const S = window.PPStore;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "RD$" + Math.round(Number(n) || 0).toLocaleString("es-DO");
  const money2 = (n) => "RD$" + (Number(n) || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const db = () => S.db;
  /* utilidades que viven en app.js (se enganchan cuando ya cargo) */
  const toast = (m) => (window.PPUI && window.PPUI.toast ? window.PPUI.toast(m) : console.log(m));
  const render = () => (window.PPUI && window.PPUI.render ? window.PPUI.render() : null);

  /* ---------- Cuentas por cobrar ---------- */
  function deudaDe(cid) {
    let t = 0;
    for (const s of db().sales) {
      if (s.cliente_id !== cid) continue;
      if (s.metodo !== "credito") continue;
      t += Number(s.total) || 0;
      if (s.pagada) t -= Number(s.total) || 0;
    }
    return Math.round(t * 100) / 100;
  }
  function ventasDe(cid) {
    return db().sales.filter((s) => s.cliente_id === cid).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  /* ---------- Pantalla Clientes ---------- */
  function renderClientes() {
    const view = document.getElementById("view");
    const list = db().clients || [];
    const total = list.reduce((s, c) => s + Math.max(0, deudaDe(c.cid)), 0);
    const conDeuda = list.filter((c) => deudaDe(c.cid) > 0).length;

    view.innerHTML = `
      <div class="krow" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="card" style="margin:0;padding:12px"><span class="lbl">Por cobrar</span><b class="kval">${money(total)}</b></div>
        <div class="card" style="margin:0;padding:12px"><span class="lbl">Con deuda</span><b class="kval">${conDeuda}</b></div>
      </div>
      <div class="search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input id="cq2" placeholder="Buscar cliente">
      </div>
      <div id="cl2"></div>
      <button class="btn" id="newc" style="margin-top:8px">+ Nuevo cliente</button>`;

    const draw = (f = "") => {
      const t = f.toLowerCase().trim();
      const l = list.filter((c) => !t || String(c.nombre).toLowerCase().includes(t) || String(c.telefono || "").includes(t));
      document.getElementById("cl2").innerHTML = l.length
        ? l.map((c) => {
            const d = deudaDe(c.cid);
            return `<div class="card" style="margin:0 0 8px;padding:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                <div style="min-width:0">
                  <b style="font-size:14px">${esc(c.nombre)}</b>
                  <div class="cnt" style="font-size:12px">${esc(c.telefono || "sin telefono")}${d > 0 ? " · debe " + money(d) : ""}</div>
                </div>
                <button class="mini ${d > 0 ? "red" : ""}" data-c="${esc(c.cid)}">${d > 0 ? "Cobrar" : "Ver"}</button>
              </div></div>`;
          }).join("")
        : '<p class="cnt" style="text-align:center;padding:20px 0">Sin clientes todavia.</p>';
      $$("[data-c]").forEach((b) => (b.onclick = () => verCliente(list.find((c) => c.cid === b.dataset.c))));
    };
    document.getElementById("cq2").oninput = (e) => draw(e.target.value);
    document.getElementById("newc").onclick = () => editarCliente(null);
    draw();
  }

  function verCliente(c) {
    if (!c) return;
    const d = deudaDe(c.cid), vs = ventasDe(c.cid);
    const s = sheetCliente(`<div class="sh-h"><h2>${esc(c.nombre)}</h2><button class="sh-x" data-x>✕</button></div>
      <div class="card" style="margin:0 0 10px;padding:12px">
        <div class="line" style="margin:4px 0;font-size:13px"><span>Telefono</span><span>${esc(c.telefono || "-")}</span></div>
        <div class="line" style="margin:4px 0;font-size:13px"><span>Direccion</span><span>${esc(c.direccion || "-")}</span></div>
        <div class="line" style="margin:8px 0 0;font-size:13px"><span>Debe</span><b style="color:${d > 0 ? "#B3261E" : "#0B6B45"}">${money(d)}</b></div>
      </div>
      ${d > 0 ? '<button class="btn" data-pay style="margin-bottom:10px">Registrar abono</button>' : ""}
      <p class="lbl" style="margin:6px 2px">COMPRAS (${vs.length})</p>
      ${vs.length ? vs.slice(0, 20).map((v) => `<div class="card" style="margin:0 0 6px;padding:10px"><div style="display:flex;justify-content:space-between;font-size:13px">
        <span>${new Date(v.fecha).toLocaleDateString("es-DO")} · ${esc(v.metodo || "")}</span><b>${money(v.total)}</b></div>
        ${v.metodo === "credito" ? `<small class="cnt" style="font-size:11.5px">${v.pagada ? "pagada" : "pendiente"}</small>` : ""}</div>`).join("")
        : '<p class="cnt" style="padding:10px 0">Sin compras.</p>'}
      <button class="btn sec" data-edit style="margin-top:10px">Editar cliente</button>`);

    s.querySelector("[data-x]").onclick = closeSheet;
    s.querySelector("[data-edit]").onclick = () => { closeSheet(); editarCliente(c); };
    const pay = s.querySelector("[data-pay]");
    if (pay) pay.onclick = () => abonar(c);
  }

  function editarCliente(c) {
    const n = !c;
    c = c || { cid: S.uid("C"), nombre: "", telefono: "", direccion: "", nota: "", limite_credito: 0, activo: true };
    const s = sheetCliente(`<div class="sh-h"><h2>${n ? "Nuevo cliente" : "Editar cliente"}</h2><button class="sh-x" data-x>✕</button></div>
      <label class="field"><span>Nombre</span><input id="cn2" value="${esc(c.nombre)}"></label>
      <label class="field"><span>Telefono</span><input id="ct" inputmode="tel" value="${esc(c.telefono || "")}"></label>
      <label class="field"><span>Direccion</span><input id="cd" value="${esc(c.direccion || "")}"></label>
      <label class="field"><span>Limite de credito (RD$)</span><input id="cl" inputmode="decimal" value="${c.limite_credito || ""}"></label>
      <button class="btn" id="svc">Guardar</button>
      ${n ? "" : '<button class="btn red" id="dlc" style="margin-top:10px">Eliminar</button>'}`);

    s.querySelector("[data-x]").onclick = closeSheet;
    s.querySelector("#svc").onclick = () => {
      const nom = s.querySelector("#cn2").value.trim();
      if (!nom) return toast("Falta el nombre");
      Object.assign(c, {
        nombre: nom,
        telefono: s.querySelector("#ct").value.trim(),
        direccion: s.querySelector("#cd").value.trim(),
        limite_credito: parseFloat(String(s.querySelector("#cl").value).replace(",", ".")) || 0,
      });
      if (n) (db().clients = db().clients || []).push(c);
      S.save(); window.PPSync.saveCliente(c); closeSheet(); toast("Cliente guardado"); render();
    };
    const dl = s.querySelector("#dlc");
    if (dl) dl.onclick = () => {
      db().clients = db().clients.filter((x) => x.cid !== c.cid);
      S.save(); window.PPSync.deleteCliente(c.cid); closeSheet(); toast("Cliente eliminado"); render();
    };
  }

  function abonar(c) {
    const s = sheetCliente(`<div class="sh-h"><h2>Abono de ${esc(c.nombre)}</h2><button class="sh-x" data-x>✕</button></div>
      <label class="field"><span>Monto (RD$)</span><input id="ab" inputmode="decimal" placeholder="${deudaDe(c.cid)}"></label>
      <button class="btn" id="oka">Registrar abono</button>`);
    s.querySelector("[data-x]").onclick = closeSheet;
    s.querySelector("#oka").onclick = () => {
      const m = parseFloat(String(s.querySelector("#ab").value).replace(",", "."));
      if (!(m > 0)) return toast("Monto invalido");
      const pend = db().sales.filter((s2) => s2.cliente_id === c.cid && s2.metodo === "credito" && !s2.pagada).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
      let resto = m;
      for (const v of pend) {
        if (resto <= 0) break;
        if (resto >= Number(v.total) - 0.01) { v.pagada = true; resto = S.round2(resto - Number(v.total)); }
      }
      S.save(); pend.forEach((v) => window.PPSync.saveSale(v));
      closeSheet(); toast("Abono registrado"); render();
    };
  }

  /* ---------- Proveedores ---------- */
  function renderProveedores() {
    const view = document.getElementById("view");
    const list = db().providers || [];
    view.innerHTML = `
      <p class="lbl" style="margin:0 2px 8px">PROVEEDORES (${list.length})</p>
      <div id="pl2"></div>
      <button class="btn" id="newpv" style="margin-top:8px">+ Nuevo proveedor</button>`;
    const draw = () => {
      document.getElementById("pl2").innerHTML = list.length
        ? list.map((p) => `<div class="card" style="margin:0 0 8px;padding:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <div style="min-width:0"><b style="font-size:14px">${esc(p.nombre)}</b><div class="cnt" style="font-size:12px">${esc(p.contacto || "sin contacto")}${p.telefono ? " · " + esc(p.telefono) : ""}</div></div>
            <button class="mini" data-p="${esc(p.prid)}">Editar</button></div></div>`).join("")
        : '<p class="cnt" style="text-align:center;padding:20px 0">Sin proveedores todavia.</p>';
      $$("[data-p]").forEach((b) => (b.onclick = () => editarProveedor(list.find((x) => x.prid === b.dataset.p))));
    };
    document.getElementById("newpv").onclick = () => editarProveedor(null);
    draw();
  }

  function editarProveedor(p) {
    const n = !p;
    p = p || { prid: S.uid("PR"), nombre: "", contacto: "", telefono: "", nota: "", activo: true };
    const s = sheetCliente(`<div class="sh-h"><h2>${n ? "Nuevo proveedor" : "Editar proveedor"}</h2><button class="sh-x" data-x>✕</button></div>
      <label class="field"><span>Nombre</span><input id="pn" value="${esc(p.nombre)}"></label>
      <label class="field"><span>Persona de contacto</span><input id="pc" value="${esc(p.contacto || "")}"></label>
      <label class="field"><span>Telefono</span><input id="pt" inputmode="tel" value="${esc(p.telefono || "")}"></label>
      <label class="field"><span>Nota</span><input id="pno" value="${esc(p.nota || "")}"></label>
      <button class="btn" id="svp">Guardar</button>
      ${n ? "" : '<button class="btn red" id="dlp" style="margin-top:10px">Eliminar</button>'}`);
    s.querySelector("[data-x]").onclick = closeSheet;
    s.querySelector("#svp").onclick = () => {
      const nom = s.querySelector("#pn").value.trim();
      if (!nom) return toast("Falta el nombre");
      Object.assign(p, { nombre: nom, contacto: s.querySelector("#pc").value.trim(), telefono: s.querySelector("#pt").value.trim(), nota: s.querySelector("#pno").value.trim() });
      if (n) (db().providers = db().providers || []).push(p);
      S.save(); window.PPSync.saveProveedor(p); closeSheet(); toast("Proveedor guardado"); render();
    };
    const dl = s.querySelector("#dlp");
    if (dl) dl.onclick = () => {
      db().providers = db().providers.filter((x) => x.prid !== p.prid);
      S.save(); window.PPSync.deleteProveedor(p.prid); closeSheet(); toast("Proveedor eliminado"); render();
    };
  }

  /* ---------- Hoja auxiliar (reutiliza estilos de la app) ---------- */
  function sheetCliente(html) {
    if (window.PPUI && window.PPUI.sheet) return window.PPUI.sheet(html);
    const layer = document.getElementById("layer");
    layer.innerHTML = "";
    const m = document.createElement("div"); m.className = "mask";
    const s = document.createElement("section"); s.className = "sheet";
    s.innerHTML = '<div class="grip"></div>' + html;
    layer.append(m, s);
    m.onclick = () => { layer.innerHTML = ""; };
    return s;
  }
  function closeSheet() { document.getElementById("layer").innerHTML = ""; }

  /* ---------- Impresion termica ---------- */
  const PRINTER = { service: null, char: null, name: "" };

  async function btConectar() {
    if (!navigator.bluetooth) throw new Error("Este telefono no soporta Bluetooth web");
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb", "0000ff00-0000-1000-8000-00805f9b34fb", "49535343-fe7d-4ae5-8fa9-9fafd205e455"],
    });
    const server = await device.gatt.connect();
    const svcs = await server.getPrimaryServices();
    for (const svc of svcs) {
      const chars = await svc.getCharacteristics();
      for (const ch of chars) {
        if (ch.properties.write || ch.properties.writeWithoutResponse) {
          PRINTER.service = svc; PRINTER.char = ch; PRINTER.name = device.name || "Impresora";
          localStorage.setItem("pedipos.printer", PRINTER.name);
          return PRINTER.name;
        }
      }
    }
    throw new Error("La impresora no acepta escritura");
  }

  function texto(sale) {
    const st = db().settings;
    const L = [];
    L.push(st.negocio || "Mi negocio");
    L.push(new Date(sale.fecha).toLocaleString("es-DO"));
    L.push("--------------------------------");
    for (const l of sale.lineas) {
      const izq = String(Math.round(l.cant * 100) / 100) + " x " + l.nombre;
      const der = money(l.cant * l.precio);
      L.push(izq.slice(0, 22).padEnd(32 - der.length) + der);
    }
    L.push("--------------------------------");
    L.push("Subtotal".padEnd(22) + money2(sale.subtotal));
    L.push("ITBIS".padEnd(22) + money2(sale.itbis));
    L.push("TOTAL".padEnd(22) + money2(sale.total));
    L.push("");
    L.push("Gracias por su compra");
    L.push("\n\n\n");
    return L.join("\n");
  }

  async function imprimir(sale) {
    const t = texto(sale);
    if (PRINTER.char) {
      try {
        const data = new TextEncoder().encode(t);
        const paso = 100;
        for (let i = 0; i < data.length; i += paso) {
          await PRINTER.char.writeValue(data.slice(i, i + paso));
        }
        return "bt";
      } catch (_) { /* cae a impresion del sistema */ }
    }
    const v = window.open("", "_blank", "width=380,height=600");
    if (!v) throw new Error("Permite las ventanas emergentes para imprimir");
    v.document.write('<pre style="font:12px/1.35 monospace;width:300px;margin:0 auto;white-space:pre-wrap">' + esc(t) + "</pre>");
    v.document.close();
    v.focus();
    setTimeout(() => v.print(), 350);
    return "sistema";
  }

  /* Adjuntar la foto del comprobante a una venta (sin internet: queda en el telefono) */
  async function adjuntarComprobante(sale, listo) {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*"; inp.capture = "environment";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 700, esc = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement("canvas");
          cv.width = Math.round(img.width * esc); cv.height = Math.round(img.height * esc);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          sale.foto = cv.toDataURL("image/jpeg", 0.6);
          S.save(); sync.saveSale(sale);
          toast("Comprobante guardado");
          listo(sale);
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(f);
    };
    inp.click();
  }

  window.PPExtra = {
    adjuntarComprobante, renderClientes, renderProveedores, editarCliente, editarProveedor, deudaDe, imprimir, btConectar, PRINTER };
  window.renderClientes = renderClientes;
  window.renderProveedores = renderProveedores;
})();
