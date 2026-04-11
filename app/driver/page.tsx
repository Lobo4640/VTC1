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

// ── TIPOS ACTUALIZADOS SEGÚN TU SQL ─────────────────────────
type NavTab = "viajes" | "registro" | "perfil";
type MetodoPago = "Tarjeta" | "Efectivo" | "Bizum";

interface Viaje {
  id: string;
  precio_estimado: number; // Según tu SQL
  fecha_hora: string;      // Según tu SQL
  origen: string;
  destino: string;
  nombre_cliente: string;  // Según tu SQL
  metodo_pago?: MetodoPago;
  estado_reserva: string;  // Según tu SQL: 'pendiente', 'aceptada', 'completada'
  distancia_km?: number;
  nota_conductor?: string;
}

// ── COMPONENTES DE APOYO (MicButton, VoiceField, etc. se mantienen igual) ──
// ... (Mantén tus componentes MicButton, VoiceField y AddressField igual que los tienes)

function PantallaViajes() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [nota, setNota] = useState("");
  const [saveResult, setSaveResult] = useState<{phase: string; errorMsg?: string}>({ phase: "idle" });
  const { copiedId, copy } = useCopyToClipboard();

  // CARGAR DATOS REALES DE SUPABASE
  const cargarViajes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("estado_reserva", "pendiente")
      .order("fecha_hora", { ascending: true });

    if (!error) setViajes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargarViajes(); }, [cargarViajes]);

  // ACTUALIZAR ESTADO (Aceptar o Finalizar)
  const actualizarEstado = async (viajeId: string, nuevoEstado: string) => {
    setSaveResult({ phase: "saving" });
    const { error } = await supabase
      .from("reservas")
      .update({ 
        estado_reserva: nuevoEstado,
        nota_conductor: nuevoEstado === "completada" ? nota : null 
      })
      .eq("id", viajeId);

    if (error) {
      setSaveResult({ phase: "error", errorMsg: error.message });
    } else {
      setSaveResult({ phase: "saved" });
      cargarViajes(); // Recargar lista
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Buscando servicios...</div>;

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {viajes.length === 0 ? (
        <div className="vtc-card p-10 text-center border-dashed">
          <p className="text-text-dim">No hay servicios pendientes</p>
        </div>
      ) : (
        viajes.map((v) => (
          <div key={v.id} className="rounded-3xl border border-border/60 overflow-hidden bg-gradient-to-br from-card to-oled p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-2xl font-black text-gold">{v.precio_estimado}€</div>
                <div className="text-text-muted text-2xs font-mono">ID: {v.id.slice(0,8)}</div>
              </div>
              <div className="text-right">
                <p className="text-accent text-xs font-black">
                  {new Date(v.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <p className="text-text-dim text-2xs">{v.distancia_km} km</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
               <AddressField label="Recogida" address={v.origen} fieldId={`o-${v.id}`} copiedId={copiedId} onCopy={copy} icon={<MapPin size={12}/>} />
               <AddressField label="Destino" address={v.destino} fieldId={`d-${v.id}`} copiedId={copiedId} onCopy={copy} icon={<Navigation size={12}/>} />
            </div>

            <button 
              onClick={() => actualizarEstado(v.id, "aceptada")}
              className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-gold transition-colors"
            >
              Aceptar Servicio
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// ── EXPORT PRINCIPAL ─────────────────────────────────────────
export default function DriverPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("viajes");
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="min-h-dvh bg-oled text-text-main">
      <DriverHeader activeTab={activeTab} isOnline={isOnline} onToggleOnline={() => setIsOnline(!isOnline)} />
      <main className="px-4 pb-24 pt-20">
        {activeTab === "viajes" && <PantallaViajes />}
        {activeTab === "registro" && <PantallaRegistro />}
        {activeTab === "perfil" && <PantallaPerfil />}
      </main>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
