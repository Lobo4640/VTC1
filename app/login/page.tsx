"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Car,
  ChevronRight,
} from "lucide-react";

// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import type { UserRole } from "../../types/database";

const ROLE_COOKIE = "vtc-role";

function setCookieRol(rol: UserRole) {
  const maxAge = 60 * 60 * 24 * 7; // 7 días
  document.cookie = `${ROLE_COOKIE}=${rol}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

interface LoginError {
  field?: "email" | "password" | "general";
  msg: string;
}

function parseSupabaseError(message: string): LoginError {
  if (message.includes("Invalid login credentials")) {
    return { field: "general", msg: "Email o contraseña incorrectos." };
  }
  if (message.includes("Email not confirmed")) {
    return { field: "general", msg: "Confirma tu email antes de entrar." };
  }
  if (message.includes("Too many requests")) {
    return { field: "general", msg: "Demasiados intentos. Espera unos minutos." };
  }
  return { field: "general", msg: message };
}

// Componente de Input extraído para mantener limpio el código
function InputField({
  type, value, onChange, placeholder, error, autoComplete, disabled, rightSlot,
}: any) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`
          w-full px-5 py-4 rounded-2xl text-sm
          bg-white text-gray-900 placeholder:text-gray-400
          border-2 transition-all duration-200 outline-none
          disabled:opacity-60 disabled:cursor-not-allowed
          ${error
            ? "border-red-400 focus:border-red-400"
            : "border-transparent focus:border-blue-400"}
          ${rightSlot ? "pr-14" : ""}
        `}
      />
      {rightSlot && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// --- CONTENIDO DEL LOGIN (Usa los hooks de navegación) ---
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [phase, setPhase] = useState<"idle" | "auth" | "role" | "redirect">("idle");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", session.user.id)
          .single();

        if (perfil?.rol) {
          setCookieRol(perfil.rol as UserRole);
          const dest = redirectTo ?? (perfil.rol === "admin" ? "/admin" : "/driver");
          router.replace(dest);
          return;
        }
      }
      setChecking(false);
    })();
  }, [router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!email.trim()) { setLoginError({ field: "email", msg: "Introduce tu email." }); return; }
    if (!password.trim()) { setLoginError({ field: "password", msg: "Introduce tu contraseña." }); return; }

    setLoading(true);
    setPhase("auth");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (authError || !authData.user) {
      setLoading(false);
      setPhase("idle");
      setLoginError(parseSupabaseError(authError?.message ?? "Error desconocido."));
      return;
    }

    setPhase("role");
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id, rol, nombre, activo")
      .eq("id", authData.user.id)
      .single();

    if (!perfil || !perfil.activo) {
      await supabase.auth.signOut();
      setLoading(false);
      setPhase("idle");
      setLoginError({
        field: "general",
        msg: "Cuenta desactivada o sin perfil.",
      });
      return;
    }

    setPhase("redirect");
    setCookieRol(perfil.rol as UserRole);
    const dest = redirectTo ?? (perfil.rol === "admin" ? "/admin" : "/driver");
    setTimeout(() => router.replace(dest), 400);
  };

  const phaseLabel: Record<typeof phase, string> = {
    idle: "",
    auth: "Verificando...",
    role: "Cargando perfil...",
    redirect: "Entrando...",
  };

  if (checking) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#000000" }}>
      <main className="relative flex-1 flex flex-col items-center justify-center px-5 py-10">
        {/* Tu diseño de Logo */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f1f35 0%, #1a2d45 100%)", border: "1px solid rgba(0,181,255,0.25)" }}>
            <Car size={36} style={{ color: "#00B5FF" }} />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-[0.15em] uppercase text-white">VTC Register</h1>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500">Plataforma de gestión</p>
          </div>
        </div>

        {/* Card de Formulario */}
        <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "linear-gradient(160deg, #1a2535 0%, #111827 100%)", border: "1px solid rgba(55,65,81,0.6)" }}>
          <div className="px-7 pt-8 pb-3">
            <h2 className="text-center text-xl font-black mb-1" style={{ color: "#C8972E" }}>Bienvenido</h2>
            <p className="text-center text-xs text-gray-500 mb-7">Accede con tu cuenta para continuar</p>

            <form onSubmit={handleLogin} noValidate className="space-y-3">
              <InputField
                type="email"
                value={email}
                onChange={(v: any) => setEmail(v)}
                placeholder="Email"
                autoComplete="email"
                error={loginError?.field === "email"}
                disabled={loading}
              />
              <InputField
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(v: any) => setPassword(v)}
                placeholder="Contraseña"
                autoComplete="current-password"
                error={loginError?.field === "password"}
                disabled={loading}
                rightSlot={
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              {loginError?.field === "general" && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                  <AlertCircle size={15} className="mt-0.5" />
                  <span>{loginError.msg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 rounded-2xl font-black text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-2.5"
                style={{ background: loading ? "#3a4a5a" : "#C8972E", color: "#000" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{phaseLabel[phase]}</span>
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ChevronRight size={16} strokeWidth={3} />
                  </>
                )}
              </button>
            </form>
          </div>
          <div className="px-7 pb-7 pt-3">
            <p className="text-center text-xs text-gray-500">VTC Register v1.0</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- EXPORT PRINCIPAL (Obligatorio para evitar el error de Suspense) ---
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
