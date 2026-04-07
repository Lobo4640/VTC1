/**
 * lib/rvtc.js — INTEGRACIÓN MINISTERIO DE TRANSPORTES (RVTC)
 * Manual RVTC v1.0 · Cap. 4 (pág. 6-13) · RD 1076/2017
 * Orden FOM/36/2008 Art. 24
 *
 * FLUJO LEGAL:
 *   1. comunicarServicio()  ← ANTES de iniciar el viaje (OBLIGATORIO)
 *   2. confirmarServicio()  ← Al arrancar físicamente
 *   3. anularServicio()     ← Si se cancela
 */
import CFG from "@/config/vtc_setup";

const { RVTC_CREDS: R, DATOS_TITULAR: D } = CFG;

const dd = (n) => String(n).padStart(2, "0");
const fmtFecha = (iso) => {
  const d = new Date(iso);
  return `${dd(d.getDate())}/${dd(d.getMonth()+1)}/${d.getFullYear()}`;
};
const fmtFechaHora = (iso) => {
  const d = new Date(iso);
  return `${fmtFecha(iso)} ${dd(d.getHours())}:${dd(d.getMinutes())}`;
};

function buildPayload(viaje) {
  return {
    matricula:           D.matricula,
    nif_titular:         D.nif,
    nombre_titular:      D.nombre,
    nif_arrendador:      D.nif_arrendador || D.nif,
    nombre_arrendador:   D.nombre,
    // Art. 24 FOM/36/2008: DNI del arrendatario obligatorio
    codigo_arrendatario: viaje.cliente_dni   || viaje.codigo_viaje,
    nombre_arrendatario: viaje.cliente_nombre|| "CLIENTE",
    fecha_contrato:      fmtFecha(new Date().toISOString()),
    provincia_contrato:  R.ine_provincia,
    municipio_contrato:  R.ine_municipio,
    fecha_inicio_prevista: fmtFechaHora(viaje.fecha_inicio_servicio || new Date().toISOString()),
    provincia_origen:    R.ine_provincia,
    municipio_origen:    R.ine_municipio,
    direccion_origen:    (viaje.direccion_origen  || "").slice(0, 100),
    fecha_fin:           fmtFecha(viaje.fecha_fin_servicio || new Date(Date.now()+3600000).toISOString()),
    provincia_destino:   R.ine_provincia,
    municipio_destino:   R.ine_municipio,
    direccion_destino:   (viaje.direccion_destino || "").slice(0, 100),
    punto_mas_lejano:    null,
  };
}

// ─── COMUNICAR (ANTES de iniciar) ─────────────────────────────────
export async function comunicarServicio(viaje) {
  console.log(`[RVTC] Comunicando: ${viaje.codigo_viaje}`);
  const payload = buildPayload(viaje);

  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), R.timeout_ms);

    const res = await fetch(`${R.api_url}/servicios/comunicar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key":  R.api_key,
        "X-Operador": R.codigo_operador,
      },
      body: JSON.stringify({ operacion: "COMUNICAR_SERVICIO", datos: payload }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`[RVTC] ✅ COMUNICADO · Código: ${data.codigo_servicio}`);
    return { exito: true, codigoMinisterio: data.codigo_servicio, estado: "COMUNICADO", payload };

  } catch (err) {
    const motivo = err.name === "AbortError" ? `TIMEOUT >${R.timeout_ms}ms` : err.message;
    console.error(`[RVTC] ⚠️  PENDIENTE_MANUAL — ${viaje.codigo_viaje} — ${motivo}`);
    console.error(`[RVTC] 👉 Registrar en: https://sede.fomento.gob.es/RegistroVTC/`);
    console.error(`[RVTC] Payload:\n${JSON.stringify(payload, null, 2)}`);
    console.error(`[RVTC] Línea TXT carga masiva:\n${generarLineaTXT(payload, viaje.id)}`);
    return { exito: false, estado: "PENDIENTE_MANUAL", error: motivo, payload,
             lineaCargaMasiva: generarLineaTXT(payload, viaje.id) };
  }
}

export async function confirmarServicio(codigoRVTC) {
  try {
    const res = await fetch(`${R.api_url}/servicios/confirmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": R.api_key },
      body: JSON.stringify({ operacion: "CONFIRMAR_SERVICIO", codigo_servicio: codigoRVTC }),
    });
    return { exito: res.ok };
  } catch (e) { return { exito: false, error: e.message }; }
}

export async function anularServicio(codigoRVTC) {
  try {
    const res = await fetch(`${R.api_url}/servicios/anular`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": R.api_key },
      body: JSON.stringify({ operacion: "ANULAR_SERVICIO", codigo_servicio: codigoRVTC }),
    });
    return { exito: res.ok };
  } catch (e) { return { exito: false, error: e.message }; }
}

// ─── Formato TXT carga masiva (Cap. 9, pág. 27-30) ───────────────
export function generarLineaTXT(payload, indice = 1) {
  return [
    String(indice).slice(0,12),
    D.matricula.slice(0,11),
    D.nif.slice(0,9),
    (D.nif_arrendador||D.nif).slice(0,9),
    (payload.codigo_arrendatario||"").slice(0,20),
    (payload.nombre_arrendatario||"").slice(0,70),
    payload.fecha_contrato,
    payload.provincia_contrato,
    payload.municipio_contrato,
    payload.provincia_origen,
    payload.municipio_origen,
    (payload.direccion_origen||"").slice(0,100),
    payload.fecha_inicio_prevista,
    payload.provincia_destino,
    payload.municipio_destino,
    (payload.direccion_destino||"").slice(0,100),
    payload.fecha_fin,
    "","","",
  ].join(";");
}
