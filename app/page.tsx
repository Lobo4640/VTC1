// app/page.tsx — Punto de entrada raíz
// El middleware intercepta esta ruta y redirige según sesión:
//   • Sin sesión  → /login
//   • Conductor   → /driver
//   • Admin       → /admin
//
// Este componente solo se ejecuta si el middleware deja pasar
// al usuario (sesión válida sin cookie de rol aún establecida).

import { redirect } from "next/navigation";
import { getPerfilActual } from "@/lib/supabase-server";

export default async function RootPage() {
  const perfil = await getPerfilActual();

  // Sin perfil → el middleware debería haber redirigido, pero
  // como salvaguarda adicional redirigimos aquí también.
  if (!perfil) {
    redirect("/login");
  }

  // Redirigir según rol
  if (perfil.rol === "admin") {
    redirect("/admin");
  }

  redirect("/driver");
}
