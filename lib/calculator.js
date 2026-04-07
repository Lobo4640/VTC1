/**
 * lib/calculator.js — MOTOR DE CÁLCULO VTC MADRID 2026
 * ─────────────────────────────────────────────────────
 * ✅ Precontratación: 0 minutos (viajes inmediatos permitidos)
 * ✅ Precio cerrado e inamovible (Art. 7 RD 1057/2015)
 * ✅ Tarifas T1 (diurna) / T2 (nocturna + festivos)
 * ✅ Suplementos: aeropuerto, maleta, mascota, silla
 * ✅ IVA 10% transporte de viajeros
 */

// ── FESTIVOS MADRID 2026 ─────────────────────────────────────────
export const FESTIVOS_2026 = [
  "2026-01-01", "2026-01-06", "2026-03-19", "2026-04-02", "2026-04-03",
  "2026-05-01", "2026-05-02", "2026-05-15", "2026-07-25", "2026-08-15",
  "2026-10-12", "2026-11-01", "2026-11-09", "2026-12-06", "2026-12-08",
  "2026-12-25",
];

// ── TARIFAS BASE (configurable en vtc_setup.js) ──────────────────
export const TARIFAS = {
  T1: {
    nombre:         "Tarifa 1 · Diurna (07:00–22:00)",
    bajada_bandera: 3.50,
    precio_km:      1.45,
    precio_minuto:  0.22,
    minimo_legal:   15.00,
  },
  T2: {
    nombre:         "Tarifa 2 · Nocturna / Festivos",
    bajada_bandera: 4.50,
    precio_km:      1.80,
    precio_minuto:  0.30,
    minimo_legal:   18.00,
  },
  SUPLEMENTOS: {
    aeropuerto:     35.00,  // tarifa plana MAD
    aeropuerto_max: 45.00,  // límite superior aeropuerto
    nocturnidad_x:  1.25,   // ×1.25 en horario nocturno
    festivo_x:      1.20,   // ×1.20 días festivos
    maleta_extra:    3.00,
    mascota:         5.00,
    silla_bebe:      3.00,
  },
  IVA: 0.10,
};

// ── DETECTORES ───────────────────────────────────────────────────
export function esNocturno(fecha) {
  const h = new Date(fecha).getHours();
  return h >= 22 || h < 7;
}

export function esFestivo(fecha) {
  return FESTIVOS_2026.includes(
    new Date(fecha).toISOString().slice(0, 10)
  );
}

export function esAeropuerto(origen = "", destino = "") {
  const txt = `${origen} ${destino}`.toLowerCase();
  return ["aeropuerto", "barajas", "t1", "t2", "t3", "t4", "t4s", "mad"].some(
    (t) => txt.includes(t)
  );
}

// ── VALIDACIÓN DE PRECONTRATACIÓN ────────────────────────────────
/**
 * Con 0 minutos siempre retorna válido.
 * Se mantiene la firma para compatibilidad futura.
 *
 * @param {string} fechaServicio - ISO string de la fecha del servicio
 * @returns {{ valido: boolean, minutos: number, error?: string }}
 */
export function validarPrecontratacion(fechaServicio) {
  const diffMin = (new Date(fechaServicio) - new Date()) / 60000;

  // ⚡ PRECONTRATACIÓN MÍNIMA = 0 MINUTOS (viajes inmediatos permitidos)
  const MINIMO_MINUTOS = 0;

  if (diffMin < MINIMO_MINUTOS) {
    return {
      valido:  false,
      minutos: Math.round(diffMin),
      error:   `La fecha del servicio no puede ser en el pasado.`,
    };
  }
  return { valido: true, minutos: Math.round(diffMin) };
}

// ── CÁLCULO PRINCIPAL ────────────────────────────────────────────
/**
 * Calcula el precio cerrado del viaje VTC.
 *
 * @param {Object} params
 * @param {number}  params.km           - Distancia en kilómetros
 * @param {number}  params.duracionMin  - Duración estimada en minutos
 * @param {string}  params.fecha        - ISO string de la fecha del servicio
 * @param {string}  [params.origen]     - Texto del punto de origen
 * @param {string}  [params.destino]    - Texto del punto de destino
 * @param {Object}  [params.extras]     - { maleta, mascota, silla }
 *
 * @returns {Object} Desglose completo con precio cerrado
 */
