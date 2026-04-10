// ─────────────────────────────────────────────────────────
// MIDDLEWARE — VTC Register
// Protección de rutas + control de rol por cookie
// ─────────────────────────────────────────────────────────

import { createServerClient } from "@supabase/ssr";
import { NextResponse }        from "next/server";
import type { NextRequest }    from "next/server";

// ── Nombre de la cookie de rol ─────────────────────────
// Se establece en el cliente tras el login exitoso.
// Valor: "admin" | "conductor"
const ROLE_COOKIE = "vtc-role";

// ── Rutas protegidas y sus roles requeridos ────────────
const ROUTE_ROLES: Record<string, string[]> = {
  "/admin":  ["admin"],
  "/driver": ["admin", "conductor"],  // admin puede acceder a ambos paneles
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Construir respuesta mutable para que el cliente SSR
  //       pueda leer y refrescar la sesión mediante cookies ──
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ── 2. Cliente Supabase adaptado al contexto del Middleware ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Actualizar las cookies en el request Y en la respuesta
          // para que el token refrescado viaje correctamente.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── 3. Refrescar sesión — CRÍTICO: nunca omitir getUser() ──
  // getUser() hace una llamada al servidor de Supabase para
  // validar el JWT (resiste tokens manipulados en cookies).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const role            = request.cookies.get(ROLE_COOKIE)?.value ?? null;

  // ── 4. Rutas de autenticación (login, register) ────────
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isAuthenticated && isAuthRoute) {
    // Usuario ya autenticado intenta abrir el login → redirigir a su panel
    const dest = role === "admin" ? "/admin" : "/driver";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── 5. Rutas protegidas ────────────────────────────────
  const protectedEntry = Object.entries(ROUTE_ROLES).find(([route]) =>
    pathname.startsWith(route)
  );

  if (protectedEntry) {
    const [route, allowedRoles] = protectedEntry;

    // 5a. Sin sesión → login, conservando la URL de destino
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 5b. Sin cookie de rol aún (primera carga tras login) → dejar pasar
    //     La página de destino leerá el perfil y establecerá la cookie.
    if (!role) {
      return response;
    }

    // 5c. Rol insuficiente → redirigir al panel correcto
    if (!allowedRoles.includes(role)) {
      const fallback = role === "admin" ? "/admin" : "/driver";
      return NextResponse.redirect(new URL(fallback, request.url));
    }

    // Registrar en cabecera el rol para que los Server Components
    // puedan leerlo sin hacer otra query a Supabase.
    response.headers.set("x-vtc-role", role);
  }

  return response;
}

// ── Configurar qué rutas pasan por el middleware ─────────
export const config = {
  matcher: [
    /*
     * Ejecutar en todas las rutas EXCEPTO:
     * - _next/static  (archivos estáticos)
     * - _next/image   (optimización de imágenes)
     * - favicon.ico   (icono)
     * - archivos con extensión (js, css, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
