// PediPOS · Reparto de numeros e-NCF y perfil restaurable (microservicio Deno)
// Entrada: POST JSON { accion, rnc, ... }   Salida: JSON { ok, ... }
//
// COMO REPARTE SIN PERDER NI REPETIR NUMEROS
// Base44 no tiene transacciones ni claves unicas, y varias cajas pueden pedir a la vez.
// Por eso cada bloque se reparte con "RECLAMAR Y DESEMPATAR":
//   1) la caja escribe un reclamo para el bloque N (sin leer el contador antes);
//   2) lee TODOS los reclamos de ese mismo bloque N;
//   3) gana el reclamo mas antiguo (desempate por id); los demas se retiran y prueban el bloque N+1.
// El contador nunca se "suma": el bloque N sale de la posicion en el rango, asi que ningun numero puede
// quedar sin dueno. Si un reclamo se pierde, el bloque vuelve a estar libre para la siguiente caja.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const TAM_BLOQUE_MAX = 200;
const TAM_BLOQUE_DEF = 50;
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
const soloDigitos = (s: unknown) => String(s ?? "").replace(/\D/g, "");

async function secuenciaDe(db: any, rnc: string, tipo: string) {
  const f = await db.entities.PpSecuencia.filter({ rnc, tipo }, "created_date", 5);
  return (f || []).filter((x: any) => !x.eliminado)[0] || null;
}

// Gana el reclamo mas antiguo; si empatan en fecha, el de menor id (orden total fijo).
function ganador(reclamos: any[]) {
  return [...reclamos].sort((a, b) => {
    const ta = String(a.reservado_en || ""), tb = String(b.reservado_en || "");
    if (ta !== tb) return ta < tb ? -1 : 1;
    return String(a.id) < String(b.id) ? -1 : 1;
  })[0];
}

async function reservar(db: any, b: any) {
  const rnc = soloDigitos(b.rnc), tipo = soloDigitos(b.tipo), caja = String(b.caja || "caja").slice(0, 40);
  if (!rnc) return { ok: false, error: "Falta el RNC" };
  if (!tipo) return { ok: false, error: "Falta el tipo de comprobante" };
  const cant = Math.max(1, Math.min(TAM_BLOQUE_MAX, Number(b.cantidad) || TAM_BLOQUE_DEF));
  const seq = await secuenciaDe(db, rnc, tipo);
  if (!seq) return { ok: false, error: "Sin secuencia configurada para el tipo " + tipo };
  const desde0 = Number(seq.desde), hasta0 = Number(seq.hasta);
  if (seq.vence && String(seq.vence) < new Date().toISOString().slice(0, 10)) {
    return { ok: false, error: "El rango autorizado por la DGII esta vencido", vencido: seq.vence };
  }
  const totalBloques = Math.ceil((hasta0 - desde0 + 1) / cant);

  // UNA sola lectura trae todos los bloques ya reclamados de este RNC y tipo (ahorra consultas: Base44 limita a 70 por minuto).
  const yaTomados = new Set<number>();
  const cargarTomados = async () => {
    const todos = (await db.entities.PpBloque.filter({ rnc, tipo }, "created_date", 2000)) || [];
    yaTomados.clear();
    for (const x of todos) if (x.estado !== "devuelto" && Number(String(x.clave).split("|")[2]) === cant) yaTomados.add(Number(x.indice));
  };
  await cargarTomados();

  // se prueba desde el primer bloque libre. Un bloque 'devuelto' vuelve a estar disponible.
  for (let i = 0; i < totalBloques; i++) {
    const clave = [rnc, tipo, cant, i].join("|");
    if (yaTomados.has(i)) continue; // ya tiene dueno

    const desde = desde0 + i * cant;
    const hasta = Math.min(hasta0, desde + cant - 1);
    const ahora = new Date().toISOString();
    const mio = await db.entities.PpBloque.create({ clave, rnc, tipo, indice: i, desde, hasta, caja, estado: "reservado", reservado_en: ahora });

    // DOBLE VERIFICACION: se lee el bloque dos veces, separadas por una pausa. Un reclamo que aun no se habia
    // escrito la primera vez aparece la segunda, asi dos cajas nunca creen ganar el mismo bloque a la vez.
    let gana: any = null;
    for (let vuelta = 0; vuelta < 2; vuelta++) {
      await dormir(vuelta === 0 ? 350 : 450);
      const todos = (await db.entities.PpBloque.filter({ clave }, "created_date", 100) || []).filter((x: any) => x.estado !== "devuelto");
      gana = ganador(todos);
      if (!gana || gana.id !== mio.id) break; // ya perdi: no hace falta mirar mas
    }
    if (gana && gana.id === mio.id) {
      const restantes = Math.max(0, hasta0 - hasta);
      return { ok: true, rnc, tipo, desde, hasta, restantes, vence: seq.vence || "", aviso: restantes <= Number(seq.aviso_en || 100) };
    }
    // perdi el desempate: retiro mi reclamo y sigo con el siguiente bloque
    try { await db.entities.PpBloque.update(mio.id, { estado: "devuelto" }); } catch (_) { /* si falla, el ganador igual es el otro */ }
    yaTomados.add(i);
    await cargarTomados();
  }
  return { ok: false, error: "Secuencia agotada", limite: hasta0 };
}

