import { createClient } from "@supabase/supabase-js";

// ✅ Credenciales conectadas a tu proyecto Supabase
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || "https://mwjewdguvvmgzajfbjev.supabase.co";
const SUPABASE_ANON     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13amV3ZGd1dnZtZ3phamZiamV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjM5NjUsImV4cCI6MjA5MDE5OTk2NX0.U8ratVAm6zh9a1UD6Q4Uoay5akgUKnArOxx_PAvo1F8";
const SUPABASE_SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY      || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13amV3ZGd1dnZtZ3phamZiamV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyMzk2NSwiZXhwIjoyMDkwMTk5OTY1fQ.C4On-1nbZ0O_TJwQtA-d7zdsAKgb9UC6zrp3B5N0jwI";

// Cliente público (browser / componentes cliente)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Cliente admin con service role (solo en API routes — servidor)
export const supabaseAdmin = () =>
  createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

// ── HELPERS ──────────────────────────────────────────────────────
export async function getViajes({ mes, conductorId, limit = 200 } = {}) {
  const db = supabaseAdmin();
  let q = db.from("viajes")
    .select("*")
    .order("fecha_reserva", { ascending: false })
    .limit(limit);
  if (mes) {
    const ini = `${mes}-01T00:00:00`;
    const fin = new Date(mes.slice(0,4), parseInt(mes.slice(5)), 1).toISOString();
    q = q.gte("fecha_reserva", ini).lt("fecha_reserva", fin);
  }
  if (conductorId) q = q.eq("conductor_id", parseInt(conductorId));
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function crearViaje(datos) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("viajes").insert(datos).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarViaje(id, datos) {
  const db = supabaseAdmin();
  const { error } = await db.from("viajes").update(datos).eq("id", id);
  if (error) throw error;
}

export async function getViajeByCode(codigo) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("viajes").select("*").eq("codigo_viaje", codigo).single();
  if (error) throw error;
  return data;
}

export async function getConductores() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("conductores").select("id,nombre,activo,total_viajes,total_km").eq("activo", true);
  if (error) throw error;
  return data;
}

export async function verificarPin(conductorId, pin) {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("verificar_pin_conductor", {
    p_conductor_id: parseInt(conductorId),
    p_pin: pin,
  });
  if (error) throw error;
  return data;
}

export async function cambiarPin(conductorId, nuevoPIN) {
  const db = supabaseAdmin();
  const { error } = await db.rpc("cambiar_pin_conductor", {
    p_conductor_id: parseInt(conductorId),
    p_nuevo_pin: nuevoPIN,
  });
  if (error) throw error;
}

export async function getResumenMensual(mes) {
  const db = supabaseAdmin();
  const { data, error } = await db.from("resumen_mensual").select("*");
  if (error) throw error;
  return data;
}
