import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ─────────────────────────────────────────────────────────
// SUPABASE — Cliente del lado del navegador (anon key)
// ─────────────────────────────────────────────────────────
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:      true,
    autoRefreshToken:    true,
    detectSessionInUrl:  true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ─────────────────────────────────────────────────────────
// SUPABASE ADMIN — Solo en Server Components / API Routes
// Usar SUPABASE_SERVICE_ROLE_KEY (nunca exponerlo al cliente)
// ─────────────────────────────────────────────────────────
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY — solo disponible en el servidor");
  }
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  });
}
