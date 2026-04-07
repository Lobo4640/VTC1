"use client";

import {
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  Clock,
  ClipboardList,
  User,
  Copy,
  Check,
  Mic,
  MicOff,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Euro,
  Car,
  AlertTriangle,
  CreditCard,
  Banknote,
  Wifi,
  WifiOff,
  Loader2,
  Send,
  RotateCcw,
  Phone,
  LogOut,
  Shield,
  Star,
  Calendar,
  Timer,
} from "lucide-react";

import { useVoiceInput } from "@/hooks/useVoiceInput";
import { supabase }      from "@/lib/supabase";
import {
  determinarTarifa,
  calcularPrecioViaje,
  formatearPrecio,
} from "@/lib/tarifas";

// ─────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────

type NavTab = "viajes" | "registro" | "perfil";
type ViajeEstado = "pendiente" | "recogido" | "en_trayecto" | "completado" | "cancelado";
type MetodoPago  = "Tarjeta" | "Efectivo" | "Bizum";

interface Viaje {
  id:           string;
  precio:       number;
  fechaHora:    string;
  origen:       string;
  destino:      string;
  pasajero:     string;
  metodoPago:   MetodoPago;
  estado:       ViajeEstado;
  km:           number;
  notaConductor?: string;
}

// ─────────────────────────────────────────────────────────
// DATOS MOCK — sustituir por Supabase realtime
// ─────────────────────────────────────────────────────────
const VIAJE_ACTIVO: Viaje = {
  id:         "vtc-2024-0041",
  precio:     32.0,
  fechaHora:  "2025-04-08T09:30:00",
  origen:     "Aeropuerto Madrid-Barajas T4",
  destino:    "Hotel Ritz, Plaza de la Lealtad",
  pasajero:   "Sr. Smith",
  metodoPago: "Tarjeta",
  estado:     "pendiente",
  km:         18.6,
};

