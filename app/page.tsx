// app/page.tsx — Punto de entrada raíz (Server Component)
import { redirect } from "next/navigation";
import { getPerfilActual } from "../lib/supabase-server";

/**
 * Esta página actúa como un "enrutador inteligente".
 * El flujo es:
 * 1. Intenta obtener el perfil del usuario desde el servidor.
 * 2. Si no hay sesión, manda a /login.
 * 3. Si hay sesión, mira el rol y redirige al panel correspondiente.
 */
export default async function RootPage() {
  // Obtenemos el perfil usando el cliente de servidor
  const perfil = await getPerfilActual();

  // 1. Si no hay sesión o no existe el perfil, redirigimos al login
  if (!perfil) {
    redirect("/login");
  }

  // 2. Verificamos si la cuenta está activa (Seguridad extra)
  // Usamos (perfil as any) para evitar errores de tipos en el build de Vercel
  if ((perfil as any).activo === false) {
    redirect("/login?error=cuenta_desactivada");
  }

  // 3. Redirigir según el rol
  const role = (perfil as any).rol;

  if (role === "admin") {
    // Si es administrador, lo enviamos a su panel de control
    redirect("/admin");
  } else {
    // Por defecto (conductores), los enviamos a la app de gestión de viajes
    redirect("/driver");
  }
}
