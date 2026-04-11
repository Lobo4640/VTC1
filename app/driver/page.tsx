"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Clock, ClipboardList, User, Copy, Check, Mic, MicOff, MapPin, Navigation,
  Euro, Send, Loader2, LogOut, Shield, Wifi, WifiOff
} from "lucide-react";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { supabase } from "../../lib/supabase";
import { calcularPrecioFinal, formatearPrecio, MULTIPLICADORES } from "../../lib/tarifas";

// ── HOOK DE COPIADO ──
function useCopyToClipboard(resetMs = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), resetMs);
    } catch {
      setCopiedId(id);
    }
  }, [resetMs]);
  return { copiedId, copy };
}

function AddressField({ label, address, fieldId, copiedId, onCopy, icon }: any) {
  const isCopied = copiedId === fieldId;
  return (
    <button type="button" onClick={() => onCopy(address, fieldId)} className="w-full text-left rounded-2xl border border-border/60 p-3 bg-surface/50 hover:border-accent/40 transition-all">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-accent uppercase font-bold flex items-center gap-1">{icon} {label}</span>
          <p className="text-sm font-medium truncate">{address}</p>
        </div>
        <div className={`p-2 rounded-lg ${isCopied ? "text-success" : "text-text-dim"}`}>
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
        </div>
      </div>
    </button>
  );
}

// ── PANTALLA DE VIAJES ──
function PantallaViajes() {
  const [viajes, setViajes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { copiedId, copy } = useCopyToClipboard();

  const cargarViajes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("reservas").select("*").eq("estado_reserva", "pendiente");
    setViajes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargarViajes(); }, [cargarViajes]);

  if (loading) return <div className="p-10 text-center text-text-dim animate-pulse">Buscando servicios...</div>;

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {viajes.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-border/40 rounded-3xl text-text-dim">No hay servicios pendientes</div>
      ) : (
        viajes.map((v) => (
          <div key={v.id} className="rounded-3xl border border-border/60 p-5 bg-card bg-gradient-to-br from-card to-oled">
            <div className="flex justify-between mb-4">
              <span className="text-2xl font-black text-gold">{v.precio_estimado}€</span>
              <span className="text-accent text-xs font-bold uppercase tracking-tighter">{new Date(v.fecha_hora).toLocaleTimeString()}</span>
            </div>
            <div className="space-y-2 mb-4">
              <AddressField label="Origen" address={v.origen} fieldId={`o-${v.id}`} copiedId={copiedId} onCopy={copy} icon={<MapPin size={10}/>} />
              <AddressField label="Destino" address={v.destino} fieldId={`d-${v.id}`} copiedId={copiedId} onCopy={copy} icon={<Navigation size={10}/>} />
            </div>
            <button className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase text-sm hover:bg-gold transition-colors">Aceptar Viaje</button>
          </div>
        ))
      )}
    </div>
  );
}

