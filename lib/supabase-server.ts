// lib/supabase-server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies }            from "next/headers";
// Importamos el tipo de tu base de datos
import type { Database }      from "../types/database";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Esto es normal en Server Components de solo lectura
        }
      },
    },
  });
}

export async function getPerfilActual() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return perfil;
}
