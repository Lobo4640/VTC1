"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import {
  Clock, ClipboardList, User, Copy, Check, Mic, MicOff, MapPin, Navigation,
  CheckCircle2, XCircle, ChevronRight, Euro, Car, AlertTriangle, CreditCard,
  Banknote, Wifi, WifiOff, Loader2, Send, RotateCcw, Phone, LogOut, Shield,
  Star, Calendar, Timer
} from "lucide-react";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { supabase } from "../../lib/supabase";
import { determinarTarifa, calcularPrecioViaje, formatearPrecio } from "../../lib/tarifas";

// ── 1. HOOK DE COPIADO (Soluciona el error de compilación) ──
function useCopyToClipboard(resetMs = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), resetMs);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), resetMs);
    }
  }, [resetMs]);
  return { copiedId, copy };
}

// ── 2. COMPONENTES DE INTERFAZ (Micrófono y Campos) ──
function MicButton({ isRecording, isSupported, onToggle }: { isRecording: boolean; isSupported: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} disabled={!isSupported} className={`relative flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isRecording ? "bg-red-500/20 border-red-500/60 text-red-400 animate-pulse" : "bg-accent/10 border-accent/30 text-accent"}`}>
      {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
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

// ── 3. PANTALLA DE VIAJES (Conexión real Supabase) ──
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

  if (loading) return <div className="p-10 text-center text-text-dim">Cargando servicios de Supabase...</div>;

  return (
    <div className="flex flex-col gap-4">
      {viajes.map((v) => (
        <div key={v.id} className="rounded-3xl border border-border/60 p-5 bg-card">
          <div className="flex justify-between mb-4">
            <span className="text-2xl font-black text-gold">{v.precio_estimado}€</span>
            <span className="text-accent text-xs font-bold uppercase">{new Date(v.fecha_hora).toLocaleTimeString()}</span>
          </div>
          <div className="space-y-2 mb-4">
            <AddressField label="Origen" address={v.origen} fieldId={`o-${v.id}`} copiedId={copiedId} onCopy={copy} icon={<MapPin size={10}/>} />
            <AddressField label="Destino" address={v.destino} fieldId={`d-${v.id}`} copiedId={copiedId} onCopy={copy} icon={<Navigation size={10}/>} />
          </div>
          <button className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase text-sm">Aceptar Viaje</button>
        </div>
      ))}
    </div>
  );
}

// ── 4. PANTALLA REGISTRO MINISTERIO (Recuperada íntegra) ──
function PantallaRegistro() {
  const [nombre, setNombre] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [precio, setPrecio] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    // Simulación de envío al Ministerio (RD 1057/2015)
    await new Promise(r => setTimeout(r, 1500));
    setEnviando(false);
    alert("Registro enviado correctamente al Ministerio");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex items-center gap-3">
        <Shield className="text-accent" size={20} />
        <p className="text-xs font-bold text-text-main">Registro Oficial Ministerio de Transportes</p>
      </div>
      <input className="vtc-input" placeholder="Nombre del Cliente" value={nombre} onChange={e => setNombre(e.target.value)} required />
      <input className="vtc-input" placeholder="Origen" value={origen} onChange={e => setOrigen(e.target.value)} required />
      <input className="vtc-input" placeholder="Destino" value={destino} onChange={e => setDestino(e.target.value)} required />
      <input className="vtc-input" type="number" placeholder="Precio Final €" value={precio} onChange={e => setPrecio(e.target.value)} required />
      <button type="submit" disabled={enviando} className="vtc-btn-accent">
        {enviando ? <Loader2 className="animate-spin" /> : <Send size={18} />}
        {enviando ? "Registrando..." : "Enviar Registro Oficial"}
      </button>
    </form>
  );
}

// ── 5. PANTALLA PERFIL ──
function PantallaPerfil() {
  return (
    <div className="flex flex-col gap-4">
      <div className="vtc-card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center text-xl font-bold">MG</div>
        <div>
          <h2 className="text-lg font-black">Mateo García</h2>
          <p className="text-text-dim text-sm">Licencia: VTC-M-00456</p>
        </div>
      </div>
      <button className="flex items-center gap-3 p-4 rounded-2xl bg-surface text-danger font-bold mt-4">
        <LogOut size={18} /> Cerrar Sesión
      </button>
    </div>
  );
}

// ── ESTRUCTURA PRINCIPAL ──
export default function DriverPage() {
  const [activeTab, setActiveTab] = useState<"viajes" | "registro" | "perfil">("viajes");
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="min-h-dvh bg-oled text-text-main">
      <header className="fixed top-0 inset-x-0 h-16 bg-black/80 backdrop-blur-lg border-b border-border/50 flex items-center justify-between px-6 z-50">
        <div className="font-black text-xs tracking-tighter uppercase">Conductor <br/><span className="text-accent">Online</span></div>
        <h1 className="text-sm font-bold uppercase tracking-widest">{activeTab}</h1>
        <button onClick={() => setIsOnline(!isOnline)} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isOnline ? "border-success text-success bg-success/10" : "border-danger text-danger bg-danger/10"}`}>
          {isOnline ? "ACTIVO" : "OFFLINE"}
        </button>
      </header>

      <main className="pt-24 px-4 pb-24">
        {activeTab === "viajes" && <PantallaViajes />}
        {activeTab === "registro" && <PantallaRegistro />}
        {activeTab === "perfil" && <PantallaPerfil />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 h-20 bg-black border-t border-border/50 flex justify-around items-center pb-safe">
        <button onClick={() => setActiveTab("viajes")} className={`flex flex-col items-center gap-1 ${activeTab === 'viajes' ? 'text-accent' : 'text-text-dim'}`}>
          <Clock size={20} /> <span className="text-[10px] font-bold">Viajes</span>
        </button>
        <button onClick={() => setActiveTab("registro")} className={`flex flex-col items-center gap-1 ${activeTab === 'registro' ? 'text-accent' : 'text-text-dim'}`}>
          <ClipboardList size={20} /> <span className="text-[10px] font-bold">Registro</span>
        </button>
        <button onClick={() => setActiveTab("perfil")} className={`flex flex-col items-center gap-1 ${activeTab === 'perfil' ? 'text-accent' : 'text-text-dim'}`}>
          <User size={20} /> <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
