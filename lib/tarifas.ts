// ─────────────────────────────────────────────────────────
// LÓGICA DE TARIFAS — TaxMad VTC
// Extraída de la Calculadora_TaxMad.html original
// ─────────────────────────────────────────────────────────

export type TarifaNombre =
  | "Diurna (L-V)"
  | "Nocturna (L-V)"
  | "Fin de Semana";

export interface Tarifa {
  BASE:         number;      // €  — bajada de bandera
  PRECIO_KM:    number;      // €/km
  TARIFA_NOMBRE: TarifaNombre;
}

export interface CalculoRuta {
  km:           number;
  duracionMin:  number;
  precio:       number;
  tarifa:       TarifaNombre;
}

/**
 * Determina la tarifa aplicable según fecha y hora.
 *
 * Reglas:
 *  - Sábado (6) o Domingo (0)  → Fin de Semana   1.60 €/km
 *  - L-V entre 07:00 y 20:59   → Diurna          1.40 €/km
 *  - L-V resto de horas        → Nocturna         1.60 €/km
 *
 * Bajada de bandera (BASE): 6.00 € en todos los casos.
 */
export function determinarTarifa(fechaHoraStr: string): Tarifa {
  const fecha     = new Date(fechaHoraStr);
  const diaSemana = fecha.getDay();   // 0 = domingo, 6 = sábado
  const hora      = fecha.getHours(); // 0-23

  const BASE = 6.00;

  if (diaSemana === 0 || diaSemana === 6) {
    return { BASE, PRECIO_KM: 1.60, TARIFA_NOMBRE: "Fin de Semana" };
  }

  if (hora >= 7 && hora < 21) {
    return { BASE, PRECIO_KM: 1.40, TARIFA_NOMBRE: "Diurna (L-V)" };
  }

  return { BASE, PRECIO_KM: 1.60, TARIFA_NOMBRE: "Nocturna (L-V)" };
}

/**
 * Calcula el precio final de un viaje dado km y tarifa.
 * precio = BASE + km × PRECIO_KM
 */
export function calcularPrecioViaje(
  km: number,
  tarifa: Tarifa
): number {
  return tarifa.BASE + km * tarifa.PRECIO_KM;
}

/**
 * Calcula un viaje completo a partir de los datos de la ruta.
 */
export function calcularViaje(
  distanciaMetros: number,
  duracionSegundos: number,
  fechaHoraStr: string
): CalculoRuta {
  const km          = distanciaMetros / 1000;
  const duracionMin = Math.round(duracionSegundos / 60);
  const tarifa      = determinarTarifa(fechaHoraStr);
  const precio      = calcularPrecioViaje(km, tarifa);

  return {
    km,
    duracionMin,
    precio,
    tarifa: tarifa.TARIFA_NOMBRE,
  };
}

/**
 * Formatea un precio como string en euros.
 * Ej: 32.5 → "32.50 €"
 */
export function formatearPrecio(precio: number): string {
  return `${precio.toFixed(2)} €`;
}

/**
 * Formatea km con 2 decimales.
 */
export function formatearKm(km: number): string {
  return `${km.toFixed(2)} km`;
}

/**
 * Formatea duración en minutos a texto legible.
 * Ej: 75 → "1h 15min"
 */
export function formatearDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h   = Math.floor(minutos / 60);
  const min = minutos % 60;
  return min > 0 ? `${h}h ${min}min` : `${h}h`;
}

/**
 * Comprueba que la fecha de recogida sea futura (mínimo ahora).
 */
export function esFechaValida(fechaHoraStr: string): boolean {
  return new Date(fechaHoraStr) > new Date();
}

/**
 * Devuelve la fecha/hora mínima para el input datetime-local
 * (30 minutos de antelación mínima según las reglas de negocio).
 */
export function fechaMinimaReserva(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}
