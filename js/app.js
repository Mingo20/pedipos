/* PediPOS: interfaz. Lee siempre del espejo local; la red solo sincroniza. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const S = window.PPStore, db = () => S.db;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "RD$" + Math.round(Number(n) || 0).toLocaleString("es-DO");
  const money2 = (n) => "RD$" + (Number(n) || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (n) => (Math.round(n * 100) / 100).toString();

  /* Las ventas pueden venir con las lineas como lista o como texto JSON (al bajar de la nube). */
  function lineasDe(s) {
    let L = s && s.lineas;
    if (typeof L === "string") { try { L = JSON.parse(L); } catch (_) { L = []; } }
    return Array.isArray(L) ? L : [];
  }

  const I = {
    menu: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h11M4 17h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    list: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    pausa: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.500"/><rect x="14" y="5" width="4" height="14" rx="1.500"/></svg>',
    seguir: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5.500v13a1 1 0 0 0 1.500.860l10.500-6.500a1 1 0 0 0 0-1.720L9.500 4.640A1 1 0 0 0 8 5.500z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    trashAnim: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 7.5l.85 11.6A2 2 0 0 0 9.34 21h5.32a2 2 0 0 0 1.99-1.9l.85-11.6"/><g class="tapa"><path d="M4.4 7.2h15.2"/><path d="M9.4 7.2V4.9h5.2v2.3"/></g></svg>',
    lockAnim: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.6" width="14" height="9.4" rx="2.6"/><path class="arco" d="M8.2 10.6V7.9a3.8 3.8 0 0 1 7.6 0v2.7"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8.5 6.5 12 3l3.5 3.5"/><path d="M6 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"/></svg>',
    sendarrow: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    xDown: '<svg class="chev-down" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    box: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>',
    compass: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.6 13.6 8.5 15.5 10.4 10.4z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="3"/></svg>',
    filtro: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    down: '<svg class="chev" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6"/></svg>',
    bike: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l4-8h5l3 8M10 9l-1-3h3"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5C5 4 8.500 4 12 6c3.500-2 7-2 10-.5V19c-3-1.500-6.500-1.500-10.500.500C8.500 17.500 5 17.500 2 19V5.500zM12 6v13.500"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 21V10M12 21V3M19 21v-7"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    help: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 1-1 1.700M12 17h.01"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2.100h5c0-.9.400-1.600 1-2.100A6 6 0 0 0 12 3z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.500"/><circle cx="18" cy="20" r="1.500"/><path d="M2 3h3l2.500 12h11l2-8H6"/></svg>',
    users: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 4.500a3.500 3.500 0 0 1 0 7M18 14.500a6.500 6.500 0 0 1 3.500 5.500"/></svg>',
    cam: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h3l2-2h8l2 2h3v11H3z"/><circle cx="12" cy="13" r="3.2"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.6" cy="10" r="1.7"/><path d="M3.5 17.5l4.6-4.2a2 2 0 0 1 2.7 0l2.2 2 2.1-1.9a2 2 0 0 1 2.7 0l2.7 2.4"/></svg>',
    card: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="M3 10h18"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7"/><circle cx="6.500" cy="18" r="1.800"/><circle cx="16.500" cy="18" r="1.800"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/></svg>',
    print: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    truck2: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h12v9H2zM14 10h4l3 3v3h-7"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>',
    group: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.2A5 5 0 0 1 21.5 20"/></svg>',
    bagnav: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    userplus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="8" r="3.5"/><path d="M3 20a7 7 0 0 1 14 0M19 8v6M16 11h6"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>',
    order: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.5" cy="13.5" r="1.2"/></svg>',
    tag: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.500" cy="8.500" r="1.200"/></svg>',
  };

  /* ---------- Estado de interfaz ---------- */
  let tab = "panel";
  let voice = { phase: "idle", text: "" };
  const cart = () => db().cart;

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
  }
  const rate = () => db().settings.itbisRate;
  const tot = () => S.totals(cart(), rate());

  /* ---------- Confirmacion tactil: sonido corto + vibracion ---------- */
  let AC = null;
  function beep() {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const t = AC.currentTime;
      /* dos notas cortas y suaves: se percibe como una confirmacion agradable */
      [{ f: 987.77, d: 0.09, v: 0.13 }, { f: 1318.51, d: 0.13, v: 0.10 }].reduce((st, n) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(n.f, st);
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(n.v, st + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, st + n.d);
        o.connect(g); g.connect(AC.destination);
        o.start(st); o.stop(st + n.d + 0.02);
        return st + n.d * 0.85;
      }, t);
    } catch (_) {}
  }
  function vibrar(ms) { try { navigator.vibrate && navigator.vibrate(ms || 14); } catch (_) {} }
  function tap() { beep(); vibrar(14); }
  /* confirmacion con vibracion fuerte al agregar al talonario */
  function tapFuerte() { beep(); try { navigator.vibrate && navigator.vibrate([55, 40, 90]); } catch (_) {} }

  /* ---------- Boton flotante (vive fuera del area con scroll: queda fijo) ---------- */
  function setFab(icon, onclick, label) {
    const f = $("#float"); if (!f) return;
    f.innerHTML = `<button class="fab" id="fabMain" aria-label="${label || ""}">${icon}</button>`;
    $("#fabMain").onclick = onclick;
  }
  function clearFab() { const f = $("#float"); if (f) f.innerHTML = ""; }

  /* ---------- Contacto por WhatsApp ---------- */
  function waLink(tel, txt) {
    const d = String(tel || "").replace(/\D/g, "");
    if (!d) return null;
    const num = d.length === 10 ? "1" + d : d;   /* RD: 809... se antepone el 1 */
    return "https://wa.me/" + num + (txt ? "?text=" + encodeURIComponent(txt) : "");
  }
  function chatear(tel, txt) {
    const u = waLink(tel, txt);
    if (!u) return toast("Ese contacto no tiene WhatsApp registrado");
    window.open(u, "_blank");
  }

  /* ---------- Tarjeta de producto (catalogo y agregar producto) ---------- */
  function fotoDe(p) {
    if (p && p.img) return `<img src="${esc(p.img)}" alt="">`;
    return I.box;   /* sin foto: icono de caja */
  }
  function pcard(p, extra) {
    return `<button class="pcard" data-p="${esc(p.pid)}" ${extra || ""}>
      <span class="ph">${fotoDe(p)}</span>
      <b class="nm">${esc(p.nombre)}</b>
      <span class="prow"><span class="pr">${money(p.precio)}</span><span class="un">${esc(p.unidad || "unidad")}</span></span>
    </button>`;
  }

  /* ---------- Dock ---------- */
  const TABS = [["clientes", "Clientes", "group"], ["proveedores", "Proveedor", "truck2"], ["panel", "Talonario", "ticket"], ["historial", "Pedidos", "bagnav"], ["catalogo", "Catalogo", "box"]];
  function drawDock() {
    const d = $("#dock");
    /* el panel de venta tiene su propia barra inferior: ahi el dock no aparece */
    if (tab === "panel") { d.classList.add("hide"); d.innerHTML = ""; document.body.classList.remove("has-dock"); return; }
    d.classList.remove("hide");
    document.body.classList.add("has-dock");
    d.innerHTML = TABS.map(([k, lb, ic]) => k === "panel"
      ? `<button data-t="${k}" class="mid ${tab === k ? "on" : ""}" aria-label="${lb}"><span class="orb">${I[ic]}</span></button>`
      : `<button data-t="${k}" class="${tab === k ? "on" : ""}" aria-label="${lb}">${I[ic]}<small>${lb}</small></button>`).join("");
    $$("#dock button").forEach((b) => (b.onclick = () => {
      /* el icono central abre el panel de venta con una animacion breve */
      if (b.dataset.t === "panel" && window.animarTal) {
        if (tab === "panel") { tap(); return; }
        window.animarTal({ ms: 1000, titulo: "Panel de venta", texto: "Abriendo el talonario...", abrir: () => go("panel") });
        return;
      }
      go(b.dataset.t);
    }));
  }
  const TITULOS = { panel: "PANEL", catalogo: "CATALOGO", soporte: "SOPORTE", analitica: "ANALITICA", historial: "PEDIDOS", config: "CONFIGURACION", clientes: "CLIENTES", proveedores: "PROVEEDORES" };
  /* ----- Avisos de pagos a credito ----- */
  const DIAS = 86400000;
  function avisosPago() {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const out = [];
    for (const s of db().sales || []) {
      if (s.metodo !== "credito" || s.pagada || !s.fecha_pago) continue;
      const f = new Date(String(s.fecha_pago) + "T00:00:00");
      if (isNaN(f)) continue;
      const dias = Math.round((f - hoy) / DIAS);
      if (dias > 2) continue;
      out.push({ clave: s.vid + ":" + (dias <= 0 ? "v" : "p"), tipo: dias <= 0 ? "vencido" : "proximo", dias, s });
    }
    return out.sort((a, b) => a.dias - b.dias);
  }
  /* Burbuja roja con el numero de avisos SIN LEER; desaparece al tocar la campana. */
  function sinLeer() {
    const leidos = ((db().avisos = db().avisos || { vistos: [] }).leidos = db().avisos.leidos || []);
    return avisosPago().filter((a) => !leidos.includes(a.clave));
  }
  function pintarBurbuja() {
    const dot = $("#bellDot");
    if (!dot) return;
    const n = sinLeer().length;
    dot.hidden = !n;
    dot.textContent = n > 9 ? "9+" : String(n || "");
    if (n) { dot.classList.remove("pop"); void dot.offsetWidth; dot.classList.add("pop"); }
  }
  function marcarLeidos() {
    const a = (db().avisos = db().avisos || { vistos: [] });
    a.leidos = a.leidos || [];
    for (const x of avisosPago()) if (!a.leidos.includes(x.clave)) a.leidos.push(x.clave);
    S.save(); pintarBurbuja();
  }
  /* suena y vibra solo cuando aparece un aviso nuevo */
  function revisarAvisos() {
    const av = avisosPago();
    const vista = (db().avisos = db().avisos || { vistos: [] });
    const nuevos = av.filter((a) => !vista.vistos.includes(a.clave));
    pintarBurbuja();
    if (!nuevos.length) return;
    for (const a of nuevos) vista.vistos.push(a.clave);
    S.save();
    /* aviso sonoro y vibracion de notificacion */
    try { beep(); setTimeout(() => beep(), 240); } catch (_) {}
    try { navigator.vibrate && navigator.vibrate([120, 70, 120, 70, 220]); } catch (_) {}
    toast(nuevos.length === 1
      ? (nuevos[0].tipo === "vencido" ? "Tienes un pago vencido" : "Un pago vence en 2 dias")
      : nuevos.length + " avisos de pago");
  }
  function renderAvisos() {
    const av = avisosPago();
    const fila = (a) => {
      const s = a.s;
      const nombre = s.cliente || "Sin cliente";
      const fecha = new Date(String(s.fecha_pago) + "T00:00:00");
      const cuando = a.tipo === "vencido"
        ? (a.dias === 0 ? "Vence hoy" : "Vencido hace " + Math.abs(a.dias) + " dia" + (Math.abs(a.dias) === 1 ? "" : "s"))
        : (a.dias === 1 ? "Falta 1 dia" : "Faltan " + a.dias + " dias");
      return `<button class="aviso ${a.tipo}" data-v="${esc(s.vid)}">
        <span class="av-ic">${a.tipo === "vencido" ? I.clock : I.card}</span>
        <span class="av-tx"><b>${a.tipo === "vencido" ? "Pago vencido" : "Pago proximo a vencer"}</b>
          <span>${esc(nombre)} &middot; ${money(s.total)}</span>
          <span>${fecha.toLocaleDateString("es-DO")} &middot; ${cuando}</span></span>
        <span class="av-go">${I.chev}</span>
      </button>`;
    };
    $("#view").innerHTML = `<div class="av-h"><b>Notificaciones</b><span>${av.length ? av.length + " aviso" + (av.length === 1 ? "" : "s") + " de pago" : "Sin avisos por ahora"}</span></div>
      ${av.length ? av.map(fila).join("") : '<div class="card"><div class="cnt" style="text-align:center;padding:26px 10px">No hay pagos proximos a vencer ni vencidos.</div></div>'}`;
    $$(".aviso", $("#view")).forEach((b) => (b.onclick = () => {
      const s = (db().sales || []).find((x) => x.vid === b.dataset.v);
      if (s) openDetalle(s);
    }));
  }

  function go(t) {
    const cambio = t !== tab;
    tab = t;
    $("#title").textContent = "PediPOS";   /* el encabezado ya no cambia con la pantalla */
    drawDock(); render(); $("#view").scrollTop = 0;
    if (cambio) {
      const v = $("#view"); v.classList.remove("vin"); void v.offsetWidth; v.classList.add("vin");
      /* la clase se quita al terminar: si no, cada redibujo reiniciaba la animacion (el "pestaneo") */
      clearTimeout(v._vt); v._vt = setTimeout(() => v.classList.remove("vin"), 420);
    }
  }

  /* ---------- Panel ---------- */
  let manual = false;
  function manualRow() {
    return `<div class="row man" id="mrow"><input class="nm" id="mnm" placeholder="Producto" autocomplete="off" enterkeyhint="next"><input id="mq" inputmode="decimal" placeholder="Cant." value="1" enterkeyhint="next"><input id="mp" inputmode="decimal" placeholder="Precio" enterkeyhint="done"><span class="t" id="mt">RD$0</span></div>`;
  }
  /* La seccion manual tambien se elimina deslizandola a la izquierda, igual que un producto. */
  function bindSwipeManual() {
    const row = $("#mrow");
    if (!row) return;
    let x0 = 0, y0 = 0, dx = 0, activo = false, vertical = false;
    row.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; activo = true; vertical = false;
      row.classList.add("drag");
    }, { passive: true });
    row.addEventListener("touchmove", (e) => {
      if (!activo) return;
      const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (!vertical && Math.abs(my) > Math.abs(mx) && Math.abs(my) > 12) {
        vertical = true; activo = false; row.classList.remove("drag");
        row.style.transform = ""; row.style.opacity = ""; return;
      }
      if (vertical) return;
      dx = Math.min(0, mx);
      if (dx > 0) { row.style.transform = ""; row.style.opacity = ""; return; }
      row.style.transform = `translateX(${dx}px)`;
      row.style.opacity = String(Math.max(0.3, 1 + dx / 220));
    }, { passive: true });
    const soltar = () => {
      if (!activo) return;
      activo = false; row.classList.remove("drag");
      if (dx < -70) {
        row.style.transition = "transform .18s ease, opacity .18s ease";
        row.style.transform = "translateX(-110%)"; row.style.opacity = "0";
        vibrar(26);
        setTimeout(() => { manual = false; render(); }, 190);
      } else { row.style.transform = ""; row.style.opacity = ""; }
      dx = 0;
    };
    row.addEventListener("touchend", soltar); row.addEventListener("touchcancel", soltar);
    /* con raton tambien se puede quitar */
    row.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "INPUT") return;
      inicio: { x0 = e.clientX; dx = 0; activo = true; }
    });
    row.addEventListener("mousemove", (e) => { if (!activo) return; dx = Math.min(0, e.clientX - x0); if (dx < 0) row.style.transform = `translateX(${dx}px)`; });
    row.addEventListener("mouseup", () => { if (!activo) return; activo = false; if (dx < -70) { manual = false; render(); } else row.style.transform = ""; });
  }

  /* Guarda el producto escrito a mano: entra al talonario y, si no existe, al catalogo como disponible. */
  function commitManual() {
    const nom = ($("#mnm").value || "").trim();
    const q = parseFloat(String($("#mq").value).replace(",", ".")) || 0;
    const p = parseFloat(String($("#mp").value).replace(",", ".")) || 0;
    if (!nom && !($("#mp").value || "").trim()) { manual = false; render(); return; }
    if (!nom) { toast("Escribe el nombre del producto"); $("#mnm").focus(); return; }
    if (!(q > 0)) { toast("Pon la cantidad"); $("#mq").focus(); return; }
    if (!(p >= 0) || !(($("#mp").value || "").trim())) { toast("Pon el precio"); $("#mp").focus(); return; }
    const key = window.PPVoice.norm(nom);
    let prod = db().products.find((x) => window.PPVoice.norm(x.nombre) === key);
    if (!prod) {
      /* sin stock declarado: no se descuenta inventario en la venta */
      prod = { pid: S.uid("P"), nombre: nom, precio: p, unidad: "unidad", categoria: "General", itbis: true, activo: true, manual: true };
      db().products.push(prod); window.PPSync.saveProduct(prod);
    } else if (prod.activo === false) { prod.activo = true; window.PPSync.saveProduct(prod); }
    /* el precio escrito manda en esta venta, sin alterar el precio guardado del catalogo */
    const ex = cart().lines.find((l) => l.pid === prod.pid && l.precio === p);
    if (ex) ex.cant = S.round2(ex.cant + q);
    else cart().lines.push({ pid: prod.pid, nombre: prod.nombre, precio: p, unidad: prod.unidad, cant: q });
    manual = false; S.save(); render();
    toast(prod.manual && !ex ? nom + " agregado al catalogo" : nom + " agregado");
  }
  function bindManual() {
    const f = ["#mnm", "#mq", "#mp"].map((s) => $(s));
    const upd = () => { const q = parseFloat(String(f[1].value).replace(",", ".")) || 0, p = parseFloat(String(f[2].value).replace(",", ".")) || 0; $("#mt").textContent = money(q * p); };
    /* si el nombre escrito ya existe en el catalogo, se toma su precio y su unidad:
       asi no se crean productos duplicados ni se escribe el precio dos veces */
    const buscar = (texto) => {
      const t = window.PPVoice.norm(texto);
      if (!t) return null;
      const prods = (db().products || []).filter((p) => p.activo !== false);
      const exacto = prods.find((p) => window.PPVoice.norm(p.nombre) === t);
      if (exacto) return exacto;
      if (t.length < 3) return null;
      const empieza = prods.filter((p) => window.PPVoice.norm(p.nombre).startsWith(t));
      return empieza.length === 1 ? empieza[0] : null;
    };
    const sugerir = () => {
      const p = buscar(f[0].value || "");
      const et = $("#mnm").parentElement && $("#mnm").parentElement.querySelector(".auto-p");
      if (!p) { if (et) et.remove(); return; }
      const precio = String(Number(p.precio) || 0);
      const yaTiene = ($("#mp").value || "").trim();
      if (!yaTiene || yaTiene !== precio) { $("#mp").value = precio; upd(); }
      if (!et) {
        const s = document.createElement("span");
        s.className = "auto-p";
        s.textContent = "Precio del catalogo";
        f[0].parentElement && f[0].parentElement.appendChild(s);
      }
    };
    f[0].addEventListener("input", sugerir);
    /* al salir del nombre se confirma la coincidencia */
    f[0].addEventListener("blur", () => setTimeout(() => {
      const p = buscar(f[0].value || "");
      if (p && !($("#mp").value || "").trim()) { $("#mp").value = String(Number(p.precio) || 0); upd(); }
    }, 120));
    f.forEach((el, i) => {
      el.oninput = upd;
      el.onkeydown = (e) => { if (e.key !== "Enter") return; e.preventDefault(); if (i < 2) f[i + 1].focus(); else commitManual(); };
    });
    /* al salir de toda la fila se guarda solo (si hay datos) */
    $("#mrow").addEventListener("focusout", () => setTimeout(() => {
      if (!manual || !$("#mrow") || $("#mrow").contains(document.activeElement)) return;
      if (($("#mnm").value || "").trim() && ($("#mp").value || "").trim()) commitManual();
    }, 180));
    upd();
  }
  /* Barra de filtro: abre/cierra con animacion, gira el icono y se cierra al tocar fuera */
  function alternarFiltro(btn, pop) {
    const abrir = pop.hidden;
    $$(".filtro-pop:not([hidden]), .inv-filtro:not([hidden])").forEach((p) => { if (p !== pop) p.hidden = true; });
    $$(".fbtn.abierto, .inv-b.rnd.abierto").forEach((b) => { if (b !== btn) b.classList.remove("abierto"); });
    pop.hidden = !abrir;
    btn.classList.toggle("abierto", abrir);
    if (abrir) {
      const fuera = (ev) => {
        if (pop.contains(ev.target) || btn.contains(ev.target)) return;
        pop.hidden = true; btn.classList.remove("abierto");
        document.removeEventListener("pointerdown", fuera, true);
      };
      setTimeout(() => document.addEventListener("pointerdown", fuera, true), 0);
    }
  }
  window.PPUI_alternarFiltro = alternarFiltro;

  /* Dialogo de confirmacion propio (reemplaza al confirm() generico del navegador) */
  function confirmar(o, onOk) {
    const prev = document.getElementById("dlg"); prev && prev.remove();
    const d = document.createElement("div"); d.id = "dlg"; d.className = "dlg";
    d.innerHTML = `<div class="dlg-m"></div>
      <div class="dlg-c" role="alertdialog" aria-modal="true">
        <div class="dlg-i ${o.peligro ? "red" : ""}">${o.icono || I.help}</div>
        <h3>${esc(o.titulo)}</h3>
        <p>${esc(o.texto || "")}</p>
        <div class="dlg-b">
          <button class="dlg-no" id="dlgNo">${esc(o.cancelar || "Cancelar")}</button>
          <button class="dlg-ok ${o.peligro ? "red" : ""}" id="dlgOk">${esc(o.ok || "Aceptar")}</button>
        </div>
      </div>`;
    document.body.append(d);
    requestAnimationFrame(() => d.classList.add("on"));
    const cerrar = (cb) => { d.classList.remove("on"); setTimeout(() => { d.remove(); cb && cb(); }, 200); };
    $("#dlgNo", d).onclick = () => cerrar();
    $(".dlg-m", d).onclick = () => cerrar();
    $("#dlgOk", d).onclick = () => { vibrar(18); cerrar(onOk); };
  }
  const MAX_FILAS = 5;
  function lineRow(l, i) {
    return `<div class="row" data-i="${i}"><b>${esc(l.nombre)}</b><input class="q" data-i="${i}" inputmode="decimal" value="${num(l.cant)}" aria-label="Cantidad"><input class="p" data-i="${i}" inputmode="decimal" value="${num(l.precio)}" aria-label="Precio"><span class="t">${money(l.cant * l.precio)}</span></div>`;
  }

  /* Deslizar una fila del talonario a cualquier lado para eliminarla. */
  /* El talonario muestra exactamente 5 secciones; el resto se desliza. */
  function ajustarAltoTalonario() {
    const b = $("#tickb");
    if (!b) return;
    const f = b.querySelector(".row");
    if (!f) { b.style.maxHeight = ""; return; }
    const h = Math.ceil(f.getBoundingClientRect().height) || 52;
    b.style.maxHeight = (h * 5) + "px";
  }

  function bindSwipeRows() {
    $$("#tickb .row[data-i]").forEach((row) => {
      let x0 = 0, y0 = 0, dx = 0, activo = false, vertical = false;
      row.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; activo = true; vertical = false;
        row.classList.add("drag");
      }, { passive: true });
      row.addEventListener("touchmove", (e) => {
        if (!activo) return;
        const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
        if (!vertical && Math.abs(my) > Math.abs(mx) && Math.abs(my) > 12) { vertical = true; activo = false; row.classList.remove("drag"); row.style.transform = ""; row.style.opacity = ""; return; }
        if (vertical) return;
        /* solo cuenta el deslizamiento hacia la izquierda */
        dx = Math.min(0, mx);
        if (dx > 0) { row.style.transform = ""; row.style.opacity = ""; return; }
        row.style.transform = `translateX(${dx}px)`;
        row.style.opacity = String(Math.max(0.3, 1 + dx / 220));
      }, { passive: true });
      const soltar = () => {
        if (!activo) return;
        activo = false; row.classList.remove("drag");
        if (Math.abs(dx) > 8) row._swiped = Date.now();
        if (dx < -70) {
          /* deslizar a la izquierda elimina el producto de inmediato */
          const i = +row.dataset.i;
          row.style.transition = "transform .18s ease, opacity .18s ease, max-height .2s ease .08s";
          row.style.transform = "translateX(-110%)"; row.style.opacity = "0";
          vibrar(26);
          setTimeout(() => { if (cart().lines[i]) cart().lines.splice(i, 1); S.save(); render(); }, 200);
        } else { row.style.transform = ""; row.style.opacity = ""; }
        dx = 0;
      };
      /* tocar la fila tambien abre el editor */
      row.addEventListener("click", (e) => {
        if (e.target.tagName === "INPUT") return;
        if (row._swiped && Date.now() - row._swiped < 450) return;   /* el click fantasma tras deslizar no abre nada */
        abrirEditorFila(+row.dataset.i);
      });
      row.addEventListener("touchend", soltar);
      row.addEventListener("touchcancel", soltar);
    });
  }
  /* Editor compacto de una seccion del talonario. */
  function abrirEditorFila(i) {
    const l = cart().lines[i];
    if (!l) return;
    const s = sheet(`<div class="sh-h compacta"><h2>Editar nombre</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <label class="field"><span>Nombre del producto</span><input id="en" value="${esc(l.nombre)}" autocomplete="off"></label>
      <div class="sh-f solo"><button class="big" id="eok">${I.check} <span class="bl">Listo</span></button></div>`);
    $("#x", s).onclick = closeSheet;
    const en = $("#en", s);
    setTimeout(() => { en.focus(); en.select(); }, 240);
    const guardar = () => {
      const nom = en.value.trim();
      if (!nom) return toast("Escribe el nombre del producto");
      cart().lines[i].nombre = nom;
      S.save(); closeSheet(); render();
    };
    $("#eok", s).onclick = guardar;
    en.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); guardar(); } };
  }

  function renderPanel() {
    const c = cart(), t = tot(), n = c.lines.length;
    $("#view").innerHTML = `
      <section class="tick">
        <div class="tick-h"><span>PRODUCTO</span><span>CANTIDAD</span><span>PRECIO</span><span>TOTAL</span></div>
        <div class="tick-b" id="tickb">${n ? c.lines.map(lineRow).join("") : (manual ? "" : '<div class="tick-empty">Toca + para agregar productos</div>')}${manual ? manualRow() : ""}</div>
        <div class="tick-f">
          <div class="itbis-r"><span>ITBIS ${Math.round(rate() * 100)}%</span><button class="sw ${c.itbis ? "on" : ""}" id="swItbis" aria-label="ITBIS"></button></div>
          <div class="line"><span>Subtotal</span><span id="vSub">${money(t.subtotal)}</span></div>
          <div class="line it"><span>ITBIS (${Math.round(rate() * 100)}%)</span><span id="vIt">+${money(t.itbis)}</span></div>
          <div class="tot"><span>TOTAL A COBRAR</span><b id="vTot">${money(t.total)}</b></div>
        </div>
        <div class="tools">
          <button class="plus tl" id="bList" aria-label="Lista de pedido">${I.list}</button>
          <button class="plus" id="bPlus" aria-label="Agregar">${I.plus}</button>
          <button class="plus tl" id="bSearch" aria-label="Productos">${I.box}</button>
        </div>
      </section>
      <div class="act ${n ? "hay" : ""}" id="actbar">
        <button class="n ${n ? "on" : ""}" id="bNew">NUEVA</button>
        <button class="c" id="bPay" ${n ? "" : "disabled"}>COBRAR</button>
        <div class="mic ${voice.phase === "wait" ? "wait" : ""}" id="bMic"><i>${voice.phase === "wait" ? I.clock : I.bag}</i></div>
      </div>`;
    $("#bSearch").onclick = openSearch; $("#bList").onclick = () => openOrder("");
    $("#bPlus").onclick = () => {
      /* siempre se puede agregar a mano: el talonario muestra 5 y el resto se desliza */
      manual = true; render(); const f = $("#mnm"); f && f.focus();
    };
    if (manual) bindManual();
    $("#swItbis").onclick = () => {
      const a = tot();
      cart().itbis = !cart().itbis; S.save();
      const b = tot();
      const sw = $("#swItbis"); sw.classList.toggle("on", cart().itbis);
      cuenta("#vSub", a.subtotal, b.subtotal, false);
      cuenta("#vIt", a.itbis, b.itbis, true);
      cuenta("#vTot", a.total, b.total, false);
      tap();
    };
    $("#bNew").onclick = () => {
      const limpiar = () => { cart().lines = []; manual = false; S.save(); render(); };
      if (!cart().lines.length && !manual) return;
      if (!cart().lines.length) return limpiar();
      confirmar({ titulo: "Descartar venta actual", texto: "Se quitaran todos los productos del talonario. Esta accion no se puede deshacer.", ok: "Descartar", cancelar: "Cancelar", peligro: true, icono: I.trash }, limpiar);
    };
    $("#bPay").onclick = openPay;
    bindMicGestos();
    $$(".row .q").forEach((inp) => (inp.onchange = () => {
      const v = parseFloat(String(inp.value).replace(",", "."));
      const i = +inp.dataset.i;
      if (!(v > 0)) cart().lines.splice(i, 1); else cart().lines[i].cant = v;
      S.save(); render();
    }));
    /* el precio tambien se puede corregir en la misma fila */
    $$(".row .p").forEach((inp) => (inp.onchange = () => {
      const v = parseFloat(String(inp.value).replace(",", "."));
      const i = +inp.dataset.i;
      if (!(v >= 0)) { render(); return toast("Precio no valido"); }
      cart().lines[i].precio = v; S.save(); render();
    }));
    bindSwipeRows(); bindSwipeManual(); ajustarAltoTalonario();
    renderListen();
    bindAbrirInventario();
  }

  /* Deslizar desde el borde izquierdo abre la barra de inventario. */
  let abriendoInv = false;
  function bindAbrirInventario() {
    const v = $("#view");
    if (!v || abriendoInv) return;
    abriendoInv = true;
    let x0 = 0, y0 = 0, activo = false, borde = "";
    v.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      const w = window.innerWidth;
      borde = x0 < 26 ? "izq" : x0 > w - 26 ? "der" : "";
      activo = !!borde;
    }, { passive: true });
    v.addEventListener("touchmove", (e) => {
      if (!activo) return;
      const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
      if (Math.abs(dy) > Math.abs(dx)) { activo = false; return; }
      /* desde el borde izquierdo se abre arrastrando a la derecha; desde el derecho, a la izquierda */
      if ((borde === "izq" && dx > 66) || (borde === "der" && dx < -66)) { activo = false; openSearch(); }
    }, { passive: true });
    v.addEventListener("touchend", () => { activo = false; });
  }

  function addLine(p, cant) {
    const c = cart();
    const ex = c.lines.find((l) => l.pid === p.pid);
    if (ex) ex.cant = S.round2(ex.cant + cant);
    else c.lines.push({ pid: p.pid, nombre: p.nombre, precio: p.precio, unidad: p.unidad, cant });
    S.save();
  }

  /* ---------- Hojas ---------- */
  /* Icono segun el titulo de cada ventana (tambien aplica a las hojas de extra.js). */
  const ICONO_HOJA = [
    [/^agregar producto|^buscar|^inventario|^catalogo/i, "box"], [/^men/i, "compass"], [/^categor|^filtrar/i, "filtro"], [/lista de pedido/i, "list"], [/confirmar pedido/i, "check"],
    [/^cobrar/i, "wallet"], [/venta registrada/i, "ok"], [/detalle del pedido/i, "order"],
    [/nuevo cliente|editar cliente/i, "userplus"], [/abono/i, "wallet"], [/proveedor/i, "truck2"],
    [/crear producto|editar producto/i, "box"], [/entrar a la caja/i, "users"],
  ];
  function iconoDe(t) { for (const [re, k] of ICONO_HOJA) if (re.test(t)) return k; return null; }
  function decorar(s) {
    $$(".sh-h h2", s).forEach((h) => {
      if (h.querySelector(".hi")) return;
      const k = iconoDe(h.textContent.trim()) || (/^[A-Za-z]/.test(h.textContent) ? "home" : null);
      if (k && I[k]) h.insertAdjacentHTML("afterbegin", `<span class="hi">${I[k]}</span>`);
    });
    /* el boton cerrar de cualquier hoja usa el cierre animado */
    $$(".sh-x", s).forEach((b) => {
      if (/✕/.test(b.textContent) || b.id === "x") b.addEventListener("click", (e) => { e.stopImmediatePropagation(); closeSheet(); }, true);
    });
  }
  function sheet(html, onClose, opts) {
    closeSheet(true);
    const lado = opts && opts.lado;
    const m = document.createElement("div"); m.className = "mask"; m.id = "mask";
    const alto = opts && opts.alto;
    const s = document.createElement("section"); s.className = "sheet" + (lado ? " side" : "") + (alto ? " alto" : ""); s.id = "sheet";
    s.innerHTML = '<div class="grip"></div>' + html;
    $("#layer").append(m, s);
    decorar(s);
    if (lado) bindCerrarLado(s);
    else if (!alto) bindCerrarAbajo(s);
    const t0 = Date.now();
    /* el mismo toque que abre la hoja no debe cerrarla */
    m.onclick = () => { if (Date.now() - t0 < 320) return; closeSheet(); onClose && onClose(); };
    return s;
  }
  /* La barra lateral se oculta deslizandola hacia la derecha. */
  /* El panel de productos se cierra arrastrandolo hacia la derecha: sigue el dedo
     y, si no se completa, vuelve a su sitio con una curva suave. */
  /* El panel de productos se cierra arrastrandolo hacia la derecha desde cualquier
     punto: sigue el dedo, se atenua mientras sale y, si no se completa, vuelve. */
  function bindCerrarPanel(s) {
    let x0 = 0, y0 = 0, dx = 0, dy = 0;
    let activo = false, decidido = false, horizontal = false;
    const ancho = () => s.getBoundingClientRect().width || 360;

    s.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      const t = e.target;
      if (t && t.closest && t.closest("input,textarea")) { activo = false; return; }
      activo = true; decidido = false; horizontal = false;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; dy = 0;
    }, { passive: true });

    s.addEventListener("touchmove", (e) => {
      if (!activo) return;
      const t = e.touches[0];
      const mx = t.clientX - x0, my = t.clientY - y0;
      if (!decidido) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        decidido = true;
        horizontal = Math.abs(mx) > Math.abs(my) * 1.25 && mx > 0;
        if (!horizontal) { activo = false; return; }   /* es un scroll: se deja pasar */
      }
      if (!horizontal) return;
      e.preventDefault();
      dx = Math.max(0, mx);
      const k = dx < 140 ? dx : 140 + (dx - 140) * 0.45;
      s.style.transition = "none";
      s.classList.add("arrastrando");
      s.style.transform = "translateX(" + k + "px)";
      s.style.opacity = String(Math.max(0.4, 1 - k / (ancho() * 1.1)));
    }, { passive: false });

    const soltar = () => {
      if (!activo) { return; }
      activo = false;
      if (!horizontal) return;
      horizontal = false;
      s.classList.remove("arrastrando");
      if (dx > Math.min(150, ancho() * 0.26)) {
        s.style.transition = "transform .3s cubic-bezier(.4,0,.7,.3), opacity .26s ease";
        s.style.transform = "translateX(106%)";
        s.style.opacity = "0";
        setTimeout(() => closeSheet(), 260);
      } else {
        s.style.transition = "transform .34s cubic-bezier(.22,1,.3,1), opacity .22s ease";
        s.style.transform = ""; s.style.opacity = "";
      }
      dx = 0;
    };
    s.addEventListener("touchend", soltar);
    s.addEventListener("touchcancel", soltar);
  }

  function bindCerrarLado(s) {
    let x0 = 0, dx = 0, activo = false;
    s.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; dx = 0; activo = true;
      s.classList.add("arrastrando");
    }, { passive: true });
    s.addEventListener("touchmove", (e) => {
      if (!activo) return;
      dx = Math.max(0, e.touches[0].clientX - x0);
      s.style.transform = "translateX(" + dx + "px)";
    }, { passive: true });
    const soltar = () => {
      if (!activo) return;
      activo = false; s.classList.remove("arrastrando");
      if (dx > 62) { s.style.transform = ""; closeSheet(); }
      else { s.style.transform = ""; }
      dx = 0;
    };
    s.addEventListener("touchend", soltar);
    s.addEventListener("touchcancel", soltar);
  }

  /* Cerrar una hoja deslizandola hacia la derecha (solo gestos horizontales). */
  /* Cerrar la hoja deslizando hacia abajo: sigue el dedo y, al soltar, se decide
     si vuelve a su sitio o se cierra, con una curva suave. Se puede tomar desde
     el asa o desde cualquier parte de la hoja que no sea un campo o un boton. */
  function bindCerrarAbajo(s) {
    let y0 = 0, dy = 0, activo = false, ignorar = false, alto = 0;
    const esControl = (el) => !!(el && el.closest && el.closest("input,textarea,select,button,.fopt,.pcard,.ec-f,.dl,.aviso,img,a"));
    s.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      if (esControl(e.target)) { activo = false; ignorar = true; return; }
      ignorar = false; activo = true;
      y0 = e.touches[0].clientY; dy = 0;
      alto = s.getBoundingClientRect().height || 420;
    }, { passive: true });
    s.addEventListener("touchmove", (e) => {
      if (!activo || ignorar) return;
      const my = e.touches[0].clientY - y0;
      /* si sube por encima del punto inicial, la hoja vuelve sola a su sitio */
      if (my <= 0) { dy = 0; s.style.transform = ""; s.style.opacity = ""; return; }
      dy = my;
      const k = dy < 140 ? dy : 140 + (dy - 140) * 0.5;   /* resistencia suave */
      s.style.transition = "none";
      s.classList.add("arrastrando");
      s.style.transform = "translate(-50%," + k + "px)";
      s.style.opacity = String(Math.max(0.45, 1 - k / (alto * 1.15)));
    }, { passive: true });
    const soltar = () => {
      if (!activo || ignorar) { activo = false; return; }
      activo = false;
      s.classList.remove("arrastrando");
      /* solo se cierra si se arrastro casi hasta el final */
      if (dy > alto * 0.45) {
        s.style.transition = "transform .26s cubic-bezier(.4,0,.75,.35), opacity .22s ease";
        s.style.transform = "translate(-50%," + (alto + 40) + "px)";
        s.style.opacity = "0";
        const capa = $("#layer");
        setTimeout(() => { if (capa && $("#sheet") === s) capa.innerHTML = ""; }, 250);
      } else {
        s.style.transition = "transform .34s cubic-bezier(.22,1,.3,1), opacity .24s ease";
        s.style.transform = ""; s.style.opacity = "";
      }
      dy = 0;
    };
    s.addEventListener("touchend", soltar);
    s.addEventListener("touchcancel", soltar);
  }

  function bindCerrarDerecha(s, handle) {
    const zona = handle || s;
    let x0 = 0, y0 = 0, dx = 0, activo = false, vertical = false;
    zona.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; activo = true; vertical = false;
      s.classList.add("arrastrando");
    }, { passive: true });
    zona.addEventListener("touchmove", (e) => {
      if (!activo) return;
      const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (!vertical && Math.abs(my) > Math.abs(mx) && Math.abs(my) > 12) { vertical = true; activo = false; s.style.transform = ""; s.classList.remove("arrastrando"); return; }
      if (vertical) return;
      dx = Math.max(0, mx);
      s.style.transform = "translateX(" + dx + "px)";
    }, { passive: true });
    const soltar = () => {
      if (!activo) return;
      activo = false; s.classList.remove("arrastrando");
      s.style.transform = "";
      if (dx > 70) closeSheet();
      dx = 0;
    };
    zona.addEventListener("touchend", soltar);
    zona.addEventListener("touchcancel", soltar);
  }

  /* Cierre con desvanecimiento. closeSheet(true) cierra de golpe (cuando se reemplaza por otra hoja). */
  function closeSheet(ya) {
    const layer = $("#layer");
    if (ya === true || !layer.firstChild) { layer.innerHTML = ""; return; }
    const sh = $("#sheet"), mk = $("#mask");
    if (!sh || sh.classList.contains("out")) return;
    /* si viene de un arrastre, ya salio de la pantalla: no se vuelve a animar */
    if (sh.classList.contains("arrastrando") || (sh.style.transform || "").includes("-50%,")) {
      layer.innerHTML = ""; return;
    }
    sh.classList.add("out"); mk && mk.classList.add("out");
    /* solo se limpia si esa hoja sigue siendo la actual: asi una hoja nueva no desaparece */
    setTimeout(() => { if ($("#sheet") === sh) layer.innerHTML = ""; }, 230);
  }

  /* ----- Buscar producto: tarjetas en dos columnas ----- */
  /* ---------- Barra de inventario (pantalla completa) ---------- */
  let invCat = "";
  const invToque = new Map();   /* pid -> momento del ultimo toque (para subir los recientes) */
  let invRec = false;
  let invGrabando = false;

  function openSearch() {
    const s = sheet(`<div class="inv">
      <div class="inv-h">
        <div class="inv-tt"><span class="hi">${I.box}</span><h2>Productos</h2></div>
        <button class="inv-b rnd" id="x" aria-label="Cerrar">${I.chev}</button>
      </div>
      <div class="inv-c">
        <div class="invrow">
          <div class="search inv-search">
            ${I.search}<input id="q" placeholder="Buscar producto" autocomplete="off">
          </div>
          <button class="inv-b rnd" id="invFil" aria-label="Filtrar por categoria">${I.filtro}</button>
        </div>
        <div class="inv-filtro" id="invCatList" hidden></div>
      </div>
      <div class="inv-lista"><div class="pgrid" id="res"></div></div>

    </div>`, () => { window.PPVoice.stopDictation(); invRec = false; }, { alto: true });
    decorar(s);
    bindCerrarPanel(s);

    const q = $("#q", s), res = $("#res", s);
    const cats = () => [...new Set(db().products.map((p) => p.categoria).filter(Boolean))].sort();

    const enCarrito = (pid) => cart().lines.filter((l) => l.pid === pid).reduce((x, l) => x + l.cant, 0);

    /* lista ordenada: primero lo que esta en el talonario, lo mas reciente arriba */
    const ordenar = (list) => list.slice().sort((a, b) => {
      const ca = enCarrito(a.pid) > 0 ? 1 : 0, cb = enCarrito(b.pid) > 0 ? 1 : 0;
      if (ca !== cb) return cb - ca;
      if (ca && cb) return (invToque.get(b.pid) || 0) - (invToque.get(a.pid) || 0);
      return 0;
    });

    const filtrar = () => {
      const t = window.PPVoice.norm(q.value);
      return db().products.filter((p) => p.activo !== false
        && (!invCat || p.categoria === invCat)
        && (!t || window.PPVoice.norm(p.nombre).includes(t)));
    };

    const marcar = () => {
      $$(".pcard", res).forEach((el) => {
        const n = enCarrito(el.dataset.p);
        let b = el.querySelector(".cntb");
        if (n > 0) {
          if (!b) { b = document.createElement("i"); b.className = "cntb"; el.append(b); }
          b.textContent = num(n); el.classList.add("in");
        } else { if (b) b.remove(); el.classList.remove("in"); }
      });
    };

    const pintar = (animar) => {
      const antes = new Map();
      if (animar) $$(".pcard", res).forEach((el) => antes.set(el.dataset.p, el.getBoundingClientRect()));
      const list = ordenar(filtrar());
      res.innerHTML = list.length ? list.map((p) => pcard(p)).join("") : '<div class="empty">Sin productos con ese filtro.</div>';
      $$(".pcard", res).forEach((el) => (el.onclick = () => {
        const p = db().products.find((x) => x.pid === el.dataset.p);
        if (!p) return;
        addLine(p, 1);
        invToque.set(p.pid, Date.now());
        tapFuerte();
        el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit");
        render();
        pintar(true);   /* el producto sube solo hacia la parte superior */
      }));
      /* cada tarjeta viaja de su posicion anterior a la nueva */
      if (animar) $$(".pcard", res).forEach((el) => {
        const a = antes.get(el.dataset.p);
        if (!a) return;
        const b = el.getBoundingClientRect();
        const dx = a.left - b.left, dy = a.top - b.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px,${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform .38s cubic-bezier(.22,.9,.3,1)";
          el.style.transform = "";
        });
      });
      marcar();
    };

    /* filtro por categoria, dentro de la misma barra */
    const panel = $("#invCatList", s);
    const pintarCats = () => {
      panel.innerHTML = [["", "Todas las categorias"], ...cats().map((c) => [c, c])]
        .map(([v, t]) => `<button class="fopt ${invCat === v ? "on" : ""}" data-cat="${esc(v)}">${esc(t)} ${I.check}</button>`).join("");
      $$("[data-cat]", panel).forEach((b) => (b.onclick = () => {
        invCat = b.dataset.cat;
        $("#invFil", s).classList.toggle("on", !!invCat);
        panel.hidden = true; $("#invFil", s).classList.remove("abierto");
        pintar(false);
      }));
    };
    pintarCats();
    $("#invFil", s).classList.toggle("on", !!invCat);
    $("#invFil", s).onclick = () => alternarFiltro($("#invFil", s), panel);
    q.oninput = () => pintar(false);
    $("#x", s).onclick = () => closeSheet();
    pintar(false);



  }

  /* ---------- Bolsa por voz: se mantiene pulsada 0.5 s, se habla y al soltar se agrega ----------
     Soltar  -> procesa el pedido.
     Deslizar hacia arriba mientras se mantiene -> queda grabando a manos libres (se puede
     recorrer el catalogo). Un toque despues termina y agrega. */
  function bindBolsa(sheetEl, refrescar, ids) {
    ids = ids || {};
    const idFab = ids.fab || "bagFab", idInd = ids.ind || "bagInd", idTx = ids.tx || "bagIndTx";
    const fab = $("#" + idFab, sheetEl);
    if (!fab) return;
    let down = false, largo = false, libre = false, x0 = 0, y0 = 0, tmr = null;

    const pintar = (modo) => {
      fab.classList.toggle("rec", modo === "rec");
      fab.classList.toggle("libre", modo === "libre");
      const i = fab.querySelector("i");
      if (i) i.innerHTML = modo === "rec" ? I.sendarrow : (modo === "libre" ? I.check : I.bag);
      const ind = $("#" + idInd, sheetEl);
      const tx = $("#" + idTx, sheetEl);
      if (ind) {
        ind.hidden = !modo;
        ind.className = "bag-ind " + (modo || "");
      }
      const hint = $("#bagIndHint", sheetEl);
      if (tx) tx.textContent = modo === "libre" ? "Manos libres, toca para terminar" : "Escuchando el pedido";
      if (hint) hint.textContent = modo === "libre" ? "Suelta y toca la bolsa para terminar" : "Desliza hacia arriba para manos libres";
    };

    const iniciar = () => {
      largo = true;
      micVibra([35, 25, 60]);
      pintar("rec");
      (async () => {
        try {
          if (window.PPVoice.canRecord()) await window.PPVoice.startRecording();
        } catch (_) { toast("Sin acceso al microfono"); }
      })();
    };

    const terminar = async (manualTap) => {
      if (!largo) return;
      largo = false; libre = false;
      pintar("");
      const icono = fab.querySelector("i");
      if (icono) icono.innerHTML = I.clock;
      fab.classList.add("wait");
      let texto = "";
      try {
        texto = await window.PPVoice.recordAndTranscribe();
      } catch (_) { texto = ""; }
      fab.classList.remove("wait");
      if (icono) icono.innerHTML = I.bag;
      if (!texto) { if (manualTap) toast("No se pudo transcribir el pedido"); return; }
      showProc();
      let r = { lines: [] };
      try { r = await window.PPVoice.interpret(texto, db().products); } catch (_) {}
      const p = $("#proc"); if (p) p.remove();
      const lines = (r && r.lines) || [];
      if (!lines.length) { toast("No se reconocio ningun producto"); return; }
      agregarDirecto(r);
      lines.forEach((l) => invToque.set(l.pid, Date.now()));
      micVibra(45);
      toast("Agregado a la bolsa");
      if (refrescar) refrescar();
    };

    const soltar = () => {
      if (!down) return;
      down = false; clearTimeout(tmr);
      if (!largo) return;                 /* fue un toque corto: nada */
      if (libre) { tap(); return; }       /* en manos libres un toque termina */
      terminar(false);
    };

    fab.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (largo && libre) { terminar(true); return; }   /* toque para cerrar en manos libres */
      const t = e.touches[0];
      down = true; largo = false; libre = false; x0 = t.clientX; y0 = t.clientY;
      micVibra(12);
      tmr = setTimeout(() => { if (down) iniciar(); }, 500);
    }, { passive: false });

    fab.addEventListener("touchmove", (e) => {
      if (!down || !largo) return;
      const t = e.touches[0];
      const dy = t.clientY - y0;
      if (!libre && dy < -50) {           /* deslizar arriba = manos libres */
        libre = true; micVibra([30, 20, 40]);
        pintar("libre");
      }
    }, { passive: true });

    fab.addEventListener("touchend", (e) => { e.preventDefault(); soltar(); });
    fab.addEventListener("touchcancel", () => { down = false; clearTimeout(tmr); });

    /* con raton: mantener tambien graba */
    fab.addEventListener("mousedown", () => {
      if (largo && libre) { terminar(true); return; }
      down = true; largo = false; libre = false; micVibra(12);
      tmr = setTimeout(() => { if (down) iniciar(); }, 500);
    });
    fab.addEventListener("mouseup", () => soltar());
  }

  /* Dictado dentro del inventario: agrega al talonario sin salir de la barra. */
  async function vozInventario(btn, refrescar) {
    const listo = (on) => { btn.classList.toggle("on", on); btn.innerHTML = on ? I.stop : I.mic; };
    const aplicar = async (text) => {
      const t = String(text || "").trim();
      if (!t) { toast("No se escucho nada"); return; }
      showProc();
      const r = await window.PPVoice.interpret(t, db().products);
      $("#proc") && $("#proc").remove();
      agregarDirecto(r);
      (r.lines || []).forEach((l) => invToque.set(l.pid, Date.now()));
      if (refrescar) refrescar();
    };
    if (invRec) { invRec = false; listo(false); window.PPVoice.stopDictation(); return; }

    if (window.PPVoice.supportsDictation()) {
      invRec = window.PPVoice.startDictation(() => {}, (txt) => { invRec = false; listo(false); aplicar(txt); },
        () => { invRec = false; listo(false); toast("El dictado no esta disponible aqui"); });
      if (invRec) listo(true);
      return;
    }
    /* sin dictado del navegador: se graba y al tocar otra vez se transcribe */
    if (!window.PPVoice.canRecord()) return toast("Este navegador no permite dictar");
    if (invGrabando) {
      invGrabando = false; listo(false);
      try { aplicar(await window.PPVoice.recordAndTranscribe()); }
      catch (_) { toast("No se pudo transcribir"); }
      return;
    }
    try {
      await window.PPVoice.startRecording();
      invGrabando = true; listo(true); toast("Grabando. Toca el cuadro para terminar.");
    } catch (_) { listo(false); toast("Sin acceso al microfono"); }
  }

  /* ----- Lista de pedido con IA ----- */
  let orderRec = false;
  /* El texto de la lista vive aparte: sobrevive a cerrar la hoja, salir o recargar la app.
     Solo se borra al confirmar el cobro o si el usuario lo vacia a mano. */
  const ORDER_KEY = "pedipos.listaPedido";
  const orderTexto = () => { try { return localStorage.getItem(ORDER_KEY) || ""; } catch (_) { return ""; } };
  const guardarOrderTexto = (v) => { try { localStorage.setItem(ORDER_KEY, v == null ? "" : v); } catch (_) {} };
  window.PPOrder = { leer: orderTexto, borrar: () => guardarOrderTexto("") };

  function openOrder(initial) {
    const arranque = (initial != null && initial !== "") ? initial : orderTexto();
    const s = sheet(`<div class="sh-h"><h2>Lista de pedido</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <textarea class="ta baja" id="ta" placeholder="Escribe el pedido: dos leches, media libra de arroz...">${esc(arranque)}</textarea>
      <div class="sh-f solo"><button class="big" id="go">${I.spark} <span class="bl">Procesar pedido</span></button></div>`);
    $("#x", s).onclick = () => { window.PPVoice.stopDictation(); closeSheet(); };
    const ta = $("#ta", s), go = $("#go", s);
    ta.value = arranque;
    ta.oninput = () => guardarOrderTexto(ta.value);
    setTimeout(() => ta.focus(), 220);
    go.onclick = async () => {
      const text = ta.value.trim();
      if (!text) return toast("Escribe el pedido");
      guardarOrderTexto(ta.value);
      go.disabled = true; go.innerHTML = '<span class="bar" id="bar" style="width:4%"></span><span class="spin" style="border-color:#fff;border-top-color:transparent"></span><span id="pc">Procesando... 4%</span>';
      let r = null;
      try {
        r = await window.PPVoice.interpret(text, db().products, (p) => { const b2 = $("#bar"), c = $("#pc"); if (b2) b2.style.width = p + "%"; if (c) c.textContent = "Procesando... " + p + "%"; });
      } catch (_) { r = null; }
      closeSheet();
      if (!r) return toast("No se pudo procesar la lista. Intenta de nuevo.");
      setTimeout(() => agregarDirecto(r), 180);
    };
  }

  function confirmOrder(r) {
    const lines = r.lines.map((l) => ({ ...l }));
    const s = sheet(`<div class="sh-h compacta"><button class="sh-x" id="b">${I.back}</button><h2>Confirmar pedido</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <div class="cnt">${lines.length} producto${lines.length === 1 ? "" : "s"} detectado${lines.length === 1 ? "" : "s"}</div>
      ${lines.map((l, i) => `<div class="item"><div class="nm"><b>${esc(l.nombre)}</b><span>${money(l.precio)} c/u &middot; ${esc(l.unidad)}</span></div><input class="qty" data-i="${i}" inputmode="decimal" value="${num(l.cant)}"></div>`).join("")}
      ${r.missing && r.missing.length ? `<div class="miss">No encontre: ${r.missing.map(esc).join(", ")}. Agregalo desde Catalogo.</div>` : ""}
      <button class="big" id="ok" ${lines.length ? "" : "disabled"} style="width:100%;margin-top:6px">Agregar al talonario</button>`);
    $("#x", s).onclick = closeSheet; $("#b", s).onclick = () => openOrder("");
    $$(".qty", s).forEach((i) => (i.onchange = () => { const v = parseFloat(String(i.value).replace(",", ".")); if (v > 0) lines[+i.dataset.i].cant = v; }));
    $("#ok", s).onclick = () => {
      for (const l of lines) { const p = db().products.find((x) => x.pid === l.pid); if (p) addLine(p, l.cant); }
      closeSheet(); toast(lines.length + " producto" + (lines.length === 1 ? "" : "s") + " agregado" + (lines.length === 1 ? "" : "s")); render();
    };
  }

  /* Cuenta animada: los montos se deslizan al nuevo valor en vez de saltar. */
  function cuenta(sel, desde, hasta, signo) {
    const el = $(sel);
    if (!el) return;
    if (Math.abs(hasta - desde) < 0.005) { el.textContent = (signo ? "+" : "") + money(hasta); return; }
    el.classList.add("cambiando");
    const t0 = performance.now(), dur = 320;
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);           /* salida suave */
      const v = desde + (hasta - desde) * e;
      el.textContent = (signo ? "+" : "") + money(v);
      if (k < 1) requestAnimationFrame(paso);
      else { el.textContent = (signo ? "+" : "") + money(hasta); el.classList.remove("cambiando"); }
    };
    requestAnimationFrame(paso);
  }

  /* ----- Voz: los productos entran directo al talonario ----- */
  function agregarDirecto(r) {
    const lines = (r && r.lines) || [];
    if (!lines.length) {
      toast("No reconoci productos en el pedido");
      if (r && r.missing && r.missing.length) toast("No encontre: " + r.missing.join(", "));
      return;
    }
    const antes = cart().lines.length;
    let n = 0;
    for (const l of lines) {
      const p = db().products.find((x) => x.pid === l.pid);
      if (!p) continue;
      addLine(p, l.cant || 1);
      n++;
    }
    S.save(); render();
    animarNuevas(antes, n);
    tapFuerte();
    if (n) toast(n + " producto" + (n === 1 ? "" : "s") + " agregado" + (n === 1 ? "" : "s") + " al talonario");
    if (r.missing && r.missing.length) setTimeout(() => toast("No encontre: " + r.missing.join(", ")), 1100);
  }
  /* Entrada escalonada de las filas recien agregadas. */
  function animarNuevas(desde, cuantas) {
    const rows = $$("#tickb .row[data-i]");
    if (!rows.length) return;
    const inicio = Math.max(0, Math.min(desde, rows.length) - 0);
    const ultimas = rows.slice(rows.length - Math.max(cuantas, 1));
    ultimas.forEach((row, i) => {
      row.classList.add("fila-nueva");
      row.style.animationDelay = (i * 70) + "ms";
    });
    const caja = $("#tickb");
    if (caja) { caja.classList.add("brillo"); setTimeout(() => caja.classList.remove("brillo"), 1100); }
  }

  /* ----- Voz directa desde el boton negro ----- */
  /* ====== Microfono estilo nota de voz ======
     Toque corto: dicta (como antes).
     Mantener 1 s: vibra y la barra se transforma en grabadora.
       soltar            -> termina y procesa
       deslizar izquierda -> cancela
       deslizar derecha   -> bloquea (manos libres) con opcion de eliminar o procesar */
  const MIC = { t: null, activo: false, bloqueado: false, x0: 0, dx: 0, hold: false, seg: 0, tick: null, rec: null, usaDictado: false, pausado: false };

  function micVibra(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} }

  function bindMicGestos() {
    const mic = $("#bMic");
    if (!mic) return;
    let down = false, largo = false, x0 = 0, y0 = 0, tmr = null;

    const inicio = (x, y) => { down = true; largo = false; x0 = x; y0 = y; micVibra(18);
      tmr = setTimeout(() => { if (!down) return; largo = true; micVibra([40, 30, 70]); iniciarGrabacionGesto(); }, 500); };
    const mueve = (x) => {
      if (!down || !largo || MIC.bloqueado) return;
      MIC.dx = x - x0;
      actualizarArrastre();
    };
    const fin = () => {
      if (!down) return;
      down = false; clearTimeout(tmr);
      if (!largo) return;          /* un toque corto ya no activa nada */
      if (MIC.bloqueado) return;
      /* soltar: segun hacia donde quedo el dedo */
      if (MIC.dx < -70) { micVibra([30, 20, 45]); cancelarGrabacionGesto(true); }
      else if (MIC.dx > 70) bloquearGrabacionGesto();
      else terminarGrabacionGesto();
    };
    mic.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.touches[0]; inicio(t.clientX, t.clientY); }, { passive: false });
    mic.addEventListener("touchmove", (e) => { const t = e.touches[0]; mueve(t.clientX); }, { passive: true });
    mic.addEventListener("touchend", (e) => { e.preventDefault(); fin(); });
    mic.addEventListener("touchcancel", () => { if (down && largo && !MIC.bloqueado) cancelarGrabacionGesto(false); down = false; clearTimeout(tmr); });
    /* raton (pruebas en computadora) */
    mic.addEventListener("mousedown", (e) => { inicio(e.clientX, e.clientY);
      const mm = (ev) => mueve(ev.clientX), up = () => { document.removeEventListener("mousemove", mm); document.removeEventListener("mouseup", up); fin(); };
      document.addEventListener("mousemove", mm); document.addEventListener("mouseup", up); });
  }

  const fmtSeg = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

  async function iniciarGrabacionGesto() {
    if (MIC.activo) return;
    if (voice.phase !== "idle" && voice.phase !== undefined) { try { window.PPVoice.stopDictation(); } catch (_) {} voice = { phase: "idle", text: "" }; renderListen(); }
    if (!window.PPVoice.canRecord()) { toast("Este telefono no permite grabar audio"); return; }
    try { await window.PPVoice.startRecording(); }
    catch (_) { toast("Permite el microfono para grabar"); return; }
    MIC.activo = true; MIC.bloqueado = false; MIC.dx = 0; MIC.seg = 0;
    transformarBarra(true);
    MIC.tick = setInterval(() => {
      MIC.seg++;
    }, 1000);
  }

  /* la barra de venta se convierte en la barra de grabacion */
  function transformarBarra(on) {
    const bar = $("#actbar");
    if (!bar) return;
    document.body.classList.toggle("grabando", on);
    if (!on) { bar.classList.remove("rec", "lock", "izq"); bar.querySelector(".recbar") && bar.querySelector(".recbar").remove(); const m = $("#bMic"); m && (m.style.transform = ""); return; }
    bar.classList.add("rec");
    let rb = bar.querySelector(".recbar");
    if (!rb) {
      rb = document.createElement("div"); rb.className = "recbar";
      rb.innerHTML = `<span class="rtrash" id="recX" aria-hidden="true">${I.trashAnim}</span>
        <span class="rlock2" id="recLock" aria-hidden="true">${I.lockAnim}</span>


        <div class="rfree" id="recF" hidden>
          <button class="rdel" id="recDel" aria-label="Eliminar audio">${I.trash}</button>
          <div class="rwave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <button class="rpause" id="recP" aria-label="Pausar">${I.pausa}</button>
          <button class="rsend" id="recSend" aria-label="Guardar pedido">${I.bag}</button>
        </div>`;
      bar.append(rb);
      $("#recDel").onclick = () => cancelarGrabacionGesto(true);
      $("#recSend").onclick = () => terminarGrabacionGesto();
      $("#recP").onclick = alternarPausa;
    }
    const m = $("#bMic"); m && m.classList.add("grab");
    /* los dos avisos aparecen desde el primer instante, en modo suave */
    const X0 = $("#recX"), L0 = $("#recLock");
    if (X0) { X0.style.opacity = "0.45"; X0.classList.add("sutil"); }
    if (L0) { L0.style.opacity = "0.45"; L0.classList.add("sutil"); }
  }

  function actualizarArrastre() {
    const m = $("#bMic");
    const dx = MIC.dx;
    if (m) m.style.transform = "translateX(" + Math.max(-110, Math.min(110, dx)) + "px) scale(1.18)";
    const X = $("#recX"), bar = $("#actbar");
    if (X) {
      const k = Math.min(1, Math.max(0, -dx / 70));          /* 0 a 1 segun lo que se desliza */
      X.style.opacity = String(0.45 + 0.55 * k);
      X.style.transform = "translateY(-50%) scale(" + (0.86 + 0.34 * k) + ")";
      X.classList.toggle("on", dx < -34);
      if (dx < -6) X.classList.remove("sutil");
    }
    if (bar) bar.classList.toggle("izq", dx < -6);
    /* candado: aparece al empezar a deslizar a la derecha y se apaga al completar */
    const L2 = $("#recLock");
    if (L2) {
      const k = Math.min(1, Math.max(0, dx / 70));
      L2.style.opacity = String(0.45 + 0.55 * k);
      L2.style.transform = "translateY(-50%) scale(" + (0.86 + 0.34 * k) + ")";
      L2.classList.toggle("on", k > 0.38);
      if (dx > 6) L2.classList.remove("sutil");
    }
  }

  /* pausar / continuar la grabacion a manos libres */
  function alternarPausa() {
    if (!MIC.activo) return;
    const b = $("#recP"), onda = $(".rwave"), dot = $(".rdot");
    if (!MIC.pausado) {
      if (!window.PPVoice.pauseRecording()) return;
      MIC.pausado = true; clearInterval(MIC.tick); MIC.tick = null;
      micVibra(20);
      if (b) { b.innerHTML = I.seguir; b.setAttribute("aria-label", "Continuar"); b.classList.add("on"); }
      onda && onda.classList.add("quieta"); dot && dot.classList.add("quieto");
    } else {
      if (!window.PPVoice.resumeRecording()) return;
      MIC.pausado = false; micVibra(20);
      MIC.tick = setInterval(() => { MIC.seg++; }, 1000);
      if (b) { b.innerHTML = I.pausa; b.setAttribute("aria-label", "Pausar"); b.classList.remove("on"); }
      onda && onda.classList.remove("quieta"); dot && dot.classList.remove("quieto");
    }
  }

  function limpiarGrabacionGesto() {
    clearInterval(MIC.tick); MIC.tick = null;
    MIC.activo = false; MIC.bloqueado = false; MIC.dx = 0; MIC.pausado = false;
    /* el microfono vuelve siempre visible (antes quedaba oculto tras cancelar en manos libres) */
    const m = $("#bMic"); if (m) { m.classList.remove("grab"); m.style.transform = ""; m.style.display = ""; }
    transformarBarra(false);
    const m2 = $("#bMic"); if (m2) m2.style.display = "";
  }

  async function cancelarGrabacionGesto(vibra) {
    if (!MIC.activo) return;
    if (vibra) micVibra([30, 40, 30]);
    limpiarGrabacionGesto();
    try { await window.PPVoice.stopRecording(); } catch (_) {}
    toast("Grabacion cancelada");
  }

  function bloquearGrabacionGesto() {
    if (!MIC.activo) return;
    MIC.bloqueado = true; MIC.dx = 0;
    micVibra(40);
    /* el icono de la barra se retira: el boton de guardar ya es una bolsa verde */
    const m = $("#bMic"); if (m) { m.style.transform = ""; m.style.display = "none"; }
    const hh = $("#recH"); if (hh) hh.hidden = true;
    const ll = $("#recL"); if (ll) ll.hidden = true;
    /* el candado se transforma en enviar: ya quedo bloqueado y se puede mandar */
    const l2 = $("#recLock");
    if (l2) {
      l2.hidden = false;
      l2.classList.remove("sutil", "on");
      l2.classList.add("enviar");
      l2.innerHTML = I.sendarrow;
      l2.setAttribute("aria-label", "Enviar pedido");
      l2.setAttribute("role", "button");
      l2.style.opacity = "1";
      l2.style.transform = "translateY(-50%) scale(1)";
      l2.onclick = (ev) => { ev.stopPropagation(); terminarGrabacionGesto(); };
    }

    $("#recF").hidden = false;
    $("#actbar").classList.add("lock");
  }

  async function terminarGrabacionGesto() {
    if (!MIC.activo) return;
    try { if (MIC.pausado) window.PPVoice.resumeRecording(); } catch (_) {}
    const seg = MIC.seg;
    micVibra(30);
    limpiarGrabacionGesto();
    const m = $("#bMic"); if (m) m.style.display = "";
    if (seg < 1) { try { await window.PPVoice.stopRecording(); } catch (_) {} return toast("Mantén presionado mas tiempo para grabar"); }
    voice = { phase: "wait", text: "" }; render(); showProc();
    let text = "";
    try { text = await window.PPVoice.recordAndTranscribe(); } catch (_) { text = ""; }
    $("#proc") && $("#proc").remove();
    voice = { phase: "idle", text: "" }; render();
    if (!text) return toast("No se entendio el audio. Intenta de nuevo.");
    showProc();
    let r = null;
    try { r = await window.PPVoice.interpret(text, db().products); } catch (_) { r = null; }
    $("#proc") && $("#proc").remove();
    if (!r) return toast("No se pudo procesar el pedido.");
    agregarDirecto(r);
  }

  function toggleVoice() {
    if (voice.phase === "listening") { window.PPVoice.stopDictation(); return; }
    if (!window.PPVoice.supportsDictation()) return whisperMode();
    voice = { phase: "listening", text: "" }; renderListen(); render();
    window.PPVoice.startDictation((t) => { voice.text = t; renderListen(); },
      async (finalText) => {
        const text = (finalText || voice.text || "").trim();
        voice = { phase: "idle", text: "" };
        if (!text) { render(); return; }
        voice.phase = "wait"; render(); showProc();
        const r = await window.PPVoice.interpret(text, db().products);
        voice = { phase: "idle", text: "" }; $("#proc") && $("#proc").remove(); render(); agregarDirecto(r);
      },
      (e) => { voice = { phase: "idle", text: "" }; render(); toast(e === "not-allowed" ? "Permite el microfono para dictar" : "No se pudo escuchar. Prueba escribiendo."); openOrder(""); });
  }
  /* Graba con el movil y transcribe con Whisper de Puter (se usa cuando el navegador no dicta). */
  async function whisperMode() {
    if (!window.PPVoice.canRecord()) return openOrder("");
    if (voice.phase === "recording") { voice.phase = "wait"; render(); showProc(); return finishWhisper(); }
    try {
      await window.PPVoice.startRecording();
      voice = { phase: "recording", text: "" }; renderListen(); render();
    } catch (e) {
      voice = { phase: "idle", text: "" }; render(); openOrder("");
      toast("Sin acceso al microfono. Escribe el pedido.");
    }
  }
  async function finishWhisper() {
    voice.phase = "wait"; render(); showProc();
    let text = "";
    try { text = await window.PPVoice.recordAndTranscribe(); } catch (_) { text = ""; }
    $("#proc") && $("#proc").remove();
    voice = { phase: "idle", text: "" }; render();
    if (!text) return toast("No se pudo transcribir. Escribe el pedido.");
    showProc();
    const r = await window.PPVoice.interpret(text, db().products);
    $("#proc") && $("#proc").remove();
    agregarDirecto(r);
  }

  function renderListen() {
    let el = $("#listen");
    if (voice.phase !== "listening" && voice.phase !== "recording") { el && el.remove(); return; }
    const rec = voice.phase === "recording";
    const lab = rec ? "GRABANDO" : "ESCUCHANDO";
    const txt = voice.text || (rec ? "Habla y toca detener al terminar" : "Dicta: \"dos leches, media libra de arroz\"");
    if (!el) {
      el = document.createElement("div"); el.id = "listen"; el.className = "listen";
      el.innerHTML = '<div class="wave"><i></i><i></i><i></i><i></i><i></i></div><div class="tx"><b></b><span></span></div><button class="stop" id="stp" aria-label="Detener"><i></i></button>';
      document.body.append(el);
      $("#stp").onclick = () => { if (voice.phase === "recording") { voice.phase = "wait"; finishWhisper(); } else window.PPVoice.stopDictation(); };
    }
    /* se actualiza solo el texto: la tarjeta no parpadea mientras se dicta */
    el.querySelector(".tx b").textContent = lab;
    const sp = el.querySelector(".tx span"); sp.textContent = txt; sp.style.color = voice.text ? "#14171c" : "";
  }
  function showProc() {
    const d = document.createElement("div"); d.id = "proc"; d.className = "proc"; d.innerHTML = '<span class="spin"></span> Procesando...'; document.body.append(d);
  }

  /* ----- Cobro ----- */
  function clientOpts(sel) {
    return (db().clients || []).filter((c) => c.activo !== false).map((c) => `<option value="${esc(c.cid)}" ${c.cid === sel ? "selected" : ""}>${esc(c.nombre)}${window.PPExtra && window.PPExtra.deudaDe(c.cid) > 0 ? " · debe " + money(window.PPExtra.deudaDe(c.cid)) : ""}</option>`).join("");
  }
  function openPay() {
    const t = tot();
    const s = sheet(`<div class="sh-h"><h2>Cobrar</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <div class="receipt"><div class="r"><span>Subtotal</span><span>${money2(t.subtotal)}</span></div><div class="r"><span>ITBIS</span><span>${money2(t.itbis)}</span></div><div class="r t"><span>TOTAL</span><span>${money2(t.total)}</span></div></div>
      <label class="field"><span>Metodo de pago</span><select id="met"><option value="efectivo">Efectivo</option><option value="credito">Credito</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option></select></label>
      <label class="field" id="recw"><span>Efectivo recibido</span><input id="rec" inputmode="decimal" placeholder="${num(t.total)}"></label>
      <div class="field"><span id="clilbl">Cliente (opcional)</span>
        <div class="cliwrap"><select id="cli2"><option value="">Sin cliente</option>${clientOpts("")}</select>
        <button type="button" class="cliplus" id="cliplus" aria-label="Nuevo cliente">${I.userplus}</button></div>
        <div id="newcli" hidden style="margin-top:10px;display:none">
          <input id="ncn" placeholder="Nombre del cliente" autocomplete="off" style="width:100%;height:46px;border:1.5px solid var(--g-line);border-radius:14px;padding:0 14px;font-size:15px;margin-bottom:8px;outline:none">
          <input id="nct" inputmode="tel" placeholder="Telefono (opcional)" style="width:100%;height:46px;border:1.5px solid var(--g-line);border-radius:14px;padding:0 14px;font-size:15px;margin-bottom:8px;outline:none">
          <input id="ncd" placeholder="Direccion (opcional)" style="width:100%;height:46px;border:1.5px solid var(--g-line);border-radius:14px;padding:0 14px;font-size:15px;margin-bottom:8px;outline:none">
          <div style="display:flex;gap:10px"><button type="button" class="btn sec" id="ncx" style="flex:1">Cancelar</button><button type="button" class="btn" id="ncs" style="flex:1">Guardar y vincular</button></div>
        </div></div>
      <label class="field" id="fpw" style="display:none"><span>Fecha de pago (obligatoria)</span><input type="date" id="fpago"></label>
      <div id="chg" class="cnt"></div>
      <button class="big" id="done" style="width:100%">${I.check} Confirmar cobro</button>`);
    $("#x", s).onclick = () => closeSheet();
    const met = $("#met", s), rec = $("#rec", s), chg = $("#chg", s), cli = $("#cli2", s), done = $("#done", s);
    /* A credito exige cliente: sin cliente el boton queda inhabilitado. */
    const upd = () => {
      const cred = met.value === "credito";
      $("#recw", s).style.display = met.value === "efectivo" ? "block" : "none";
      const r = parseFloat(String(rec.value).replace(",", "."));
      chg.textContent = met.value === "efectivo" && r >= t.total ? "Devuelta: " + money2(r - t.total) : "";
      $("#clilbl", s).textContent = cred ? "Cliente (obligatorio para fiar)" : "Cliente (opcional)";
      $("#fpw", s).style.display = cred ? "block" : "none";
      const sinCliente = cred && !cli.value;
      const sinFecha = cred && !$("#fpago", s).value;
      done.disabled = sinCliente || sinFecha;
      let h = $("#credhint", s);
      let msg = "";
      if (sinCliente) msg = "Para vender a credito, elige o crea un cliente con el (+).";
      else if (sinFecha) msg = "Elige la fecha de pago para despachar el pedido a credito.";
      if (msg) {
        if (!h) { h = document.createElement("div"); h.id = "credhint"; h.className = "hint"; done.before(h); }
        h.textContent = msg;
      } else if (h) h.remove();
    };
    met.onchange = upd; rec.oninput = upd; cli.onchange = upd; $("#fpago", s).onchange = upd;
    /* (+) crea un cliente nuevo y lo vincula a esta venta sin salir del cobro */
    const nb = $("#newcli", s);
    const showNew = (v) => { nb.style.display = v ? "block" : "none"; if (v) setTimeout(() => $("#ncn", s).focus(), 60); };
    $("#cliplus", s).onclick = () => showNew(nb.style.display === "none");
    $("#ncx", s).onclick = () => showNew(false);
    $("#ncs", s).onclick = () => {
      const nom = $("#ncn", s).value.trim();
      if (!nom) { toast("Escribe el nombre del cliente"); $("#ncn", s).focus(); return; }
      const dup = (db().clients || []).find((c) => window.PPVoice.norm(c.nombre) === window.PPVoice.norm(nom));
      let c = dup;
      if (!c) {
        c = { cid: S.uid("C"), nombre: nom, telefono: $("#nct", s).value.trim(), direccion: $("#ncd", s).value.trim(), nota: "", limite_credito: 0, activo: true };
        (db().clients = db().clients || []).push(c); S.save(); window.PPSync.saveCliente(c);
      }
      cli.innerHTML = '<option value="">Sin cliente</option>' + clientOpts(c.cid);
      cli.value = c.cid; showNew(false); $("#ncn", s).value = ""; $("#nct", s).value = ""; $("#ncd", s).value = "";
      toast(dup ? "Cliente existente vinculado" : "Cliente creado y vinculado"); upd();
    };
    upd();
    $("#done", s).onclick = () => {
      if (met.value === "credito" && !$("#cli2", s).value) return toast("Elige el cliente para fiar");
      const sale = {
        vid: S.uid("V"), fecha: new Date().toISOString(),
        lineas: cart().lines.map((l) => ({ ...l })),
        subtotal: t.subtotal, itbis: t.itbis, total: t.total, aplica_itbis: cart().itbis,
        metodo: met.value, cajero: (db().session && db().session.nombre) || "Caja",
        recibido: (() => { const r = parseFloat(String(rec.value || "").replace(",", ".")); return isFinite(r) ? r : 0; })(),
        cambio: (() => { const r = parseFloat(String(rec.value || "").replace(",", ".")); return isFinite(r) && r >= t.total ? S.round2(r - t.total) : 0; })(),
        fecha_pago: met.value === "credito" ? $("#fpago", s).value : "",
        cliente_id: $("#cli2", s).value || "", cliente: (() => { const c = (db().clients || []).find((x) => x.cid === $("#cli2", s).value); return c ? c.nombre : ""; })(),
      };
      db().sales.push(sale);
      for (const l of lineasDe(sale)) { const p = db().products.find((x) => x.pid === l.pid); if (p && typeof p.stock === "number") { p.stock = S.round2(p.stock - l.cant); window.PPSync.saveProduct(p); } }
      cart().lines = []; S.save(); window.PPSync.saveSale(sale);
      guardarOrderTexto("");   /* el cobro confirmado limpia la lista de pedido */
      receipt(sale);
    };
  }
  /* WhatsApp del cliente de la venta: para abrir el chat directo */
  function waDeVenta(s) {
    if (!s) return "";
    if (s.cliente_whatsapp) return s.cliente_whatsapp;
    const c = (db().clients || []).find((x) => x.cid === s.cliente_id) ||
      (db().clients || []).find((x) => x.nombre && s.cliente && x.nombre.toLowerCase() === String(s.cliente).toLowerCase());
    return c ? (c.whatsapp || c.telefono || "") : "";
  }

  /* ticket en texto para WhatsApp: abre el chat directo, nunca el menu de Android */
  function enviarTicketWa(v, telefono) {
    const neg = db().settings.negocio || "Mi negocio";
    const L = window.PPTicket.lineasVenta(v, neg, db().settings.direccion || "", db().settings.telefono || "");
    const texto = "```\n" + window.PPTicket.textoPlano(L) + "\n```";
    const r = window.PPTicket.enviarWhatsApp(texto, telefono);
    toast(r === "chat" ? "Abriendo el chat del cliente" : "Elige el contacto en WhatsApp");
  }

  function receipt(sale) {
    const s = sheet(`<div class="ok-big"><div class="tk">${I.ok}</div><h2>Venta registrada</h2><div class="cnt">${new Date(sale.fecha).toLocaleString("es-DO")}</div></div>
      <div class="receipt">${lineasDe(sale).map((l) => `<div class="r"><span>${num(l.cant)} x ${esc(l.nombre)}</span><span>${money(l.cant * l.precio)}</span></div>`).join("")}
      <div class="r"><span>Subtotal</span><span>${money2(sale.subtotal)}</span></div><div class="r"><span>ITBIS</span><span>${money2(sale.itbis)}</span></div><div class="r t"><span>TOTAL</span><span>${money2(sale.total)}</span></div></div>
      <div class="sh-f rcp"><button class="big miniwa" id="wa">${I.wa} <span class="bl">Enviar ticket</span></button><button class="m negro" id="pr" aria-label="Imprimir por Bluetooth">${I.print}</button><button class="m" id="img" aria-label="Ticket en imagen">${I.ticket}</button></div>
      <button class="btn sec" id="nw" style="margin-top:14px">Nueva venta</button>`);
    $("#pr", s).onclick = () => {
      window.PPTicket.imprimirConVentana(window.PPTicket.lineasVenta(sale, db().settings.negocio || "Mi negocio", db().settings.direccion || "", db().settings.telefono || ""), "ticket");
    };
    $("#wa", s).onclick = () => enviarTicketWa(sale, waDeVenta(sale));
    const im = $("#img", s);
    if (im) im.onclick = async () => {
      try {
        const neg = db().settings.negocio || "Mi negocio";
        const c = window.PPTicket.lienzoVenta(sale, { negocio: neg, direccion: db().settings.direccion || "", telefono: db().settings.telefono || "" });
        const r = await window.PPTicket.compartir(c, "ticket-" + (sale.vid || "pedido") + ".png");
        if (r === "descargado") toast("Imagen guardada. Adjuntala en WhatsApp");
        else if (r === "compartido") toast("Ticket compartido");
      } catch (e) { toast("No se pudo generar la imagen"); }
    };
    $("#nw", s).onclick = () => { closeSheet(); render(); };
  }

  /* ---------- Catalogo ---------- */
  let catQ = "", catCat = "";
  function renderCatalogo() {
    const cats = [...new Set(db().products.map((p) => p.categoria).filter(Boolean))].sort();
    $("#view").innerHTML = `<div class="stickbar">
        <div class="searchrow">
          <div class="search">${I.search}<input id="cq" placeholder="Buscar en el catalogo" value="${esc(catQ)}" autocomplete="off"></div>
          <button class="fbtn ${catCat ? "on" : ""}" id="cfil" aria-label="Filtrar por categoria">${I.filtro}</button>
        </div>
        <div class="filtro-pop" id="cfp" hidden>
          <button class="fopt ${catCat ? "" : "on"}" data-cat="">Todas las categorias ${I.check}</button>
          ${cats.map((c) => `<button class="fopt ${catCat === c ? "on" : ""}" data-cat="${esc(c)}">${esc(c)} ${I.check}</button>`).join("")}
        </div>
      </div>
      <div class="pgrid" id="cl"></div>
      `;
    const draw = () => {
      const t = window.PPVoice.norm(catQ);
      const l = db().products.filter((p) => p.activo !== false && (!catCat || p.categoria === catCat) && (!t || window.PPVoice.norm(p.nombre).includes(t)));
      $("#cl").innerHTML = l.length ? l.map((p) => pcard(p, `title="${esc(p.categoria || "General")}"`)).join("") : '<div class="empty">Sin productos con ese filtro.</div>';
      $$("#cl .pcard").forEach((el) => (el.onclick = () => { tap(); editProduct(db().products.find((p) => p.pid === el.dataset.p)); }));
    };
    $("#cq").oninput = (e) => { catQ = e.target.value; draw(); };
    const pop = $("#cfp");
    $("#cfil").onclick = () => alternarFiltro($("#cfil"), pop);
    $$("[data-cat]", pop).forEach((b) => (b.onclick = () => { catCat = b.dataset.cat; renderCatalogo(); }));
    setFab(I.plus, () => editProduct(null), "Crear producto");
    draw();
  }
  /* Hoja con las categorias para elegir con un toque. */
  function abrirFiltroCategorias(cats) {
    const s = sheet(`<div class="sh-h compacta"><h2>Categorias</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <div class="fopts">
        <button class="fopt ${catCat ? "" : "on"}" data-cat="">Todas las categorias ${I.check}</button>
        ${cats.map((c) => `<button class="fopt ${catCat === c ? "on" : ""}" data-cat="${esc(c)}">${esc(c)} ${I.check}</button>`).join("")}
      </div>`);
    $("#x", s).onclick = closeSheet;
    $$("[data-cat]", s).forEach((b) => (b.onclick = () => { catCat = b.dataset.cat; closeSheet(true); renderCatalogo(); }));
  }

  function editProduct(p) {
    const n = !p; p = p || { pid: S.uid("P"), nombre: "", precio: 0, unidad: "unidad", categoria: "", stock: 0, itbis: true, activo: true };
    const s = sheet(`<div class="sh-h"><h2>${n ? "Crear producto" : "Editar producto"}</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <label class="field"><span>Nombre</span><input id="fn" value="${esc(p.nombre)}"></label>
      <div class="duo">
        <label class="field"><span>Categoria</span><input id="fc" value="${esc(p.categoria)}"></label>
        <label class="field"><span>Precio (RD$)</span><input id="fp" inputmode="decimal" value="${p.precio || ""}"></label>
      </div>
      <div class="duo">
        <label class="field"><span>Stock</span><input id="fs" inputmode="decimal" value="${p.stock || 0}"></label>
        <label class="field"><span>Unidad</span><select id="fu">${["unidad", "libra", "onza", "litro", "funda", "caja", "docena"].map((u) => `<option ${u === p.unidad ? "selected" : ""}>${u}</option>`).join("")}</select></label>
      </div>
      <div class="field"><span>Foto del producto</span>
        <div class="upimg"><span class="pv" id="pv">${fotoDe(p)}</span>
          <label class="btn gris fbtn2" style="margin:0">${I.image}<span>Subir</span><input type="file" accept="image/*" id="fi" hidden></label>
          <label class="btn gris fbtn2" style="margin:0">${I.cam}<span>Tomar</span><input type="file" accept="image/*" capture="environment" id="fcam" hidden></label>
        </div>
      </div>
      <button class="btn" id="sv">Guardar</button>${n ? "" : '<button class="btn red" id="dl" style="margin-top:10px">Eliminar</button>'}`);
    $("#x", s).onclick = closeSheet;
    /* foto opcional: se guarda comprimida y se usa en las tarjetas */
    let img = p.img || "";
    const procesar = (input) => {
      const f = input.files && input.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => {
          /* se guarda liviana para que la foto viaje y quede guardada en la nube */
          const max = 320, k = Math.min(1, max / Math.max(im.width, im.height));
          const cv = document.createElement("canvas");
          cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
          cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
          img = cv.toDataURL("image/jpeg", 0.62);
          $("#pv", s).innerHTML = `<img src="${img}" alt="">`;
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
    $("#fi", s).onchange = () => procesar($("#fi", s));
    $("#fcam", s).onchange = () => procesar($("#fcam", s));
    /* tocar la vista previa quita la foto */
    $("#pv", s).onclick = () => { if (!img) return; img = ""; $("#pv", s).innerHTML = I.box; toast("Foto quitada"); };
    $("#sv", s).onclick = () => {
      const nom = $("#fn", s).value.trim(), pr = parseFloat(String($("#fp", s).value).replace(",", "."));
      if (!nom || !(pr >= 0)) return toast("Falta el nombre o el precio");
      Object.assign(p, { nombre: nom, precio: pr, unidad: $("#fu", s).value, categoria: $("#fc", s).value.trim(), stock: parseFloat($("#fs", s).value) || 0, img });
      if (n) db().products.push(p);
      S.save(); window.PPSync.saveProduct(p); closeSheet(); toast("Producto guardado"); render();
    };
    const dl = $("#dl", s);
    if (dl) dl.onclick = () => { db().products = db().products.filter((x) => x.pid !== p.pid); S.save(); window.PPSync.deleteProduct(p.pid); closeSheet(); toast("Producto eliminado"); render(); };
  }

  /* ---------- Analitica ---------- */
  function renderAnalitica() {
    const sales = db().sales, today = new Date().toISOString().slice(0, 10);
    const hoy = sales.filter((s) => String(s.fecha).slice(0, 10) === today);
    const sum = (a, k) => a.reduce((x, s) => x + (Number(s[k]) || 0), 0);
    const byProd = {};
    for (const s of sales) { let L = s.lineas; if (typeof L === "string") { try { L = JSON.parse(L); } catch (_) { L = []; } } for (const l of L) byProd[l.nombre] = (byProd[l.nombre] || 0) + l.cant * l.precio; }
    const top = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 6), mx = top.length ? top[0][1] : 1;
    const ticket = sales.length ? sum(sales, "total") / sales.length : 0;
    $("#view").innerHTML = `<div class="kpis">
      <div class="kpi"><small>Ventas hoy</small><b>${money(sum(hoy, "total"))}</b></div>
      <div class="kpi"><small>Tickets hoy</small><b>${hoy.length}</b></div>
      <div class="kpi"><small>ITBIS hoy</small><b>${money(sum(hoy, "itbis"))}</b></div>
      <div class="kpi"><small>Ticket promedio</small><b>${money(ticket)}</b></div></div>
      <div class="card"><h3>Productos mas vendidos</h3>${top.length ? top.map(([n, v]) => `<div class="bar-r"><span>${esc(n)}</span><i><u style="width:${Math.max(6, v / mx * 100)}%"></u></i><em>${money(v)}</em></div>`).join("") : '<div class="empty" style="padding:24px">Aun no hay ventas.</div>'}</div>
      <div class="card"><h3>Ultimas ventas</h3>${sales.length ? sales.slice(-8).reverse().map((s) => `<div class="bar-r" style="grid-template-columns:1fr auto"><span>${new Date(s.fecha).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })} &middot; ${esc(s.metodo)}</span><em>${money(s.total)}</em></div>`).join("") : '<div class="empty" style="padding:24px">Sin ventas registradas.</div>'}</div>`;
  }

  /* ---------- Soporte ---------- */
  const DOC = [
    ["book", "Introduccion a PediPOS", ["Que es PediPOS?", "Requisitos del sistema", "Planes y precios"]],
    ["bolt", "Primeros pasos", ["Crear tu cuenta", "Configurar tu negocio", "Navegacion principal"]],
    ["cart", "Flujo completo de una venta", ["Venta manual", "Venta desde catalogo", "Venta por voz", "Lista de Pedido IA", "Cobro en efectivo", "Cobro a credito"]],
    ["users", "Gestion de clientes", ["Registrar clientes", "Historial de compras", "Registrar pagos", "Enviar WhatsApp"]],
    ["card", "Gestion de creditos", ["Crear credito", "Fecha de cobro", "Avisos de vencimiento", "Cobrar deuda"]],
    ["truck", "Gestion de proveedores", ["Registrar proveedores", "Pagos y cargos", "Historial de movimientos"]],
    ["box", "Gestion del catalogo", ["Mis productos (favoritos)", "Catalogo global", "Mi Precio", "Crear productos"]],
    ["chart", "Analitica", ["KPIs en tiempo real", "Productos mas vendidos", "Deuda con proveedores"]],
    ["gear", "Configuracion", ["Datos del negocio", "Logo", "Ubicacion", "ITBIS"]],
    ["wa", "Integracion con WhatsApp", ["Facturas por WhatsApp", "Recordatorios de cobro"]],
    ["print", "Impresion Bluetooth", ["Impresoras compatibles", "Configurar conexion", "Imprimir ticket"]],
    ["mic", "Venta por voz", ["Whisper + DeepSeek", "Conectar Puter", "Cache inteligente"]],
    ["spark", "Lista de Pedido con IA", ["Texto a productos", "Cache de intenciones", "Productos no encontrados"]],
    ["bulb", "Buenas practicas", ["Organizar favoritos", "Registrar clientes", "Revisar analitica diaria"]],
    ["help", "Solucion de problemas", ["No conecta microfono", "No imprime", "Puter no conecta"]],
  ];
  const TIPS = [["bolt", "Vende mas rapido", "Usa favoritos para acceder a tus productos mas vendidos con un solo toque."], ["box", "Organiza tu catalogo", "Marca los productos frecuentes; apareceran en 'Mis productos' al instante."], ["list", "Uso de Lista de Pedido", "Escribe varios productos en texto libre y la IA los agrega todos a la vez."], ["mic", "Uso de venta por voz", "Dicta el pedido en lenguaje natural. La IA transcribe e interpreta automaticamente."], ["users", "Gestion de clientes", "Registra cada cliente con WhatsApp para enviar facturas y recordar cobros."], ["card", "Organizacion de creditos", "Asigna fecha de cobro y recibe avisos antes del vencimiento."], ["globe", "Portal Global de Suplidores", "Usa el catalogo global compartido para mantener precios consistentes."]];
  const FAQ = [["Como hago una venta manual?", "Toca + en el Panel, busca el producto, ajusta la cantidad y toca Cobrar."], ["Como vendo desde el catalogo?", "Abre Catalogo, toca el producto y se agrega al talonario."], ["Como funciona la venta por voz?", "Toca el microfono negro y dicta, por ejemplo: dos libras y media de arroz. La IA interpreta y te pide confirmar."], ["Que es la Lista de Pedido con IA?", "Una caja de texto donde escribes o dictas varios productos a la vez. La IA los cruza con tu catalogo."], ["Como comparto una factura por WhatsApp?", "Al cobrar toca Enviar por WhatsApp. Se abre el chat con el detalle de la venta."], ["Puedo enviar facturas en texto?", "Si. El detalle se envia como mensaje de texto ordenado."], ["Puedo enviar facturas en imagen?", "Puedes imprimir o guardar el ticket como imagen desde el boton de impresion."], ["Como funcionan los creditos?", "Elige A credito al cobrar, asigna cliente y fecha de cobro."], ["Como activo el ITBIS?", "En el Panel, el interruptor ITBIS 18% aplica o quita el impuesto de la venta."], ["Como registro un cliente?", "Al cobrar escribe el nombre del cliente. En Gestion de clientes guardas su WhatsApp."], ["Funciona sin internet?", "Si. Todo se guarda en tu telefono y sube solo cuando vuelve la conexion."]];
  const QUICK = [["cart", "Crear una venta", "Agrega productos y cobra en segundos."], ["users", "Registrar un cliente", "Guarda nombre, WhatsApp y direccion."], ["truck", "Registrar un proveedor", "Agrega proveedores con saldo inicial."], ["box", "Registrar una compra", "Registra movimientos de proveedor."], ["list", "Compartir una factura", "Envia facturas por WhatsApp."], ["print", "Imprimir factura", "Conecta tu impresora Bluetooth."], ["card", "Registrar credito", "Vende a credito con fecha de cobro."], ["tag", "Cobrar una deuda", "Registra pagos de clientes."], ["wa", "Configurar WhatsApp", "Conecta tu numero de WhatsApp."], ["print", "Configurar impresion", "Configura impresora termica ESC/POS."]];
  function renderSoporte() {
    $("#view").innerHTML = `
      <div class="hx-hero">
        <div class="hx-tt"><div class="hx-ic">${I.help}</div><div><h2>Centro de ayuda</h2><p>Todo lo que necesitas para operar PediPOS</p></div></div>
        <div class="hx-srch">${I.search}<input id="sq" placeholder="Buscar en la ayuda" autocomplete="off"></div>
        <div class="hx-st"><span class="dot" id="svcdot"></span><span id="svc">Operativo</span></div>
      </div>

      <h3 class="hx-h">Accesos rapidos</h3>
      <div class="hx-grid" id="hxq">${QUICK.map(([ic, t, p], i) => `<button class="hx-card" data-q="${i}"><span class="hx-ib">${I[ic]}</span><b>${t}</b><span>${p}</span></button>`).join("")}</div>

      <h3 class="hx-h">Guias por tema</h3>
      <div class="hx-list" id="hxd">${DOC.map(([ic, t, items], i) => `<div class="hx-acc" data-tema="${esc(t + " " + items.join(" "))}"><button class="hx-acc-b"><span class="hx-ib sm">${I[ic]}</span><b>${t}</b><i class="hx-n">${items.length}</i>${I.chev}</button><ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>

      <h3 class="hx-h">Preguntas frecuentes</h3>
      <div class="hx-list" id="hxf">${FAQ.map(([q, r], i) => `<div class="hx-faq" data-tema="${esc(q + " " + r)}"><button class="hx-faq-b"><span>${q}</span>${I.down}</button><div class="hx-a">${r}</div></div>`).join("")}</div>

      <h3 class="hx-h">Soporte directo</h3>
      <div class="hx-contact">
        <div class="hx-ct"><span class="hx-ib">${I.wa}</span><div><b>WhatsApp</b><span>829-646-9885</span></div></div>
        <div class="hx-ct"><span class="hx-ib">${I.mail}</span><div><b>Correo</b><span>domingoguerra688@gmail.com</span></div></div>
        <div class="hx-ct"><span class="hx-ib">${I.clock}</span><div><b>Horario</b><span>Lun a Sab &middot; 8:00 AM a 8:00 PM</span></div></div>
        <div class="hx-btns"><a href="https://wa.me/18296469885" target="_blank" rel="noopener" class="hx-b1">${I.wa} Escribir por WhatsApp</a><a href="mailto:domingoguerra688@gmail.com" class="hx-b2">${I.mail} Enviar correo</a></div>
      </div>
      <p class="hx-foot">PediPOS &middot; Sistema de gestion de pedidos para colmados, mini markets y almacenes. Hecho para el comercio dominicano.</p>`;

    /* acordeones */
    $$(".hx-acc-b").forEach((b) => (b.onclick = () => b.parentElement.classList.toggle("open")));
    $$(".hx-faq-b").forEach((b) => (b.onclick = () => b.parentElement.classList.toggle("open")));

    /* accesos rapidos */
    const GUIA = {
      "Crear una venta": () => go("panel"),
      "Registrar un cliente": () => go("clientes"),
      "Registrar un proveedor": () => go("proveedores"),
      "Registrar una compra": () => go("proveedores"),
      "Compartir una factura": () => go("historial"),
      "Imprimir factura": () => go("config"),
      "Registrar credito": () => go("clientes"),
      "Cobrar una deuda": () => go("clientes"),
      "Configurar WhatsApp": () => go("config"),
      "Configurar impresion": () => go("config"),
    };
    $$(".hx-card").forEach((b) => (b.onclick = () => {
      const t = QUICK[+b.dataset.q][1], f = GUIA[t];
      if (f) f(); else toast("Esta guia llega pronto");
    }));

    /* buscador: filtra temas y preguntas */
    const sq = $("#sq");
    sq.oninput = () => {
      const q = window.PPVoice.norm(sq.value);
      let sede = 0;
      $$("#hxd .hx-acc").forEach((el) => {
        const hit = !q || window.PPVoice.norm(el.dataset.tema).includes(q);
        el.style.display = hit ? "" : "none";
        if (hit && q) { el.classList.add("open"); sede++; }
        if (!q) el.classList.remove("open");
      });
      $$("#hxf .hx-faq").forEach((el) => {
        const hit = !q || window.PPVoice.norm(el.dataset.tema).includes(q);
        el.style.display = hit ? "" : "none";
        if (hit && q) { el.classList.add("open"); sede++; }
        if (!q) el.classList.remove("open");
      });
      $$("#hxq .hx-card").forEach((el) => {
        const t = window.PPVoice.norm(el.querySelector("b").textContent + " " + el.querySelector("span:last-child").textContent);
        el.style.display = !q || t.includes(q) ? "" : "none";
      });
      let vacio = $("#hxnone");
      if (q && !sede) {
        if (!vacio) { vacio = document.createElement("div"); vacio.id = "hxnone"; vacio.className = "empty"; vacio.textContent = "No encontramos resultados. Escribenos por WhatsApp."; $("#hxd").after(vacio); }
      } else if (vacio) vacio.remove();
    };

    /* estado real del servicio */
    const on = window.PPSync.state.online;
    $("#svc").textContent = on ? "Servicio operativo" : "Sin conexion (modo local)";
    $("#svcdot").classList.toggle("off", !on);
  }

  /* ---------- Menu lateral ---------- */
  function openMenu() {
    const items = [["panel", "Panel de venta", "ticket"], ["clientes", "Clientes y creditos", "group"], ["catalogo", "Catalogo", "box"], ["proveedores", "Proveedores", "truck2"],
      ["historial", "Pedidos", "bagnav"], ["analitica", "Analitica", "chart"], ["soporte", "Soporte", "help"], ["config", "Configuracion", "gear"]];
    const s = sheet(`<div class="sh-h"><h2>Men&uacute;</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      ${items.map(([k, t, ic]) => `<button class="mnu" data-g="${k}"><span class="mi">${I[ic]}</span><span>${t}</span>${I.chev}</button>`).join("")}`, null, { lado: true });
    $("#x", s).onclick = () => closeSheet();
    $$("[data-g]", s).forEach((b) => (b.onclick = () => { closeSheet(true); go(b.dataset.g); }));
  }
  /* ---------- Pedidos: listado con filtros ---------- */
  let pedFiltro = 9999;   /* rango: 4, 8 o todos */
  let pedTipo = "";       /* "", "pagado" o "credito" */
  let pedQ = "";
  function renderHistorial() {
    const q = window.PPVoice.norm(pedQ);
    const conFiltro = !!pedTipo;
    const esCredito = (s) => s.metodo === "credito";
    let L = db().sales.slice().reverse().filter((s) => {
      if (pedTipo === "credito" && !esCredito(s)) return false;
      if (pedTipo === "pagado" && esCredito(s)) return false;
      if (!q) return true;
      const f = new Date(s.fecha);
      const mes = f.toLocaleDateString("es-DO", { month: "long" });
      const anio = String(f.getFullYear());
      const tipo = esCredito(s) ? "a credito credito fiado pendiente" : "pagado contado efectivo";
      return window.PPVoice.norm([s.cliente || "sin cliente", mes, anio, tipo].join(" ")).includes(q);
    });

    $("#view").innerHTML = `<div class="stickbar">
        <div class="searchrow">
          <div class="search">${I.search}<input id="pq2" placeholder="Buscar pedido" value="${esc(pedQ)}" autocomplete="off"></div>
          <button class="fbtn ${conFiltro ? "on" : ""}" id="pfil" aria-label="Filtrar pedidos">${I.filtro}</button>
        </div>
        <div class="filtro-pop" id="pfp" hidden>
          <button class="fopt ${pedTipo === "" ? "on" : ""}" data-t="">Todos ${I.check}</button>
          <button class="fopt ${pedTipo === "pagado" ? "on" : ""}" data-t="pagado">Pagados ${I.check}</button>
          <button class="fopt ${pedTipo === "credito" ? "on" : ""}" data-t="credito">A credito ${I.check}</button>
        </div>
      </div>` +
      (L.length ? L.map((s) => {
        const est = esCredito(s) ? "A credito" : "Pagado";
        return `<button class="ord" data-v="${esc(s.vid)}">
          <div class="ord-t"><b>${esc(s.cliente || "Sin cliente")}</b><span class="badge ${esCredito(s) ? "cred" : ""}">${est}</span></div>
          <div class="ord-b"><span>${new Date(s.fecha).toLocaleString("es-DO", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}</span><b>${money(s.total)}</b></div>
        </button>`;
      }).join("") : '<div class="card"><div class="cnt">No hay pedidos que coincidan con esa busqueda.</div></div>');

    const inp = $("#pq2");
    inp.oninput = (e) => {
      pedQ = e.target.value;
      const pos = e.target.selectionStart;
      renderHistorial();
      const n2 = $("#pq2"); if (n2) { n2.focus(); n2.setSelectionRange(pos, pos); }
    };
    const pp = $("#pfp");
    $("#pfil").onclick = () => alternarFiltro($("#pfil"), pp);
    $$("[data-t]", pp).forEach((b) => (b.onclick = () => { pedTipo = b.dataset.t; renderHistorial(); }));
    $$(".ord", $("#view")).forEach((b) => (b.onclick = () => openDetalle(db().sales.find((x) => x.vid === b.dataset.v))));
  }

  /* Hoja de filtros: tipo de venta y rango. */
  function abrirFiltroPedidos() {
    const s = sheet(`<div class="sh-h compacta"><h2>Filtrar pedidos</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <p class="lbl" style="margin:2px 2px 8px">TIPO DE VENTA</p>
      <div class="fopts">
        <button class="fopt ${pedTipo === "" ? "on" : ""}" data-t="">Todos ${I.check}</button>
        <button class="fopt ${pedTipo === "pagado" ? "on" : ""}" data-t="pagado">Pagados ${I.check}</button>
        <button class="fopt ${pedTipo === "credito" ? "on" : ""}" data-t="credito">A credito ${I.check}</button>
      </div>
      <p class="lbl" style="margin:14px 2px 8px">CANTIDAD</p>
      <div class="fopts">
        <button class="fopt ${pedFiltro === 4 ? "on" : ""}" data-r="4">Ultimos 4 ${I.check}</button>
        <button class="fopt ${pedFiltro === 8 ? "on" : ""}" data-r="8">Ultimos 8 ${I.check}</button>
        <button class="fopt ${pedFiltro >= 9000 ? "on" : ""}" data-r="9999">Todo el historial ${I.check}</button>
      </div>
      <button class="btn sec" id="plimpia" style="margin-top:14px">Quitar filtros</button>`);
    $("#x", s).onclick = closeSheet;
    $$("[data-t]", s).forEach((b) => (b.onclick = () => { pedTipo = b.dataset.t; closeSheet(true); renderHistorial(); }));
    $$("[data-r]", s).forEach((b) => (b.onclick = () => { pedFiltro = parseInt(b.dataset.r, 10); closeSheet(true); renderHistorial(); }));
    $("#plimpia", s).onclick = () => { pedTipo = ""; pedFiltro = 9999; closeSheet(true); renderHistorial(); };
  }

  /* ---------- Detalle del pedido ---------- */
  /* 5/11/2026 - 11:39 a. m. */
  function fechaCorta(f) {
    const d = new Date(f);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("es-DO") + " - " + d.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
  }

  function openDetalle(s) {
    if (!s) return;
    const st = db().settings;
    const lineas = lineasDe(s).map((l) => `<div class="dl"><div><b>${esc(l.nombre)}</b><span>${num(l.cant)} ${esc(l.unidad || "unid.")} &middot; ${money(l.precio)} c/u</span></div><b>${money(l.cant * l.precio)}</b></div>`).join("");
    const pagado = s.metodo !== "credito";
    const sh = sheet(`<div class="sh-h"><h2><span class="hi">${I.ticket}</span>Ticket del pedido</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <div class="tk-body">
      <div class="mch grande"><b>${esc(st.negocio || "Mi negocio")}</b><span>${esc(st.direccion || "Sin direccion registrada")}</span><span>${esc(st.telefono || "")}</span></div>
      <div class="strow"><span class="stt ${pagado ? "" : "cred"}">${pagado ? I.ok : I.card} ${pagado ? "PAGADO" : "A CREDITO"}</span><span class="cnt">${fechaCorta(s.fecha)}</span></div>
      <div class="dsum"><div class="r"><span>CLIENTE</span><span>${esc(s.cliente || "Sin cliente")}</span></div></div>
      <div class="dlh"><span>PRODUCTO</span><span>TOTAL</span></div>
      <div class="dls">${lineas}</div>
      <div class="dsum">
        <div class="r"><span>Subtotal</span><span>${money2(s.subtotal)}</span></div>
        <div class="r it"><span>ITBIS (${Math.round((s.aplica_itbis ? rate() : 0) * 100)}%)</span><span>${money2(s.itbis)}</span></div>
        <div class="r tot"><span>TOTAL</span><span>${money2(s.total)}</span></div>
        ${s.fecha_pago ? `<div class="r"><span>Pago prometido</span><span>${new Date(s.fecha_pago + "T12:00:00").toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}</span></div>` : ""}
        ${s.recibido ? `<div class="r"><span>Recibido</span><span>${money2(s.recibido)}</span></div><div class="r chg"><span>Cambio</span><span>${money2(s.cambio || 0)}</span></div>` : ""}
      </div>
      ${s.foto ? `<img class="comp" src="${s.foto}" alt="Comprobante">` : ""}
      </div>
      <div class="sh-f fijo"><button class="big slim miniwa" id="send">${I.wa} <span class="bl">Enviar Ticket</span></button>
        <button class="m negro" id="prt" aria-label="Imprimir">${I.print}</button>
        </div>`);
    $("#x", sh).onclick = closeSheet;
    $("#send", sh).onclick = () => enviarTicketWa(s, waDeVenta(s));
    $("#img", sh).onclick = async () => {
      try {
        const c = window.PPTicket.lienzoVenta(s, { negocio: db().settings.negocio || "Mi negocio", direccion: db().settings.direccion || "", telefono: db().settings.telefono || "" });
        const r = await window.PPTicket.compartir(c, "ticket-" + (s.vid || "pedido") + ".png");
        if (r === "descargado") toast("Imagen guardada. Adjuntala en WhatsApp");
        else if (r === "compartido") toast("Ticket compartido");
      } catch (e) { toast("No se pudo generar la imagen"); }
    };
    $("#prt", sh).onclick = () => {
      window.PPTicket.imprimirConVentana(window.PPTicket.lineasVenta(s, db().settings.negocio || "Mi negocio", db().settings.direccion || "", db().settings.telefono || ""), "ticket");
    };

  }
  function renderConfig() {
    const st = db().settings;
    $("#view").innerHTML = `<div class="card"><label class="field"><span>Nombre del negocio</span><input id="cn" value="${esc(st.negocio)}"></label>
      <label class="field"><span>Direccion del negocio</span><input id="cd" value="${esc(st.direccion || "")}" placeholder="Calle, numero, sector"></label>
      <label class="field"><span>Telefono del negocio</span><input id="ct2" value="${esc(st.telefono || "")}" placeholder="8090000000"></label>
      <label class="field"><span>ITBIS (%)</span><input id="ci" inputmode="decimal" value="${Math.round(st.itbisRate * 100)}"></label>
      <button class="btn" id="cs">Guardar</button></div>
      <div class="card"><h3>Caja y acceso</h3>
        <div class="line" style="font-size:13px"><span>Sesion</span><b>${db().session ? esc(db().session.nombre + " · " + db().session.rol) : "sin iniciar"}</b></div>
        <label class="field" style="margin-top:8px"><span>Pedir PIN al abrir</span><select id="cr"><option value="0" ${st.pinReq ? "" : "selected"}>No</option><option value="1" ${st.pinReq ? "selected" : ""}>Si</option></select></label>
        <button class="btn sec" id="cses">${db().session ? "Cerrar sesion" : "Iniciar sesion"}</button>
        <button class="btn sec" id="cbm" style="margin-top:8px">Emparejar impresora Bluetooth</button>
        <div class="cnt" style="font-size:11.5px;margin-top:6px" id="bti">${localStorage.getItem("pedipos.printer") ? "Impresora: " + esc(localStorage.getItem("pedipos.printer")) : "Sin impresora emparejada"}</div>
      </div>
      <div class="card"><h3>Sincronizacion</h3><div class="cnt" id="syn"></div><button class="btn sec" id="sy">Sincronizar ahora</button></div>`;
    $("#cr").onchange = (e) => { st.pinReq = e.target.value === "1"; S.save(); toast(st.pinReq ? "Se pedira PIN al abrir" : "Sin PIN al abrir"); };
    $("#cses").onclick = () => { if (db().session) { db().session = null; S.save(); toast("Sesion cerrada"); render(); } else loginScreen(); };
    $("#cbm").onclick = async () => {
      try { const n = await window.PPExtra.btConectar(); toast("Impresora: " + n); render(); }
      catch (e) { toast(String(e.message || e)); }
    };
    $("#cs").onclick = () => { st.negocio = $("#cn").value.trim() || "Mi negocio"; st.direccion = ($("#cd") ? $("#cd").value.trim() : ""); st.telefono = ($("#ct2") ? $("#ct2").value.trim() : ""); const r = parseFloat($("#ci").value); if (r >= 0 && r <= 100) st.itbisRate = r / 100; S.save(); toast("Guardado"); };
    const paint = () => ($("#syn") && ($("#syn").textContent = (window.PPSync.state.online ? "Conectado" : "Sin conexion") + " · " + window.PPSync.state.pending + " pendiente(s)"));
    paint(); $("#sy").onclick = async () => { await window.PPSync.flush(); await window.PPSync.pull(); paint(); toast("Sincronizado"); };
  }

  function render() {
    clearFab();
    if (tab === "panel") renderPanel();
    else if (tab === "catalogo") renderCatalogo();
    else if (tab === "soporte") renderSoporte();
    else if (tab === "analitica") renderAnalitica();
    else if (tab === "clientes") renderClientes();
    else if (tab === "proveedores") renderProveedores();
    else if (tab === "historial") renderHistorial();
    else if (tab === "config") renderConfig();
    else if (tab === "avisos") renderAvisos();
  }

  /* ---------- Acceso con PIN ---------- */
  function loginScreen() {
    const users = db().users || [];
    const s = sheet(`<div class="sh-h"><h2>Entrar a la caja</h2></div>
      <p class="cnt" style="margin:0 0 10px">Elige tu usuario y escribe el PIN.</p>
      <label class="field"><span>Usuario</span><select id="lu">${users.map((u) => `<option value="${esc(u.uid)}">${esc(u.nombre)} · ${esc(u.rol)}</option>`).join("")}</select></label>
      <label class="field"><span>PIN</span><input id="lp" inputmode="numeric" type="password" maxlength="6" placeholder="••••"></label>
      <button class="btn" id="lin">Entrar</button>
      <p class="cnt" style="margin-top:10px;font-size:11.5px">PIN inicial: 1234 (administrador) o 0000 (caja). Cambialo en Configuracion.</p>`);
    const go2 = () => {
      const uid = s.querySelector("#lu").value, pin = s.querySelector("#lp").value.trim();
      const u = users.find((x) => x.uid === uid);
      if (!u || String(u.pin || "") !== pin) return toast("PIN incorrecto");
      if (u.activo === false) return toast("Usuario inactivo");
      db().session = { uid: u.uid, nombre: u.nombre, rol: u.rol };
      S.save(); closeSheet(); toast("Bienvenido, " + u.nombre); render();
    };
    s.querySelector("#lin").onclick = go2;
    s.querySelector("#lp").oninput = (e) => { if (e.target.value.length >= 4) go2(); };
  }

  /* ---------- Tarjeta de instalacion (fija arriba hasta deslizarla o descargar) ---------- */
  const INS_OFF = "pedipos.install.off", INS_DONE = "pedipos.install.done";
  const esStandalone = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true;
  function esIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function esAndroid() { return /android/i.test(navigator.userAgent); }

  function initInstall() {
    const bar = $("#instbar");
    if (!bar) return;
    /* ya instalada, o descartada hace poco: no se muestra */
    if (esStandalone() || localStorage.getItem(INS_DONE)) return;
    if (Number(localStorage.getItem(INS_OFF) || 0) > Date.now() - 7 * 864e5) return;

    const sub = $("#instsub");
    if (sub && esIOS() && !window.__ppInstallPrompt) sub.textContent = "Toca Descargar y sigue 2 pasos";

    const cerrar = (anim) => {
      if (anim === false) { bar.hidden = true; return; }
      bar.classList.add("out");
      setTimeout(() => { bar.hidden = true; bar.classList.remove("out"); }, 230);
    };
    const descartar = () => { localStorage.setItem(INS_OFF, String(Date.now())); cerrar(); };

    /* --- deslizar a los lados para ocultarla --- */
    let x0 = 0, y0 = 0, dx = 0, arrastrando = false;
    bar.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; arrastrando = true;
      bar.classList.add("drag");
    }, { passive: true });
    bar.addEventListener("touchmove", (e) => {
      if (!arrastrando) return;
      const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 12) { arrastrando = false; bar.classList.remove("drag"); bar.style.transform = ""; return; }
      dx = mx;
      bar.style.transform = "translateX(" + dx + "px)";
      bar.style.opacity = String(Math.max(.25, 1 - Math.abs(dx) / 260));
    }, { passive: true });
    const soltar = () => {
      if (!arrastrando) return;
      arrastrando = false; bar.classList.remove("drag");
      if (Math.abs(dx) > 70) { bar.style.transform = ""; bar.style.opacity = ""; descartar(); }
      else { bar.style.transform = ""; bar.style.opacity = ""; }
      dx = 0;
    };
    bar.addEventListener("touchend", soltar);
    bar.addEventListener("touchcancel", soltar);

    /* --- boton Descargar --- */
    $("#instbtn").onclick = async () => {
      const p = window.__ppInstallPrompt;
      if (!p) return guiaInstalar();
      let r = null;
      try {
        p.prompt();
        /* si el navegador no responde (o cancela en silencio), a los 2.5 s se muestran los pasos */
        r = await Promise.race([p.userChoice, new Promise((ok) => setTimeout(() => ok(null), 2500))]);
      } catch (_) { r = null; }
      if (r && r.outcome === "accepted") {
        window.__ppInstallPrompt = null; localStorage.setItem(INS_DONE, "1");
        cerrar(); toast("Instalando PediPOS..."); return;
      }
      if (r && r.outcome === "dismissed") { toast("Toca Descargar cuando quieras instalarla"); return; }
      guiaInstalar();
    };

    /* aparece sola, sin empujar el contenido de golpe */
    bar.hidden = false;
    bar.classList.add("vin");
    setTimeout(() => bar.classList.remove("vin"), 400);
  }

  /* Instrucciones cuando el telefono no ofrece el aviso automatico (iPhone, o Chrome sin aviso). */
  function guiaInstalar() {
    const pasos = esIOS()
      ? ["Abre esta pagina en Safari.", "Toca el boton Compartir (el cuadro con la flecha hacia arriba).", "Elige Anadir a pantalla de inicio y confirma con Anadir."]
      : esAndroid()
        ? ["Abre el menu del navegador (los tres puntos arriba a la derecha).", "Toca Instalar aplicacion o Anadir a pantalla principal.", "Confirma con Instalar."]
        : ["Abre el menu del navegador.", "Busca Instalar aplicacion o Anadir a pantalla principal.", "Confirma con Instalar."];
    const s = sheet(`<div class="sh-h"><h2>Instalar PediPOS</h2><button class="sh-x" id="x">${I.xDown}</button></div>
      <p class="cnt" style="margin:0 0 12px">Queda como una app en tu telefono y abre sin internet.</p>
      <div class="iguide">${pasos.map((t, i) => `<div class="st"><span class="n">${i + 1}</span><p>${esc(t)}</p></div>`).join("")}</div>
      <button class="big" id="iok" style="width:100%;margin-top:16px">${I.check} Entendido</button>`);
    $("#x", s).onclick = () => closeSheet();
    /* cerrar la guia no borra la tarjeta: sigue arriba hasta deslizarla o instalar */
    $("#iok", s).onclick = () => closeSheet();
  }

  /* ---------- Conexion y arranque ---------- */
  function netbar() {
    const b = $("#netbar"), st = window.PPSync.state;
    if (!st.online) { b.hidden = true; b.textContent = ""; }
    else if (st.pending) { b.hidden = false; b.className = "netbar ok"; b.textContent = "Enviando " + st.pending + " pendiente(s)..."; }
    else b.hidden = true;
  }
  window.addEventListener("pp:sync", () => { netbar(); revisarAvisos(); });
  /* Solo se redibuja si los datos de la nube realmente cambiaron: antes cada sincronizacion
     (cada 30 s) repintaba la pantalla y la animacion de entrada parecia "parpadear". */
  let huella = "";
  const firma = () => {
    const d = db();
    return [d.products.length, d.sales.length, (d.clients || []).length, (d.providers || []).length,
      d.sales.map((s) => s.vid + (s.pagada ? "1" : "0")).join(","),
      (d.clients || []).map((c) => c.cid + c.nombre + (c.direccion || "")).join(","),
      (d.providers || []).map((p) => p.prid + p.nombre + (p.compras || []).length + (p.pagos || []).length).join(","),
      d.products.map((p) => p.pid + p.nombre + p.precio + p.stock + (p.img ? p.img.length : 0)).join(",")].join("|");
  };
  huella = firma();
  window.addEventListener("pp:data", () => {
    const nueva = firma();
    if (nueva === huella) return;            /* nada cambio: no se toca la pantalla */
    huella = nueva;
    pintarBurbuja();
    if (document.getElementById("sheet") || voice.phase !== "idle" || tab === "panel" || MIC.activo) return;
    if (document.body.classList.contains("focus")) return;          /* no interrumpir un detalle abierto */
    const pop = document.querySelector(".filtro-pop:not([hidden])");
    if (pop) return;                                                  /* ni un filtro desplegado */
    const act = document.activeElement;
    if (act && /INPUT|TEXTAREA|SELECT/.test(act.tagName)) return;     /* ni mientras se escribe */
    render();
  });
  window.addEventListener("resize", () => ajustarAltoTalonario());
  window.addEventListener("pp:quota", () => toast("Espacio casi lleno. Se libero historial antiguo."));
  window.PPUI = { sheet, closeSheet, toast, render, go, I, money, money2, esc, cart, tot, rate, db, initInstall, guiaInstalar, waLink, chatear, tap, setFab, clearFab, detalle: openDetalle, animarTal: window.animarTal };
  $("#btnMenu").onclick = openMenu;
  $("#btnBell").onclick = () => { marcarLeidos(); go("avisos"); };
  go("panel"); netbar(); revisarAvisos(); window.PPSync.start(); initInstall();
  addEventListener("pp:installable", () => { const b = $("#instbar"); if (b && b.hidden && !localStorage.getItem(INS_DONE)) { localStorage.removeItem(INS_OFF); b.hidden = false; } });
  addEventListener("pp:installed", () => { localStorage.setItem(INS_DONE, "1"); const b = $("#instbar"); if (b) { b.hidden = true; } toast("PediPOS instalada"); });
  if (db().settings.pinReq && !db().session) setTimeout(loginScreen, 260);
})();