// ─────────────────────────────────────────────────────────
// HOOK: useCopyToClipboard
// ─────────────────────────────────────────────────────────
function useCopyToClipboard(resetMs = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), resetMs);
      } catch {
        // fallback para entornos sin permisos de clipboard
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity  = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), resetMs);
      }
    },
    [resetMs]
  );

  return { copiedId, copy };
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTE: MicButton
// ─────────────────────────────────────────────────────────
interface MicButtonProps {
  isRecording: boolean;
  isSupported: boolean;
  onToggle:    () => void;
  className?:  string;
}
function MicButton({ isRecording, isSupported, onToggle, className = "" }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!isSupported}
      title={
        !isSupported
          ? "Dictado no compatible con este navegador"
          : isRecording
          ? "Detener dictado"
          : "Dictar por voz"
      }
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full border transition-all duration-200
        disabled:opacity-30 disabled:cursor-not-allowed
        active:scale-90 focus-visible:ring-2 focus-visible:ring-accent
        ${
          isRecording
            ? "bg-red-500/20 border-red-500/60 text-red-400 animate-pulse-glow"
            : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/60"
        }
        ${className}
      `}
    >
      {isRecording ? (
        <MicOff size={16} strokeWidth={2.5} />
      ) : (
        <Mic size={16} strokeWidth={2.5} />
      )}
      {isRecording && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTE: VoiceField — Input + Mic integrados
// ─────────────────────────────────────────────────────────
interface VoiceFieldProps {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  icon?:       ReactNode;
  type?:       string;
  multiline?:  boolean;
  required?:   boolean;
}
function VoiceField({
  label,
  value,
  onChange,
  placeholder = "",
  icon,
  type = "text",
  multiline = false,
  required = false,
}: VoiceFieldProps) {
  const { isRecording, isSupported, toggleRecording } = useVoiceInput({
    onResult: (transcript) => onChange(value ? `${value} ${transcript}` : transcript),
  });

  const sharedClass = `
    vtc-input pr-14 w-full
    ${isRecording ? "border-red-500/60 ring-2 ring-red-500/20" : ""}
  `;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="vtc-label flex items-center gap-1.5">
        {icon && <span className="text-accent/70">{icon}</span>}
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isRecording ? "🎙 Escuchando..." : placeholder
            }
            rows={3}
            className={`${sharedClass} resize-none`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isRecording ? "🎙 Escuchando..." : placeholder
            }
            className={sharedClass}
            required={required}
          />
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <MicButton
            isRecording={isRecording}
            isSupported={isSupported}
            onToggle={toggleRecording}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTE: AddressField — dirección copiable
// ─────────────────────────────────────────────────────────
interface AddressFieldProps {
  label:   string;
  address: string;
  fieldId: string;
  copiedId: string | null;
  onCopy:  (text: string, id: string) => void;
  icon:    ReactNode;
}
function AddressField({ label, address, fieldId, copiedId, onCopy, icon }: AddressFieldProps) {
  const isCopied = copiedId === fieldId;

  return (
    <button
      type="button"
      onClick={() => onCopy(address, fieldId)}
      className="
        w-full text-left rounded-2xl border transition-all duration-200
        active:scale-[0.98] group
        border-border/60 hover:border-accent/40
      "
      style={{ background: "linear-gradient(145deg, #1a2535 0%, #111827 100%)" }}
      title="Toca para copiar al portapapeles"
    >
      <div className="px-4 py-3.5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="vtc-label flex items-center gap-1.5 mb-1">
            <span className="text-accent/80">{icon}</span>
            {label}
          </span>
          <p className="text-text-main text-base font-medium leading-snug truncate">
            {address}
          </p>
        </div>
        <div
          className={`
            flex-shrink-0 flex items-center justify-center
            w-8 h-8 rounded-xl transition-all duration-300
            ${
              isCopied
                ? "bg-success/20 text-success"
                : "bg-surface text-text-dim group-hover:bg-accent/10 group-hover:text-accent"
            }
          `}
        >
          {isCopied ? (
            <Check size={15} strokeWidth={2.5} className="animate-success" />
          ) : (
            <Copy size={15} strokeWidth={2} />
          )}
        </div>
      </div>
      {isCopied && (
        <div className="px-4 pb-2.5">
          <p className="text-success text-2xs font-semibold tracking-wide animate-fade-in">
            ✓ Copiado — pega en tu GPS
          </p>
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// TIPOS DE ESTADO PARA LA OPERACIÓN DE GUARDADO
// ─────────────────────────────────────────────────────────

type SavePhase =
  | "idle"     // Sin operación en curso
  | "saving"   // Escribiendo en Supabase
  | "saved"    // Confirmado — muestra pantalla de éxito
  | "error";   // Error de Supabase — muestra detalle

interface SaveResult {
  phase:        SavePhase;
  errorMsg?:    string;
  savedAt?:     Date;
  notaGuardada?: string;
}

// ─────────────────────────────────────────────────────────
// PANTALLA 1: GESTIÓN DE VIAJES
// ─────────────────────────────────────────────────────────
function PantallaViajes() {
  const [viaje, setViaje]   = useState<Viaje>(VIAJE_ACTIVO);
  const [nota, setNota]     = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estado granular del flujo de guardado en Supabase
  const [saveResult, setSaveResult] = useState<SaveResult>({ phase: "idle" });

  const { copiedId, copy } = useCopyToClipboard();

  // ── Micrófono para el textarea de incidencias ──────────
  const {
    isRecording: micNotaActive,
    isSupported: micSupported,
    toggleRecording: toggleMicNota,
  } = useVoiceInput({
    onResult: (transcript) =>
      setNota((prev) => (prev ? `${prev} ${transcript}` : transcript)),
    onError:  (err) => showToast(`Mic: ${err}`, "error"),
  });

  // ── Toast helper ───────────────────────────────────────
  const showToast = useCallback(
    (msg: string, type: "ok" | "error" | "info" = "ok") => {
      setToastMsg(
        `${type === "error" ? "⚠️" : type === "ok" ? "✅" : "ℹ️"} ${msg}`
      );
      setTimeout(() => setToastMsg(null), 3500);
    },
    []
  );

  // ── 1. CONFIRMAR RECOGIDA — update estado → 'recogido' ─
  const handleConfirmarRecogida = useCallback(async () => {
    setSaveResult({ phase: "saving" });

    const { error } = await supabase
      .from("viajes")
      .update({
        estado:     "recogido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", viaje.id);

    if (error) {
      setSaveResult({ phase: "idle" });
      showToast(`Error al confirmar recogida: ${error.message}`, "error");
      return;
    }

    setSaveResult({ phase: "idle" });
    setViaje((v) => ({ ...v, estado: "recogido" }));
    showToast("Recogida confirmada — buen viaje", "ok");
  }, [viaje.id, showToast]);

  // ── 2. FINALIZAR SERVICIO — update real en Supabase ────
  //    Guarda: estado → 'completado', nota_conductor, updated_at
  const handleFinalizarServicio = useCallback(async () => {
    // Fase 1: UI en modo "guardando"
    setSaveResult({ phase: "saving" });

    const ahora = new Date().toISOString();

    const { data, error } = await supabase
      .from("viajes")
      .update({
        estado:          "completado",
        nota_conductor:  nota.trim() || null,  // null si no hay incidencias
        updated_at:      ahora,
      })
      .eq("id", viaje.id)
      .select()   // devuelve la fila actualizada para confirmación
      .single();

    if (error) {
      // Fase: error — muestra mensaje detallado sin perder la nota
      setSaveResult({
        phase:    "error",
        errorMsg: error.message,
      });
      return;
    }

    // Fase: guardado con éxito — actualiza estado local
    setViaje((v) => ({
      ...v,
      estado:       "completado",
      notaConductor: nota.trim() || undefined,
    }));
    setSaveResult({
      phase:        "saved",
      savedAt:      new Date(data.updated_at),
      notaGuardada: nota.trim() || undefined,
    });
  }, [viaje.id, nota]);

  // ── 3. ANULAR SERVICIO — update estado → 'cancelado' ───
  const handleAnular = useCallback(async () => {
    const confirmed = window.confirm(
      "¿Seguro que quieres anular este servicio?\nEsta acción quedará registrada y se notificará al Admin."
    );
    if (!confirmed) return;

    setSaveResult({ phase: "saving" });

    const { error } = await supabase
      .from("viajes")
      .update({
        estado:     "cancelado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", viaje.id);

    if (error) {
      setSaveResult({ phase: "idle" });
      showToast(`Error al anular: ${error.message}`, "error");
      return;
    }

    setSaveResult({ phase: "idle" });
    setViaje((v) => ({ ...v, estado: "cancelado" }));
    showToast("Servicio anulado — Admin notificado", "error");
  }, [viaje.id, showToast]);

  // ── Helpers de estado ──────────────────────────────────
  const isSaving  = saveResult.phase === "saving";
  const hasError  = saveResult.phase === "error";

  // ── Formatear fecha de viaje ───────────────────────────
  const fechaViaje = new Date(viaje.fechaHora);
  const esManana   = (() => {
    const hoy     = new Date();
    const manana  = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    return fechaViaje.toDateString() === manana.toDateString();
  })();
  const etiquetaFecha = esManana
    ? `MAÑANA ${fechaViaje.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
    : fechaViaje.toLocaleString("es-ES", {
        weekday: "short", day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit",
      }).toUpperCase();

  // ── PANTALLA: Guardando en Supabase (overlay de carga) ─
  if (isSaving) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 animate-fade-in">
        {/* Anillo animado */}
        <div className="relative w-28 h-28">
          <div
            className="absolute inset-0 rounded-full border-4 border-accent/20"
          />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="text-accent animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-text-main text-lg font-black">Guardando en Supabase</p>
          <p className="text-text-dim text-sm">
            Enviando nota del conductor y actualizando estado…
          </p>
          {/* Barra de progreso indeterminada */}
          <div className="mt-4 w-48 h-1 rounded-full bg-surface overflow-hidden mx-auto">
            <div
              className="h-full rounded-full bg-accent animate-shimmer"
              style={{ width: "60%", backgroundSize: "200% 100%" }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── PANTALLA: Error de Supabase ────────────────────────
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center">
          <AlertTriangle size={40} className="text-danger" strokeWidth={1.5} />
        </div>

        <div className="text-center space-y-2 max-w-xs">
          <h2 className="text-xl font-black text-text-main">Error al guardar</h2>
          <p className="text-text-dim text-sm">
            No se pudo conectar con Supabase. Tu nota está a salvo — inténtalo de nuevo.
          </p>
          {saveResult.errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-danger/10 border border-danger/20 text-left">
              <p className="vtc-label text-danger/80 mb-1">Detalle técnico</p>
              <p className="text-danger/70 text-xs font-mono break-all leading-relaxed">
                {saveResult.errorMsg}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {/* Reintentar — vuelve a llamar a handleFinalizar con la misma nota */}
          <button
            onClick={handleFinalizarServicio}
            className="
              w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase
              flex items-center justify-center gap-2
              transition-all duration-200 active:scale-[0.98]
            "
            style={{
              background: "linear-gradient(135deg, #00B5FF 0%, #0077CC 100%)",
              boxShadow: "0 4px 24px rgba(0,181,255,0.35)",
              color: "#000",
            }}
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            Reintentar
          </button>

          {/* Descartar error — volver al formulario */}
          <button
            onClick={() => setSaveResult({ phase: "idle" })}
            className="text-text-dim text-sm text-center py-1 hover:text-text-main transition-colors"
          >
            Volver y editar nota
          </button>
        </div>
      </div>
    );
  }

  // ── PANTALLA: Guardado con éxito ───────────────────────
  if (saveResult.phase === "saved") {
    const hora = saveResult.savedAt
      ? saveResult.savedAt.toLocaleTimeString("es-ES", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        })
      : "";

    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 px-4 animate-fade-in">
        {/* Círculo de éxito con icono animado */}
        <div className="relative">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center animate-success"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)",
              border: "2px solid rgba(16,185,129,0.4)",
              boxShadow: "0 0 40px rgba(16,185,129,0.3)",
            }}
          >
            <CheckCircle2 size={52} className="text-success" strokeWidth={1.5} />
          </div>
          {/* Ping de confirmación */}
          <span
            className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping"
            style={{ animationDuration: "1.5s", animationIterationCount: 1 }}
          />
        </div>

        {/* Mensaje principal */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-text-main">
            Servicio Guardado con Éxito
          </h2>
          <p className="text-success text-sm font-semibold">
            ✓ Supabase actualizado correctamente
          </p>
        </div>

        {/* Ficha resumen del servicio completado */}
        <div
          className="w-full max-w-sm rounded-2xl border border-border/60 overflow-hidden animate-slide-up"
          style={{ background: "linear-gradient(145deg, #1a2535 0%, #111827 100%)" }}
        >
          {/* Precio */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-border/40">
            <span className="vtc-label">Total del servicio</span>
            <span className="text-text-main text-xl font-black">
              {formatearPrecio(viaje.precio)}
            </span>
          </div>

          {/* Detalles */}
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="vtc-label">Pasajero</p>
                <p className="text-text-main text-sm font-semibold">{viaje.pasajero}</p>
              </div>
              <div className="text-right">
                <p className="vtc-label">Hora de cierre</p>
                <p className="text-accent text-sm font-mono font-bold">{hora}</p>
              </div>
            </div>

            <div>
              <p className="vtc-label flex items-center gap-1">
                <MapPin size={9} /> Origen
              </p>
              <p className="text-text-dim text-xs leading-snug">{viaje.origen}</p>
            </div>

            <div>
              <p className="vtc-label flex items-center gap-1">
                <Navigation size={9} /> Destino
              </p>
              <p className="text-text-dim text-xs leading-snug">{viaje.destino}</p>
            </div>

            {/* Nota del conductor si existe */}
            {saveResult.notaGuardada && (
              <div className="pt-1 border-t border-border/40">
                <p className="vtc-label flex items-center gap-1 mb-1">
                  <AlertTriangle size={9} className="text-warning/70" />
                  Nota guardada en BD
                </p>
                <p className="text-text-dim text-xs leading-relaxed italic">
                  "{saveResult.notaGuardada}"
                </p>
              </div>
            )}
          </div>

          {/* Sello de estado */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 border border-success/20">
              <Check size={12} className="text-success" strokeWidth={3} />
              <span className="text-success text-xs font-bold tracking-wide">
                COMPLETADO · nota_conductor guardada · estado: completado
              </span>
            </div>
          </div>
        </div>

        {/* CTA — preparar siguiente servicio */}
        <button
          onClick={() => {
            setViaje(VIAJE_ACTIVO);
            setNota("");
            setSaveResult({ phase: "idle" });
          }}
          className="vtc-btn-accent max-w-xs w-full animate-slide-up delay-150"
        >
          <RotateCcw size={16} strokeWidth={2.5} />
          Listo para el siguiente viaje
        </button>
      </div>
    );
  }

  // ── PANTALLA: viaje cancelado ──────────────────────────
  if (viaje.estado === "completado") {
    // Guardia de seguridad — normalmente no se alcanza porque
    // el estado "completado" lo maneja la fase "saved" de Supabase.
    return null;
  }

  // ── Estado cancelado ──────────────────────────────────
  if (viaje.estado === "cancelado") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center">
          <XCircle size={48} className="text-danger" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-text-main">Servicio Anulado</h2>
          <p className="text-text-dim text-sm">Admin ha sido notificado.</p>
        </div>
        <button
          onClick={() => setViaje(VIAJE_ACTIVO)}
          className="vtc-btn-accent max-w-xs"
        >
          <RotateCcw size={16} />
          Volver al servicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-slide-up">

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 p-3.5 rounded-2xl bg-card border border-border shadow-lg animate-slide-down text-sm text-center font-medium">
          {toastMsg}
        </div>
      )}

      {/* ── Tarjeta principal del viaje ── */}
      <div
        className="rounded-3xl border border-border/60 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1a2535 0%, #111827 100%)" }}
      >
        {/* Cabecera: precio + fecha */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div>
            <div className="vtc-price">{formatearPrecio(viaje.precio)}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`
                  vtc-badge text-2xs
                  ${viaje.estado === "recogido"
                    ? "bg-success/15 text-success border-success/30"
                    : "bg-accent/10 text-accent border-accent/20"}
                `}
              >
                {viaje.estado === "recogido" ? "EN TRAYECTO" : "PENDIENTE"}
              </span>
              <span className="text-text-muted text-2xs font-mono">#{viaje.id}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-accent text-xs font-black tracking-widest">{etiquetaFecha}</p>
            <p className="text-text-dim text-2xs mt-1 flex items-center justify-end gap-1">
              <Navigation size={10} />
              {viaje.km.toFixed(1)} km aprox.
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-border/40 mx-5" />

        {/* Campos de dirección (copiables) */}
        <div className="px-4 py-3 flex flex-col gap-3">
          <AddressField
            label="Punto de recogida"
            address={viaje.origen}
            fieldId="origen"
            copiedId={copiedId}
            onCopy={copy}
            icon={<MapPin size={11} strokeWidth={2.5} />}
          />
          <AddressField
            label="Destino"
            address={viaje.destino}
            fieldId="destino"
            copiedId={copiedId}
            onCopy={copy}
            icon={<Navigation size={11} strokeWidth={2.5} />}
          />
        </div>

        {/* Pasajero + Pago */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <div>
            <p className="vtc-label">Pasajero</p>
            <p className="text-text-main font-bold text-lg leading-tight">{viaje.pasajero}</p>
          </div>
          <div className="text-right">
            <p className="vtc-label">Pago</p>
            <div className="flex items-center gap-1.5">
              {viaje.metodoPago === "Tarjeta" ? (
                <CreditCard size={14} className="text-accent" />
              ) : viaje.metodoPago === "Efectivo" ? (
                <Banknote size={14} className="text-success" />
              ) : (
                <Phone size={14} className="text-warning" />
              )}
              <p className="text-text-main font-bold">{viaje.metodoPago}</p>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-border/40 mx-5" />

        {/* Textarea de incidencias + Micrófono */}
        <div className="px-4 py-4">
          <p className="vtc-label flex items-center gap-1.5 mb-2">
            <AlertTriangle size={11} className="text-warning/80" strokeWidth={2.5} />
            Nota para Admin
            <span className="text-text-muted font-normal normal-case tracking-normal">
              (incidencias)
            </span>
          </p>
          <div className="relative">
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={
                micNotaActive
                  ? "🎙 Escuchando incidencia..."
                  : "Dicta incidencia aquí..."
              }
              rows={3}
              className={`
                vtc-input resize-none pr-14 font-mono text-sm
                ${micNotaActive ? "border-red-500/60" : ""}
              `}
            />
            <div className="absolute right-3 bottom-3">
              <MicButton
                isRecording={micNotaActive}
                isSupported={micSupported}
                onToggle={toggleMicNota}
              />
            </div>
          </div>
        </div>

        {/* Botón de acción dual */}
        <div className="px-4 pb-4 flex flex-col gap-3">
          {viaje.estado === "pendiente" ? (
            <button
              onClick={handleConfirmarRecogida}
              disabled={isSaving}
              className="
                w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase
                transition-all duration-200 active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-wait
                flex items-center justify-center gap-2 text-white
              "
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                boxShadow: "0 4px 24px rgba(16,185,129,0.40)",
              }}
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} strokeWidth={2.5} />
              )}
              {isSaving ? "Actualizando en BD..." : "Confirmar Recogida"}
            </button>
          ) : (
            <button
              onClick={handleFinalizarServicio}
              disabled={isSaving}
              className="
                w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase
                transition-all duration-200 active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-wait
                flex items-center justify-center gap-2
              "
              style={{
                background: "linear-gradient(135deg, #00B5FF 0%, #0077CC 100%)",
                boxShadow: "0 4px 24px rgba(0,181,255,0.40)",
                color: "#000",
              }}
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} strokeWidth={2.5} />
              )}
              {isSaving ? "Guardando en Supabase..." : "Finalizar Servicio"}
            </button>
          )}

          {/* Anular */}
          <button
            onClick={handleAnular}
            disabled={isSaving}
            className="
              text-text-muted text-sm text-center py-1
              hover:text-danger transition-colors duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            Anular este servicio
          </button>
        </div>
      </div>

      {/* ── Panel de instrucciones de GPS ── */}
      <div className="vtc-card p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <Navigation size={16} className="text-accent" />
        </div>
        <div>
          <p className="text-text-main text-sm font-semibold mb-0.5">
            Copia y navega
          </p>
          <p className="text-text-dim text-xs leading-relaxed">
            Toca el origen o el destino para copiarlo al portapapeles.
            Abre tu app de navegación preferida y pega la dirección.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PANTALLA 2: REGISTRO MANUAL (MINISTERIO)
