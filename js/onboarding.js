/* PediPOS · Onboarding visual de primer uso.
   Tres pasos con el formato de las capturas: logo, progreso, tarjeta y botones.
   Se muestra una sola vez; despues se puede reabrir desde Ajustes. */
(function () {
  "use strict";

  const S = window.PPStore;
  const db = () => S.db;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const PROVINCIAS = ["Distrito Nacional", "Santo Domingo", "Santiago", "La Vega", "San Cristóbal", "Puerto Plata", "Duarte", "La Romana", "San Pedro de Macorís", "Espaillat", "Monseñor Nouel", "Peravia", "Azua", "Barahona", "Valverde", "Hermanas Mirabal", "Sánchez Ramírez", "Monte Plata", "Hato Mayor", "El Seibo", "La Altagracia", "María Trinidad Sánchez", "Samaná", "Monte Cristi", "Dajabón", "Elías Piña", "San Juan", "Independencia", "Pedernales", "Bahoruco", "Santiago Rodríguez", "San José de Ocoa"];

  const MUNIS = {
    "Distrito Nacional": ["Santo Domingo de Guzmán"],
    "Santo Domingo": ["Santo Domingo Este", "Santo Domingo Oeste", "Santo Domingo Norte", "Boca Chica", "Los Alcarrizos", "Pedro Brand", "San Antonio de Guerra"],
    "Santiago": ["Santiago de los Caballeros", "Bisonó", "Tamboril", "Villa González", "Licey al Medio", "San José de las Matas"],
    "La Vega": ["La Vega", "Constanza", "Jarabacoa", "San José de Ocoa"],
    "San Cristóbal": ["San Cristóbal", "Haina", "Villa Altagracia", "Bajos de Haina", "Yaguate"],
    "Puerto Plata": ["Puerto Plata", "Sosúa", "Cabarete", "Imbert", "Luperón"],
    "Duarte": ["San Francisco de Macorís", "Nagua", "Castillo", "Villa Riva"],
    "San Pedro de Macorís": ["San Pedro de Macorís", "Los Llanos", "Ramón Santana"],
    "La Romana": ["La Romana", "Villa Hermosa", "Guaymate"],
    "Espaillat": ["Moca", "Gaspar Hernández", "San Víctor"],
    "Peravia": ["Baní", "Nizao", "Paya"],
    "Azua": ["Azua de Compostela", "Padre Las Casas", "Las Charcas"]
  };

  const TIPOS = ["Colmado", "Mini Market", "Almacén", "Ventorrillo", "Centro de belleza", "Barbería",
    "Centro de tatuajes", "Consultorio", "Otros servicios"];
  const TAMANOS = ["1 a 3 personas", "4 a 10 personas", "11 personas o más"];
  const ICONOS = {
    tipo: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16v11H4z"/><path d="M3 9l1.6-4.2A2 2 0 0 1 6.5 3.5h11a2 2 0 0 1 1.9 1.3L21 9"/><path d="M9 20v-6h6v6"/></svg>',
    ubi: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    neg: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v10H4z"/><path d="M3 10l1.5-4.5h15L21 10"/><path d="M8 20v-5h8v5"/><path d="M9 13h6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  const CSS = `
  .ob{position:fixed;inset:0;z-index:200;background:#fff;display:flex;flex-direction:column;align-items:center;
      padding:calc(env(safe-area-inset-top) + 26px) 18px 26px;overflow-y:auto;
      background:linear-gradient(180deg,#EAF5EE 0%,#F7FAF8 34%,#FFFFFF 62%)}
  .ob-logo{width:86px;height:86px;border-radius:50%;background:#fff;display:grid;place-items:center;
      box-shadow:0 8px 26px #0b8f5f1f;margin:8px 0 18px}
  .ob-logo img{width:56px;height:56px;object-fit:contain}
  .ob h1{font-size:31px;line-height:1.15;color:#10231A;letter-spacing:-.6px;text-align:center;margin:0 0 10px;font-weight:800}
  .ob-sub{color:#6B7A72;font-size:17px;line-height:1.35;text-align:center;max-width:420px;margin:0 0 26px}
  .ob-bars{display:flex;gap:10px;width:100%;max-width:520px;margin-bottom:22px}
  .ob-bars i{flex:1;height:7px;border-radius:99px;background:#E2E8E4;transition:background .25s}
  .ob-bars i.on{background:#0B8F5F}
  .ob-card{width:100%;max-width:520px;background:#fff;border-radius:28px;padding:22px 20px 20px;
      box-shadow:0 18px 46px #10231a14,0 2px 6px #10231a08;border:1px solid #EFF3F0}
  .ob-h{display:flex;align-items:center;gap:14px;margin-bottom:22px}
  .ob-hi{width:58px;height:58px;border-radius:18px;background:#E7F4EC;color:#0B8F5F;display:grid;place-items:center;flex:none}
  .ob-ht b{display:block;font-size:21px;color:#10231A;letter-spacing:-.3px;margin-bottom:2px}
  .ob-ht span{display:block;font-size:15px;color:#74827B}
  .ob-lbl{display:block;font-size:15.5px;font-weight:800;color:#2C3B34;margin:18px 0 10px}
  .ob-lbl:first-of-type{margin-top:0}
  .ob-opt{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ob-opt.one{grid-template-columns:1fr}
  .ob-b{border:1.6px solid #E1E7E3;background:#fff;border-radius:999px;height:64px;font-size:17px;font-weight:700;
      color:#31423A;display:flex;align-items:center;justify-content:center;transition:all .16s;padding:0 12px}
  .ob-b:active{transform:scale(.985)}
  .ob-b.on{border-color:#0B8F5F;background:#EDF8F2;color:#08603F;box-shadow:0 0 0 3px #0b8f5f1a}
  .ob-in,.ob-sel{width:100%;height:62px;border:1.6px solid #E9EEEA;background:#F4F7F5;border-radius:17px;
      padding:0 18px;font-size:17px;color:#1B2A23;outline:none;font-family:inherit;-webkit-appearance:none;appearance:none}
  .ob-sel{background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2374827B' stroke-width='2.2' stroke-linecap='round'><path d='M3 6l5 5 5-5'/></svg>");
      background-repeat:no-repeat;background-position:right 18px center}
  .ob-in:focus,.ob-sel:focus{border-color:#0B8F5F;background:#fff;box-shadow:0 0 0 4px #0b8f5f14}
  .ob-f{display:flex;gap:12px;margin-top:26px}
  .ob-atras{flex:0 0 auto;min-width:120px;height:62px;border-radius:999px;border:1.6px solid #E3E9E5;background:#fff;
      font-size:17.5px;font-weight:800;color:#2C3B34;display:grid;place-items:center}
  .ob-next{flex:1;height:62px;border-radius:999px;border:0;background:#0B8F5F;color:#fff;font-size:18px;font-weight:800;
      display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity .2s,transform .12s}
  .ob-next:disabled{background:#9FD9C1;opacity:1}
  .ob-next:active:not(:disabled){transform:scale(.985)}
  .ob-solo{width:100%;max-width:520px;margin-top:16px;font-size:14.5px;color:#7C8A83;text-align:center}
  @media (max-width:420px){.ob h1{font-size:27px}.ob-sub{font-size:15.5px}.ob-card{padding:18px 16px 16px}
    .ob-b{height:58px;font-size:16px}.ob-atras{min-width:104px;height:58px;font-size:16px}.ob-next{height:58px;font-size:17px}}
  `;

  let paso = 1;
  let datos = { tipo: "", tamano: "", provincia: "", municipio: "", negocio: "", whatsapp: "", direccion: "" };
  let nodo = null;

  function chapa() {
    if (document.getElementById("obCSS")) return;
    const st = document.createElement("style");
    st.id = "obCSS"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  function barra() {
    return `<div class="ob-bars">${[1, 2, 3].map((n) => `<i class="${n <= paso ? "on" : ""}"></i>`).join("")}</div>`;
  }

  function cab(titulo, sub, icono) {
    return `<div class="ob-h"><div class="ob-hi">${icono}</div>
      <div class="ob-ht"><b>Paso ${paso} · ${titulo}</b><span>${sub}</span></div></div>`;
  }

  function paso1() {
    return `
      ${cab("Tipo de negocio", "Cuéntanos sobre tu comercio", ICONOS.tipo)}
      <span class="ob-lbl">Tipo de negocio</span>
      <label class="ob-sel"><select id="obTipo" aria-label="Tipo de negocio">
        <option value="">Seleccionar categoría...</option>
        ${TIPOS.map((t) => `<option value="${esc(t)}" ${datos.tipo === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
      </select></label>
      <span class="ob-lbl">Tamaño del negocio</span>
      <div class="ob-opt one">${TAMANOS.map((t) => `<button type="button" class="ob-b ${datos.tamano === t ? "on" : ""}" data-tam="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <div class="ob-f"><button type="button" class="ob-next" id="obNext" ${datos.tipo && datos.tamano ? "" : "disabled"}>Siguiente ${ICONOS.arrow}</button></div>`;
  }

  function paso2() {
    const munis = MUNIS[datos.provincia] || [];
    return `
      ${cab("Ubicación", "Personaliza tu catálogo según tu zona", ICONOS.ubi)}
      <span class="ob-lbl">Ciudad / Provincia</span>
      <select class="ob-sel" id="obProv">
        <option value="">Seleccionar provincia...</option>
        ${PROVINCIAS.map((p) => `<option ${datos.provincia === p ? "selected" : ""}>${esc(p)}</option>`).join("")}
      </select>
      <span class="ob-lbl">Municipio</span>
      ${munis.length
        ? `<select class="ob-sel" id="obMuni"><option value="">Seleccionar municipio...</option>${munis.map((m) => `<option ${datos.municipio === m ? "selected" : ""}>${esc(m)}</option>`).join("")}</select>`
        : `<input class="ob-in" id="obMuni" placeholder="Seleccionar municipio..." value="${esc(datos.municipio)}" autocomplete="off">`}
      <div class="ob-f">
        <button type="button" class="ob-atras" id="obBack">Atrás</button>
        <button type="button" class="ob-next" id="obNext" ${datos.provincia ? "" : "disabled"}>Siguiente ${ICONOS.arrow}</button>
      </div>`;
  }

  function paso3() {
    const listo = datos.negocio.trim() && datos.whatsapp.trim();
    return `
      ${cab("Datos del negocio", "Aparecerá en facturas y pedidos", ICONOS.neg)}
      <span class="ob-lbl">Nombre del negocio *</span>
      <input class="ob-in" id="obNom" placeholder="Ej: Colmado La Esquina" value="${esc(datos.negocio)}" autocomplete="off">
      <span class="ob-lbl">Número de WhatsApp *</span>
      <input class="ob-in" id="obWa" placeholder="809-000-0000" inputmode="tel" value="${esc(datos.whatsapp)}" autocomplete="off">
      <span class="ob-lbl">Dirección del negocio</span>
      <input class="ob-in" id="obDir" placeholder="Ej: Calle Duarte #12, La Fe" value="${esc(datos.direccion)}" autocomplete="off">
      <div class="ob-f">
        <button type="button" class="ob-atras" id="obBack">Atrás</button>
        <button type="button" class="ob-next" id="obFin" ${listo ? "" : "disabled"}>${ICONOS.ok} Finalizar</button>
      </div>`;
  }

  function pintar() {
    chapa();
    if (!nodo) {
      nodo = document.createElement("div");
      nodo.className = "ob";
      nodo.id = "obWizard";
      document.body.appendChild(nodo);
    }
    nodo.innerHTML = `
      <div class="ob-logo"><img src="img/logo-96.png" alt="PediPOS"></div>
      <h1>Configura tu negocio</h1>
      <p class="ob-sub">Solo toma un minuto. Después podrás editar todo desde Ajustes.</p>
      ${barra()}
      <div class="ob-card">${paso === 1 ? paso1() : paso === 2 ? paso2() : paso3()}</div>
      <p class="ob-solo">Puedes cambiar esto cuando quieras en Ajustes.</p>`;
    conectar();
  }

  function conectar() {
    const selTipo = nodo.querySelector("#obTipo");
    if (selTipo) selTipo.onchange = () => {
      datos.tipo = selTipo.value;
      const nb = nodo.querySelector("#obNext");
      if (nb) nb.disabled = !(datos.tipo && datos.tamano);
    };
    nodo.querySelectorAll("[data-tam]").forEach((b) => b.onclick = () => { datos.tamano = b.dataset.tam; pintar(); });

    const prov = nodo.querySelector("#obProv");
    if (prov) prov.onchange = () => { datos.provincia = prov.value; datos.municipio = ""; pintar(); };
    const muni = nodo.querySelector("#obMuni");
    if (muni) {
      const ev = muni.tagName === "SELECT" ? "onchange" : "oninput";
      muni[ev] = () => { datos.municipio = muni.value; };
    }

    const nom = nodo.querySelector("#obNom"), wa = nodo.querySelector("#obWa"), dir = nodo.querySelector("#obDir");
    const refresca = () => {
      datos.negocio = nom.value; datos.whatsapp = wa.value; datos.direccion = dir.value;
      const fin = nodo.querySelector("#obFin");
      if (fin) fin.disabled = !(datos.negocio.trim() && datos.whatsapp.trim());
    };
    if (nom) { nom.oninput = refresca; wa.oninput = refresca; dir.oninput = refresca; }

    const next = nodo.querySelector("#obNext");
    if (next) next.onclick = () => { paso = Math.min(3, paso + 1); pintar(); };
    const back = nodo.querySelector("#obBack");
    if (back) back.onclick = () => { paso = Math.max(1, paso - 1); pintar(); };
    const fin = nodo.querySelector("#obFin");
    if (fin) fin.onclick = guardar;
  }

  function guardar() {
    const d = db();
    d.settings = Object.assign({}, d.settings, {
      negocio: datos.negocio.trim() || "Mi negocio",
      telefono: datos.whatsapp.trim(),
      direccion: datos.direccion.trim(),
      tipo_negocio: datos.tipo,
      tamano_negocio: datos.tamano,
      provincia: datos.provincia,
      municipio: datos.municipio,
      onboarded: true,
      onboarded_at: new Date().toISOString()
    });
    S.save();
    try { if (window.PPSync && window.PPSync.push) window.PPSync.push(); } catch (_) {}
    cerrar(true);
  }

  function cerrar(hecho) {
    if (nodo) { nodo.remove(); nodo = null; }
    if (hecho) {
      try { if (window.PPUI && window.PPUI.toast) window.PPUI.toast("Listo, " + (db().settings.negocio || "tu negocio") + " configurado"); } catch (_) {}
      /* repinta la pantalla actual con los datos nuevos */
      try { window.dispatchEvent(new CustomEvent("pp:onboarded")); } catch (_) {}
      /* recarga una sola vez para que toda la app tome el negocio nuevo */
      if (!sessionStorage.getItem("pp:obReload")) {
        sessionStorage.setItem("pp:obReload", "1");
        setTimeout(() => location.reload(), 260);
      }
    }
    paso = 1;
  }

  function necesita() {
    const s = (db().settings || {});
    return !s.onboarded;
  }

  function abrir(forzar) {
    datos = { tipo: "", tamano: "", provincia: "", municipio: "", negocio: "", whatsapp: "", direccion: "" };
    const s = db().settings || {};
    if (forzar) {
      datos = {
        tipo: s.tipo_negocio || "", tamano: s.tamano_negocio || "",
        provincia: s.provincia || "", municipio: s.municipio || "",
        negocio: s.negocio && s.negocio !== "Mi negocio" ? s.negocio : "",
        whatsapp: s.telefono || "", direccion: s.direccion || ""
      };
    }
    paso = 1;
    pintar();
  }

  window.PPOnboarding = { abrir, cerrar, necesita };
  window.PPOnboarding.geo = { PROVINCIAS, MUNIS, TIPOS, TAMANOS };

  /* arranque: si es la primera vez, se abre solo */
  function auto() {
    try {
      if (necesita() && !document.getElementById("obWizard")) abrir(false);
    } catch (_) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(auto, 700));
  else setTimeout(auto, 700);
  /* por si la app termina de cargar despues */
  setTimeout(auto, 1800);
})();
