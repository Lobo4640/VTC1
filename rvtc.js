/**
 * lib/rvtc.js — INTEGRACIÓN MINISTERIO DE TRANSPORTES (RVTC)
 * Basado en: Manual RVTC v1.0, Cap. 4 (Pág 6-13)
 * RD 1076/2017 + Orden FOM/36/2008 Art.24
 *
 * FLUJO SEGÚN MANUAL:
 *  1. comunicarServicio()  → Antes de iniciar el viaje (OBLIGATORIO)
 *  2. confirmarServicio()  → Al arrancar (inicio real)
 *  3. anularServicio()     → Si el viaje se cancela
 */

import CFG from "@/config/vtc_setup";

const { RVTC_CREDS: R, DATOS_TITULAR: D } = CFG;

// ─── FORMATEADORES (formato esperado por el Ministerio) ───────────
const fmtFecha = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};
const fmtFechaHora = (iso) => {
  const d = new Date(iso);
  return `${fmtFecha(iso)} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};

// ─── CONSTRUCTOR DEL PAYLOAD MINISTERIAL ──────────────────────────
// Art. 24 Orden FOM/36/2008: campos obligatorios
// PRIVACIDAD: El DNI/Nombre del cliente se envía al Ministerio según normativa.
// El operador es responsable del tratamiento conforme al RGPD.
function buildPayload(viaje) {
  return {
    // IDENTIFICACIÓN DEL VEHÍCULO
    matricula: D.matricula,

    // DATOS DEL TITULAR (automático del config)
    nif_titular:    D.nif,
    nombre_titular: D.nombre,

    // DATOS DEL ARRENDADOR (mismo que titular modelo 1 vehículo)
    nif_arrendador:    D.nif_arrendador || D.nif,
    nombre_arrendador: D.nombre,

    // DATOS DEL ARRENDATARIO (cliente) — Obligatorio Art.24
    codigo_arrendatario: viaje.cliente_dni  || viaje.codigo_viaje,
    nombre_arrendatario: viaje.cliente_nombre || "CLIENTE",

    // DATOS DEL CONTRATO
    fecha_contrato:    fmtFecha(new Date().toISOString()),
    provincia_contrato: R.ine_provincia,
    municipio_contrato: R.ine_municipio,

    // DATOS DEL SERVICIO (Pág. 10 del Manual)
    fecha_inicio_prevista: fmtFechaHora(viaje.fecha_inicio_servicio || new Date().toISOString()),
    provincia_origen:  R.ine_provincia,
    municipio_origen:  R.ine_municipio,
    direccion_origen:  viaje.direccion_origen.slice(0, 100),

    fecha_fin:         fmtFecha(viaje.fecha_fin_servicio || new Date(Date.now() + 3600000).toISOString()),
    provincia_destino: R.ine_provincia,
    municipio_destino: R.ine_municipio,
    direccion_destino: viaje.direccion_destino.slice(0, 100),

    // Punto más lejano: solo si origen = destino (circular)
    // Para trayectos A→B se deja vacío
    punto_mas_lejano: null,
  };
}

// ─── FUNCIÓN PRINCIPAL: comunicarServicio() ──────────────────────
/**
 * Comunica un viaje al RVTC ANTES de iniciar.
 * Cap. 4 del Manual (pág. 6-13): "El primer paso es la Comunicación al RVTC"
 *
 * @param {Object} viaje - Datos del viaje de Supabase
 * @returns {Object} { exito, codigoMinisterio, estado, error? }
 */
export async function comunicarServicio(viaje) {
  console.log(`[RVTC] Comunicando servicio: ${viaje.codigo_viaje}`);
  const payload = buildPayload(viaje);

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), R.timeout_ms);

    const res = await fetch(`${R.api_url}/servicios/comunicar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": R.api_key,
        "X-Operador": R.codigo_operador,
      },
      body: JSON.stringify({ operacion: "COMUNICAR_SERVICIO", datos: payload }),
      signal: controller.signal,
    });
    clearTimeout(tid);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();

    console.log(`[RVTC] ✅ Comunicado. Código RVTC: ${data.codigo_servicio}`);
    return { exito: true, codigoMinisterio: data.codigo_servicio, estado: "COMUNICADO", payload };

  } catch (err) {
    const esTimeout = err.name === "AbortError";
    const motivo = esTimeout ? `TIMEOUT (>${R.timeout_ms}ms)` : err.message;

    // ⚠️ El viaje CONTINÚA pero queda pendiente de registro manual
    console.error(`[RVTC] ⚠️  PENDIENTE_MANUAL — ${viaje.codigo_viaje} — ${motivo}`);
    console.error(`[RVTC] 👉  Registrar en: https://sede.fomento.gob.es/RegistroVTC/`);
    console.error(`[RVTC] Payload para registro manual:\n${JSON.stringify(payload, null, 2)}`);

    return {
      exito: false,
      estado: "PENDIENTE_MANUAL",
      error: motivo,
      payload,
      // Línea para carga masiva TXT (Cap. 9 del Manual, pág. 27-30)
      lineaCargaMasiva: generarLineaTXT(payload, viaje.id),
    };
  }
}

// ─── CONFIRMAR SERVICIO ────────────────────────────────────────────
export async function confirmarServicio(codigoRVTC) {
  try {
    const res = await fetch(`${R.api_url}/servicios/confirmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": R.api_key },
      body: JSON.stringify({ operacion: "CONFIRMAR_SERVICIO", codigo_servicio: codigoRVTC }),
    });
    return { exito: res.ok };
  } catch (e) {
    console.error("[RVTC] Error confirmando:", e.message);
    return { exito: false, error: e.message };
  }
}

// ─── ANULAR SERVICIO ──────────────────────────────────────────────
export async function anularServicio(codigoRVTC) {
  try {
    const res = await fetch(`${R.api_url}/servicios/anular`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": R.api_key },
      body: JSON.stringify({ operacion: "ANULAR_SERVICIO", codigo_servicio: codigoRVTC }),
    });
    return { exito: res.ok };
  } catch (e) {
    return { exito: false, error: e.message };
  }
}

// ─── GENERADOR LÍNEA CARGA MASIVA TXT (Cap. 9, pág. 27-30) ───────
// Formato exacto del Ministerio: campos separados por ";"
export function generarLineaTXT(payload, indice = 1) {
  const campos = [
    String(indice).slice(0, 12),
    D.matricula.slice(0, 11),
    D.nif.slice(0, 9),
    (D.nif_arrendador || D.nif).slice(0, 9),
    (payload.codigo_arrendatario || "").slice(0, 20),
    (payload.nombre_arrendatario || "").slice(0, 70),
    payload.fecha_contrato,
    payload.provincia_contrato,
    payload.municipio_contrato,
    payload.provincia_origen,
    payload.municipio_origen,
    (payload.direccion_origen || "").slice(0, 100),
    payload.fecha_inicio_prevista,
    payload.provincia_destino,
    payload.municipio_destino,
    (payload.direccion_destino || "").slice(0, 100),
    payload.fecha_fin,
    // Punto más lejano (vacío para trayectos A→B)
    "", "", "",
  ];
  return campos.join(";");
}
