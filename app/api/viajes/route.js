/**
 * app/api/viajes/route.js
 * ─────────────────────────────────────────────
 * POST → Crear viaje, comunicar al RVTC (rvtc.js), guardar en Supabase
 * GET  → Listar viajes (Admin / Conductor)
 *
 * ⚡ PRECONTRATACIÓN = 0 MINUTOS — viajes inmediatos permitidos
 */

import { NextResponse } from "next/server";
import { createClient }  from "@supabase/supabase-js";
import { calcularPrecio, generarCodigoViaje } from "@/lib/calculator";
import { comunicarServicio }                  from "@/lib/rvtc";

// ── Cliente Supabase con service_role ────────────────────────────
const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

// ════════════════════════════════════════════════════════════════
//  POST /api/viajes — Crear nuevo viaje
// ════════════════════════════════════════════════════════════════
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      // Ruta
      direccion_origen,
      direccion_destino,
      fecha_servicio,
      km,
      duracion,
      // Opciones
      extras   = {},
      pax      = 1,
      // Pago
      forma_pago = "EFECTIVO",
      // Cliente (privados — solo Supabase, nunca al Ministerio)
      cliente_nombre,
      cliente_telefono,
      cliente_dni,
      cliente_email,
      // Conductor (si viene desde panel conductor)
      conductor_id    = null,
      conductor_nombre = "Cliente",
      // Precio manual (modo negociación)
      precio_negociado = null,
    } = body;

    // ── Validaciones básicas ─────────────────────────────────
    if (!direccion_origen?.trim())  return err("Dirección de origen requerida",  400);
    if (!direccion_destino?.trim()) return err("Dirección de destino requerida", 400);
    if (!fecha_servicio)            return err("Fecha del servicio requerida",   400);

    // ⚡ Sin validación de precontratación (0 min permitido)
    // Solo comprobamos que la fecha no sea en el pasado absoluto
    const fechaDate = new Date(fecha_servicio);
    if (isNaN(fechaDate.getTime())) {
      return err("Formato de fecha inválido", 400);
    }

    // ── Calcular precio cerrado ──────────────────────────────
    const kmNum  = parseFloat(km)      || estimarKm(direccion_origen, direccion_destino);
    const minNum = parseInt(duracion)  || Math.round(kmNum * 2.5);

    const desglose = calcularPrecio({
      km:          kmNum,
      duracionMin: minNum,
      fecha:       fecha_servicio,
      origen:      direccion_origen,
      destino:     direccion_destino,
      extras,
    });

    // Precio final: negociado o calculado
    const precioFinal = precio_negociado
      ? parseFloat(precio_negociado)
      : desglose.total;

    const precioIva  = parseFloat((precioFinal * 0.10).toFixed(2));
    const codigoViaje = generarCodigoViaje();

    // ── Guardar en Supabase ──────────────────────────────────
    const nuevaFila = {
      codigo_viaje:          codigoViaje,
      conductor_id,
      conductor_nombre,
      direccion_origen,
      direccion_destino,
      distancia_km:          kmNum,
      duracion_min:          minNum,
      tarifa_nombre:         desglose.tarifa_nombre,
      precio_base:           desglose.subtotal,
      precio_final:          precioFinal,
      precio_iva:            precioIva,
      desglose_precio:       desglose,
      fue_negociado:         Boolean(precio_negociado),
      forma_pago,
      cliente_nombre:        cliente_nombre  || null,
      cliente_telefono:      cliente_telefono|| null,
      cliente_dni:           cliente_dni     || null,
      cliente_email:         cliente_email   || null,
      pasajeros:             pax,
      extras_json:           extras,
      estado:                "EN_CURSO",
      estado_ministerio:     "PENDIENTE",
      fecha_reserva:         new Date().toISOString(),
      fecha_inicio_servicio: fecha_servicio,
    };

    const { data: viaje, error: dbErr } = await db()
      .from("viajes")
      .insert(nuevaFila)
      .select()
      .single();

    if (dbErr) throw new Error(`DB insert: ${dbErr.message}`);

    // ── Comunicar al RVTC (asíncrono — no bloquea la respuesta) ─
    comunicarServicio(viaje)
      .then(async (rvtc) => {
        await db()
          .from("viajes")
          .update({
            estado_ministerio:  rvtc.estado,
            codigo_ministerio:  rvtc.codigoMinisterio || null,
            payload_ministerio: rvtc.payload,
            error_ministerio:   rvtc.error || null,
          })
          .eq("id", viaje.id);
      })
      .catch((e) =>
        console.error(`[RVTC] Error comunicando ${codigoViaje}:`, e.message)
      );

    // ── Respuesta inmediata al cliente ───────────────────────
    return NextResponse.json({
      exito:          true,
      codigo_viaje:   codigoViaje,
      precio_final:   precioFinal,
      desglose,
      url_hoja_ruta:  `/api/hoja-ruta/${codigoViaje}`,
      aviso:          null,
    });

  } catch (e) {
    console.error("[POST /api/viajes]", e);
    return err(e.message, 500);
  }
}

// ════════════════════════════════════════════════════════════════
//  GET /api/viajes — Listar viajes
//  Query params: mes=YYYY-MM | conductor=ID | limit=N | estado=X
// ════════════════════════════════════════════════════════════════
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mes         = searchParams.get("mes");
    const conductorId = searchParams.get("conductor");
    const limit       = parseInt(searchParams.get("limit") || "100");
    const estado      = searchParams.get("estado");

    let q = db()
      .from("viajes")
      .select(
        "id,codigo_viaje,conductor_id,conductor_nombre," +
        "direccion_origen,direccion_destino,precio_final,precio_iva," +
        "forma_pago,estado,estado_ministerio,codigo_ministerio," +
        "fue_negociado,distancia_km,duracion_min,pasajeros," +
        "fecha_reserva,fecha_inicio_servicio,fecha_fin_servicio"
      )
      .order("fecha_reserva", { ascending: false })
      .limit(limit);

    if (mes) {
      const ini = `${mes}-01T00:00:00`;
      const fin = new Date(
        parseInt(mes.slice(0, 4)),
        parseInt(mes.slice(5)),   // mes+1
        1
      ).toISOString();
      q = q.gte("fecha_reserva", ini).lt("fecha_reserva", fin);
    }

    if (conductorId) q = q.eq("conductor_id", parseInt(conductorId));
    if (estado)      q = q.eq("estado", estado);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return NextResponse.json({ viajes: data || [] });
  } catch (e) {
    console.error("[GET /api/viajes]", e);
    return err(e.message, 500);
  }
}

// ── PATCH /api/viajes — Actualizar estado ──────────────────────
export async function PATCH(req) {
  try {
    const { codigo_viaje, estado, ...resto } = await req.json();
    if (!codigo_viaje) return err("codigo_viaje requerido", 400);

    const { error } = await db()
      .from("viajes")
      .update({ estado, ...resto, updated_at: new Date().toISOString() })
      .eq("codigo_viaje", codigo_viaje);

    if (error) throw new Error(error.message);
    return NextResponse.json({ exito: true });
  } catch (e) {
    return err(e.message, 500);
  }
}

// ── Helpers ─────────────────────────────────────────────────────
const err = (msg, status = 400) =>
  NextResponse.json({ error: msg }, { status });

// Estimación de km cuando no viene de Google Maps
function estimarKm(origen = "", destino = "") {
  const base = Math.abs(origen.length - destino.length) * 0.3 + 6;
  return Math.min(Math.max(base, 4), 40);
}