// ─────────────────────────────────────────────────────────
function PantallaRegistro() {
  const [nombreCliente, setNombreCliente] = useState("");
  const [origen,        setOrigen]        = useState("");
  const [destino,       setDestino]       = useState("");
  const [precioManual,  setPrecioManual]  = useState("");
  const [metodoPago,    setMetodoPago]    = useState<MetodoPago>("Tarjeta");
  const [sending,       setSending]       = useState(false);
  const [enviado,       setEnviado]       = useState(false);
  const [toastMsg,      setToastMsg]      = useState<string | null>(null);

  // Sugerir precio con tarifas.ts
  const tarifaActual = determinarTarifa(new Date().toISOString());
  const precioSugerido = useCallback(
    (km: number) => formatearPrecio(calcularPrecioViaje(km, tarifaActual)),
    [tarifaActual]
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCliente || !origen || !destino) {
      showToast("⚠️ Completa todos los campos obligatorios");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    // aquí llamarías a tu API Route → Ministerio
    setSending(false);
    setEnviado(true);
    showToast("✅ Registro enviado al Ministerio de Transportes");
  };

  const handleNuevo = () => {
    setNombreCliente("");
    setOrigen("");
    setDestino("");
    setPrecioManual("");
    setMetodoPago("Tarjeta");
    setEnviado(false);
  };

  // Métodos de pago disponibles
  const metodos: { label: MetodoPago; icon: ReactNode }[] = [
    { label: "Tarjeta", icon: <CreditCard size={14} /> },
    { label: "Efectivo", icon: <Banknote size={14} /> },
    { label: "Bizum",   icon: <Phone size={14} /> },
  ];

  if (enviado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-success/15 border border-success/30 flex items-center justify-center animate-success">
          <Shield size={44} className="text-success" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black">Registro Enviado</h2>
          <p className="text-text-dim text-sm">
            El servicio de{" "}
            <span className="text-text-main font-semibold">{nombreCliente}</span>{" "}
            ha sido registrado correctamente.
          </p>
          <p className="text-text-muted text-xs mt-2">
            Conforme a la normativa del Ministerio de Transportes
          </p>
        </div>
        <button onClick={handleNuevo} className="vtc-btn-accent max-w-xs">
          <RotateCcw size={16} />
          Nuevo registro
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-slide-up">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 p-3.5 rounded-2xl bg-card border border-border shadow-lg animate-slide-down text-sm text-center font-medium">
          {toastMsg}
        </div>
      )}

      {/* Cabecera informativa */}
      <div className="vtc-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-accent" />
        </div>
        <div>
          <p className="text-text-main text-sm font-bold leading-tight">
            Registro Ministerio de Transportes
          </p>
          <p className="text-text-dim text-xs">
            Tarifa actual:{" "}
            <span className="text-accent font-semibold">
              {tarifaActual.TARIFA_NOMBRE} — {tarifaActual.PRECIO_KM.toFixed(2)} €/km
            </span>
          </p>
        </div>
      </div>

      {/* Sugerencia de precios rápidos */}
      <div>
        <p className="vtc-label mb-2">Precio sugerido por km</p>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 20].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setPrecioManual(
                calcularPrecioViaje(km, tarifaActual).toFixed(2)
              )}
              className="
                flex flex-col items-center py-2.5 rounded-xl
                bg-surface border border-border/60 text-center
                hover:border-accent/40 hover:bg-accent/5
                transition-all duration-150 active:scale-95
              "
            >
              <span className="text-accent text-xs font-bold">{km} km</span>
              <span className="text-text-dim text-2xs mt-0.5">
                {precioSugerido(km)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <VoiceField
          label="Nombre del cliente"
          value={nombreCliente}
          onChange={setNombreCliente}
          placeholder="Dicta o escribe el nombre..."
          icon={<User size={11} strokeWidth={2.5} />}
          required
        />
        <VoiceField
          label="Origen"
          value={origen}
          onChange={setOrigen}
          placeholder="Dirección de recogida..."
          icon={<MapPin size={11} strokeWidth={2.5} />}
          required
        />
        <VoiceField
          label="Destino"
          value={destino}
          onChange={setDestino}
          placeholder="Dirección de destino..."
          icon={<Navigation size={11} strokeWidth={2.5} />}
          required
        />

        {/* Precio final */}
        <div className="flex flex-col gap-1.5">
          <label className="vtc-label flex items-center gap-1.5">
            <span className="text-accent/70"><Euro size={11} strokeWidth={2.5} /></span>
            Precio acordado (€)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={precioManual}
              onChange={(e) => setPrecioManual(e.target.value)}
              placeholder={`Mín. ${formatearPrecio(tarifaActual.BASE)}`}
              className="vtc-input pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">
              EUR
            </span>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <p className="vtc-label mb-2">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {metodos.map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setMetodoPago(label)}
                className={`
                  flex items-center justify-center gap-2
                  py-3 rounded-2xl text-sm font-bold
                  border transition-all duration-150 active:scale-95
                  ${
                    metodoPago === label
                      ? "bg-accent/15 border-accent text-accent shadow-accent"
                      : "bg-surface border-border text-text-dim hover:border-border"
                  }
                `}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Botón enviar */}
        <button
          type="submit"
          disabled={sending}
          className="vtc-btn-accent mt-2 disabled:opacity-60 disabled:cursor-wait"
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {sending ? "Enviando al Ministerio..." : "Registrar Servicio"}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PANTALLA 3: MI PERFIL
// ─────────────────────────────────────────────────────────
function PantallaPerfil() {
  const stats = [
    { label: "Viajes hoy",    value: "7",       icon: <Car size={16} /> },
    { label: "Facturado",     value: "224 €",   icon: <Euro size={16} /> },
    { label: "Valoración",    value: "4.9 ⭐",  icon: <Star size={16} /> },
    { label: "En activo",     value: "6 h 20m", icon: <Timer size={16} /> },
  ];

  const menuItems = [
    { label: "Mi turno de hoy",     icon: <Calendar size={18} />,     color: "text-accent" },
    { label: "Historial de viajes", icon: <ClipboardList size={18} />, color: "text-accent" },
    { label: "Mis valoraciones",    icon: <Star size={18} />,          color: "text-warning" },
    { label: "Soporte / Ayuda",     icon: <Phone size={18} />,         color: "text-success" },
    { label: "Cerrar sesión",       icon: <LogOut size={18} />,        color: "text-danger" },
  ];

  return (
    <div className="flex flex-col gap-4 animate-slide-up">

      {/* Cabecera de perfil */}
      <div className="vtc-card p-5 flex items-center gap-4">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
            style={{ background: "linear-gradient(135deg, #00B5FF 0%, #0077CC 100%)" }}
          >
            MG
          </div>
          {/* Punto de estado activo */}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-oled" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-text-main text-lg font-black leading-tight">Mateo García</h2>
          <p className="text-text-dim text-sm">mateo.g@taxmad.es</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="vtc-badge-success text-2xs">ACTIVO</span>
            <span className="text-text-muted text-2xs">VTC-M-00456</span>
          </div>
        </div>
        <Wifi size={18} className="text-success flex-shrink-0" />
      </div>

      {/* Stats del día */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="vtc-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-accent">{icon}</span>
              <p className="vtc-label">{label}</p>
            </div>
            <p className="text-text-main text-xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Menú */}
      <div className="vtc-card overflow-hidden">
        {menuItems.map(({ label, icon, color }, idx) => (
          <button
            key={label}
            className={`
              w-full flex items-center justify-between
              px-4 py-4 transition-colors duration-150
              hover:bg-surface active:bg-surface
              ${idx !== 0 ? "border-t border-border/50" : ""}
              ${label === "Cerrar sesión" ? "opacity-80 hover:opacity-100" : ""}
            `}
          >
            <div className="flex items-center gap-3">
              <span className={color}>{icon}</span>
              <span
                className={`text-sm font-semibold ${
                  label === "Cerrar sesión" ? "text-danger" : "text-text-main"
                }`}
              >
                {label}
              </span>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        ))}
      </div>

      {/* Footer legal */}
      <p className="text-center text-text-muted text-2xs pb-2">
        TaxMad VTC v1.0.0 · Conforme RD 1057/2015
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BOTTOM NAVIGATION BAR
// ─────────────────────────────────────────────────────────
interface NavItem {
  id:    NavTab;
  label: string;
  icon:  ReactNode;
}
const NAV_ITEMS: NavItem[] = [
  { id: "viajes",   label: "Viajes",    icon: <Clock   size={22} strokeWidth={1.8} /> },
  { id: "registro", label: "Registro",  icon: <ClipboardList size={22} strokeWidth={1.8} /> },
  { id: "perfil",   label: "Perfil",    icon: <User    size={22} strokeWidth={1.8} /> },
];

interface BottomNavProps {
  activeTab: NavTab;
  onChange:  (tab: NavTab) => void;
}
function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`bottom-nav-item ${activeTab === id ? "active" : ""}`}
          aria-label={label}
          aria-current={activeTab === id ? "page" : undefined}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// HEADER DEL CONDUCTOR
// ─────────────────────────────────────────────────────────
interface DriverHeaderProps {
  activeTab: NavTab;
  isOnline:  boolean;
  onToggleOnline: () => void;
}
function DriverHeader({ activeTab, isOnline, onToggleOnline }: DriverHeaderProps) {
  const titles: Record<NavTab, string> = {
    viajes:   "Servicio Activo",
    registro: "Registro VTC",
    perfil:   "Mi Perfil",
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
      style={{
        height: "var(--header-h)",
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(55,65,81,0.5)",
      }}
    >
      {/* Conductor */}
      <div>
        <p className="text-text-muted text-2xs font-bold tracking-widest uppercase leading-none">
          Conductor
        </p>
        <p className="text-text-main text-sm font-black leading-tight">Mateo G.</p>
      </div>

      {/* Título central */}
      <h1 className="text-text-main text-sm font-bold absolute left-1/2 -translate-x-1/2">
        {titles[activeTab]}
      </h1>

      {/* Toggle online/offline */}
      <button
        onClick={onToggleOnline}
        className={`
          vtc-badge text-2xs transition-all duration-200 active:scale-95
          ${isOnline
            ? "bg-success/15 text-success border-success/40 hover:bg-success/25"
            : "bg-danger/15 text-danger border-danger/40 hover:bg-danger/25"
          }
        `}
      >
        {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
        {isOnline ? "ACTIVO" : "OFFLINE"}
      </button>
    </header>
  );
}

// ─────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL DEL CONDUCTOR
// ─────────────────────────────────────────────────────────
export default function DriverPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("viajes");
  const [isOnline,  setIsOnline]  = useState(true);

  const renderScreen = () => {
    switch (activeTab) {
      case "viajes":   return <PantallaViajes />;
      case "registro": return <PantallaRegistro />;
      case "perfil":   return <PantallaPerfil />;
    }
  };

  return (
    <div className="min-h-dvh bg-oled text-text-main">

      {/* Header fijo */}
      <DriverHeader
        activeTab={activeTab}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline((v) => !v)}
      />

      {/* Contenido scrollable */}
      <main
        className="px-4 pb-6"
        style={{
          paddingTop: "calc(var(--header-h) + 1rem)",
          // El padding-bottom del body (globals.css) ya incluye la nav
        }}
      >
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}