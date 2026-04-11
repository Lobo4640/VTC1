"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, Car, ChevronRight, Key } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={32} /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- FUNCIÓN RECUPERAR CONTRASEÑA ---
  const handleResetPassword = async () => {
    if (!email) {
      setLoginError("Introduce tu email para recuperar la contraseña.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) setLoginError(error.message);
    else alert("Revisa tu correo: te hemos enviado un enlace de recuperación.");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoginError("Acceso denegado: Datos incorrectos.");
      setLoading(false);
      return;
    }

    // Redirigir según rol
    const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", data.user.id).single();
    if (perfil?.rol === "admin") router.push("/admin");
    else router.push("/driver");
  };

  return (
    <div className="min-h-dvh bg-oled flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-card to-black border border-gold/30 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-gold/10">
            <Car size={40} className="text-gold" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black uppercase tracking-widest text-white">TaxMad <span className="text-gold">Driver</span></h1>
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-[0.3em]">Acceso Profesional</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <input 
              className="vtc-input" 
              type="email" 
              placeholder="Email Profesional" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <div className="relative">
              <input 
                className="vtc-input" 
                type={showPass ? "text" : "password"} 
                placeholder="Contraseña" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {loginError}
            </div>
          )}

          <button type="submit" disabled={loading} className="vtc-btn-accent w-full py-5 rounded-2xl flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <>ENTRAR AHORA <ChevronRight size={18}/></>}
          </button>
        </form>

        <div className="flex flex-col items-center gap-4">
          <button onClick={handleResetPassword} className="text-[10px] font-bold text-text-dim hover:text-gold flex items-center gap-2 uppercase tracking-widest">
            <Key size={12} /> He olvidado mi contraseña
          </button>
          <Link href="/" className="text-[10px] font-bold text-accent uppercase tracking-widest">
            Volver a la calculadora pública
          </Link>
        </div>
      </div>
    </div>
  );
}
