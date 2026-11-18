/* PediPOS Fiscal · modulo e-CF (DGII, Republica Dominicana)
 * Construye el XML, lo firma con el certificado del comerciante (XMLDSig enveloped,
 * RSA-SHA256) y lo envia al ambiente de certificacion o produccion de la DGII.
 *
 * Estados que devuelve: borrador -> firmado -> enviado -> aceptado | rechazado | error
 * Modo demo: simula la DGII para probar el flujo sin certificado real.
 */
(function (global) {
  "use strict";

  var AMBIENTES = {
    certecf: "https://ecf.dgii.gov.do/certecf",
    testecf: "https://ecf.dgii.gov.do/testecf",
    ecf: "https://ecf.dgii.gov.do/ecf"
  };
  /* rutas de autenticacion: se prueban en orden hasta que una responda */
  var RUTAS_AUTH = [
    "/autenticacion/api/autenticacion/validarcertificado",
    "/autenticacion/api/autenticacion/validarsemilla",
    "/autenticacion/api/Autenticacion/ValidarCertificado"
  ];
  var RUTAS_ESTADO = [
    "/consultas/api/consultas/estado/",
    "/consultas/api/consultas/estadotrackid/"
  ];

  /* ---------- utilidades ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fechaDGII(d) {
    d = d ? new Date(d) : new Date();
    return pad(d.getDate()) + "-" + pad(d.getMonth() + 1) + "-" + d.getFullYear();
  }
  function money(n) { return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function rncLimpio(v) { return String(v || "").replace(/[^0-9]/g, ""); }

  /* ---------- XML del e-CF (tipo 32 = Factura de Consumo Electronica) ---------- */
  function buildEcf(sale, cfg) {
    var tipo = cfg.tipo || "32";
    var lineas = (sale.lineas || []).map(function (l, i) {
      var cant = Number(l.cant || l.cantidad || 1) || 1;
      var precio = Number(l.precio || 0);
      var monto = Math.round(cant * precio * 100) / 100;
      var itbis = l.itbis === false ? 0 : 1; /* IndicadorFacturacion: 1 = ITBIS 18% */
      return '<Item numeroLinea="' + (i + 1) + '">' +
        "<IndicadorFacturacion>" + itbis + "</IndicadorFacturacion>" +
        "<NombreItem>" + esc(l.nombre || "Producto") + "</NombreItem>" +
        "<CantidadItem>" + money(cant) + "</CantidadItem>" +
        "<UnidadMedida>" + (l.unidad === "libra" ? "44" : "43") + "</UnidadMedida>" +
        "<PrecioUnitarioItem>" + money(precio) + "</PrecioUnitarioItem>" +
        "<MontoItem>" + money(monto) + "</MontoItem>" +
        "</Item>";
    }).join("");

    var total = Number(sale.total) || 0;
    var itbisTotal = Number(sale.itbis) || 0;
    var gravado = Number(sale.subtotal) || 0;

    var xml = "<ECF>" +
      "<Encabezado>" +
        "<Version>1.0</Version>" +
        "<IdDoc>" +
          "<TipoeCF>" + tipo + "</TipoeCF>" +
          "<eNCF>" + esc(cfg.ncf || "") + "</eNCF>" +
          "<FechaVencimientoSecuencia>" + esc(cfg.vencimientoSecuencia || fechaDGII(new Date(Date.now() + 31536e6))) + "</FechaVencimientoSecuencia>" +
          "<IndicadorEnvioDiferido>" + (sale.diferido ? 1 : 0) + "</IndicadorEnvioDiferido>" +
          "<IndicadorMontoGravado>1</IndicadorMontoGravado>" +
          "<TipoIngresos>01</TipoIngresos>" +
          "<TipoPago>" + (sale.metodo === "credito" ? "2" : "1") + "</TipoPago>" +
          "<TablaFormasPago><FormaDePago>" + (sale.metodo === "credito" ? "4" : "1") + "</FormaDePago>" +
          "<MontoPago>" + money(total) + "</MontoPago></TablaFormasPago>" +
        "</IdDoc>" +
        "<Emisor>" +
          "<RNCEmisor>" + rncLimpio(cfg.rnc) + "</RNCEmisor>" +
          "<RazonSocialEmisor>" + esc(cfg.razonSocial || "Colmado") + "</RazonSocialEmisor>" +
          (cfg.nombreComercial ? "<NombreComercial>" + esc(cfg.nombreComercial) + "</NombreComercial>" : "") +
          "<DireccionEmisor>" + esc(cfg.direccion || "Republica Dominicana") + "</DireccionEmisor>" +
          "<FechaEmision>" + fechaDGII(sale.fecha) + "</FechaEmision>" +
        "</Emisor>" +
        (sale.compradorRnc ? "<Comprador>" +
          "<RNCComprador>" + rncLimpio(sale.compradorRnc) + "</RNCComprador>" +
          "<RazonSocialComprador>" + esc(sale.compradorNombre || "") + "</RazonSocialComprador>" +
        "</Comprador>" : "") +
        "<Totales>" +
          "<MontoTotal>" + money(total) + "</MontoTotal>" +
          "<MontoNoFacturable>0.00</MontoNoFacturable>" +
          "<MontoPeriodo>" + money(total) + "</MontoPeriodo>" +
          "<TotalITBIS>" + money(itbisTotal) + "</TotalITBIS>" +
          "<MontoGravadoTotal>" + money(gravado) + "</MontoGravadoTotal>" +
          "<MontoGravadoI1>" + money(gravado) + "</MontoGravadoI1>" +
          "<TotalITBIS1>" + money(itbisTotal) + "</TotalITBIS1>" +
        "</Totales>" +
      "</Encabezado>" +
      "<DetallesItems>" + lineas + "</DetallesItems>" +
    "</ECF>";

    return xml;
  }

  /* ---------- firma XMLDSig ---------- */
  function cargarP12(p12base64, pass) {
    var forge = global.forge;
    if (!forge) throw new Error("No cargo forge");
    var der = forge.util.decode64(p12base64);
    var asn1 = forge.asn1.fromDer(der);
    var p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, pass);
    var certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    var keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ||
      p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];
    if (!certBags || !certBags.length) throw new Error("El certificado no trae certificado publico");
    if (!keyBags || !keyBags.length) throw new Error("El certificado no trae clave privada");
    return { cert: certBags[0].cert, key: keyBags[0].key, forge: forge };
  }

  /* El documento se genera ya en forma canonica (sin espacios, atributos ordenados),
     por eso el digest se calcula sobre el mismo texto que se firma. */
  function firmar(xml, cred) {
    var forge = cred.forge;

    /* 1. digest del documento */
    var mdDoc = forge.md.sha256.create();
    mdDoc.update(xml, "utf8");
    var digestDoc = forge.util.encode64(mdDoc.digest().getBytes());

    /* 2. SignedInfo canonico */
    var signedInfo =
      '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">' +
        "<CanonicalizationMethod Algorithm=\"http://www.w3.org/TR/2001/REC-xml-c14n-20010315\"></CanonicalizationMethod>" +
        "<SignatureMethod Algorithm=\"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256\"></SignatureMethod>" +
        "<Reference URI=\"\">" +
          "<Transforms>" +
            "<Transform Algorithm=\"http://www.w3.org/2000/09/xmldsig#enveloped-signature\"></Transform>" +
            "<Transform Algorithm=\"http://www.w3.org/TR/2001/REC-xml-c14n-20010315\"></Transform>" +
          "</Transforms>" +
          "<DigestMethod Algorithm=\"http://www.w3.org/2001/04/xmlenc#sha256\"></DigestMethod>" +
          "<DigestValue>" + digestDoc + "</DigestValue>" +
        "</Reference>" +
      "</SignedInfo>";

    /* 3. firma de SignedInfo con la clave privada */
    var mdSi = forge.md.sha256.create();
    mdSi.update(signedInfo, "utf8");
    var firma = forge.util.encode64(cred.key.sign(mdSi));

    var certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cred.cert)).getBytes();
    var certB64 = forge.util.encode64(certDer);

    var signature =
      "<Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\">" +
        signedInfo +
        "<SignatureValue>" + firma + "</SignatureValue>" +
        "<KeyInfo><X509Data><X509Certificate>" + certB64 + "</X509Certificate></X509Data></KeyInfo>" +
      "</Signature>";

    return xml.replace("</ECF>", signature + "</ECF>");
  }

  /* ---------- llamadas a la DGII ---------- */
  function base(cfg) { return AMBIENTES[cfg.ambiente] || AMBIENTES.certecf; }

  async function semilla(cfg) {
    var r = await fetch(base(cfg) + "/autenticacion/api/autenticacion/semilla", {
      method: "GET", headers: { Accept: "application/xml" }
    });
    var t = await r.text();
    if (!r.ok) throw new Error("Semilla HTTP " + r.status + " " + t.slice(0, 120));
    var m = t.match(/<Valor>([^<]+)<\/Valor>/);
    return m ? m[1] : t.trim();
  }

  async function token(cfg, cred) {
    var sem = await semilla(cfg);
    var xml = "<SemillaModel><valor>" + sem + "</valor></SemillaModel>";
    var firmado = firmarSemilla(xml, cred);
    var ultimo = "";
    for (var i = 0; i < RUTAS_AUTH.length; i++) {
      var r = await fetch(base(cfg) + RUTAS_AUTH[i], {
        method: "POST",
        headers: { "Content-Type": "application/xml", Accept: "application/json" },
        body: firmado
      });
      var t = await r.text();
      if (r.status === 404) { ultimo = "404 " + RUTAS_AUTH[i]; continue; }
      if (!r.ok) throw new Error("Autenticacion HTTP " + r.status + " " + t.slice(0, 160));
      var j = {};
      try { j = JSON.parse(t); } catch (_) { j = { token: t.trim() }; }
      return j.token || j.Token || j.access_token || "";
    }
    throw new Error("No se encontro la ruta de autenticacion de la DGII (" + ultimo + ")");
  }

  function firmarSemilla(xml, cred) {
    var forge = cred.forge;
    var md = forge.md.sha256.create();
    md.update(xml, "utf8");
    var firma = forge.util.encode64(cred.key.sign(md));
    var certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cred.cert)).getBytes();
    var certB64 = forge.util.encode64(certDer);
    var sig = "<Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\">" +
      "<SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/TR/2001/REC-xml-c14n-20010315\"></CanonicalizationMethod>" +
      "<SignatureMethod Algorithm=\"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256\"></SignatureMethod>" +
      "<Reference URI=\"\"><DigestMethod Algorithm=\"http://www.w3.org/2001/04/xmlenc#sha256\"></DigestMethod>" +
      "<DigestValue>" + forge.util.encode64(md.digest().getBytes()) + "</DigestValue></Reference></SignedInfo>" +
      "<SignatureValue>" + firma + "</SignatureValue>" +
      "<KeyInfo><X509Data><X509Certificate>" + certB64 + "</X509Certificate></X509Data></KeyInfo></Signature>";
    return xml.replace("</SemillaModel>", sig + "</SemillaModel>");
  }

  async function enviar(cfg, xmlFirmado, tk) {
    var r = await fetch(base(cfg) + "/recepcion/api/facturaselectronicas", {
      method: "POST",
      headers: { "Content-Type": "application/xml", Accept: "application/json", Authorization: "Bearer " + tk },
      body: xmlFirmado
    });
    var t = await r.text();
    var j = {};
    try { j = JSON.parse(t); } catch (_) { j = {}; }
    return {
      http: r.status,
      trackId: j.trackId || j.TrackId || j.trackid || "",
      estado: r.ok ? "enviado" : "error",
      mensaje: j.mensaje || j.Mensaje || (r.ok ? "Enviado a la DGII" : t.slice(0, 200))
    };
  }

  async function estado(cfg, trackId, tk) {
    var url = base(cfg) + RUTAS_ESTADO[0] + encodeURIComponent(trackId);
    var r = await fetch(url, {
      method: "GET", headers: { Accept: "application/json", Authorization: "Bearer " + tk }
    });
    if (r.status === 404) {
      r = await fetch(base(cfg) + RUTAS_ESTADO[1] + encodeURIComponent(trackId), {
        method: "GET", headers: { Accept: "application/json", Authorization: "Bearer " + tk }
      });
    }
    var t = await r.text();
    var j = {};
    try { j = JSON.parse(t); } catch (_) { j = {}; }
    var e = (j.estado || j.Estado || "").toString().toLowerCase();
    return {
      http: r.status,
      estado: e.indexOf("acept") === 0 ? "aceptado" : (e.indexOf("rechaz") === 0 ? "rechazado" : "enviado"),
      detalle: j.mensaje || j.Mensaje || j.detalle || "",
      crudo: j
    };
  }

  /* ---------- modo demo: simula la DGII sin certificado real ---------- */
  function demo(tipo) {
    var id = "TRK-" + Date.now().toString(36).toUpperCase();
    return {
      trackId: id,
      http: 200,
      estado: tipo === "rechazado" ? "rechazado" : "aceptado",
      mensaje: tipo === "rechazado"
        ? "Rechazado en demo: el monto no coincide con el detalle"
        : "Aceptado en demo: comprobante recibido por la DGII"
    };
  }

  /* ---------- QR de validacion (obligatorio en la representacion impresa) ---------- */
  function qrDataUrl(texto) {
    try {
      var q = global.qrcode(0, "M");
      q.addData(texto); q.make();
      return q.createDataURL(6, 2);
    } catch (e) { return ""; }
  }
  function urlValidacion(cfg, valores) {
    var b = base(cfg);
    return b + "/consulta/?rnc=" + encodeURIComponent(rncLimpio(cfg.rnc)) +
      "&ncf=" + encodeURIComponent(valores.ncf || "") +
      "&monto=" + encodeURIComponent(money(valores.total || 0)) +
      "&codigo=" + encodeURIComponent(valores.codigoSeguridad || "");
  }

  global.ECF = {
    AMBIENTES: AMBIENTES,
    buildEcf: buildEcf,
    cargarP12: cargarP12,
    firmar: firmar,
    token: token,
    enviar: enviar,
    estado: estado,
    demo: demo,
    qrDataUrl: qrDataUrl,
    urlValidacion: urlValidacion,
    fechaDGII: fechaDGII,
    money: money,
    rncLimpio: rncLimpio
  };
})(window);
