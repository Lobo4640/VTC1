// app/page.tsx — Punto de entrada raíz
import { redirect } from "next/navigation";
// Cambiamos @/ por ../ para que Next.js encuentre el archivo sin errores
import { getPerfilActual } from "../lib/supabase-server";

export default async function RootPage() {
  // Obtenemos el perfil usando el cliente de servidor optimizado
  const perfil = await getPerfilActual();

  // 1. Si no hay sesión o perfil, mandamos al login
  if (!perfil) {
    redirect("/login");
  }

  // 2. Si la cuenta existe pero no está activa (seguridad extra)
  if (perfil.activo === false) {
    redirect("/login?error=cuenta_desactivada");
  }

  // 3. Redirigir según el rol definido en la base de datos
  if (perfil.rol === "admin") {
    redirect("/admin");
  }

  // Por defecto, si no es admin, es conductor
  redirect("/driver");
}
