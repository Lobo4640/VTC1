// ── LÓGICA DE PRECIOS SIMPLIFICADA — TaxMad VTC ──

export const MULTIPLICADORES = [1, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00];

/**
 * Nueva lógica: 1€ por KM + Multiplicador de demanda
 * O Precio Pactado si se introduce manualmente.
 */
export function calcularPrecioFinal(
  km: number,
  multiplicador: number = 1,
  precioPactado?: number | null
): number {
  if (precioPactado && precioPactado > 0) {
    return precioPactado;
  }
  // Lógica simple de 1€/km
  const precioBase = km * 1; 
  return precioBase * multiplicador;
}

export function formatearPrecio(precio: number | string): string {
  const n = typeof precio === "string" ? parseFloat(precio) : precio;
  return `${(n || 0).toFixed(2)} €`;
}

// Funciones de compatibilidad con el resto de la app
export function determinarTarifa() { return "Tarifa Dinámica"; }
export function calcularPrecioViaje(km: number, multiplicador: number) {
    return km * 1 * multiplicador;
}
export function formatearKm(km: number): string {
  return `${(km || 0).toFixed(2)} km`;
}
