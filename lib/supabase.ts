import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────
// SUPABASE — Cliente del lado del navegador
// ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Falta configurar las variables de entorno de Supabase.");
}

// Creamos el cliente de forma sencilla para que Vercel no de errores de tipos
// Sustituye la última línea por esto:
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
