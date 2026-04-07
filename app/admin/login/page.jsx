"use client";
/**
 * app/admin/login/page.jsx — Login del Administrador
 * Email + Contraseña via Supabase Auth
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showPass,setShowPass]= useState(false);

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
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 py-12">
      <div
        className="w-full max-w-[400px] rounded-[2rem] overflow-hidden"
        style={{
          background: "#0d1f36",
          border: "1px solid #1a2f4a",
          boxShadow: "0 0 0 8px #050e1a, 0 0 0 10px #112F5C, 0 40px 80px rgba(0,0,0,.7)",
        }}
      >
        {/* Header */}
        <div
          className="px-8 py-8 text-center"
          style={{ background: "linear-gradient(135deg,#071528,#112F5C)", borderBottom: "1px solid rgba(0,181,255,.1)" }}
        >
          <div className="text-[44px] mb-3 float">🛡️</div>
          <div className="text-[22px] font-black text-white tracking-tight">Panel Admin</div>
          <div
            className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-[10px] font-bold"
            style={{ background:"rgba(34,199,139,.1)", color:"#22c78b", border:"1px solid rgba(34,199,139,.2)" }}
          >
            🔒 Acceso seguro con Supabase Auth
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="p-7 flex flex-col gap-5">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold tracking-widest mb-2" style={{ color: "#8898aa" }}>
              EMAIL
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none">📧</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tuempresa.com"
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#00B5FF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,181,255,.12)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#1a2f4a"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-[10px] font-bold tracking-widest mb-2" style={{ color: "#8898aa" }}>
              CONTRASEÑA
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => { e.target.style.borderColor = "#00B5FF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,181,255,.12)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#1a2f4a"; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] transition-opacity hover:opacity-70"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8898aa" }}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-3 p-3.5 rounded-xl text-[12px] font-bold fade-in"
              style={{ background:"rgba(255,77,77,.1)", border:"1px solid rgba(255,77,77,.25)", color:"#ff4d4d" }}
            >
              ❌ {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full"
            style={{ padding: 16, fontSize: 14, opacity: loading ? 0.6 : 1 }}
          >
            {loading
              ? <><span className="spin">⏳</span> Verificando...</>
              : "Entrar al Panel Admin →"}
          </button>

          {/* Volver */}
          <div className="text-center">
            <a href="/inicio" className="text-[11px] font-bold no-underline hover:opacity-70 transition-opacity"
              style={{ color: "#8898aa" }}>
              ← Volver a inicio
            </a>
          </div>
        </form>

        {/* Info */}
        <div
          className="px-7 pb-6 text-center text-[9px] leading-5"
          style={{ color: "#8898aa" }}
        >
          Autenticación gestionada por Supabase Auth<br />
          <span className="font-mono" style={{ color: "#00B5FF" }}>
            mwjewdguvvmgzajfbjev.supabase.co
          </span>
        </div>
      </div>
    </div>
  );
}
