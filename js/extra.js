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

  /* Subpantalla a todo el ancho (detalle de cliente o proveedor). */
  let sub = null;

  /* ---------- Pantalla Clientes ---------- */
  let cliFiltro = "";   /* "", "debe", "aldia" */
  let provFiltro = "";

  function renderClientes() {
    const view = document.getElementById("view");
    if (sub && sub.tipo === "cliente") {
      const c = (db().clients || []).find((x) => x.cid === sub.id);
      if (c) return pintarCliente(c);
      sub = null;
    } else if (sub) sub = null;
    document.body.classList.remove("focus");
    const list = db().clients || [];
    const total = list.reduce((s, c) => s + Math.max(0, deudaDe(c.cid)), 0);
    const conDeuda = list.filter((c) => deudaDe(c.cid) > 0).length;

    view.innerHTML = `
      <div class="kpis">
        <div class="kpi"><small>Por cobrar</small><b>${money(total)}</b></div>
        <div class="kpi"><small>Con deuda</small><b>${conDeuda}</b></div>
      </div>
      <div class="stickbar">
        <div class="searchrow">
          <div class="search">${window.PPUI.I.search}<input id="cq2" placeholder="Buscar cliente" autocomplete="off"></div>
          <button class="fbtn" id="cfil2" aria-label="Filtrar clientes">${window.PPUI.I.filtro}</button>
        </div>
        <div class="filtro-pop" id="cfp" hidden>
          <button class="fopt" data-e="">Todos los clientes ${window.PPUI.I.check}</button>
          <button class="fopt" data-e="debe">Con deuda ${window.PPUI.I.check}</button>
          <button class="fopt" data-e="aldia">Al dia ${window.PPUI.I.check}</button>
        </div>
      </div>
      <div id="cl2"></div>`;

    const draw = (f = "") => {
      const t = f.toLowerCase().trim();
      const l = list.filter((c) => !t || String(c.nombre).toLowerCase().includes(t) || String(c.direccion || "").toLowerCase().includes(t))
        .filter((c) => cliFiltro === "debe" ? deudaDe(c.cid) > 0 : cliFiltro === "aldia" ? deudaDe(c.cid) <= 0 : true);
      document.getElementById("cl2").innerHTML = l.length
        ? l.map((c) => `<div class="clrow" data-c="${esc(c.cid)}">
              <div class="cli"><b>${esc(c.nombre)}</b><span>${esc(c.direccion || "Sin direccion")}</span></div>
              <span class="ico wa wa-end" data-w="${esc(c.cid)}" role="button" aria-label="WhatsApp">${window.PPUI.I.wa}</span>
            </div>`).join("")
        : '<p class="cnt" style="text-align:center;padding:20px 0">Sin clientes con ese filtro.</p>';
      /* toda la tarjeta abre el detalle */
      $$(".clrow").forEach((el) => (el.onclick = () => verCliente(list.find((c) => c.cid === el.dataset.c))));
      $$("[data-w]").forEach((b) => (b.onclick = (e) => {
        e.stopPropagation();
        const c = list.find((x) => x.cid === b.dataset.w);
        window.PPUI.chatear(c.whatsapp || c.telefono, "Hola " + c.nombre + ", le escribo de " + (db().settings.negocio || "mi negocio") + ".");
      }));
    };
    const inp = document.getElementById("cq2");
    inp.oninput = (e) => draw(e.target.value);
    const pop = document.getElementById("cfp"), fb = document.getElementById("cfil2");
    fb.classList.toggle("on", !!cliFiltro);
    const marcar = () => $$("[data-e]", pop).forEach((b) => b.classList.toggle("on", b.dataset.e === cliFiltro));
    marcar();
    fb.onclick = () => { pop.hidden = !pop.hidden; };
    $$("[data-e]", pop).forEach((b) => (b.onclick = () => {
      cliFiltro = b.dataset.e; fb.classList.toggle("on", !!cliFiltro);
      pop.hidden = true; marcar(); draw(inp.value);
    }));
    window.PPUI.setFab(window.PPUI.I.plus, () => editarCliente(null), "Nuevo cliente");
    draw();
  }

  function verCliente(c) {
    if (!c) return;
    sub = { tipo: "cliente", id: c.cid };
    pintarCliente(c);
  }

  function pintarCliente(c) {
    const view = document.getElementById("view");
    const d = deudaDe(c.cid), vs = ventasDe(c.cid);
    const comprado = vs.reduce((x, v) => x + (Number(v.total) || 0), 0);
    const pagado = Math.max(0, Math.round((comprado - d) * 100) / 100);
    const fila = (v) => {
      const cred = v.metodo === "credito";
      return `<div class="hrow" data-v="${esc(v.vid || "")}">
        <div class="hi"><b>${cred ? (v.pagada ? "Credito pagado" : "Credito pendiente") : "Contado"}</b>
          <span>${new Date(v.fecha).toLocaleString("es-DO", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}${v.lineas ? " &middot; " + lineasDe2(v).length + " art." : ""}</span>
          ${cred && v.fecha_pago ? `<span class="fpago">Pago prometido: ${new Date(v.fecha_pago + "T12:00:00").toLocaleDateString("es-DO", { day: "numeric", month: "long" })}</span>` : ""}</div>
        <b class="${cred && !v.pagada ? "red" : ""}">${money(v.total)}</b></div>`;
    };
    window.PPUI.clearFab();
    document.body.classList.add("focus");   /* sin encabezado ni barra inferior */
    const dir = c.direccion || "Sin direccion registrada";
    view.innerHTML = `<div class="subv">
      <div class="subv-h">
        <button class="subv-back" id="svBack" aria-label="Volver">${window.PPUI.I.back}</button>
        <div class="subv-tt"><b>${esc(c.nombre)}</b><span>${esc(dir)}</span></div>
        <button class="ico wa" id="svWa" aria-label="WhatsApp">${window.PPUI.I.wa}</button>
      </div>
      <div class="kpis" style="grid-template-columns:1fr 1fr 1fr;gap:8px;margin:14px">
        <div class="kpi" style="padding:12px"><small>Comprado</small><b style="font-size:15.5px">${money(comprado)}</b></div>
        <div class="kpi" style="padding:12px"><small>Pagado</small><b style="font-size:15.5px;color:#0B6B45">${money(pagado)}</b></div>
        <div class="kpi" style="padding:12px"><small>Debe</small><b style="font-size:15.5px;color:${d > 0 ? "#B3261E" : "#0B6B45"}">${money(d)}</b></div>
      </div>
      ${d > 0 ? '<div class="subv-acc"><button class="btn" id="svPay" style="height:48px;width:100%">Registrar pagos y abono</button></div>' : ""}
      <p class="lbl subv-lbl">HISTORIAL DE COMPRAS (${vs.length})</p>
      ${vs.length ? vs.map(fila).join("") : '<p class="cnt" style="padding:10px 14px">Sin compras registradas.</p>'}
      <div class="subv-acc"><button class="btn sec" id="svEdit" style="height:48px;width:100%">Editar cliente</button></div>
    </div>`;
    view.scrollTop = 0;
    const wa = c.whatsapp || c.telefono;
    $("#svBack").onclick = () => { document.body.classList.remove("focus"); sub = null; render(); };
    $("#svWa").onclick = () => window.PPUI.chatear(wa, "Hola " + c.nombre + ", le escribo de " + (db().settings.negocio || "mi negocio") + ".");
    $("#svEdit").onclick = () => editarCliente(c);
    const pay = $("#svPay");
    if (pay) pay.onclick = () => abonar(c);
  }

  function lineasDe2(v) {
    let l = v && v.lineas;
    if (typeof l === "string") { try { l = JSON.parse(l); } catch (_) { l = []; } }
    return Array.isArray(l) ? l : [];
  }

  function editarCliente(c) {
    const n = !c;
    c = c || { cid: S.uid("C"), nombre: "", whatsapp: "", direccion: "", nota: "", limite_credito: 0, activo: true };
    const s = sheetCliente(`<div class="sh-h"><h2>${n ? "Nuevo cliente" : "Editar cliente"}</h2><button class="sh-x" data-x>✕</button></div>
      <label class="field"><span>Nombre</span><input id="cn2" value="${esc(c.nombre)}"></label>
      <label class="field"><span>Numero de WhatsApp</span><input id="cw" inputmode="tel" placeholder="8090000000" value="${esc(c.whatsapp || c.telefono || "")}"></label>
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
        whatsapp: s.querySelector("#cw").value.trim().replace(/\D/g, ""),
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

  /* ---------- Proveedores: compras, pagos y saldo ---------- */
  function comprasDe(p) { return Array.isArray(p && p.compras) ? p.compras : []; }
  function pagosDe(p) { return Array.isArray(p && p.pagos) ? p.pagos : []; }
  function saldoProv(p) {
    const comprado = comprasDe(p).reduce((x, c) => x + (Number(c.total) || 0), 0);
    const pagado = comprasDe(p).reduce((x, c) => x + (Number(c.pagado) || 0), 0);
    return { comprado: Math.round(comprado * 100) / 100, pagado: Math.round(pagado * 100) / 100, debe: Math.round((comprado - pagado) * 100) / 100 };
  }

  function renderProveedores() {
    const view = document.getElementById("view");
    if (sub && sub.tipo === "proveedor") {
      const p = (db().providers || []).find((x) => x.prid === sub.id);
      if (p) return pintarProveedor(p);
      sub = null;
    } else if (sub) sub = null;
    document.body.classList.remove("focus");
    const list = db().providers || [];
    const debeTotal = list.reduce((s, p) => s + Math.max(0, saldoProv(p).debe), 0);
    const conDeuda = list.filter((p) => saldoProv(p).debe > 0).length;
    view.innerHTML = `
      <div class="kpis">
        <div class="kpi"><small>Por pagar</small><b>${money(debeTotal)}</b></div>
        <div class="kpi"><small>Con deuda</small><b>${conDeuda}</b></div>
      </div>
      <div class="stickbar">
        <div class="searchrow">
          <div class="search">${window.PPUI.I.search}<input id="pq" placeholder="Buscar proveedor" autocomplete="off"></div>
          <button class="fbtn" id="pvfil" aria-label="Filtrar proveedores">${window.PPUI.I.filtro}</button>
        </div>
        <div class="filtro-pop" id="pvp" hidden>
          <button class="fopt" data-e="">Todos los proveedores ${window.PPUI.I.check}</button>
          <button class="fopt" data-e="debe">Con deuda ${window.PPUI.I.check}</button>
          <button class="fopt" data-e="aldia">Al dia ${window.PPUI.I.check}</button>
        </div>
      </div>
      <div id="pl2"></div>`;
    const draw = (f = "") => {
      const t = f.toLowerCase().trim();
      const l = list.filter((p) => !t || String(p.nombre).toLowerCase().includes(t) || String(p.contacto || "").toLowerCase().includes(t))
        .filter((p) => provFiltro === "debe" ? saldoProv(p).debe > 0 : provFiltro === "aldia" ? saldoProv(p).debe <= 0 : true);
      document.getElementById("pl2").innerHTML = l.length
        ? l.map((p) => {
            const s = saldoProv(p);
            return `<div class="clrow" data-pv="${esc(p.prid)}">
              <div class="cli"><b>${esc(p.nombre)}</b><span>${p.contacto ? esc(p.contacto) : (s.debe > 0 ? "Debe " + money(s.debe) : "Al dia")}${p.contacto && s.debe > 0 ? " &middot; debe " + money(s.debe) : ""}</span></div>
              <span class="ico wa wa-end" data-w="${esc(p.prid)}" role="button" aria-label="WhatsApp">${window.PPUI.I.wa}</span>
            </div>`;
          }).join("")
        : '<p class="cnt" style="text-align:center;padding:20px 0">Sin proveedores con ese filtro.</p>';
      $$(".clrow").forEach((el) => (el.onclick = () => verProveedor(list.find((x) => x.prid === el.dataset.pv))));
      $$("[data-w]").forEach((b) => (b.onclick = (e) => {
        e.stopPropagation();
        const p = list.find((x) => x.prid === b.dataset.w);
        window.PPUI.chatear(p.whatsapp || p.telefono, "Hola " + p.nombre + ", le escribo de " + (db().settings.negocio || "mi negocio") + ".");
      }));
    };
    const inp = document.getElementById("pq");
    inp.oninput = (e) => draw(e.target.value);
    const pop = document.getElementById("pvp"), fb = document.getElementById("pvfil");
    fb.classList.toggle("on", !!provFiltro);
    const marcar = () => $$("[data-e]", pop).forEach((b) => b.classList.toggle("on", b.dataset.e === provFiltro));
    marcar();
    fb.onclick = () => { pop.hidden = !pop.hidden; };
    $$("[data-e]", pop).forEach((b) => (b.onclick = () => {
      provFiltro = b.dataset.e; fb.classList.toggle("on", !!provFiltro);
      pop.hidden = true; marcar(); draw(inp.value);
    }));
    window.PPUI.setFab(window.PPUI.I.plus, () => editarProveedor(null), "Nuevo proveedor");
    draw();
  }

  function verProveedor(p) {
    if (!p) return;
    sub = { tipo: "proveedor", id: p.prid };
    pintarProveedor(p);
  }

  function pintarProveedor(p) {
    const view = document.getElementById("view");
    const s0 = saldoProv(p);
    const mov = [
      ...comprasDe(p).map((c) => ({ t: c.fecha, tipo: "compra", x: c })),
      ...pagosDe(p).map((g) => ({ t: g.fecha, tipo: "pago", x: g })),
    ].sort((a, b) => String(b.t).localeCompare(String(a.t)));
    const fila = (m) => {
      const compra = m.tipo === "compra";
      const pend = compra ? Math.max(0, (Number(m.x.total) || 0) - (Number(m.x.pagado) || 0)) : 0;
      return `<div class="hrow">
        <div class="hi"><b>${compra ? esc(m.x.concepto || "Compra") : "Pago"}</b>
          <span>${new Date(m.t).toLocaleString("es-DO", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}${compra ? (pend > 0 ? " &middot; debe " + money(pend) : " &middot; pagada") : ""}</span></div>
        <b class="${compra ? (pend > 0 ? "red" : "") : "green"}">${compra ? "-" + money(m.x.total) : "+" + money(m.x.monto)}</b></div>`;
    };
    window.PPUI.clearFab();
    document.body.classList.add("focus");
    const contacto = p.contacto || p.whatsapp || p.telefono || "Sin contacto";
    view.innerHTML = `<div class="subv">
      <div class="subv-h">
        <button class="subv-back" id="svBack" aria-label="Volver">${window.PPUI.I.back}</button>
        <div class="subv-tt"><b>${esc(p.nombre)}</b><span>${esc(contacto)}</span></div>
        <button class="ico wa" id="svWa" aria-label="WhatsApp">${window.PPUI.I.wa}</button>
      </div>
      <div class="kpis" style="grid-template-columns:1fr 1fr 1fr;gap:8px;margin:14px">
        <div class="kpi" style="padding:12px"><small>Comprado</small><b style="font-size:15.5px">${money(s0.comprado)}</b></div>
        <div class="kpi" style="padding:12px"><small>Pagado</small><b style="font-size:15.5px;color:#0B6B45">${money(s0.pagado)}</b></div>
        <div class="kpi" style="padding:12px"><small>Debe</small><b style="font-size:15.5px;color:${s0.debe > 0 ? "#B3261E" : "#0B6B45"}">${money(s0.debe)}</b></div>
      </div>
      <div class="subv-acc">
        <button class="btn" id="svCompra" style="height:48px">Nueva compra</button>
        ${s0.debe > 0 ? '<button class="btn sec" id="svPago" style="height:48px">Registrar pago</button>' : ""}
      </div>
      <p class="lbl subv-lbl">MOVIMIENTOS (${mov.length})</p>
      ${mov.length ? mov.map(fila).join("") : '<p class="cnt" style="padding:10px 14px">Sin movimientos registrados.</p>'}
      <div class="subv-acc"><button class="btn sec" id="svEdit" style="height:48px;width:100%">Editar proveedor</button></div>
    </div>`;
    view.scrollTop = 0;
    $("#svBack").onclick = () => { document.body.classList.remove("focus"); sub = null; render(); };
    $("#svWa").onclick = () => window.PPUI.chatear(p.whatsapp || p.telefono, "Hola " + p.nombre + ", le escribo de " + (db().settings.negocio || "mi negocio") + ".");
    $("#svCompra").onclick = () => registrarCompra(p);
    $("#svEdit").onclick = () => editarProveedor(p);
    const pg = $("#svPago");
    if (pg) pg.onclick = () => registrarPago(p);
  }

  function registrarCompra(p) {
    const pend = saldoProv(p).debe;
    const s = sheetCliente(`<div class="sh-h"><h2>Compra a ${esc(p.nombre)}</h2><button class="sh-x" data-x>✕</button></div>
      <label class="field"><span>Concepto</span><input id="cc" placeholder="Ej. Mercancia de la semana"></label>
      <label class="field"><span>Monto (RD$)</span><input id="ct2" inputmode="decimal" placeholder="0"></label>
      <label class="field"><span>Tipo de compra</span><select id="ck">
        <option value="credito">A credito (queda debiendo)</option>
        <option value="contado">Al contado (pagada)</option>
      </select></label>
      ${pend > 0 ? `<p class="cnt" style="margin-top:-4px">Saldo anterior: ${money(pend)}</p>` : ""}
      <button class="btn" id="okc">Registrar compra</button>`);
    s.querySelector("[data-x]").onclick = closeSheet;
    s.querySelector("#okc").onclick = () => {
      const monto = parseFloat(String(s.querySelector("#ct2").value).replace(",", "."));
      if (!(monto > 0)) return toast("Monto invalido");
      const tipo = s.querySelector("#ck").value;
      const c = {
        id: S.uid("CP"), fecha: new Date().toISOString(),
        concepto: s.querySelector("#cc").value.trim() || "Compra",
        total: S.round2(monto), pagado: tipo === "contado" ? S.round2(monto) : 0,
      };
      p.compras = comprasDe(p); p.compras.push(c);
      S.save(); window.PPSync.saveProveedor(p);
      closeSheet(); toast(tipo === "contado" ? "Compra al contado registrada" : "Compra a credito registrada"); render();
    };
  }

  function registrarPago(p) {
    const s0 = saldoProv(p);
    const s = sheetCliente(`<div class="sh-h"><h2>Pago a ${esc(p.nombre)}</h2><button class="sh-x" data-x>✕</button></div>
      <p class="cnt" style="margin-top:-6px">Saldo pendiente: <b>${money(s0.debe)}</b></p>
      <label class="field"><span>Monto (RD$)</span><input id="gm" inputmode="decimal" placeholder="${s0.debe}"></label>
      <label class="field"><span>Nota (opcional)</span><input id="gn" placeholder="Efectivo, transferencia..."></label>
      <button class="btn" id="okg">Registrar pago</button>`);
    s.querySelector("[data-x]").onclick = closeSheet;
    s.querySelector("#okg").onclick = () => {
      const monto = parseFloat(String(s.querySelector("#gm").value).replace(",", "."));
      if (!(monto > 0)) return toast("Monto invalido");
      if (monto > s0.debe + 0.01) return toast("El pago supera el saldo de " + money(s0.debe));
      /* el pago se aplica a las compras mas antiguas que aun deban */
      let resto = monto;
      const abiertas = comprasDe(p).filter((c) => (Number(c.total) || 0) - (Number(c.pagado) || 0) > 0.001)
        .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
      for (const c of abiertas) {
        if (resto <= 0.001) break;
        const falta = (Number(c.total) || 0) - (Number(c.pagado) || 0);
        const abono = Math.min(falta, resto);
        c.pagado = S.round2((Number(c.pagado) || 0) + abono);
        resto = S.round2(resto - abono);
      }
      p.pagos = pagosDe(p);
      p.pagos.push({ id: S.uid("PG"), fecha: new Date().toISOString(), monto: S.round2(monto), nota: s.querySelector("#gn").value.trim() });
      S.save(); window.PPSync.saveProveedor(p);
      closeSheet(); toast("Pago registrado"); render();
    };
  }

  function editarProveedor(p) {
    const n = !p;
    p = p || { prid: S.uid("PR"), nombre: "", contacto: "", whatsapp: "", nota: "", activo: true, compras: [], pagos: [] };
    const s = sheetCliente(`<div class="sh-h"><h2>${n ? "Nuevo proveedor" : "Editar proveedor"}</h2><button class="sh-x" data-x>✕</button></div>
      <label class="field"><span>Nombre</span><input id="pn" value="${esc(p.nombre)}"></label>
      <label class="field"><span>Persona de contacto</span><input id="pc" value="${esc(p.contacto || "")}"></label>
      <label class="field"><span>Numero de WhatsApp</span><input id="pw" inputmode="tel" placeholder="8090000000" value="${esc(p.whatsapp || p.telefono || "")}"></label>
      <label class="field"><span>Nota</span><input id="pno" value="${esc(p.nota || "")}"></label>
      <button class="btn" id="svp">Guardar</button>
      ${n ? "" : '<button class="btn red" id="dlp" style="margin-top:10px">Eliminar</button>'}`);
    s.querySelector("[data-x]").onclick = closeSheet;
    s.querySelector("#svp").onclick = () => {
      const nom = s.querySelector("#pn").value.trim();
      if (!nom) return toast("Falta el nombre");
      Object.assign(p, {
        nombre: nom,
        contacto: s.querySelector("#pc").value.trim(),
        whatsapp: s.querySelector("#pw").value.trim().replace(/\D/g, ""),
        nota: s.querySelector("#pno").value.trim(),
      });
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
  function closeSheet() { if (window.PPUI && window.PPUI.closeSheet) window.PPUI.closeSheet(); else document.getElementById("layer").innerHTML = ""; }

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
