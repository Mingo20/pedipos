/* PediPOS · Respaldo en el Drive del propio comerciante
 * Cada comprobante aceptado se sube al Drive del comerciante, dentro de
 * PediPOS / Comprobantes / año / mes. El dato es suyo, el espacio lo paga
 * Google y el servidor de la app nunca lo toca.
 * Permiso usado: drive.file (solo los archivos que crea esta app).
 */
(function (global) {
  "use strict";
  var SCOPES = "https://www.googleapis.com/auth/drive.file";
  var API = "https://www.googleapis.com/drive/v3";
  var SUBIDA = "https://www.googleapis.com/upload/drive/v3/files";
  var RAIZ = "PediPOS Comprobantes";
  var token = "", pidiendo = null, ocupado = false, ultimoError = "";

  function S() { return global.PPStore; }
  function db() { return S().db; }
  function conf() {
    var d = db();
    d.respaldo = d.respaldo || { clienteId: "", conectado: false, carpetas: {}, ultimo: "", email: "" };
    d.respaldo.carpetas = d.respaldo.carpetas || {};
    return d.respaldo;
  }
  function guardar() { S().save(); }
  function toast(t) { if (global.toast) global.toast(t); }
  function comp() { return global.PPComprobantes || null; }

  /* ---------- sesion de Google ---------- */
  function cargarGIS() {
    if (global.google && global.google.accounts && global.google.accounts.oauth2) return Promise.resolve(true);
    if (pidiendo) return pidiendo;
    pidiendo = new Promise(function (res) {
      var s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = function () { res(!!(global.google && global.google.accounts)); };
      s.onerror = function () { res(false); };
      document.head.appendChild(s);
      setTimeout(function () { res(!!(global.google && global.google.accounts)); }, 8000);
    });
    return pidiendo;
  }

  function pedirToken(interactivo) {
    var c = conf();
    if (!c.clienteId) return Promise.reject(new Error("Falta el ID de cliente de Google en Ajustes"));
    return cargarGIS().then(function (ok) {
      if (!ok) throw new Error("No se pudo cargar Google desde este telefono");
      return new Promise(function (res, rej) {
        var cli = global.google.accounts.oauth2.initTokenClient({
          client_id: c.clienteId,
          scope: SCOPES,
          prompt: interactivo ? "consent" : "",
          callback: function (r) {
            if (r && r.access_token) { token = r.access_token; res(token); }
            else rej(new Error((r && r.error) || "Google no autorizo el acceso"));
          }
        });
        cli.requestAccessToken({ prompt: interactivo ? "consent" : "" });
      });
    });
  }

  function conectar() {
    var c = conf();
    if (!c.clienteId) { toast("Falta el ID de cliente de Google"); return Promise.resolve(false); }
    return pedirToken(true).then(function () {
      return api("/about?fields=user", "GET").then(function (j) {
        c.conectado = true; c.email = (j.user && j.user.emailAddress) || ""; c.desconectado = "";
        guardar(); toast("Drive conectado" + (c.email ? ": " + c.email : ""));
        return true;
      });
    }).catch(function (e) {
      ultimoError = e.message || String(e);
      toast("No se pudo conectar: " + ultimoError);
      return false;
    });
  }

  function desconectar() {
    var c = conf();
    c.conectado = false; c.email = ""; token = "";
    guardar(); toast("Respaldo en Drive desconectado");
    return Promise.resolve(true);
  }

  /* ---------- llamadas a Drive ---------- */
  function api(ruta, metodo, cuerpo, base) {
    var url = (base || API) + ruta;
    var op = { method: metodo || "GET", headers: { Authorization: "Bearer " + token } };
    if (cuerpo) { op.headers["Content-Type"] = "application/json"; op.body = JSON.stringify(cuerpo); }
    return fetch(url, op).then(function (r) {
      return r.text().then(function (t) {
        var j = {};
        try { j = JSON.parse(t); } catch (e) { j = {}; }
        if (r.status === 401) { token = ""; throw new Error("La sesion de Google vencio: vuelve a conectar"); }
        if (!r.ok) throw new Error((j.error && (j.error.message || j.error.status)) || ("Drive HTTP " + r.status));
        return j;
      });
    });
  }

  function buscarCarpeta(nombre, padre) {
    var q = "name='" + nombre.replace(/'/g, "\\'") + "' and mimeType='application/vnd.google-apps.folder' and trashed=false" +
      (padre ? " and '" + padre + "' in parents" : "");
    return api("/files?q=" + encodeURIComponent(q) + "&fields=files(id,name)&pageSize=5", "GET").then(function (j) {
      var f = (j.files || [])[0];
      return f ? f.id : "";
    });
  }

  function crearCarpeta(nombre, padre) {
    var cuerpo = { name: nombre, mimeType: "application/vnd.google-apps.folder" };
    if (padre) cuerpo.parents = [padre];
    return api("/files?fields=id", "POST", cuerpo).then(function (j) { return j.id; });
  }

  function carpetaDe(fecha) {
    var c = conf();
    var d = fecha ? new Date(fecha) : new Date();
    var anio = String(d.getFullYear()), mes = String(d.getMonth() + 1).padStart(2, "0");
    var llave = anio + "/" + mes;
    if (c.carpetas[llave]) return Promise.resolve(c.carpetas[llave]);
    return buscarCarpeta(RAIZ).then(function (id) {
      return id || crearCarpeta(RAIZ);
    }).then(function (raiz) {
      return buscarCarpeta(anio, raiz).then(function (id) { return id || crearCarpeta(anio, raiz); });
    }).then(function (anioId) {
      return buscarCarpeta(mes, anioId).then(function (id) { return id || crearCarpeta(mes, anioId); });
    }).then(function (mesId) {
      c.carpetas[llave] = mesId; guardar();
      return mesId;
    });
  }

  function subir(nombre, contenido, tipo, padre) {
    var b = "----pedipos" + Math.random().toString(36).slice(2);
    var meta = JSON.stringify({ name: nombre, parents: padre ? [padre] : undefined, mimeType: tipo || "application/xml" });
    var cuerpo = "--" + b + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + meta +
      "\r\n--" + b + "\r\nContent-Type: " + (tipo || "application/xml") + "\r\n\r\n" + contenido +
      "\r\n--" + b + "--";
    return fetch(SUBIDA + "?uploadType=multipart&fields=id,name,size", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/related; boundary=" + b },
      body: cuerpo
    }).then(function (r) {
      if (r.status === 401) { token = ""; throw new Error("La sesion de Google vencio: vuelve a conectar"); }
      return r.text().then(function (t) {
        var j = {};
        try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error((j.error && j.error.message) || ("Drive HTTP " + r.status));
        return j;
      });
    });
  }

  /* se lee de vuelta para confirmar que quedo guardado */
  function verificar(id) {
    return api("/files/" + encodeURIComponent(id) + "?fields=id,name,size", "GET");
  }

  function huella(texto) {
    if (!global.crypto || !global.crypto.subtle) return Promise.resolve(String((texto || "").length));
    var datos = new TextEncoder().encode(texto);
    return global.crypto.subtle.digest("SHA-256", datos).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("").slice(0, 32);
    });
  }

  /* ---------- respaldar ---------- */
  function pendientes() {
    if (!comp()) return [];
    return comp().all().filter(function (r) { return !r.respaldo || r.respaldo.estado !== "ok"; });
  }

  function respaldarAhora(silencioso) {
    var c = conf();
    if (!c.conectado) { if (!silencioso) toast("Conecta tu Drive primero"); return Promise.resolve({ ok: false, motivo: "sin conectar" }); }
    if (ocupado) return Promise.resolve({ ok: false, motivo: "en curso" });
    if (!comp()) return Promise.resolve({ ok: false, motivo: "sin comprobantes" });
    ocupado = true;
    var hechos = 0, fallos = 0, lista = pendientes();
    var paso = function (i) {
      if (i >= lista.length) return Promise.resolve();
      var r = lista[i];
      return carpetaDe(r.fecha).then(function (carpeta) {
        return subir((r.ncf || r.id) + ".xml", r.xml || "", "application/xml", carpeta);
      }).then(function (j) {
        return verificar(j.id).then(function (v) {
          var tam = Number(v.size || 0), esperado = (r.xml || "").length;
          if (tam && esperado && tam !== esperado) throw new Error("tamano distinto al subir");
          r.respaldo = { estado: "ok", fecha: new Date().toISOString(), fileId: v.id, size: tam || esperado };
          hechos++;
        });
      }).catch(function (e) {
        r.respaldo = { estado: "error", fecha: new Date().toISOString(), mensaje: String(e.message || e) };
        ultimoError = String(e.message || e);
        fallos++;
      }).then(function () {
        if (global.PPComprobantes && global.PPComprobantes.actualizar) global.PPComprobantes.actualizar(r);
        return paso(i + 1);
      });
    };
    return paso(0).then(function () {
      return indice();
    }).then(function () {
      c.ultimo = new Date().toISOString(); guardar(); ocupado = false;
      if (!silencioso) toast(hechos ? "Respaldados " + hechos : (fallos ? "No se pudo respaldar" : "Todo estaba respaldado"));
      return { ok: !fallos, hechos: hechos, fallos: fallos, error: ultimoError };
    }).catch(function (e) {
      ocupado = false; ultimoError = String(e.message || e);
      if (!silencioso) toast("Respaldo: " + ultimoError);
      return { ok: false, error: ultimoError };
    });
  }

  /* indice del mes: cuantos van, el ultimo e-NCF y la huella de cada uno */
  function indice() {
    if (!comp()) return Promise.resolve();
    var todos = comp().all();
    var hoy = new Date();
    var delMes = todos.filter(function (r) {
      var f = r.fecha ? new Date(r.fecha) : hoy;
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    });
    var ids = delMes.map(function (r) { return r.ncf || r.id; }).sort();
    return huella(ids.join("|")).then(function (h) {
      var cuerpo = {
        app: "PediPOS", generado: new Date().toISOString(),
        mes: hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0"),
        total: delMes.length, ultimoEncf: ids[ids.length - 1] || "",
        respaldados: delMes.filter(function (r) { return r.respaldo && r.respaldo.estado === "ok"; }).length,
        huella: h, comprobantes: ids
      };
      return carpetaDe(hoy).then(function (carpeta) {
        return subir("indice.json", JSON.stringify(cuerpo, null, 1), "application/json", carpeta);
      });
    });
  }

  /* ---------- restaurar ---------- */
  function restaurar() {
    var c = conf();
    if (!c.conectado) { toast("Conecta tu Drive primero"); return Promise.resolve(false); }
    if (!comp()) return Promise.resolve(false);
    var traidos = 0;
    return carpetaDe(new Date()).then(function (carpeta) {
      var q = "'" + carpeta + "' in parents and trashed=false and name contains '.xml'";
      return api("/files?q=" + encodeURIComponent(q) + "&fields=files(id,name,size)&pageSize=1000", "GET");
    }).then(function (j) {
      var archivos = j.files || [];
      var existentes = {};
      comp().all().forEach(function (r) { if (r.ncf) existentes[r.ncf] = true; });
      var paso = function (i) {
        if (i >= archivos.length) return Promise.resolve();
        var f = archivos[i];
        var ncf = String(f.name || "").replace(/\.xml$/i, "");
        if (existentes[ncf]) return paso(i + 1);
        return fetch(API + "/files/" + encodeURIComponent(f.id) + "?alt=media", { headers: { Authorization: "Bearer " + token } })
          .then(function (r) { return r.text(); })
          .then(function (xml) {
            if (!xml || xml.indexOf("<ECF") < 0) return;
            var m = xml.match(/<eNCF>([^<]+)<\/eNCF>/);
            return Promise.resolve(comp().add({
              id: "R" + Date.now() + Math.floor(Math.random() * 1000),
              fecha: new Date().toISOString(), ncf: m ? m[1] : ncf, estado: "restaurado",
              total: 0, itbis: 0, xml: xml, mensaje: "Restaurado desde Drive",
              respaldo: { estado: "ok", fecha: new Date().toISOString(), fileId: f.id }
            })).then(function () { traidos++; });
          }).catch(function () { }).then(function () { return paso(i + 1); });
      };
      return paso(0);
    }).then(function () {
      toast(traidos ? "Restaurados " + traidos + " comprobantes" : "No habia nada nuevo que restaurar");
      return traidos;
    }).catch(function (e) {
      toast("Restaurar: " + String(e.message || e));
      return 0;
    });
  }

  /* ---------- estado para el panel ---------- */
  function estado() {
    var c = conf();
    var todos = comp() ? comp().all() : [];
    var ok = todos.filter(function (r) { return r.respaldo && r.respaldo.estado === "ok"; }).length;
    var malos = todos.filter(function (r) { return r.respaldo && r.respaldo.estado === "error"; }).length;
    var dias = c.ultimo ? Math.floor((Date.now() - new Date(c.ultimo).getTime()) / 86400000) : null;
    return {
      conectado: !!c.conectado, email: c.email || "", clienteId: c.clienteId || "",
      total: todos.length, respaldados: ok, pendientes: todos.length - ok, conError: malos,
      ultimo: c.ultimo || "", diasSinRespaldar: dias, error: ultimoError
    };
  }

  /* se dispara solo: al abrir, al volver la red y cada 15 minutos */
  function auto() {
    var c = conf();
    if (!c.conectado) return;
    if (!pendientes().length) return;
    if (!token) {
      pedirToken(false).then(function () { return respaldarAhora(true); }).catch(function () { });
      return;
    }
    respaldarAhora(true);
  }

  global.PPRespaldo = {
    conectar: conectar, desconectar: desconectar, respaldarAhora: respaldarAhora,
    restaurar: restaurar, estado: estado, auto: auto, pendientes: pendientes, indice: indice,
    setClienteId: function (v) { conf().clienteId = String(v || "").trim(); guardar(); }
  };

  if (global.addEventListener) {
    global.addEventListener("online", function () { setTimeout(auto, 3000); });
    global.addEventListener("load", function () { setTimeout(auto, 6000); });
    setInterval(auto, 15 * 60 * 1000);
  }
})(window);