export function calcularPrecio({
  km,
  duracionMin,
  fecha,
  origen  = "",
  destino = "",
  extras  = {},
}) {
  const tarifa  = esNocturno(fecha) ? TARIFAS.T2 : TARIFAS.T1;
  const aero    = esAeropuerto(origen, destino);
  const noct    = esNocturno(fecha);
  const fest    = esFestivo(fecha);
  const S       = TARIFAS.SUPLEMENTOS;

  const conceptos = [];
  let sub = 0;

  // 1. PRECIO BASE ─────────────────────────────────────────────
  if (aero) {
    // Tarifa plana aeropuerto: máx entre mínimo y calculado, hasta el techo
    const calculado = tarifa.bajada_bandera + km * tarifa.precio_km;
    sub = Math.min(Math.max(calculado, S.aeropuerto), S.aeropuerto_max);
    conceptos.push({
      concepto: "✈️  Tarifa plana Aeropuerto MAD",
      importe:  +sub.toFixed(2),
    });
  } else {
    const base =
      tarifa.bajada_bandera +
      km          * tarifa.precio_km +
      duracionMin * tarifa.precio_minuto;

    conceptos.push({
      concepto: `${tarifa.nombre} · ${km.toFixed(1)} km · ${duracionMin} min`,
      importe:  +base.toFixed(2),
    });
    sub = base;

    // Nocturnidad (solo si no es ya festivo —no acumular ambos—)
    if (noct && !fest) {
      const inc = sub * (S.nocturnidad_x - 1);
      conceptos.push({
        concepto: "🌙 Suplemento nocturnidad (+25%)",
        importe:  +inc.toFixed(2),
      });
      sub += inc;
    }

    // Festivos
    if (fest) {
      const inc = sub * (S.festivo_x - 1);
      conceptos.push({
        concepto: "🎉 Suplemento día festivo (+20%)",
        importe:  +inc.toFixed(2),
      });
      sub += inc;
    }
  }

  // 2. EXTRAS ──────────────────────────────────────────────────
  if (extras.maleta) {
    sub += S.maleta_extra;
    conceptos.push({ concepto: "🧳 Equipaje adicional", importe: S.maleta_extra });
  }
  if (extras.mascota) {
    sub += S.mascota;
    conceptos.push({ concepto: "🐾 Mascota", importe: S.mascota });
  }
  if (extras.silla) {
    sub += S.silla_bebe;
    conceptos.push({ concepto: "👶 Silla bebé", importe: S.silla_bebe });
  }

  // 3. MÍNIMO LEGAL ────────────────────────────────────────────
  const minimoAplicable = aero
    ? S.aeropuerto
    : noct || fest
    ? TARIFAS.T2.minimo_legal
    : TARIFAS.T1.minimo_legal;

  if (sub < minimoAplicable) {
    conceptos.push({
      concepto: "⚖️  Ajuste tarifa mínima legal",
      importe:  +(minimoAplicable - sub).toFixed(2),
    });
    sub = minimoAplicable;
  }

  // 4. IVA + TOTAL ─────────────────────────────────────────────
  const subtotal = +sub.toFixed(2);
  const iva      = +(subtotal * TARIFAS.IVA).toFixed(2);
  const total    = +(subtotal + iva).toFixed(2);

  return {
    tarifa_nombre:  aero ? "Aeropuerto MAD" : tarifa.nombre,
    es_aeropuerto:  aero,
    es_nocturno:    noct,
    es_festivo:     fest,
    km:             +km.toFixed(2),
    duracionMin,
    conceptos,
    subtotal,
    iva,
    total,
    // Siempre true — precio cerrado por normativa VTC
    precio_cerrado: true,
    timestamp:      new Date().toISOString(),
  };
}

// ── GENERADOR DE CÓDIGO DE VIAJE ─────────────────────────────────
export function generarCodigoViaje() {
  const ts  = Date.now().toString(36).toUpperCase().slice(-5);
  const rnd = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `VTC-${ts}-${rnd}`;
}

// ── FORMATEADORES ────────────────────────────────────────────────
export const fmtEur = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n ?? 0);

export const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    weekday:  "short",
    day:      "2-digit",
    month:    "short",
    hour:     "2-digit",
    minute:   "2-digit",
  });
};
