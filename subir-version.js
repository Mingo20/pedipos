#!/usr/bin/env node
/* Sube la version en todos los sitios a la vez para que no vuelva a
   desincronizarse el HTML con version.json (eso causaba las recargas). */
const fs = require("fs");
const path = require("path");
const dir = "/app/conversations/69ff4798777455158dc74b38/pedipos";
const nueva = process.argv[2];
if (!nueva) { console.error("Falta el numero de version"); process.exit(1); }
const anterior = JSON.parse(fs.readFileSync(path.join(dir, "version.json"), "utf8")).v;
const leer = (f) => fs.readFileSync(path.join(dir, f), "utf8");
const escribir = (f, t) => fs.writeFileSync(path.join(dir, f), t);

/* index.html: query strings y la constante VERSION */
let html = leer("index.html").split("?v=" + anterior).join("?v=" + nueva);
html = html.replace(/var VERSION="[^"]*"/, 'var VERSION="' + nueva + '"');
escribir("index.html", html);

/* sw.js: nombre de cache, lista de assets y version */
let sw = leer("sw.js").split("?v=" + anterior).join("?v=" + nueva);
sw = sw.replace(/pedipos-v[\d.]+/, "pedipos-v" + nueva);
sw = sw.replace(/const ASSETS = \[[\s\S]*?\];/, (m) => m.split("?v=" + anterior).join("?v=" + nueva));
escribir("sw.js", sw);

escribir("version.json", JSON.stringify({ v: nueva }) + "\n");
console.log("v" + anterior + " -> v" + nueva + " en index.html, sw.js y version.json");
