"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  Euro,
  Banknote,
  Mic,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Navigation,
  User,
  CreditCard,
  Phone,
  RefreshCw,
  Archive,
  X,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Loader2,
  TrendingUp,
  Car,
  Shield,
  Bell,
  LogOut,
  Settings,
  MoreVertical,
  Calendar,
  Filter,
  Search,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import type { Viaje, ViajeEstado } from "../../types/database";
import { formatearPrecio } from "../../lib/tarifas";
// ─────────────────────────────────────────────────────────
// TIPOS LOCALES
// ─────────────────────────────────────────────────────────

type FiltroEstado = "todos" | ViajeEstado;

interface StatsHoy {
  totalEuros:   number;
  efectivo:     number;
  tarjeta:      number;
  bizum:        number;
  incidencias:  number;
  completados:  number;
  cancelados:   number;
  enCurso:      number;
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function calcularStats(viajes: Viaje[]): StatsHoy {
  const completados = viajes.filter((v) => v.estado === "completado");

  return {
    totalEuros:  completados.reduce((s, v) => s + v.precio, 0),
    efectivo:    completados
      .filter((v) => v.metodo_pago?.toLowerCase() === "efectivo")
      .reduce((s, v) => s + v.precio, 0),
    tarjeta:     completados
      .filter((v) => v.metodo_pago?.toLowerCase() === "tarjeta")
      .reduce((s, v) => s + v.precio, 0),
    bizum:       completados
      .filter((v) => v.metodo_pago?.toLowerCase() === "bizum")
      .reduce((s, v) => s + v.precio, 0),
    incidencias: viajes.filter((v) => v.nota_conductor?.trim()).length,
    completados: completados.length,
    cancelados:  viajes.filter((v) => v.estado === "cancelado").length,
    enCurso:     viajes.filter((v) =>
      ["pendiente", "asignado", "en_camino", "recogido"].includes(v.estado)
    ).length,
  };
}

/** Inicio del día local en ISO para filtrar por fecha */
function inicioDiaIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Etiqueta de estado en español + color de clase */
function etiquetaEstado(estado: ViajeEstado): {
  label: string;
  color: string;
  bg:    string;
} {
  const mapa: Record<ViajeEstado, { label: string; color: string; bg: string }> = {
    pendiente:  { label: "Pendiente",   color: "text-warning",   bg: "bg-warning/10 border-warning/30"   },
    asignado:   { label: "Asignado",    color: "text-accent",    bg: "bg-accent/10 border-accent/30"     },
    en_camino:  { label: "En camino",   color: "text-accent",    bg: "bg-accent/15 border-accent/40"     },
    recogido:   { label: "En trayecto", color: "text-success",   bg: "bg-success/10 border-success/30"   },
    completado: { label: "Completado",  color: "text-success",   bg: "bg-success/15 border-success/40"   },
    cancelado:  { label: "Cancelado",   color: "text-danger",    bg: "bg-danger/10 border-danger/30"     },
    archivado:  { label: "Archivado",   color: "text-text-muted",bg: "bg-surface border-border/40"       },
  };
  return mapa[estado] ?? { label: estado, color: "text-text-dim", bg: "bg-surface border-border" };
}

function iconoPago(metodo?: string): ReactNode {
  switch (metodo?.toLowerCase()) {
    case "tarjeta":  return <CreditCard size={13} className="text-accent"   />;
    case "efectivo": return <Banknote   size={13} className="text-success"  />;
    case "bizum":    return <Phone      size={13} className="text-warning"  />;
    default:         return <Euro       size={13} className="text-text-dim" />;
  }
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTE: StatCard
// ─────────────────────────────────────────────────────────
interface StatCardProps {
  icon:     ReactNode;
  label:    string;
  value:    string;
  sub?:     string;
  accent?:  string;   // clase de color del valor
  glow?:    string;   // rgba para box-shadow
  loading?: boolean;
}
function StatCard({ icon, label, value, sub, accent = "text-text-main", glow, loading }: StatCardProps) {
  return (
    <div
      className="relative rounded-2xl border border-border/60 p-4 flex flex-col gap-2 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #1a2535 0%, #111827 100%)",
        ...(glow ? { boxShadow: `0 0 20px ${glow}` } : {}),
      }}
    >
      {/* Fondo decorativo */}
      <div
        className="absolute -right-3 -top-3 w-14 h-14 rounded-full opacity-10"
        style={{ background: "currentColor" }}
      />
      <div className="flex items-center justify-between">
        <span className="vtc-label">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      {loading ? (
        <div className="vtc-skeleton h-7 w-24 rounded-lg" />
      ) : (
        <p className={`text-2xl font-black leading-none ${accent}`}>{value}</p>
      )}
      {sub && <p className="text-text-muted text-2xs">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTE: IncidenciaModal
// ─────────────────────────────────────────────────────────
interface IncidenciaModalProps {
  viaje:    Viaje;
  onClose:  () => void;
  onResolve:(id: string) => void;
}
function IncidenciaModal({ viaje, onClose, onResolve }: IncidenciaModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Cerrar al clicar backdrop
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)" }}
    >
      <div
        ref={modalRef}
        className="
          w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl
          border border-border/60 overflow-hidden animate-slide-up
        "
        style={{ background: "linear-gradient(160deg, #1e2d44 0%, #111827 100%)" }}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Cabecera */}
        <div className="px-5 py-4 flex items-start justify-between border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Mic size={16} className="text-accent" />
            </div>
            <div>
              <h2 className="text-text-main text-sm font-black">Nota del Conductor</h2>
              <p className="text-text-muted text-2xs">
                Viaje #{viaje.id.slice(0, 8)} · {viaje.metodo_pago}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="
              w-8 h-8 rounded-xl bg-surface border border-border/50
              flex items-center justify-center text-text-dim
              hover:text-text-main hover:border-border transition-colors
            "
          >
            <X size={14} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-5 py-4 space-y-4">
          {/* Ruta */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="vtc-label">Origen</p>
                <p className="text-text-main text-sm font-medium">{viaje.origen}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation size={13} className="text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="vtc-label">Destino</p>
                <p className="text-text-main text-sm font-medium">{viaje.destino}</p>
              </div>
            </div>
          </div>

          {/* La nota */}
          <div
            className="rounded-2xl border border-accent/20 p-4"
            style={{ background: "rgba(0,181,255,0.05)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Mic size={13} className="text-accent" />
              <span className="vtc-label text-accent">Incidencia dictada por voz</span>
            </div>
            <p className="text-text-main text-sm leading-relaxed italic">
              "{viaje.nota_conductor}"
            </p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Precio",  value: formatearPrecio(viaje.precio) },
              { label: "Pago",    value: viaje.metodo_pago ?? "—"      },
              { label: "Hora",    value: formatHora(viaje.updated_at)  },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-surface border border-border/40 py-2.5 px-2">
                <p className="vtc-label mb-0.5">{label}</p>
                <p className="text-text-main text-xs font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="px-5 pb-6 flex flex-col gap-2.5">
          <button
            onClick={() => { onResolve(viaje.id); onClose(); }}
            className="
              w-full py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase
              flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]
            "
            style={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              boxShadow:  "0 4px 20px rgba(16,185,129,0.35)",
              color: "#fff",
            }}
          >
            <CheckCircle2 size={16} strokeWidth={2.5} />
            Marcar como revisado
          </button>
          <button
            onClick={onClose}
            className="text-text-muted text-sm py-1 hover:text-text-dim transition-colors"
          >
            Cerrar sin acción
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTE: ViajeRow
// ─────────────────────────────────────────────────────────
interface ViajeRowProps {
  viaje:         Viaje;
  onVerNota:     (v: Viaje) => void;
  onArchivar:    (id: string) => void;
  isArchivando:  boolean;
}
function ViajeRow({ viaje, onVerNota, onArchivar, isArchivando }: ViajeRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { label, color, bg }    = etiquetaEstado(viaje.estado);
  const tieneNota               = !!viaje.nota_conductor?.trim();

  return (
    <div
      className="
        rounded-2xl border border-border/50 overflow-hidden
        transition-all duration-200
      "
      style={{
        background: tieneNota
          ? "linear-gradient(145deg, #1a2030 0%, #111827 100%)"
          : "linear-gradient(145deg, #161e2c 0%, #111827 100%)",
        borderColor: tieneNota ? "rgba(0,181,255,0.25)" : undefined,
      }}
    >
      {/* Fila principal */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3.5"
      >
        <div className="flex items-start gap-3">
          {/* Icono de estado */}
          <div className="flex-shrink-0 mt-0.5">
            {viaje.estado === "completado" ? (
              <CheckCircle2 size={18} className="text-success" strokeWidth={2} />
            ) : viaje.estado === "cancelado" ? (
              <XCircle size={18} className="text-danger" strokeWidth={2} />
            ) : viaje.estado === "archivado" ? (
              <Archive size={18} className="text-text-muted" strokeWidth={2} />
            ) : (
              <Clock size={18} className="text-warning" strokeWidth={2} />
            )}
          </div>

          {/* Contenido central */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Pasajero (si hay campo) */}
              <span className="text-text-main text-sm font-bold truncate">
                {viaje.origen.split(",")[0]}
              </span>
              <span className="text-text-muted text-xs">→</span>
              <span className="text-text-dim text-xs truncate">
                {viaje.destino.split(",")[0]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`vtc-badge text-2xs border ${bg} ${color}`}>
                {label}
              </span>
              <span className="flex items-center gap-1 text-text-muted text-2xs">
                {iconoPago(viaje.metodo_pago)}
                {viaje.metodo_pago ?? "—"}
              </span>
              <span className="text-text-muted text-2xs">
                {formatHora(viaje.created_at)}
              </span>
            </div>
          </div>

          {/* Derecha: precio + iconos */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            <span className="text-text-main text-base font-black">
              {formatearPrecio(viaje.precio)}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Icono de nota/incidencia parpadeante */}
              {tieneNota && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onVerNota(viaje); }}
                  className="
                    relative flex items-center justify-center
                    w-7 h-7 rounded-lg bg-accent/15 border border-accent/40
                    text-accent transition-all duration-200
                    hover:bg-accent/25 hover:scale-105 active:scale-95
                  "
                  title="Ver incidencia del conductor"
                >
                  <Mic size={13} strokeWidth={2.5} />
                  {/* Punto pulsante de alerta */}
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
                </button>
              )}
              <span className="text-text-muted">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Fila expandida */}
      {expanded && (
        <div className="border-t border-border/40 px-4 py-3 space-y-3 animate-fade-in">
          {/* Ruta completa */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="vtc-label">Origen</p>
                <p className="text-text-dim text-xs">{viaje.origen}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation size={12} className="text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="vtc-label">Destino</p>
                <p className="text-text-dim text-xs">{viaje.destino}</p>
              </div>
            </div>
          </div>

          {/* Nota inline si existe */}
          {tieneNota && (
            <button
              type="button"
              onClick={() => onVerNota(viaje)}
              className="
                w-full text-left rounded-xl border border-accent/25 p-3
                transition-all duration-150 hover:border-accent/50 hover:bg-accent/5
              "
              style={{ background: "rgba(0,181,255,0.04)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Mic size={11} className="text-accent" />
                <span className="vtc-label text-accent">Incidencia</span>
                <span className="text-accent text-2xs ml-auto">Toca para ampliar →</span>
              </div>
              <p className="text-text-dim text-xs leading-relaxed line-clamp-2 italic">
                "{viaje.nota_conductor}"
              </p>
            </button>
          )}

          {/* Acción archivar */}
          {viaje.estado !== "archivado" && (
            <button
              type="button"
              onClick={() => onArchivar(viaje.id)}
              disabled={isArchivando}
              className="
                flex items-center gap-2 text-text-muted text-xs
                hover:text-text-dim transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {isArchivando ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Archive size={12} />
              )}
              Archivar este viaje
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTE: ConfirmDialog
// ─────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  title:    string;
  body:     string;
  danger?:  boolean;
  onOk:     () => void;
  onCancel: () => void;
  loading?: boolean;
}
function ConfirmDialog({ title, body, danger, onOk, onCancel, loading }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-xs rounded-3xl border border-border/60 overflow-hidden animate-success"
        style={{ background: "linear-gradient(145deg, #1e2d44 0%, #111827 100%)" }}
      >
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-text-main font-black mb-2">{title}</h3>
          <p className="text-text-dim text-sm leading-relaxed">{body}</p>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="
              flex-1 py-3 rounded-2xl border border-border text-text-dim text-sm font-bold
              hover:border-border hover:text-text-main transition-colors
              disabled:opacity-50
            "
          >
            Cancelar
          </button>
          <button
            onClick={onOk}
            disabled={loading}
            className="
              flex-1 py-3 rounded-2xl text-sm font-black
              flex items-center justify-center gap-2
              transition-all active:scale-[0.98] disabled:opacity-60
            "
            style={
              danger
                ? { background: "linear-gradient(135deg,#EF4444,#DC2626)", color: "#fff", boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }
                : { background: "linear-gradient(135deg,#00B5FF,#0077CC)", color: "#000", boxShadow: "0 4px 16px rgba(0,181,255,0.3)" }
            }
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Archivando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: AdminPage
// ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [viajes,         setViajes]         = useState<Viaje[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [realtimeOk,     setRealtimeOk]     = useState(false);
  const [filtro,         setFiltro]         = useState<FiltroEstado>("todos");
  const [busqueda,       setBusqueda]       = useState("");
  const [notaViaje,      setNotaViaje]      = useState<Viaje | null>(null);
  const [archivandoId,   setArchivandoId]   = useState<string | null>(null);
  const [confirmLimpiar, setConfirmLimpiar] = useState(false);
  const [limpiarLoading, setLimpiarLoading] = useState(false);
  const [toast,          setToast]          = useState<{ msg: string; type: "ok"|"error"|"info" } | null>(null);

  // ── Toast helper ───────────────────────────────────────
  const showToast = useCallback((msg: string, type: "ok"|"error"|"info" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Carga inicial + suscripción realtime ───────────────
  const cargarViajes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("viajes")
      .select("*")
      .gte("created_at", inicioDiaIso())   // solo viajes de hoy
      .neq("estado", "archivado")          // excluir archivados del listado activo
      .order("created_at", { ascending: false });

    if (error) {
      showToast(`Error cargando viajes: ${error.message}`, "error");
    } else {
      setViajes((data as Viaje[]) ?? []);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    cargarViajes();

    // Suscripción Supabase Realtime — actualiza la lista automáticamente
    const channel = supabase
      .channel("viajes-admin-realtime")
      .on(
        "postgres_changes",
        {
          event:  "*",        // INSERT, UPDATE, DELETE
          schema: "public",
          table:  "viajes",
        },
        (payload) => {
          setRealtimeOk(true);
          const changed = payload.new as Viaje;

          if (payload.eventType === "INSERT") {
            setViajes((prev) => [changed, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            if (changed.estado === "archivado") {
              // Quitar de la lista activa
              setViajes((prev) => prev.filter((v) => v.id !== changed.id));
            } else {
              setViajes((prev) =>
                prev.map((v) => (v.id === changed.id ? changed : v))
              );
            }
          } else if (payload.eventType === "DELETE") {
            setViajes((prev) => prev.filter((v) => v.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        setRealtimeOk(status === "SUBSCRIBED");
      });

    return () => { supabase.removeChannel(channel); };
  }, [cargarViajes]);

  // ── Marcar incidencia como revisada (borra nota_conductor) ──
  const handleResolverIncidencia = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("viajes")
      .update({ nota_conductor: null, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      showToast(`Error: ${error.message}`, "error");
    } else {
      setViajes((prev) =>
        prev.map((v) => (v.id === id ? { ...v, nota_conductor: undefined } : v))
      );
      showToast("Incidencia marcada como revisada", "ok");
    }
  }, [showToast]);

  // ── Archivar un viaje individual ───────────────────────
  const handleArchivarUno = useCallback(async (id: string) => {
    setArchivandoId(id);
    const { error } = await supabase
      .from("viajes")
      .update({ estado: "archivado", updated_at: new Date().toISOString() })
      .eq("id", id);

    setArchivandoId(null);
    if (error) {
      showToast(`Error al archivar: ${error.message}`, "error");
    } else {
      setViajes((prev) => prev.filter((v) => v.id !== id));
      showToast("Viaje archivado", "ok");
    }
  }, [showToast]);

  // ── Limpiar hoy — archiva TODOS los completados/cancelados ──
  const handleLimpiarHoy = useCallback(async () => {
    setLimpiarLoading(true);

    const idsArchivar = viajes
      .filter((v) => ["completado", "cancelado"].includes(v.estado))
      .map((v) => v.id);

    if (idsArchivar.length === 0) {
      showToast("No hay viajes completados para archivar", "info");
      setLimpiarLoading(false);
      setConfirmLimpiar(false);
      return;
    }

    const { error } = await supabase
      .from("viajes")
      .update({ estado: "archivado", updated_at: new Date().toISOString() })
      .in("id", idsArchivar);

    setLimpiarLoading(false);
    setConfirmLimpiar(false);

    if (error) {
      showToast(`Error al limpiar: ${error.message}`, "error");
    } else {
      setViajes((prev) =>
        prev.filter((v) => !idsArchivar.includes(v.id))
      );
      showToast(`${idsArchivar.length} viajes archivados correctamente`, "ok");
    }
  }, [viajes, showToast]);

  // ── Filtrado + búsqueda ────────────────────────────────
  const viajesFiltrados = viajes.filter((v) => {
    const matchEstado  = filtro === "todos" || v.estado === filtro;
    const query        = busqueda.toLowerCase();
    const matchBusqueda =
      !query ||
      v.origen.toLowerCase().includes(query)  ||
      v.destino.toLowerCase().includes(query) ||
      v.id.toLowerCase().includes(query);
    return matchEstado && matchBusqueda;
  });

  // ── Stats ──────────────────────────────────────────────
  const stats = calcularStats(viajes);

  // ── Filtros disponibles ────────────────────────────────
  const FILTROS: { id: FiltroEstado; label: string }[] = [
    { id: "todos",      label: "Todos"       },
    { id: "pendiente",  label: "Pendientes"  },
    { id: "recogido",   label: "En trayecto" },
    { id: "completado", label: "Completados" },
    { id: "cancelado",  label: "Cancelados"  },
  ];

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-oled text-text-main">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-4 left-4 right-4 z-[60] p-3.5 rounded-2xl bg-card border border-border shadow-xl animate-slide-down text-sm text-center font-semibold"
          style={{
            borderColor:
              toast.type === "error" ? "rgba(239,68,68,0.4)" :
              toast.type === "ok"    ? "rgba(16,185,129,0.4)" :
                                       "rgba(0,181,255,0.4)",
          }}
        >
          {toast.type === "error" ? "⚠️" : toast.type === "ok" ? "✅" : "ℹ️"}{" "}
          {toast.msg}
        </div>
      )}

      {/* ── Modal de incidencia ── */}
      {notaViaje && (
        <IncidenciaModal
          viaje={notaViaje}
          onClose={() => setNotaViaje(null)}
          onResolve={handleResolverIncidencia}
        />
      )}

      {/* ── Confirm dialog "Limpiar hoy" ── */}
      {confirmLimpiar && (
        <ConfirmDialog
          title="¿Limpiar jornada de hoy?"
          body={`Se archivarán ${stats.completados + stats.cancelados} viajes (completados y cancelados). Los viajes en curso no se verán afectados.`}
          danger
          loading={limpiarLoading}
          onOk={handleLimpiarHoy}
          onCancel={() => setConfirmLimpiar(false)}
        />
      )}

      {/* ────────────────── HEADER ────────────────────── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4"
        style={{
          height: "var(--header-h)",
          background:         "rgba(0,0,0,0.90)",
          backdropFilter:     "blur(20px) saturate(180%)",
          WebkitBackdropFilter:"blur(20px) saturate(180%)",
          borderBottom:       "1px solid rgba(55,65,81,0.5)",
        }}
      >
        {/* Marca */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
            style={{ background: "linear-gradient(135deg, #00B5FF, #0077CC)", color: "#000" }}
          >
            VTC
          </div>
          <div>
            <p className="text-text-main text-sm font-black leading-none">Admin</p>
            <p className="text-text-muted text-2xs">Panel de control</p>
          </div>
        </div>

        {/* Centro: título */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-text-dim text-xs font-bold hidden sm:block">
          {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </h1>

        {/* Derecha: acciones */}
        <div className="flex items-center gap-2">
          {/* Indicador realtime */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface border border-border/40">
            {realtimeOk ? (
              <Wifi size={11} className="text-success" />
            ) : (
              <WifiOff size={11} className="text-danger" />
            )}
            <span className={`text-2xs font-bold ${realtimeOk ? "text-success" : "text-danger"}`}>
              {realtimeOk ? "EN VIVO" : "SIN SYNC"}
            </span>
          </div>

          {/* Refrescar */}
          <button
            onClick={cargarViajes}
            disabled={loading}
            className="
              w-8 h-8 rounded-xl bg-surface border border-border/40
              flex items-center justify-center text-text-dim
              hover:text-accent hover:border-accent/40 transition-colors
              disabled:opacity-40
            "
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* ────────────────── CONTENIDO ─────────────────── */}
      <main className="px-4 pt-5 pb-32 space-y-5 max-w-2xl mx-auto">

        {/* ── TARJETAS DE ESTADÍSTICAS ── */}
        <section>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Euro size={16} />}
              label="Total hoy"
              value={formatearPrecio(stats.totalEuros)}
              sub={`${stats.completados} viajes`}
              accent="text-success"
              glow="rgba(16,185,129,0.12)"
              loading={loading}
            />
            <StatCard
              icon={<Banknote size={16} />}
              label="Efectivo"
              value={formatearPrecio(stats.efectivo)}
              sub="en mano"
              accent="text-warning"
              glow="rgba(245,158,11,0.10)"
              loading={loading}
            />
            <StatCard
              icon={<Mic size={16} />}
              label="Incidencias"
              value={String(stats.incidencias)}
              sub={stats.incidencias > 0 ? "revisar" : "sin notas"}
              accent={stats.incidencias > 0 ? "text-accent" : "text-text-muted"}
              glow={stats.incidencias > 0 ? "rgba(0,181,255,0.15)" : undefined}
              loading={loading}
            />
          </div>
        </section>

        {/* ── FILA SECUNDARIA DE STATS ── */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: <Car size={14} />, label: "En curso",   value: String(stats.enCurso),   color: "text-accent"    },
            { icon: <CreditCard size={14} />, label: "Tarjeta", value: formatearPrecio(stats.tarjeta), color: "text-accent" },
            { icon: <Phone size={14} />, label: "Bizum",    value: formatearPrecio(stats.bizum),   color: "text-warning"  },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-border/40 px-3 py-2.5 flex items-center justify-between"
              style={{ background: "rgba(17,24,39,0.8)" }}
            >
              <div>
                <p className="vtc-label">{label}</p>
                {loading ? (
                  <div className="vtc-skeleton h-4 w-12 rounded mt-1" />
                ) : (
                  <p className={`text-sm font-black ${color}`}>{value}</p>
                )}
              </div>
              <span className={color}>{icon}</span>
            </div>
          ))}
        </section>

        {/* ── BÚSQUEDA + FILTROS ── */}
        <section className="space-y-3">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por origen, destino o ID…"
              className="vtc-input pl-10 pr-4 text-sm"
            />
          </div>

          {/* Pills de filtro */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {FILTROS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                className={`
                  flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold
                  border transition-all duration-150 active:scale-95
                  ${
                    filtro === id
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-surface border-border/60 text-text-muted hover:border-border hover:text-text-dim"
                  }
                `}
              >
                {label}
                {id !== "todos" && (
                  <span className="ml-1.5 opacity-60">
                    ({viajes.filter((v) => v.estado === id).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── LISTA DE SERVICIOS ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-text-main text-sm font-black">
              Servicios
              <span className="ml-2 text-text-muted font-normal text-xs">
                {viajesFiltrados.length} resultado{viajesFiltrados.length !== 1 ? "s" : ""}
              </span>
            </h2>
            {stats.incidencias > 0 && (
              <span className="vtc-badge bg-accent/10 text-accent border-accent/25 animate-pulse-glow">
                <Bell size={9} className="mr-1" />
                {stats.incidencias} incidencia{stats.incidencias !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            // Skeleton rows
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="vtc-skeleton rounded-2xl h-20" />
              ))}
            </div>
          ) : viajesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border/40 flex items-center justify-center">
                <Car size={28} className="text-text-muted" strokeWidth={1.5} />
              </div>
              <p className="text-text-dim text-sm font-semibold">Sin servicios</p>
              <p className="text-text-muted text-xs text-center max-w-xs">
                {filtro === "todos"
                  ? "No hay viajes registrados hoy todavía"
                  : `No hay viajes con estado "${etiquetaEstado(filtro as ViajeEstado).label.toLowerCase()}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {viajesFiltrados.map((v) => (
                <ViajeRow
                  key={v.id}
                  viaje={v}
                  onVerNota={setNotaViaje}
                  onArchivar={handleArchivarUno}
                  isArchivando={archivandoId === v.id}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* ────────────────── BOTTOM BAR ────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          background:    "rgba(17,24,39,0.95)",
          backdropFilter:"blur(20px)",
          borderTop:     "1px solid rgba(55,65,81,0.5)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Info rápida */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-success" />
              <span className="text-success text-xs font-bold">
                {formatearPrecio(stats.totalEuros)}
              </span>
            </div>
            <span className="text-border text-sm">·</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-success" />
              <span className="text-text-dim text-xs">{stats.completados} ok</span>
            </div>
            {stats.enCurso > 0 && (
              <>
                <span className="text-border text-sm">·</span>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-warning animate-pulse" />
                  <span className="text-warning text-xs font-semibold">{stats.enCurso} activos</span>
                </div>
              </>
            )}
          </div>

          {/* Botón Limpiar hoy */}
          <button
            onClick={() => setConfirmLimpiar(true)}
            disabled={loading || (stats.completados + stats.cancelados === 0)}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-2xl
              border border-border/60 text-text-dim text-xs font-bold
              hover:border-danger/50 hover:text-danger hover:bg-danger/5
              transition-all duration-200 active:scale-95
              disabled:opacity-30 disabled:cursor-not-allowed
            "
          >
            <Archive size={13} />
            Limpiar hoy
          </button>
        </div>
      </div>

    </div>
  );
}
