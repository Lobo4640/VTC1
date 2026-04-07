/**
 * app/api/hoja-ruta/[codigo]/route.js
 * ─────────────────────────────────────────────
 * GET → Devuelve el Contrato de Transporte en HTML completo
 *       Usa lib/hojaRuta.js como generador
 *       Imprimible desde el navegador (Ctrl+P → Guardar como PDF)
 */

import { NextResponse } from "next/server";
import { createClient }  from "@supabase/supabase-js";
import { generarHTMLHojaRuta } from "@/lib/hojaRuta";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

export async function GET(req, { params }) {
  const { codigo } = params;

  try {
    // ── Buscar viaje en Supabase ──────────────────────────────
    const { data: viaje, error } = await db()
      .from("viajes")
      .select("*")
      .eq("codigo_viaje", codigo.toUpperCase())
      .single();

    if (error || !viaje) {
      return new NextResponse(htmlNotFound(codigo), {
        status:  404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // ── Datos del titular desde variables de entorno ──────────
    const titular = {
      nombre:    process.env.VTC_TITULAR_NOMBRE    || "VTC Madrid S.L.",
      nif:       process.env.VTC_TITULAR_NIF       || "B-XXXXXXXX",
      licencia:  process.env.VTC_LICENCIA_VTC      || "VTC-M-0001",
      matricula: process.env.VTC_MATRICULA         || "1234-ABC",
      marca:     process.env.VTC_VEHICULO_MARCA    || "Mercedes-Benz",
      modelo:    process.env.VTC_VEHICULO_MODELO   || "Clase E",
      telefono:  process.env.VTC_TELEFONO          || "+34 600 000 000",
      direccion: process.env.VTC_DIRECCION         || "Madrid, España",
    };

    // ── Generar HTML con lib/hojaRuta.js ─────────────────────
    const html = generarHTMLHojaRuta(viaje, titular);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type":  "text/html; charset=utf-8",
        // No cachear — el estado ministerio puede cambiar
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (e) {
    console.error(`[GET /api/hoja-ruta/${codigo}]`, e);
    return new NextResponse(htmlError(e.message), {
      status:  500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

// ── HTMLs de error inline ────────────────────────────────────────
const base = (title, body) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family:Montserrat,sans-serif; background:#071528; color:#fff;
           display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; }
    .card { background:#0d1f36; border:1px solid #1a2f4a; border-radius:16px;
            padding:40px; max-width:420px; text-align:center; }
    .ico  { font-size:52px; margin-bottom:16px; }
    h1    { font-size:18px; font-weight:900; margin-bottom:10px; color:#fff }
    p     { font-size:12px; color:#8898aa; line-height:1.7 }
    .code { font-family:monospace; font-size:14px; color:#00B5FF; margin:12px 0 }
    a     { color:#00B5FF; text-decoration:none; font-weight:700 }
  </style>
</head>
<body><div class="card">${body}</div></body>
</html>`;

const htmlNotFound = (cod) =>
  base("Viaje no encontrado", `
    <div class="ico">🔍</div>
    <h1>Viaje no encontrado</h1>
    <div class="code">${cod}</div>
    <p>Este código de viaje no existe o aún no ha sido registrado en el sistema.</p>
    <p style="margin-top:16px"><a href="/">← Volver al inicio</a></p>
  `);

const htmlError = (msg) =>
  base("Error interno", `
    <div class="ico">⚠️</div>
    <h1>Error al generar el contrato</h1>
    <p>${msg}</p>
    <p style="margin-top:16px"><a href="/">← Volver al inicio</a></p>
  `);
