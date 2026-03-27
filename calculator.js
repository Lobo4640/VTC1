/**
 * lib/calculator.js — MOTOR DE CÁLCULO VTC MADRID 2026
 * Fiel al diseño de 5.html adaptado a normativa VTC
 */
import CFG from "@/config/vtc_setup";

const T = CFG.TARIFAS;

// ─── DETECTORES ────────────────────────────────────────────────────
export function getTarifa(fecha) {
  const h = new Date(fecha).getHours();
  return (h >= 22 || h < 7) ? T.T2 : T.T1;
}

export function esHoraNocturna(fecha) {
  const h = new Date(fecha).getHours();
  return h >= 22 || h < 7;
}

export function esDiaFestivo(fecha) {
  const festivos2026 = [
    "2026-01-01","2026-01-06","2026-03-19","2026-04-02","2026-04-03",
    "2026-05-01","2026-05-02","2026-05-15","2026-07-25","2026-08-15",
    "2026-10-12","2026-11-01","2026-11-09","2026-12-06","2026-12-08","2026-12-25",
  ];
  return festivos2026.includes(new Date(fecha).toISOString().slice(0,10));
}

export function esRutaAeropuerto(origen = "", destino = "") {
  const terms = ["aeropuerto","barajas","t1","t2","t3","t4","t4s","mad","terminal"];
  const txt = `${origen} ${destino}`.toLowerCase();
  return terms.some(t => txt.includes(t));
}

// ─── VALIDACIÓN PRECONTRATACIÓN LEGAL ─────────────────────────────
export function validarPrecontratacion(fechaServicio) {
  const diff = (new Date(fechaServicio) - new Date()) / 60000;
  if (diff < CFG.LEGAL.precontratacion_minutos) {
    return {
      valido: false,
      minutos: Math.round(diff),
      error: `Mínimo ${CFG.LEGAL.precontratacion_minutos} min de antelación (normativa VTC). Faltan ${Math.round(diff)} min.`,
    };
  }
  return { valido: true, minutos: Math.round(diff) };
}

// ─── CÁLCULO PRINCIPAL ─────────────────────────────────────────────
export function calcularPrecio({ km, duracionMin, fecha, origen = "", destino = "", extras = {} }) {
  const tarifa    = getTarifa(fecha);
  const esAero    = esRutaAeropuerto(origen, destino);
  const nocturno  = esHoraNocturna(fecha);
  const festivo   = esDiaFestivo(fecha);

  const conceptos = [];
  let subtotal = 0;

  if (esAero) {
    // Aeropuerto: tarifa plana
    const calculado = tarifa.bajada_bandera + km * tarifa.precio_km;
    const precioAero = Math.max(T.SUPLEMENTOS.aeropuerto, calculado);
    subtotal = Math.min(precioAero, T.SUPLEMENTOS.aeropuerto_max);
    conceptos.push({ concepto: "Tarifa plana aeropuerto MAD", importe: subtotal });
  } else {
    // Precio estándar
    const base = tarifa.bajada_bandera + km * tarifa.precio_km + duracionMin * tarifa.precio_minuto;
    conceptos.push({ concepto: `${tarifa.nombre} (${km.toFixed(1)} km + ${duracionMin} min)`, importe: +base.toFixed(2) });
    subtotal = base;

    if (nocturno && !festivo) {
      const inc = subtotal * (T.SUPLEMENTOS.nocturnidad_mult - 1);
      conceptos.push({ concepto: "Nocturnidad (+25%)", importe: +inc.toFixed(2) });
      subtotal += inc;
    }
    if (festivo) {
      const inc = subtotal * (T.SUPLEMENTOS.festivo_mult - 1);
      conceptos.push({ concepto: "Día festivo (+20%)", importe: +inc.toFixed(2) });
      subtotal += inc;
    }
  }

  // Suplementos extras
  if (extras.maleta) {
    conceptos.push({ concepto: "Equipaje extra", importe: T.SUPLEMENTOS.maleta_extra });
    subtotal += T.SUPLEMENTOS.maleta_extra;
  }
  if (extras.mascota) {
    conceptos.push({ concepto: "Mascota", importe: T.SUPLEMENTOS.mascota });
    subtotal += T.SUPLEMENTOS.mascota;
  }
  if (extras.silla) {
    conceptos.push({ concepto: "Silla bebé", importe: T.SUPLEMENTOS.silla_bebe });
    subtotal += T.SUPLEMENTOS.silla_bebe;
  }

  // Mínimo legal
  const minimoAplicable = esAero ? tarifa.minimo_legal : (nocturno ? T.T2.minimo_legal : T.T1.minimo_legal);
  if (subtotal < minimoAplicable) {
    conceptos.push({ concepto: "Ajuste tarifa mínima legal", importe: +(minimoAplicable - subtotal).toFixed(2) });
    subtotal = minimoAplicable;
  }

  const iva   = +(subtotal * T.iva).toFixed(2);
  const total = +(subtotal + iva).toFixed(2);

  return {
    tarifa_nombre: esAero ? "Tarifa Aeropuerto MAD" : tarifa.nombre,
    km, duracionMin,
    esAero, nocturno, festivo,
    conceptos,
    subtotal: +subtotal.toFixed(2),
    iva,
    total,
    precio_cerrado: true,
    timestamp: new Date().toISOString(),
  };
}

// ─── GENERADOR CÓDIGO VIAJE ────────────────────────────────────────
export function generarCodigoViaje() {
  return "VTC-" + Math.random().toString(36).toUpperCase().slice(2, 8);
}
