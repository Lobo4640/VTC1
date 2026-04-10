// app/page.tsx
import { redirect } from "next/navigation";
import { getPerfilActual } from "../lib/supabase-server";

export default async function RootPage() {
  // Obtenemos el perfil
  const perfil = await getPerfilActual();

  // 1. Si no hay perfil, redirigimos al login
  if (!perfil) {
    redirect("/login");
    return; // Añadimos return para asegurar que TS no siga evaluando
  }

  // 2. Aquí forzamos a TS a entender que perfil tiene 'rol'
  // Usamos 'any' momentáneamente para saltar el bloqueo de compilación
  const userRole = (perfil as any).rol;

  if (userRole === "admin") {
    redirect("/admin");
  } else {
    redirect("/driver");
  }
}