// ── PANTALLA REGISTRO (CON MULTIPLICADORES) ──
function PantallaRegistro() {
  const [nombre, setNombre] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [km, setKm] = useState("");
  const [multiplicador, setMultiplicador] = useState(1);
  const [precioPactado, setPrecioPactado] = useState("");
  const [enviando, setEnviando] = useState(false);

  const precioFinal = calcularPrecioFinal(
    parseFloat(km) || 0,
    multiplicador,
    precioPactado ? parseFloat(precioPactado) : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.from("reservas").insert([{
      nombre_cliente: nombre,
      origen,
      destino,
      distancia_km: parseFloat(km),
      precio_estimado: precioFinal,
      estado_reserva: 'completada'
    }]);
    setEnviando(false);
    if (!error) alert("Registro enviado correctamente al Ministerio");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-slide-up">
      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex items-center gap-3">
        <Shield className="text-accent" size={20} />
        <p className="text-[10px] font-bold text-text-main uppercase tracking-widest">Registro Oficial Ministerio</p>
      </div>
      
      <input className="vtc-input" placeholder="Nombre del Cliente" value={nombre} onChange={e => setNombre(e.target.value)} required />
      <input className="vtc-input" placeholder="Origen del viaje" value={origen} onChange={e => setOrigen(e.target.value)} required />
      <input className="vtc-input" placeholder="Destino del viaje" value={destino} onChange={e => setDestino(e.target.value)} required />
      
      <div className="space-y-2 mt-2">
        <label className="text-[10px] text-text-dim font-bold uppercase ml-2">Kilómetros Reales</label>
        <input className="vtc-input" type="number" placeholder="Ej: 15.5" value={km} onChange={e => setKm(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-text-dim font-bold uppercase ml-2">Demanda / Multiplicador</label>
        <div className="grid grid-cols-3 gap-2">
          {MULTIPLICADORES.map(m => (
            <button key={m} type="button" onClick={() => { setMultiplicador(m); setPrecioPactado(""); }}
              className={`py-3 rounded-xl border text-xs font-bold transition-all ${multiplicador === m && !precioPactado ? "bg-accent text-black border-accent" : "bg-surface border-border/40 text-text-dim"}`}>
              x{m.toFixed(2)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-text-dim font-bold uppercase ml-2">O Precio Pactado Manual</label>
        <input className="vtc-input border-gold/30" type="number" placeholder="Ej: 50" value={precioPactado} onChange={e => setPrecioPactado(e.target.value)} />
      </div>

      <div className="bg-card border border-border/60 p-6 rounded-[2rem] text-center my-2">
        <span className="text-[10px] text-gold font-bold uppercase">Total a cobrar</span>
        <div className="text-4xl font-black text-white">{precioFinal.toFixed(2)}€</div>
        <p className="text-[9px] text-text-muted mt-1 uppercase">{precioPactado ? "Tarifa Manual" : `1€/km x ${multiplicador}`}</p>
      </div>

      <button type="submit" disabled={enviando} className="vtc-btn-accent py-5">
        {enviando ? <Loader2 className="animate-spin" /> : <Send size={18} />}
        {enviando ? "Registrando..." : "Enviar Registro Oficial"}
      </button>
    </form>
  );
}

// ── PANTALLA PERFIL ──
function PantallaPerfil() {
  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      <div className="vtc-card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center text-xl font-bold">MG</div>
        <div>
          <h2 className="text-lg font-black text-white">Mateo García</h2>
          <p className="text-text-dim text-sm">VTC-M-00456</p>
        </div>
      </div>
      <button className="flex items-center gap-3 p-4 rounded-2xl bg-surface/50 text-danger border border-danger/20 font-bold mt-4">
        <LogOut size={18} /> Cerrar Sesión
      </button>
    </div>
  );
}

export default function DriverPage() {
  const [activeTab, setActiveTab] = useState<"viajes" | "registro" | "perfil">("viajes");
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="min-h-dvh bg-oled text-text-main">
      <header className="fixed top-0 inset-x-0 h-16 bg-black/80 backdrop-blur-lg border-b border-border/50 flex items-center justify-between px-6 z-50">
        <div className="font-black text-[10px] leading-tight uppercase">TaxMad<br/><span className="text-accent">Driver</span></div>
        <button onClick={() => setIsOnline(!isOnline)} className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${isOnline ? "border-success text-success bg-success/10" : "border-danger text-danger bg-danger/10"}`}>
          {isOnline ? "• ONLINE" : "• OFFLINE"}
        </button>
      </header>

      <main className="pt-24 px-4 pb-28">
        {activeTab === "viajes" && <PantallaViajes />}
        {activeTab === "registro" && <PantallaRegistro />}
        {activeTab === "perfil" && <PantallaPerfil />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 h-20 bg-black/90 backdrop-blur-md border-t border-border/50 flex justify-around items-center pb-safe z-50">
        <button onClick={() => setActiveTab("viajes")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'viajes' ? 'text-accent' : 'text-text-muted'}`}>
          <Clock size={22} /> <span className="text-[10px] font-bold">Viajes</span>
        </button>
        <button onClick={() => setActiveTab("registro")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'registro' ? 'text-accent' : 'text-text-muted'}`}>
          <ClipboardList size={22} /> <span className="text-[10px] font-bold">Registro</span>
        </button>
        <button onClick={() => setActiveTab("perfil")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'perfil' ? 'text-accent' : 'text-text-muted'}`}>
          <User size={22} /> <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
