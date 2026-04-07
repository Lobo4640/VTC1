/**
 * app/api/conductores/route.js
 * ─────────────────────────────────────────────
 * GET  → Listar conductores (sin pin_hash)
 * POST → Verificar PIN de 4 dígitos (usa función SQL bcrypt)
 * PUT  → Cambiar PIN (solo Admin con service_role)
 */

import { NextResponse } from "next/server";
import { createClient }  from "@supabase/supabase-js";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

const err = (msg, status = 400) =>
  NextResponse.json({ error: msg }, { status });

// ════════════════════════════════════════════════════════════════
//  GET /api/conductores — Lista de conductores (sin datos sensibles)
// ════════════════════════════════════════════════════════════════
export async function GET() {
  try {
    const { data, error } = await db()
      .from("conductores")
      .select("id, nombre, activo, total_viajes, total_km, total_ingresos")
      .eq("activo", true)
      .order("nombre");

    if (error) throw new Error(error.message);

    return NextResponse.json({ conductores: data || [] });
  } catch (e) {
    console.error("[GET /api/conductores]", e);
    return err(e.message, 500);
  }
}

// ════════════════════════════════════════════════════════════════
//  POST /api/conductores — Verificar PIN (autenticación conductor)
//
//  Seguridad:
//  · El PIN nunca se almacena en texto plano (bcrypt en DB)
//  · La verificación la hace la función SQL `verificar_pin_conductor`
//  · Máximo 5 intentos por IP (ver middleware.js en Bloque 3)
//  · Respuesta idéntica si PIN incorrecto o conductor inexistente
//    (evita enumeración de IDs)
// ════════════════════════════════════════════════════════════════
export async function POST(req) {
  try {
    const body = await req.json();
    const { conductor_id, pin } = body;

    // ── Validación de formato ────────────────────────────────
    if (!conductor_id || typeof conductor_id !== "number") {
      return err("conductor_id (number) requerido", 400);
    }
    if (!pin || !/^[0-9]{4}$/.test(String(pin))) {
      return err("PIN debe ser exactamente 4 dígitos numéricos", 400);
    }

    // ── Verificar PIN con función SQL bcrypt ─────────────────
    const { data: esValido, error: fnErr } = await db().rpc(
      "verificar_pin_conductor",
      { p_conductor_id: conductor_id, p_pin: String(pin) }
    );

    if (fnErr) {
      console.error("[PIN verify RPC]", fnErr.message);
      // Respuesta genérica — no revelar motivo técnico
      return NextResponse.json({ autenticado: false }, { status: 401 });
    }

    if (!esValido) {
      // Pequeño delay artificial para frenar ataques de fuerza bruta
      await sleep(400);
      return NextResponse.json({ autenticado: false }, { status: 401 });
    }

    // ── PIN correcto — devolver datos del conductor ──────────
    const { data: conductor, error: condErr } = await db()
      .from("conductores")
      .select("id, nombre, activo, total_viajes, total_km, total_ingresos")
      .eq("id", conductor_id)
      .eq("activo", true)
      .single();

    if (condErr || !conductor) {
      return NextResponse.json({ autenticado: false }, { status: 401 });
    }

    return NextResponse.json({
      autenticado: true,
      conductor,
    });

  } catch (e) {
    console.error("[POST /api/conductores]", e);
    return err("Error interno de servidor", 500);
  }
}

// ════════════════════════════════════════════════════════════════
//  PUT /api/conductores — Cambiar PIN (Admin only)
//  Body: { conductor_id: number, nuevo_pin: string }
// ════════════════════════════════════════════════════════════════
export async function PUT(req) {
  try {
    const { conductor_id, nuevo_pin } = await req.json();

    // ── Validaciones ─────────────────────────────────────────
    if (!conductor_id) return err("conductor_id requerido", 400);
    if (!nuevo_pin || !/^[0-9]{4}$/.test(String(nuevo_pin))) {
      return err("nuevo_pin debe ser exactamente 4 dígitos", 400);
    }

    // ── Cambiar PIN vía función SQL ──────────────────────────
    const { error: fnErr } = await db().rpc("cambiar_pin_conductor", {
      p_conductor_id: parseInt(conductor_id),
      p_nuevo_pin:    String(nuevo_pin),
    });

    if (fnErr) {
      console.error("[cambiar_pin_conductor RPC]", fnErr.message);
      return err(fnErr.message, 500);
    }

    return NextResponse.json({
      exito:   true,
      mensaje: `PIN del conductor ${conductor_id} actualizado correctamente`,
    });

  } catch (e) {
    console.error("[PUT /api/conductores]", e);
    return err(e.message, 500);
  }
}

// ── Helper ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
