/* PediPOS: venta por voz. Dictado -> texto -> DeepSeek (via Puter) cruza con el catalogo -> lineas del pedido.
   El costo de la IA corre en la cuenta Puter de cada usuario. */
(function () {
  "use strict";

  const NUM = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20 };
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s.,/]/g, " ").replace(/\s+/g, " ").trim();

  /* ---------- Dictado (reconocimiento del navegador; Whisper de Puter como respaldo) ---------- */
  let rec = null, listening = false;
  function supportsDictation() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }

  /* Limpia repeticiones que el reconocedor de Android suele producir
     ("dos leches dos leches", o una frase que reaparece al final de la siguiente). */
  function dedupe(txt) {
    let w = String(txt || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (w.length < 2) return w.join(" ");
    const k = (x) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    /* 1) palabra repetida seguida: "leches leches" -> "leches" (no toca numeros: "2 2" puede ser real) */
    w = w.filter((x, i) => i === 0 || k(x) !== k(w[i - 1]) || /^\d+$/.test(k(x)));
    /* 2) bloque repetido seguido de n palabras: "a b c a b c" -> "a b c" */
    let changed = true;
    while (changed) {
      changed = false;
      for (let n = Math.floor(w.length / 2); n >= 2; n--) {
        for (let i = 0; i + 2 * n <= w.length; i++) {
          let same = true;
          for (let j = 0; j < n; j++) if (k(w[i + j]) !== k(w[i + n + j])) { same = false; break; }
          if (same) { w.splice(i + n, n); changed = true; break; }
        }
        if (changed) break;
      }
    }
    return w.join(" ");
  }

  function startDictation(onText, onEnd, onError) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onError && onError("no-soportado"); return false; }
    rec = new SR();
    rec.lang = "es-DO";
    rec.interimResults = true;
    rec.continuous = false;          /* una frase por vez: evita que Android re-emita resultados acumulados */
    rec.maxAlternatives = 1;
    let committed = "";               /* frases ya cerradas en tandas anteriores */
    let current = "";                 /* lo que lleva la tanda actual */
    let wantStop = false, errored = false;

    rec.onresult = (e) => {
      /* se reconstruye SIEMPRE desde e.results completo (no se suma a lo anterior) */
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      current = t.replace(/\s+/g, " ").trim();
      onText && onText(dedupe((committed + " " + current).trim()));
    };
    rec.onerror = (e) => {
      const code = e.error || "error";
      if (code === "no-speech" || code === "aborted") return;   /* no es fatal: onend decide */
      errored = true; listening = false; onError && onError(code);
    };
    rec.onend = () => {
      if (current) { committed = (committed + " " + current).trim(); current = ""; }
      /* si el usuario no pidio parar, reabre para seguir escuchando sin duplicar lo ya cerrado */
      if (!wantStop && !errored && listening) {
        try { rec.start(); return; } catch (_) { /* cae a cierre */ }
      }
      wantStop = true;
      listening = false;
      if (!errored) onEnd && onEnd(dedupe(committed));
    };
    rec._stop = () => { wantStop = true; };
    try { rec.start(); listening = true; return true; }
    catch (e) { onError && onError("no-iniciado"); return false; }
  }
  function stopDictation() { try { rec && rec._stop && rec._stop(); rec && rec.stop(); } catch (_) {} listening = false; }

  /* ---------- Grabacion + Whisper (respaldo cuando el navegador no dicta) ----------
     Se graba con MediaRecorder y se transcribe con puter.ai.speech2txt (Whisper).
     El costo corre en la cuenta Puter del usuario. */
  let mediaRec = null, chunks = [], stopping = false;

  function canRecord() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  async function startRecording() {
    if (!canRecord()) throw new Error("grabadora no disponible");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = []; stopping = false;
    mediaRec = new MediaRecorder(stream);
    mediaRec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    mediaRec.start();
    listening = true;
    return stream;
  }

  /* pausa / continua la grabacion en curso (MediaRecorder.pause / resume) */
  function pauseRecording() { try { if (mediaRec && mediaRec.state === "recording") { mediaRec.pause(); return true; } } catch (_) {} return false; }
  function resumeRecording() { try { if (mediaRec && mediaRec.state === "paused") { mediaRec.resume(); return true; } } catch (_) {} return false; }

  function stopRecording() {
    stopping = true; listening = false;
    return new Promise((resolve) => {
      if (!mediaRec) return resolve(null);
      mediaRec.onstop = () => {
        try { mediaRec.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
        const blob = new Blob(chunks, { type: (chunks[0] && chunks[0].type) || "audio/webm" });
        mediaRec = null;
        resolve(blob.size > 1200 ? blob : null);
      };
      try { mediaRec.stop(); } catch (_) { resolve(null); }
    });
  }

  async function recordAndTranscribe() {
    const blob = await stopRecording();
    if (!blob) return "";
    return await transcribeBlob(blob);
  }

  /* Whisper por Puter: transcribe un audio grabado cuando el navegador no tiene dictado. */
  async function transcribeBlob(blob) {
    if (!window.puter || !puter.ai || !puter.ai.speech2txt) throw new Error("Puter no disponible");
    const r = await puter.ai.speech2txt(blob);
    return String(r && (r.text || r) || "").trim();
  }

  /* ---------- Cache de intenciones: frase ya resuelta = cero costo ---------- */
  const CKEY = "pedipos.intent.v1";
  const cacheGet = (k) => { try { return (JSON.parse(localStorage.getItem(CKEY) || "{}"))[k]; } catch (_) { return null; } };
  const cacheSet = (k, v) => {
    try {
      const c = JSON.parse(localStorage.getItem(CKEY) || "{}");
      const keys = Object.keys(c);
      if (keys.length > 200) delete c[keys[0]];
      c[k] = v;
      localStorage.setItem(CKEY, JSON.stringify(c));
    } catch (_) {}
  };

  /* ---------- Interpretacion local (sin red): cantidades y unidades en lenguaje dominicano ---------- */
  function parseQty(text) {
    let t = norm(text).replace(/\blibras?\b|\blbs?\b|\bunidades?\b|\bde\b/g, " ").replace(/\s+/g, " ").trim();
    t = t.replace(/\btres cuartos\b/g, "0.75").replace(/\bun cuarto\b|\bcuarto\b/g, "0.25");
    /* palabras-numero -> cifras (una, dos, tres...) */
    t = t.split(" ").map((w) => (NUM[w] !== undefined ? String(NUM[w]) : w)).join(" ");
    let m = t.match(/(\d+(?:[.,]\d+)?)\s*y\s*media/);
    if (m) return parseFloat(m[1].replace(",", ".")) + 0.5;
    m = t.match(/(\d+)\s*y\s*(tres cuartos|cuarto)/);
    if (m) return parseInt(m[1], 10) + (m[2] === "cuarto" ? 0.25 : 0.75);
    if (/\b(media|medio)\b/.test(t)) return 0.5;
    if (/\btres cuartos\b/.test(t)) return 0.75;
    if (/\bcuarto\b/.test(t)) return 0.25;
    m = t.match(/(\d+(?:[.,]\d+)?)/);
    if (m) return parseFloat(m[1].replace(",", "."));
    return 1;
  }

  const STOP = new Set(["libra", "libras", "lb", "lbs", "media", "medio", "cuarto", "cuartos", "tres", "dos", "un", "una", "uno", "de", "del", "la", "el", "los", "las", "y", "unidad", "unidades", "quiero", "dame", "ponme", "pon"]);
  function scoreName(frag, name) {
    const a = norm(frag).split(" ").filter((w) => w.length > 2 && !STOP.has(w) && !/^\d/.test(w));
    const b = norm(name).split(" ");
    if (!a.length) return 0;
    let hit = 0;
    for (const w of a) if (b.some((x) => x === w || x.startsWith(w) || w.startsWith(x))) hit++;
    return hit / Math.max(a.length, b.length);
  }

  function localParse(text, products) {
    const numWords = Object.keys(NUM).join("|");
    /* "libra y media", "2 y media", "1 y cuarto" completan una cantidad: se protegen antes de cortar. */
    const PROT = "\u0001";
    const guarded = String(text).replace(
      new RegExp("((?:\\d+(?:[.,]\\d+)?|" + numWords + ")\\s*(?:libras?|lbs?|unidades?)?\\s*)y(\\s+(?:media|medio|cuarto|tres cuartos)\\b)", "gi"),
      "$1" + PROT + "$2");
    const splitter = new RegExp("\\s*(?:,|\\by\\s+(?=\\d|(?:" + numWords + "|media|medio)\\b)|\\bmas\\b|\\bademas\\b|\\btambien\\b)\\s*", "i");
    /* "arroz, pollo y huevos": una "y" tambien separa cuando lo que sigue empieza con un producto del catalogo. */
    const firstWords = [...new Set(products.map((p) => norm(p.nombre).split(" ")[0]).filter((w) => w.length > 2))];
    let cut = guarded;
    if (firstWords.length) cut = cut.replace(new RegExp("\\s+y\\s+(?=(?:" + firstWords.join("|") + ")\\b)", "gi"), ", ");
    const parts = cut.split(splitter).filter(Boolean).map((s) => s.split(PROT).join("y"));
    const lines = [], missing = [];
    for (const part of parts) {
      let best = null, bs = 0;
      for (const p of products) { const s = scoreName(part, p.nombre); if (s > bs) { bs = s; best = p; } }
      if (best && bs >= 0.4) lines.push({ pid: best.pid, nombre: best.nombre, precio: best.precio, unidad: best.unidad, cant: parseQty(part) });
      else missing.push(part.trim());
    }
    return { lines, missing };
  }

  /* ---------- Interpretacion semantica con DeepSeek (Puter). Cae a lo local si no hay red/cuenta. ---------- */
  async function interpret(text, products, onProgress) {
    const key = norm(text);
    const hit = cacheGet(key);
    if (hit) { onProgress && onProgress(100); return { ...hit, cached: true }; }

    const tick = (n) => onProgress && onProgress(n);
    tick(8);
    const catalog = products.filter((p) => p.activo !== false).map((p) => ({ id: p.pid, nombre: p.nombre, unidad: p.unidad, precio: p.precio }));
    const prompt =
      "Eres el asistente de un colmado dominicano. Convierte el pedido hablado en lineas usando SOLO este catalogo.\n" +
      "Catalogo JSON: " + JSON.stringify(catalog) + "\n" +
      "Pedido: \"" + text + "\"\n" +
      "Reglas: 'libra y media'=1.5, 'media libra'=0.5, '2 libra y media' = 2.5 libras; 'dos leches' = 2 unidades. " +
      "Empareja por significado aunque el nombre no sea exacto (ej. 'arroz campo' = 'Arroz Campo'). " +
      "Si un producto no esta en el catalogo, ponlo en 'no_encontrados' y NO lo inventes. " +
      "Responde SOLO JSON: {\"lineas\":[{\"id\":\"\",\"cant\":0}],\"no_encontrados\":[\"\"]}";

    let sem = null;
    try {
      tick(25);
      if (!window.puter || !puter.ai) throw new Error("sin puter");
      const r = await puter.ai.chat(prompt, false, { model: "deepseek-chat" });
      tick(70);
      const raw = String((r && r.message && r.message.content) || r || "");
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) sem = JSON.parse(m[0]);
    } catch (_) { sem = null; }

    let out;
    if (sem && Array.isArray(sem.lineas)) {
      const byId = new Map(products.map((p) => [p.pid, p]));
      const lines = [];
      for (const l of sem.lineas) {
        const p = byId.get(l.id);
        const cant = Number(l.cant);
        if (p && cant > 0) lines.push({ pid: p.pid, nombre: p.nombre, precio: p.precio, unidad: p.unidad, cant });
      }
      out = { lines, missing: Array.isArray(sem.no_encontrados) ? sem.no_encontrados.filter(Boolean) : [], via: "deepseek" };
    }
    if (!out || (!out.lines.length && !out.missing.length)) {
      const loc = localParse(text, products);
      out = { ...loc, via: "local" };
    }
    tick(100);
    if (out.lines.length) cacheSet(key, { lines: out.lines, missing: out.missing, via: out.via });
    return out;
  }

  window.PPVoice = { dedupe, supportsDictation, startDictation, stopDictation, transcribeBlob, canRecord, startRecording, stopRecording, pauseRecording, resumeRecording, recordAndTranscribe, get recording() { return !!mediaRec; }, interpret, localParse, parseQty, norm, get listening() { return listening; } };
})();
