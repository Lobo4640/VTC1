import { redirect } from "next/navigation";
// Prueba con esta ruta (un solo nivel hacia atrás si lib está al lado de app)
import { getPerfilActual } from "../lib/supabase-server";

export default async function RootPage() {
  const perfil = await getPerfilActual();

  if (!perfil) {
    redirect("/login");
  }

  if (perfil.rol === "admin") {
    redirect("/admin");
  }

  redirect("/driver");
}