async function estado(db: any, b: any) {
  const rnc = soloDigitos(b.rnc);
  if (!rnc) return { ok: false, error: "Falta el RNC" };
  const seqs = ((await db.entities.PpSecuencia.filter({ rnc }, "created_date", 50)) || []).filter((x: any) => !x.eliminado);
  const out = [];
  for (const s of seqs) {
    const bl = ((await db.entities.PpBloque.filter({ rnc, tipo: s.tipo }, "created_date", 1000)) || []).filter((x: any) => x.estado !== "devuelto");
    // se cuenta por posicion real: el ultimo numero entregado, no un contador que se suma
    const usadoHasta = bl.reduce((m: number, x: any) => Math.max(m, Number(x.hasta)), Number(s.desde) - 1);
    const restantes = Math.max(0, Number(s.hasta) - usadoHasta);
    out.push({ tipo: s.tipo, desde: s.desde, hasta: s.hasta, entregado_hasta: usadoHasta, restantes, bloques: bl.length, vence: s.vence || "", aviso: restantes <= Number(s.aviso_en || 100) });
  }
  return { ok: true, secuencias: out };
}

async function configurar(db: any, b: any) {
  const rnc = soloDigitos(b.rnc), tipo = soloDigitos(b.tipo);
  const desde = Number(b.desde), hasta = Number(b.hasta);
  if (!rnc || !tipo) return { ok: false, error: "Faltan el RNC o el tipo" };
  if (!(desde >= 1) || !(hasta >= desde)) return { ok: false, error: "Rango invalido" };
  const ya = await secuenciaDe(db, rnc, tipo);
  if (ya) return { ok: false, error: "Ese RNC ya tiene un rango para el tipo " + tipo + ". Pide una ampliacion en vez de reemplazarlo." };
  const vence = b.vence ? String(b.vence).slice(0, 10) : "";
  await db.entities.PpSecuencia.create({ rnc, tipo, desde, hasta, vence, aviso_en: Number(b.aviso_en) || 100 });
  return { ok: true, rnc, tipo, desde, hasta, vence };
}

async function perfilGuardar(db: any, b: any) {
  const rnc = soloDigitos(b.rnc);
  if (!rnc) return { ok: false, error: "Falta el RNC" };
  const campos: any = {
    rnc, razon_social: String(b.razonSocial || ""), ajustes: String(b.ajustes || "{}"), usuarios: String(b.usuarios || "[]"),
  };
  // el certificado solo se guarda si el comerciante dio su consentimiento y ya viene cifrado desde el equipo
  if (b.certificadoCifrado) {
    if (!b.consentimiento) return { ok: false, error: "Falta el consentimiento del comerciante para guardar su certificado cifrado" };
    campos.certificado_cifrado = String(b.certificadoCifrado);
    campos.certificado_salt = String(b.certificadoSalt || "");
    campos.certificado_iv = String(b.certificadoIv || "");
    campos.certificado_huella = String(b.certificadoHuella || "");
    campos.certificado_vence = String(b.certificadoVence || "");
    campos.consentimiento_en = new Date().toISOString();
  }
  const prev = ((await db.entities.PpPerfil.filter({ rnc }, "created_date", 5)) || [])[0];
  if (prev) {
    campos.version = Number(prev.version || 0) + 1;
    await db.entities.PpPerfil.update(prev.id, campos);
    return { ok: true, rnc, version: campos.version, certificado: !!(b.certificadoCifrado || prev.certificado_cifrado) };
  }
  campos.version = 1;
  await db.entities.PpPerfil.create(campos);
  return { ok: true, rnc, version: 1, certificado: !!b.certificadoCifrado };
}

async function perfilObtener(db: any, b: any) {
  const rnc = soloDigitos(b.rnc);
  if (!rnc) return { ok: false, error: "Falta el RNC" };
  const p = ((await db.entities.PpPerfil.filter({ rnc }, "created_date", 5)) || [])[0];
  if (!p) return { ok: false, error: "Ese RNC no tiene perfil guardado" };
  return { ok: true, perfil: {
    rnc: p.rnc, razonSocial: p.razon_social, ajustes: p.ajustes, usuarios: p.usuarios, version: p.version,
    certificadoCifrado: p.certificado_cifrado || "", certificadoSalt: p.certificado_salt || "", certificadoIv: p.certificado_iv || "",
    certificadoHuella: p.certificado_huella || "", certificadoVence: p.certificado_vence || "",
  } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Usa POST" }, 405);
  let b: any;
  try { b = await req.json(); } catch (_) { return json({ ok: false, error: "JSON invalido" }, 400); }
  const db = createClientFromRequest(req).asServiceRole;
  try {
    switch (b.accion) {
      case "ping": return json({ ok: true, servicio: "pediposSecuencia" });
      case "secuencia.reservar": return json(await reservar(db, b));
      case "secuencia.estado": return json(await estado(db, b));
      case "secuencia.configurar": return json(await configurar(db, b));
      case "perfil.guardar": return json(await perfilGuardar(db, b));
      case "perfil.obtener": return json(await perfilObtener(db, b));
      default: return json({ ok: false, error: "Accion no reconocida: " + b.accion }, 400);
    }
  } catch (e) {
    return json({ ok: false, error: "Error del servidor: " + String((e as any)?.message || e).slice(0, 160) }, 500);
  }
});
