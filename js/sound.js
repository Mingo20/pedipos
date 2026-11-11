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

  function tock() {
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
    g.gain.exponentialRampToValueAtTime(0.20, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.1);

    /* chasquido: da la sensacion de madera, no de pitido */
    const largo = Math.floor(c.sampleRate * 0.02);
    const buf = c.createBuffer(1, largo, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 7);
    const n = c.createBufferSource();
    const ng = c.createGain();
    ng.gain.value = 0.07;
    n.buffer = buf;
    n.connect(ng); ng.connect(c.destination);
    n.start(t);
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

  window.PPSound = { tock };
})();
