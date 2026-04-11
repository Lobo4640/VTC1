import { redirect } from "next/navigation";
import { getPerfilActual } from "../lib/supabase-server";
import Link from "next/link";
import { Car, Navigation, Shield, Star, Clock } from "lucide-react";

export default async function RootPage() {
  const perfil = await getPerfilActual();

  // Si ya está logueado, lo mandamos a su panel
  if (perfil) {
    const role = (perfil as any).rol;
    if (role === "admin") redirect("/admin");
    if (role === "driver") redirect("/driver");
  }

  // Si NO está logueado, mostramos la interfaz de reserva para clientes
  return (
    <div className="min-h-dvh bg-oled text-white font-sans">
      {/* Header Simple */}
      <header className="p-6 flex justify-between items-center border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
            <Car size={18} className="text-black" />
          </div>
          <span className="font-black tracking-tighter uppercase text-sm">TaxMad <span className="text-gold">VTC</span></span>
        </div>
        <Link href="/login" className="text-[10px] font-bold py-2 px-4 rounded-full border border-gold/50 text-gold hover:bg-gold hover:text-black transition-all">
          ACCESO PROFESIONAL
        </Link>
      </header>

      <main className="px-6 py-10 max-w-lg mx-auto space-y-10">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-black leading-tight">Tu VTC privado <br/>al instante.</h1>
          <p className="text-text-dim text-sm italic">Precio cerrado: 1€ por cada kilómetro.</p>
        </section>

        {/* Formulario de Reserva Rápida */}
        <div className="vtc-card p-6 space-y-4 border-gold/20">
          <div className="space-y-3">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={18} />
              <input className="vtc-input pl-12" placeholder="¿Dónde te recogemos?" />
            </div>
            <div className="relative">
              <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={18} />
              <input className="vtc-input pl-12" placeholder="¿A dónde vas?" />
            </div>
          </div>

          <button className="w-full py-5 bg-gold text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform">
            CALCULAR PRECIO FINAL
          </button>
        </div>

        {/* Beneficios */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-surface flex items-center justify-center"><Shield size={16} className="text-gold"/></div>
            <p className="text-[9px] font-bold uppercase">Seguro</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-surface flex items-center justify-center"><Star size={16} className="text-gold"/></div>
            <p className="text-[9px] font-bold uppercase">Premium</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-surface flex items-center justify-center"><Clock size={16} className="text-gold"/></div>
            <p className="text-[9px] font-bold uppercase">24/7</p>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center text-[10px] text-text-dim uppercase tracking-widest">
        &copy; 2024 TaxMad VTC — Madrid, España
      </footer>
    </div>
  );
}

// Iconos que faltaban
function MapPin(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
}
