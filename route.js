/**
 * app/api/viajes/route.js — API DE VIAJES
 * GET: listar viajes (admin) | POST: crear viaje
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { comunicarServicio } from "@/lib/rvtc";
import { calcularPrecio, validarPrecontratacion, generarCodigoViaje } from "@/lib/calculator";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      conductor_id, conductor_nombre,
      direccion_origen, direccion_destino,
      fecha_servicio, distancia_km, duracion_min,
      extras, forma_pago,
      cliente_nombre, cliente_telefono, cliente_dni,
      precio_negociado,
    } = body;

    // 1. Validar precontratación (15 min mínimo — Art. 182bis LOTT)
    const precon = validarPrecontratacion(fecha_servicio);
    if (!precon.valido) {
      return NextResponse.json({ error: precon.error, codigo: "PRECONTRATACION_ILEGAL" }, { status: 422 });
    }

    // 2. Calcular precio cerrado
    const calc = calcularPrecio({
      km: parseFloat(distancia_km) || 10,
      duracionMin: parseInt(duracion_min) || 20,
      fecha: fecha_servicio,
      origen: direccion_origen,
      destino: direccion_destino,
      extras: extras || {},
    });

    const precioCerrado = precio_negociado ? parseFloat(precio_negociado) : calc.total;
    const iva = +(precioCerrado * 0.10).toFixed(2);

    const codigo = generarCodigoViaje();

    // 3. Guardar en Supabase
    const db = supabaseAdmin();
    const { data: viaje, error: dbErr } = await db.from("viajes").insert({
      codigo_viaje: codigo,
      conductor_id, conductor_nombre,
      direccion_origen, direccion_destino,
      fecha_inicio_servicio: fecha_servicio,
      distancia_km: parseFloat(distancia_km) || 0,
      duracion_min: parseInt(duracion_min) || 0,
      tarifa_nombre: calc.tarifa_nombre,
      precio_base: calc.subtotal,
      precio_final: precioCerrado,
      precio_iva: iva,
      desglose_precio: calc,
      fue_negociado: !!precio_negociado,
      forma_pago: forma_pago || "EFECTIVO",
      cliente_nombre, cliente_telefono, cliente_dni,
      pasajeros: body.pax || 1,
      extras_json: extras || {},
      estado: "EN_CURSO",
      estado_ministerio: "PENDIENTE",
      fecha_reserva: new Date().toISOString(),
    }).select().single();

    if (dbErr) throw dbErr;

    // 4. Comunicar al Ministerio ANTES de iniciar (Cap. 4 Manual RVTC)
    const rvtcRes = await comunicarServicio(viaje);
    await db.from("viajes").update({
      estado_ministerio: rvtcRes.estado,
      codigo_ministerio: rvtcRes.codigoMinisterio || null,
      payload_ministerio: rvtcRes.payload,
      error_ministerio: rvtcRes.error || null,
    }).eq("id", viaje.id);

    return NextResponse.json({
      exito: true,
      codigo_viaje: codigo,
      precio_final: precioCerrado,
      estado_ministerio: rvtcRes.estado,
      codigo_ministerio: rvtcRes.codigoMinisterio,
      url_hoja_ruta: `/api/hoja-ruta/${codigo}`,
      aviso: rvtcRes.estado === "PENDIENTE_MANUAL"
        ? "⚠️ Comunicación ministerio fallida. Registro manual requerido en https://sede.fomento.gob.es/RegistroVTC/"
        : null,
    });

  } catch (err) {
    console.error("[API/viajes POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mes         = searchParams.get("mes");      // YYYY-MM
    const conductorId = searchParams.get("conductor");

    const db = supabaseAdmin();
    let query = db.from("viajes")
      .select("id,codigo_viaje,conductor_id,conductor_nombre,direccion_origen,direccion_destino,precio_final,forma_pago,estado,estado_ministerio,codigo_ministerio,fecha_reserva,fue_negociado")
      .order("fecha_reserva", { ascending: false });

    if (mes) {
      const inicio = `${mes}-01T00:00:00`;
      const fin    = new Date(mes.slice(0,4), parseInt(mes.slice(5)) , 1).toISOString();
      query = query.gte("fecha_reserva", inicio).lt("fecha_reserva", fin);
    }
    if (conductorId) query = query.eq("conductor_id", parseInt(conductorId));

    const { data, error } = await query.limit(200);
    if (error) throw error;

    return NextResponse.json({ viajes: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
