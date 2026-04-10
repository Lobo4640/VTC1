"use client";

import { supabase } from "../../lib/supabase";
import type { UserRole } from "../../types/database";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Car,
  Shield,
  ChevronRight,
  Clock,
  ClipboardList,
  User,
  Wifi,
} from "lucide-react";

import { supabase }     from "@/lib/supabase";
import type { UserRole } from "@/types/database";

// ─────────────────────────────────────────────────────────
// CONSTANTE DE COOKIE DE ROL
// Debe coincidir exactamente con middleware.ts
// ─────────────────────────────────────────────────────────
const ROLE_COOKIE = "vtc-role";

function setCookieRol(rol: UserRole) {
  // SameSite=Lax; Path=/ → disponible en todas las rutas
  // No HTTP-only porque el middleware la lee en el edge
  const maxAge = 60 * 60 * 24 * 7; // 7 días
  document.cookie = `${ROLE_COOKIE}=${rol}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function clearCookieRol() {
  document.cookie = `${ROLE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

// ─────────────────────────────────────────────────────────
// TIPOS DE ERROR
// ─────────────────────────────────────────────────────────
interface LoginError {
  field?: "email" | "password" | "general";
  msg:    string;
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

// ─────────────────────────────────────────────────────────
// COMPONENTE: InputField
// ─────────────────────────────────────────────────────────
interface InputFieldProps {
  type:         string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder:  string;
  error?:       boolean;
  autoComplete: string;
  disabled?:    boolean;
  rightSlot?:   React.ReactNode;
}
function InputField({
  type, value, onChange, placeholder, error, autoComplete, disabled, rightSlot,
}: InputFieldProps) {
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

// ─────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: LoginPage
// ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? null;

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [checking,    setChecking]    = useState(true);  // comprueba sesión previa
  const [loginError,  setLoginError]  = useState<LoginError | null>(null);
  const [phase,       setPhase]       = useState<"idle" | "auth" | "role" | "redirect">("idle");

  const emailRef = useRef<HTMLInputElement>(null);

  // ── Comprobar sesión activa al montar ─────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Ya hay sesión — leer rol y redirigir
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

  // ── Lógica de login ───────────────────────────────────
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError(null);

      if (!email.trim())    { setLoginError({ field: "email",    msg: "Introduce tu email." });    return; }
      if (!password.trim()) { setLoginError({ field: "password", msg: "Introduce tu contraseña." }); return; }

      setLoading(true);

      // ── Fase 1: Autenticación con Supabase Auth ─────────
      setPhase("auth");
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (authError || !authData.user) {
        setLoading(false);
        setPhase("idle");
        setLoginError(parseSupabaseError(authError?.message ?? "Error desconocido."));
        return;
      }

      // ── Fase 2: Obtener rol de la tabla perfiles ────────
      setPhase("role");
      const { data: perfil, error: perfilError } = await supabase
        .from("perfiles")
        .select("id, rol, nombre, activo")
        .eq("id", authData.user.id)
        .single();

      if (perfilError || !perfil) {
        // El usuario existe en auth.users pero no en perfiles
        await supabase.auth.signOut();
        setLoading(false);
        setPhase("idle");
        setLoginError({
          field: "general",
          msg: "Tu cuenta no tiene perfil asignado. Contacta con el administrador.",
        });
        return;
      }

      if (!perfil.activo) {
        await supabase.auth.signOut();
        setLoading(false);
        setPhase("idle");
        setLoginError({
          field: "general",
          msg: "Tu cuenta está desactivada. Contacta con el administrador.",
        });
        return;
      }

      // ── Fase 3: Guardar rol en cookie + redirigir ───────
      setPhase("redirect");
      setCookieRol(perfil.rol as UserRole);

      const dest =
        redirectTo ??
        (perfil.rol === "admin" ? "/admin" : "/driver");

      // Pequeño delay para mostrar animación de éxito
      await new Promise((r) => setTimeout(r, 400));
      router.replace(dest);
    },
    [email, password, redirectTo, router]
  );

  // ── Texto de la fase de carga ─────────────────────────
  const phaseLabel: Record<typeof phase, string> = {
    idle:     "",
    auth:     "Verificando credenciales...",
    role:     "Cargando perfil...",
    redirect: "Acceso concedido ✓",
  };

  // ── Pantalla de comprobación inicial ─────────────────
  if (checking) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
          </div>
          <p className="text-gray-500 text-sm">Comprobando sesión…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "#000000" }}
    >
      {/* ── Fondo decorativo ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* Gradiente radial sutil desde arriba */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,181,255,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Grid pattern muy tenue */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,181,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,181,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* ── Contenido principal ── */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-5 py-10">

        {/* ── LOGO + BRANDING ── */}
        <div className="flex flex-col items-center gap-4 mb-10 animate-slide-up">
          {/* Icono de la app */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #0f1f35 0%, #1a2d45 100%)",
              border:     "1px solid rgba(0,181,255,0.25)",
              boxShadow:  "0 0 40px rgba(0,181,255,0.15), 0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            <Car
              size={36}
              strokeWidth={1.5}
              style={{ color: "#00B5FF" }}
            />
          </div>

          {/* Nombre */}
          <div className="text-center space-y-1">
            <h1
              className="text-2xl font-black tracking-[0.15em] uppercase"
              style={{ color: "#FFFFFF" }}
            >
              VTC Register
            </h1>
            <p
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: "#4B5563" }}
            >
              Plataforma de gestión
            </p>
          </div>
        </div>

        {/* ── TARJETA DE LOGIN ── */}
        <div
          className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up delay-75"
          style={{
            background:  "linear-gradient(160deg, #1a2535 0%, #111827 100%)",
            border:      "1px solid rgba(55,65,81,0.6)",
            boxShadow:   "0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="px-7 pt-8 pb-3">
            <h2
              className="text-center text-xl font-black mb-1"
              style={{ color: "#C8972E" }}   // gold — fiel a las capturas
            >
              Bienvenido
            </h2>
            <p className="text-center text-xs text-gray-500 mb-7">
              Accede con tu cuenta para continuar
            </p>

            <form onSubmit={handleLogin} noValidate className="space-y-3">

              {/* Email */}
              <div>
                <InputField
                  type="email"
                  value={email}
                  onChange={(v) => { setEmail(v); setLoginError(null); }}
                  placeholder="Email"
                  autoComplete="email"
                  error={loginError?.field === "email"}
                  disabled={loading}
                />
                {loginError?.field === "email" && (
                  <p className="mt-1.5 pl-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={11} /> {loginError.msg}
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <InputField
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(v) => { setPassword(v); setLoginError(null); }}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  error={loginError?.field === "password"}
                  disabled={loading}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPass
                        ? <EyeOff size={16} strokeWidth={2} />
                        : <Eye    size={16} strokeWidth={2} />
                      }
                    </button>
                  }
                />
                {loginError?.field === "password" && (
                  <p className="mt-1.5 pl-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={11} /> {loginError.msg}
                  </p>
                )}
              </div>

              {/* Error general */}
              {loginError?.field === "general" && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-2xl text-sm animate-fade-in"
                  style={{
                    background:   "rgba(239,68,68,0.10)",
                    border:       "1px solid rgba(239,68,68,0.30)",
                    color:        "#f87171",
                  }}
                >
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{loginError.msg}</span>
                </div>
              )}

              {/* Botón ENTRAR */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full py-4 mt-2 rounded-2xl
                  font-black text-sm tracking-[0.2em] uppercase
                  transition-all duration-200 active:scale-[0.98]
                  disabled:opacity-70 disabled:cursor-wait
                  flex items-center justify-center gap-2.5
                "
                style={{
                  background:  loading
                    ? "linear-gradient(135deg, #5a6a7a 0%, #3a4a5a 100%)"
                    : "linear-gradient(135deg, #C8972E 0%, #A67C20 100%)",
                  color:      "#000",
                  boxShadow:  loading
                    ? "none"
                    : "0 4px 24px rgba(200,151,46,0.40), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ color: "#9ca3af" }} />
                    <span style={{ color: "#9ca3af" }}>{phaseLabel[phase]}</span>
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

          {/* ── Divider + Links ── */}
          <div className="px-7 pb-7 pt-3 space-y-3">
            <div className="h-px" style={{ background: "rgba(55,65,81,0.6)" }} />

            <div className="text-center space-y-2">
              <button
                type="button"
                className="
                  text-sm font-semibold flex items-center gap-1.5
                  mx-auto transition-colors duration-150
                "
                style={{ color: "#00B5FF" }}
                onClick={() => { /* TODO: router.push("/register") */ }}
              >
                Crear una cuenta nueva
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>

              <button
                type="button"
                className="text-xs block mx-auto transition-colors duration-150"
                style={{ color: "#6B7280" }}
                onClick={() => { /* TODO: modal de reset */ }}
              >
                He olvidado mi contraseña
              </button>
            </div>
          </div>
        </div>

        {/* ── Tarjetas de rol disponible (informativas) ── */}
        <div
          className="w-full max-w-sm mt-5 grid grid-cols-2 gap-3 animate-slide-up delay-150"
        >
          {[
            {
              icon:  <Shield size={18} strokeWidth={1.8} />,
              label: "Admin",
              sub:   "Panel de control",
              color: "#C8972E",
              bg:    "rgba(200,151,46,0.08)",
              border:"rgba(200,151,46,0.25)",
            },
            {
              icon:  <Car size={18} strokeWidth={1.8} />,
              label: "Conductor",
              sub:   "Gestión de viajes",
              color: "#00B5FF",
              bg:    "rgba(0,181,255,0.08)",
              border:"rgba(0,181,255,0.25)",
            },
          ].map(({ icon, label, sub, color, bg, border }) => (
            <div
              key={label}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <span style={{ color }}>{icon}</span>
              <div>
                <p className="text-white text-xs font-bold leading-tight">{label}</p>
                <p className="text-gray-500 text-2xs">{sub}</p>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* ── BOTTOM NAVIGATION BAR (decorativa, refleja la app) ── */}
      <nav
        className="flex items-center justify-around px-4"
        style={{
          height:          "64px",
          paddingBottom:   "env(safe-area-inset-bottom)",
          background:      "rgba(17,24,39,0.92)",
          backdropFilter:  "blur(20px)",
          borderTop:       "1px solid rgba(55,65,81,0.5)",
          color:           "#4B5563",
        }}
      >
        {[
          { icon: <Clock   size={22} strokeWidth={1.8} />, label: "RELOJ"  },
          { icon: <ClipboardList size={22} strokeWidth={1.8} />, label: "LISTA"  },
          { icon: <User    size={22} strokeWidth={1.8} />, label: "PERFIL" },
        ].map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 px-4">
            {icon}
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em" }}>
              {label}
            </span>
          </div>
        ))}
      </nav>

    </div>
  );
}
