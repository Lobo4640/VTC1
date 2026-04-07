"use client";

/**
 * app/admin/login/page.jsx — Login del Administrador
 * Corregido para Next.js 14 + Vercel
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Forzamos que la página sea dinámica para evitar errores de compilación en Vercel
export const dynamic = "force-dynamic";

// Configuración local del cliente para asegurar compatibilidad en el build
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      
      if (authErr) throw authErr;
      
      // Redirección al panel principal tras éxito
      router.push("/admin");
    } catch (e) {
      setError(
        e.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : e.message || "Error de autenticación"
      );
    } finally {
      setLoading(false);
    }
  }

  // Estilos compartidos
  const inputStyle = {
    width: "100%",
    padding: "13px 13px 13px 42px",
    borderRadius: 12,
    border: "1.5px solid #1a2f4a",
    background: "rgba(13,31,54,.9)",
    color: "#fff",
    fontSize: 13,
    fontFamily: "Montserrat, sans-serif",
    fontWeight: 600,
    outline: "none",
    transition: "all 0.2s ease"
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 py-12 bg-[#050e1a]">
      <div
        className="w-full max-w-[400px] rounded-[2rem] overflow-hidden"
        style={{
          background: "#0d1f36",
          border: "1px solid #1a2f4a",
          boxShadow: "0 0 0 8px #050e1a, 0 0 0 10px #112F5C, 0 40px 80px rgba(0,0,0,.7)",
        }}
      >
        {/* Header con degradado neón */}
        <div
          className="px-8 py-8 text-center"
          style={{ 
            background: "linear-gradient(135deg,#071528,#112F5C)", 
            borderBottom: "1px solid rgba(0,181,255,.1)" 
          }}
        >
          <div className="text-[44px] mb-3 animate-bounce">🛡️</div>
          <div className="text-[22px] font-black text-white tracking-tight uppercase">Panel Control VTC</div>
          <div
            className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-[10px] font-bold"
            style={{ background:"rgba(34,199,139,.1)", color:"#22c78b", border:"1px solid rgba(34,199,139,.2)" }}
          >
            🔒 ACCESO RESTRINGIDO
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="p-7 flex flex-col gap-5">
          <div>
            <label className="block text-[10px] font-bold tracking-widest mb-2 text-[#8898aa]">
              CORREO ELECTRÓNICO
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px]">📧</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vtcmadrid.com"
                required
                style={inputStyle}
                className="focus:border-[#00B5FF] focus:shadow-[0_0_0_3px_rgba(0,181,255,.12)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest mb-2 text-[#8898aa]">
              CONTRASEÑA
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px]">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, paddingRight: 44 }}
                className="focus:border-[#00B5FF] focus:shadow-[0_0_0_3px_rgba(0,181,255,.12)]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] opacity-50 hover:opacity-100 transition-opacity"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-3 p-3.5 rounded-xl text-[12px] font-bold animate-pulse"
              style={{ background:"rgba(255,77,77,.1)", border:"1px solid rgba(255,77,77,.25)", color:"#ff4d4d" }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
            style={{ 
              background: loading ? "#1a2f4a" : "linear-gradient(90deg, #00B5FF, #7A5FFF)",
              boxShadow: loading ? "none" : "0 4px 15px rgba(0,181,255,0.3)",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Verificando identidad..." : "ENTRAR AL SISTEMA"}
          </button>
        </form>

        <div className="px-7 pb-8 text-center">
           <a href="/inicio" className="text-[11px] font-bold text-[#8898aa] hover:text-white transition-colors">
             ← VOLVER AL INICIO
           </a>
        </div>
      </div>
    </div>
  );
}
