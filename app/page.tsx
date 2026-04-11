import { redirect } from "next/navigation";
import { getPerfilActual } from "../lib/supabase-server";
import Link from "next/link";
import { Car, Navigation, Shield, Star, Clock, MapPin } from "lucide-react"; // Corrección: MapPin añadido aquí

export default async function RootPage() {
  const perfil = await getPerfilActual();

  // Si ya está logueado, lo mandamos a su panel correspondiente
  if (perfil) {
    const role = (perfil as any).rol;
    if (role === "admin") redirect("/admin");
    if (role === "driver") redirect("/driver");
  }

  return (
    <div className="min-h-dvh bg-oled text-white font-sans">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-border/30 bg-black/50 backdrop-blur-md sticky top-0 z-50">
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
        <div className="vtc-card p-6 space-y-4 border-gold/20 shadow-2xl shadow-gold/5">
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

          <button className="w-full py-5 bg-gold text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
            CALCULAR PRECIO FINAL
          </button>
        </div>

        {/* Beneficios */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-white/5"><Shield size={16} className="text-gold"/></div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-text-dim">Seguro</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-white/5"><Star size={16} className="text-gold"/></div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-text-dim">Premium</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-white/5"><Clock size={16} className="text-gold"/></div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-text-dim">24/7</p>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center text-[10px] text-text-dim uppercase tracking-widest border-t border-border/10">
        &copy; {new Date().getFullYear()} TaxMad VTC — Madrid, España
      </footer>
    </div>
  );
}
