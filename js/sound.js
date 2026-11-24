/* Sonido seco de toque: un "tock" corto, sin tono musical.
   Se genera en el momento, no descarga nada. */
(function () {
  let ctx = null;

  function audio() {
    try {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ctx = new C();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (_) { return null; }
  }

  let ultimoTock = 0;
  function tock() {
    /* el mismo toque puede llegar desde el listener global y desde el codigo:
       se ignora el segundo disparo para que suene una sola vez */
    const ahora = Date.now();
    if (ahora - ultimoTock < 70) return;
    ultimoTock = ahora;
    const c = audio();
    if (!c) return;
    const t = c.currentTime;

    /* cuerpo: un golpe corto que baja de tono */
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(330, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.1);

    /* chasquido: da la sensacion de madera, no de pitido */
    const largo = Math.floor(c.sampleRate * 0.02);
    const buf = c.createBuffer(1, largo, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 7);
    const n = c.createBufferSource();
    const ng = c.createGain();
    ng.gain.value = 0.04;
    n.buffer = buf;
    n.connect(ng); ng.connect(c.destination);
    n.start(t);
  }

  /* Confirmacion de grabacion: dos tonos claros y fuertes, como el aviso de una nota de voz.
     Se pide desde el toque del microfono, asi el navegador deja sonar el audio. */
  let ultimoGrabar = 0;
  function grabar() {
    const ahora = Date.now();
    if (ahora - ultimoGrabar < 500) return;
    ultimoGrabar = ahora;
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    [[784, 0], [1175, 0.11]].forEach(function (par) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(par[0], t + par[1]);
      g.gain.setValueAtTime(0.0001, t + par[1]);
      g.gain.exponentialRampToValueAtTime(0.3, t + par[1] + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + par[1] + 0.19);
      o.connect(g); g.connect(c.destination);
      o.start(t + par[1]); o.stop(t + par[1] + 0.22);
    });
    /* refuerzo grave: da cuerpo y suena mas fuerte en el altavoz del telefono */
    const o2 = c.createOscillator();
    const g2 = c.createGain();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(392, t);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.22, t + 0.016);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o2.connect(g2); g2.connect(c.destination);
    o2.start(t); o2.stop(t + 0.24);
  }

  /* todo lo que debe sonar al tocarse */
  const SEL = [
    "#bList", "#bPlus", "#bSearch",     /* lista de pedido, mas y producto */
    "#btnBell", "#btnMenu",             /* campana y menu del encabezado */
    ".fbtn",                            /* filtros junto a los buscadores */
    ".fab",                             /* botones + flotantes */
    ".mnu",                             /* enlaces del menu lateral */
    ".sh-x", ".inv-b",                  /* flechas de cerrar y volver */

  ].join(",");

  document.addEventListener("pointerdown", (e) => {
    const el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (el) tock();
  }, true);

  window.PPSound = { tock, grabar };
})();
