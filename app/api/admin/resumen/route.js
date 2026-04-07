/**
 * app/api/admin/resumen/route.js
 * ─────────────────────────────────────────────
 * GET → Liquidación mensual: Efectivo vs Tarjeta vs Bizum
 *       Estadísticas por conductor, totales globales, alertas RVTC
 */

import { NextResponse } from "next/server";
import { createClient }  from "@supabase/supabase-js";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

const err = (msg, status = 500) =>
  NextResponse.json({ error: msg }, { status });

// ════════════════════════════════════════════════════════════════
//  GET /api/admin/resumen?mes=YYYY-MM
// ════════════════════════════════════════════════════════════════
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get("mes") || hoySoloMes();

    // Rango del mes
    const [year, month] = mes.split("-").map(Number);
    const inicio = new Date(year, month - 1, 1).toISOString();
    const fin    = new Date(year, month,     1).toISOString(); // primer día del mes siguiente

    const supabase = db();

    // ── 1. Todos los viajes completados del mes ──────────────
    const { data: viajes, error: vErr } = await supabase
      .from("viajes")
      .select(
        "id,conductor_id,conductor_nombre,precio_final,precio_iva," +
        "forma_pago,fue_negociado,distancia_km,estado_ministerio," +
        "fecha_reserva,direccion_origen,direccion_destino"
      )
      .eq("estado", "COMPLETADO")
      .gte("fecha_reserva", inicio)
      .lt("fecha_reserva", fin);

    if (vErr) throw new Error(vErr.message);

    // ── 2. Pendientes RVTC del mes (todos los estados) ───────
    const { count: pendientesMin } = await supabase
      .from("viajes")
      .select("*", { count: "exact", head: true })
      .eq("estado_ministerio", "PENDIENTE_MANUAL")
      .gte("fecha_reserva", inicio)
      .lt("fecha_reserva", fin);

    // ── 3. Últimos 5 viajes (cualquier estado) para la tabla rápida
    const { data: ultimosViajes } = await supabase
      .from("viajes")
      .select(
        "id,codigo_viaje,conductor_nombre,direccion_origen,direccion_destino," +
        "precio_final,forma_pago,estado,estado_ministerio,fecha_reserva,fue_negociado"
      )
      .gte("fecha_reserva", inicio)
      .lt("fecha_reserva", fin)
      .order("fecha_reserva", { ascending: false })
      .limit(50);

    // ── 4. Agrupación por conductor ──────────────────────────
    const mapaConductores = {};

    for (const v of viajes || []) {
      const cid = String(v.conductor_id || "sin_conductor");
      if (!mapaConductores[cid]) {
        mapaConductores[cid] = {
          conductor_id:     v.conductor_id,
          conductor_nombre: v.conductor_nombre || "Sin asignar",
          total_viajes:     0,
          total_efectivo:   0,
          total_tarjeta:    0,
          total_bizum:      0,
          total_transferencia: 0,
          total_km:         0,
          viajes_negociados:0,
        };
      }

      const c = mapaConductores[cid];
      const p = parseFloat(v.precio_final) || 0;

      c.total_viajes++;
      c.total_km += parseFloat(v.distancia_km) || 0;
      if (v.fue_negociado) c.viajes_negociados++;

      switch (v.forma_pago) {
        case "EFECTIVO":      c.total_efectivo      += p; break;
        case "TARJETA":       c.total_tarjeta       += p; break;
        case "BIZUM":         c.total_bizum         += p; break;
        case "TRANSFERENCIA": c.total_transferencia += p; break;
        default:              c.total_efectivo      += p;
      }
    }

    // Calcular total facturado por conductor y redondear
    const porConductor = Object.values(mapaConductores).map((c) => ({
      ...c,
      total_efectivo:      round(c.total_efectivo),
      total_tarjeta:       round(c.total_tarjeta),
      total_bizum:         round(c.total_bizum),
      total_transferencia: round(c.total_transferencia),
      total_km:            round(c.total_km, 1),
      total_facturado:     round(
        c.total_efectivo + c.total_tarjeta + c.total_bizum + c.total_transferencia
      ),
    }));

    // ── 5. Totales globales del mes ──────────────────────────
    const totales = porConductor.reduce(
      (acc, c) => ({
        total_viajes:        acc.total_viajes        + c.total_viajes,
        total_facturado:     acc.total_facturado     + c.total_facturado,
        total_efectivo:      acc.total_efectivo      + c.total_efectivo,
        total_tarjeta:       acc.total_tarjeta       + c.total_tarjeta,
        total_bizum:         acc.total_bizum         + c.total_bizum,
        total_transferencia: acc.total_transferencia + c.total_transferencia,
        total_km:            acc.total_km            + c.total_km,
      }),
      {
        total_viajes: 0, total_facturado: 0, total_efectivo: 0,
        total_tarjeta: 0, total_bizum: 0, total_transferencia: 0, total_km: 0,
      }
    );

    // Redondear totales
    Object.keys(totales).forEach((k) => {
      totales[k] = round(totales[k], k === "total_km" ? 1 : 2);
    });

    // ── 6. Datos de los últimos 6 meses (gráfica tendencia) ──
    const tendencia = await calcularTendencia(supabase);

    return NextResponse.json({
      mes,
      totales,
      porConductor,
      pendientesMinisterio: pendientesMin || 0,
      ultimosViajes:        ultimosViajes || [],
      tendencia,
    });

  } catch (e) {
    console.error("[GET /api/admin/resumen]", e);
    return err(e.message);
  }
}

// ── Calcular tendencia de los últimos 6 meses ────────────────────
async function calcularTendencia(supabase) {
  const ahora  = new Date();
  const meses  = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push({
      label: d.toLocaleString("es-ES", { month: "short" }),
      ini:   d.toISOString(),
      fin:   new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
    });
  }

  const resultado = [];
  for (const m of meses) {
    const { data } = await supabase
      .from("viajes")
      .select("precio_final")
      .eq("estado", "COMPLETADO")
      .gte("fecha_reserva", m.ini)
      .lt("fecha_reserva", m.fin);

    const total = (data || []).reduce(
      (s, v) => s + (parseFloat(v.precio_final) || 0),
      0
    );
    resultado.push({ mes: m.label, total: round(total) });
  }

  return resultado;
}

// ── Helpers ──────────────────────────────────────────────────────
const round = (n, dec = 2) => parseFloat((n || 0).toFixed(dec));

const hoySoloMes = () => new Date().toISOString().slice(0, 7);
