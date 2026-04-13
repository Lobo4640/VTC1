"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Flag, Calendar, Users, Briefcase, Baby, Dog, Accessibility, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

// Tipos para nuestro estado
type Step = 1 | 2 | 3;

export default function BookingSystem() {
  const [step, setStep] = useState<Step>(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Lógica para los Extras
  const toggleExtra = (id: string) => {
    setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans">
      <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* HEADER & STEPPER */}
        <header className="p-6 pb-2 bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black tracking-tighter">TAX<span className="text-blue-500">MAD</span></h1>
            <div className="flex gap-2">
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 font-bold">ES</span>
            </div>
          </div>
          
          {/* Stepper Pro */}
          <div className="flex justify-between items-center relative px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  step >= s ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${step >= s ? 'text-blue-400' : 'text-slate-600'}`}>
                  {s === 1 ? 'Ruta' : s === 2 ? 'Precio' : 'Reserva'}
                </span>
              </div>
            ))}
            {/* Línea conectora */}
            <div className="absolute top-4 left-0 w-full h-[2px] bg-slate-800 -z-0">
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }}></div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* PASO 1: CONFIGURACIÓN DE RUTA */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-emerald-500/20 transition-all">
                <div className="text-2xl">⚡</div>
                <div>
                  <p className="text-emerald-400 text-sm font-bold">Reservar ahora mismo</p>
                  <p className="text-emerald-500/60 text-[10px] font-semibold">Se asignará el conductor más cercano</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-emerald-500" />
              </div>

              {/* Inputs Estilo OLED */}
              <div className="space-y-4">
                <div className="group">
                  <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Recogida</label>
                  <div className="relative mt-1">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" placeholder="¿Dónde te recogemos?" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                  </div>
                </div>

                <div className="group">
                  <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Destino</label>
                  <div className="relative mt-1">
                    <Flag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" placeholder="¿A dónde vas?" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                  </div>
                </div>
              </div>

              {/* Extras Grid */}
              <div className="grid grid-cols-2 gap-3">
                <ExtraCard icon={<Briefcase size={18}/>} label="Maletas" sub="Más de 1" active={extras.includes('bag')} onClick={() => toggleExtra('bag')} />
                <ExtraCard icon={<Baby size={18}/>} label="Silla Bebé" sub="Grupo 0/1/2" active={extras.includes('baby')} onClick={() => toggleExtra('baby')} />
                <ExtraCard icon={<Dog size={18}/>} label="Mascota" sub="Transportín" active={extras.includes('pet')} onClick={() => toggleExtra('pet')} />
                <ExtraCard icon={<Accessibility size={18}/>} label="Accesible" sub="PMR" active={extras.includes('acc')} onClick={() => toggleExtra('acc')} />
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                CALCULAR PRECIO FINAL
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* PASO 2: PRECIO (Aquí usaremos tu 1€/km) */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] text-center shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-blue-200 uppercase mb-2">Precio Cerrado</p>
                  <h2 className="text-6xl font-black tracking-tighter">15,00€</h2>
                  <div className="mt-4 flex justify-center gap-4">
                    <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold">12.4 km</div>
                    <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold">18 min</div>
                  </div>
               </div>

               <div className="bg-slate-800/30 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400 font-bold">Tarifa Base</span>
                    <span className="text-xs font-bold">1.00€ / km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">Registro Ministerio</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Incluido</span>
                  </div>
               </div>

               <div className="flex gap-3">
                 <button onClick={() => setStep(1)} className="p-5 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors">
                   <ArrowLeft size={24} />
                 </button>
                 <button onClick={() => setStep(3)} className="flex-1 bg-white text-slate-900 font-black py-5 rounded-2xl hover:bg-slate-100 transition-all active:scale-95">
                   CONTINUAR A RESERVA
                 </button>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Subcomponente para las tarjetas de extras
function ExtraCard({ icon, label, sub, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
        active 
        ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className={`${active ? 'text-blue-400' : 'text-slate-500'}`}>{icon}</div>
      <div className="text-left">
        <p className={`text-[11px] font-bold ${active ? 'text-blue-100' : 'text-slate-300'}`}>{label}</p>
        <p className="text-[9px] text-slate-500 font-medium">{sub}</p>
      </div>
    </div>
  );
}
