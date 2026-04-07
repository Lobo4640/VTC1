"use client";
/**
 * app/conductor/page.jsx — Panel del Conductor
 * ─────────────────────────────────────────────
 * · Fase 1: Seleccionar conductor de la lista
 * · Fase 2: Teclado numérico PIN 4 dígitos (validado en servidor)
 * · Fase 3: Dashboard — lista de servicios + botón QR para inspección
 */

import { useState, useEffect } from "react";
import Link from "next/link";

const fmtEur = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

// ═══════════════════════════════════════════════════════════════
//  TECLADO NUMÉRICO
// ═══════════════════════════════════════════════════════════════
const NUMPAD = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

function Numpad({ onPress }) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
      {NUMPAD.map((k, i) => {
        if (!k) return <div key={i} />;
        return (
          <button
            key={k + i}
            onClick={() => onPress(k)}
            className="aspect-square rounded-full border text-white font-bold transition-all duration-150 active:scale-90"
            style={{
              background:  "rgba(13,31,54,.9)",
              border:      "1.5px solid #1a2f4a",
              fontSize:    k === "⌫" ? 16 : 22,
              color:       k === "⌫" ? "#8898aa" : "#fff",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.background = "rgba(0,181,255,.12)";
              e.currentTarget.style.borderColor = "#00B5FF";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.background  = "rgba(13,31,54,.9)";
              e.currentTarget.style.borderColor  = "#1a2f4a";
            }}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

// ── Indicadores de PIN ─────────────────────────────────────────
function PinDots({ len, error }) {
  return (
    <div className="flex gap-4">
      {[0,1,2,3].map((i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full transition-all duration-200"
          style={{
            background:  i < len ? (error ? "#ff4d4d" : "#00B5FF") : "transparent",
            border:      `2px solid ${i < len ? (error ? "#ff4d4d" : "#00B5FF") : "#1a2f4a"}`,
            boxShadow:   i < len && !error ? "0 0 8px rgba(0,181,255,.5)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg, tipo }) {
  if (!msg) return null;
  const bg = tipo === "err" ? "#4a0d0d" : "#0d4a32";
  const bd = tipo === "err" ? "rgba(255,77,77,.3)" : "rgba(34,199,139,.3)";
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-3xl text-[12px] font-bold text-white fade-in"
      style={{ background: bg, border: `1px solid ${bd}` }}>
      {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL QR INSPECCIÓN
// ═══════════════════════════════════════════════════════════════
function ModalQR({ viaje, conductor, onClose }) {
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || "https://vtc-madrid.vercel.app";
  const codigo  = viaje?.codigo_viaje || "SIN-VIAJE";
  const qrData  = encodeURIComponent(`${appUrl}/verificar/${codigo}`);
  const qrSrc   = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=ffffff&bgcolor=071528&data=${qrData}`;
  const esOk    = viaje?.estado_ministerio === "COMUNICADO";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: "rgba(5,14,26,.92)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] rounded-2xl overflow-hidden slide-up"
        style={{ background: "#0d1f36", border: "1px solid #1a2f4a" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header oficial */}
        <div
          className="px-6 py-4 text-center"
          style={{ background: "linear-gradient(135deg,#071528,#112F5C)", borderBottom: "1px solid rgba(0,181,255,.15)" }}
        >
          <div className="text-[9px] tracking-[2px] font-bold mb-1" style={{ color: "rgba(255,255,255,.5)" }}>
            DOCUMENTO OFICIAL
          </div>
          <div className="text-[16px] font-black text-white">HOJA DE RUTA DIGITAL</div>
          <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,.5)" }}>
            VTC Madrid · {conductor?.nombre}
          </div>
        </div>

        <div className="p-6">
          {/* QR */}
          <div className="flex justify-center mb-5">
            <img
              src={qrSrc}
              alt="QR Verificación"
              width={180}
              height={180}
              className="rounded-xl"
              style={{ border: "2px solid rgba(0,181,255,.3)" }}
            />
          </div>

          {/* Datos */}
          <div className="flex flex-col gap-0 mb-5 text-[12px]">
            {[
              ["Código Viaje",   codigo],
              ["Conductor",      conductor?.nombre || "—"],
              ["Matrícula",      process.env.NEXT_PUBLIC_MATRICULA || "1234-ABC"],
              ["Licencia VTC",   process.env.NEXT_PUBLIC_LICENCIA  || "VTC-M-0001"],
              ["Estado RVTC",    esOk ? "✓ Registrado" : "⚠️ Pendiente"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2" style={{ borderBottom: "1px solid #1a2f4a" }}>
                <span style={{ color: "#8898aa", fontWeight: 600 }}>{l}</span>
                <span className="font-bold text-white">{v}</span>
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            {viaje && (
              <a
                href={`/api/hoja-ruta/${codigo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-[2] btn-neon text-center no-underline"
                style={{ padding: "12px", borderRadius: 12, fontSize: 12 }}
              >
                📄 Contrato completo
              </a>
            )}
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border font-bold text-[12px] text-white/70 hover:text-white transition-colors"
              style={{ background: "transparent", border: "1.5px solid #1a2f4a", padding: 12 }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL CONDUCTOR
// ═══════════════════════════════════════════════════════════════
export default function ConductorPage() {
  const [fase,        setFase]      = useState("seleccionar"); // seleccionar | pin | dashboard
  const [conductores, setConds]     = useState([]);
  const [seleccionado,setSel]       = useState(null);
  const [pin,         setPin]       = useState("");
  const [pinError,    setPinError]  = useState("");
  const [autenticado, setAuth]      = useState(null);
  const [viajes,      setViajes]    = useState([]);
  const [viajeActivo, setActivo]    = useState(null);
  const [qrModal,     setQrModal]   = useState(false);
  const [loading,     setLoading]   = useState(false);
  const [toast,       setToast]     = useState(null);

  const showToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // Cargar conductores al montar
  useEffect(() => {
    fetch("/api/conductores")
      .then((r) => r.json())
      .then((d) => setConds(d.conductores || []))
      .catch(() => setConds([]));
  }, []);

  // Cargar viajes del conductor autenticado
  useEffect(() => {
    if (!autenticado) return;
    fetch(`/api/viajes?conductor=${autenticado.id}&limit=30`)
      .then((r) => r.json())
      .then((d) => {
        const lista = d.viajes || [];
        setViajes(lista);
        // Detectar viaje activo (EN_CURSO)
        const activo = lista.find((v) => v.estado === "EN_CURSO");
        if (activo) setActivo(activo);
      })
      .catch(console.error);
  }, [autenticado]);

  // ── Seleccionar conductor ─────────────────────────────────
  function seleccionar(c) {
    setSel(c);
    setPin("");
    setPinError("");
    setFase("pin");
  }

  // ── Teclado PIN ───────────────────────────────────────────
  function presionarNumpad(key) {
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      setPinError("");
      return;
    }
    if (pin.length >= 4) return;
    const nuevo = pin + key;
    setPin(nuevo);
    if (nuevo.length === 4) verificarPin(nuevo);
  }

  // ── Verificar PIN en el servidor ──────────────────────────
  async function verificarPin(pinStr) {
    setLoading(true);
    setPinError("");
    try {
      const res  = await fetch("/api/conductores", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ conductor_id: seleccionado.id, pin: pinStr }),
      });
      const data = await res.json();

      if (res.ok && data.autenticado) {
        setAuth(data.conductor);
        setFase("dashboard");
        showToast(`✅ Bienvenido, ${data.conductor.nombre}`);
      } else {
        setPinError("❌ PIN incorrecto. Inténtalo de nuevo.");
        setPin("");
        setTimeout(() => setPinError(""), 2200);
      }
    } catch {
      setPinError("Error de conexión");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAuth(null);
    setSel(null);
    setPin("");
    setFase("seleccionar");
    setViajes([]);
    setActivo(null);
  }

  async function finalizarViaje() {
    if (!viajeActivo) return;
    try {
      await fetch("/api/viajes", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ codigo_viaje: viajeActivo.codigo_viaje, estado: "COMPLETADO" }),
      });
      showToast("✅ Viaje finalizado correctamente");
      setActivo(null);
      setViajes((v) =>
        v.map((x) =>
          x.codigo_viaje === viajeActivo.codigo_viaje
            ? { ...x, estado: "COMPLETADO" }
            : x
        )
      );
    } catch {
      showToast("Error al finalizar el viaje", "err");
    }
  }

  // ── Estadísticas rápidas del día ──────────────────────────
  const hoy = new Date().toDateString();
  const viajesHoy     = viajes.filter((v) => new Date(v.fecha_reserva).toDateString() === hoy);
  const facturadoHoy  = viajesHoy.reduce((s, v) => s + (parseFloat(v.precio_final) || 0), 0);
  const efectivoHoy   = viajesHoy.filter((v) => v.forma_pago === "EFECTIVO")
                                  .reduce((s, v) => s + (parseFloat(v.precio_final) || 0), 0);
  const tarjetaHoy    = viajesHoy.filter((v) => v.forma_pago === "TARJETA")
                                  .reduce((s, v) => s + (parseFloat(v.precio_final) || 0), 0);

  const badgePago = {
    EFECTIVO:      { bg: "rgba(34,199,139,.15)",  color: "#22c78b" },
    TARJETA:       { bg: "rgba(0,181,255,.15)",   color: "#00B5FF" },
    BIZUM:         { bg: "rgba(122,95,255,.15)", color: "#7A5FFF" },
    TRANSFERENCIA: { bg: "rgba(255,140,66,.15)", color: "#FF8C42" },
  };

  // ── SHELL ─────────────────────────────────────────────────
  const shell = {
    width: "100%", maxWidth: 420,
    background: "#0d1f36",
    borderRadius: "2rem",
    overflow:  "hidden",
    display:   "flex",
    flexDirection: "column",
    minHeight: 760,
    boxShadow: "0 0 0 8px #050e1a, 0 0 0 10px #112F5C, 0 40px 80px rgba(0,0,0,.7)",
  };

  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex justify-center items-start py-8 px-4">
    <div style={shell}>

      {/* ══ FASE: SELECCIONAR ══ */}
      {fase === "seleccionar" && (
        <>
          <div className="px-5 pt-5 pb-4"
            style={{ background:"linear-gradient(135deg,#071528,#112F5C)", borderBottom:"1px solid rgba(0,181,255,.1)" }}>
            <div className="flex justify-between items-center">
              <div className="text-[20px] font-black text-white">
                <span style={{color:"#00B5FF"}}>VTC</span> Conductor
              </div>
              <Link href="/inicio" className="text-[11px] font-bold text-white/60 hover:text-white transition-colors no-underline">
                ← Volver
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 p-6 gap-5">
            <div className="text-[36px] float">🚗</div>
            <div className="text-[20px] font-black text-white text-center">¿Quién eres?</div>
            <p className="text-[12px] text-brand-muted text-center">Selecciona tu nombre para continuar</p>

            <div className="w-full flex flex-col gap-3">
              {conductores.length === 0 && (
                <div className="text-center text-brand-muted text-[12px] py-8">⏳ Cargando...</div>
              )}
              {conductores.map((c) => (
                <button
                  key={c.id}
                  onClick={() => seleccionar(c)}
                  className="w-full p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(13,31,54,.9)",
                    border: "1.5px solid #1a2f4a",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00B5FF"; e.currentTarget.style.background = "rgba(0,181,255,.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a2f4a"; e.currentTarget.style.background = "rgba(13,31,54,.9)"; }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-[18px] text-white shrink-0"
                      style={{ background: "linear-gradient(135deg,#112F5C,#00B5FF)" }}>
                      {c.nombre?.[0] || "?"}
                    </div>
                    <div>
                      <div className="text-[14px] font-black text-white">{c.nombre}</div>
                      <div className="text-[11px] text-brand-muted">{c.total_viajes || 0} viajes · {fmtEur(c.total_ingresos)}</div>
                    </div>
                    <div className="ml-auto text-[18px]" style={{ color: "#00B5FF" }}>→</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══ FASE: PIN ══ */}
      {fase === "pin" && (
        <>
          <div className="px-5 pt-5 pb-4"
            style={{ background:"linear-gradient(135deg,#071528,#112F5C)", borderBottom:"1px solid rgba(0,181,255,.1)" }}>
            <div className="flex justify-between items-center">
              <div className="text-[18px] font-black text-white">
                <span style={{color:"#00B5FF"}}>VTC</span> PIN
              </div>
              <button onClick={() => setFase("seleccionar")}
                className="text-[11px] font-bold text-white/60 hover:text-white transition-colors">
                ← Cambiar
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 p-8 gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[28px] font-black text-white"
              style={{ background: "linear-gradient(135deg,#112F5C,#00B5FF)" }}>
              {seleccionado?.nombre?.[0] || "?"}
            </div>
            <div className="text-[16px] font-black text-white">{seleccionado?.nombre}</div>
            <p className="text-[12px] text-brand-muted">Introduce tu PIN de 4 dígitos</p>

            <PinDots len={pin.length} error={!!pinError} />

            <div
              className="text-[11px] font-bold text-center min-h-[18px] transition-all"
              style={{ color: "#ff4d4d" }}
            >
              {pinError}
            </div>

            <Numpad onPress={presionarNumpad} />

            {loading && (
              <div className="text-brand-muted text-[11px] font-bold">⏳ Verificando...</div>
            )}
          </div>
        </>
      )}

      {/* ══ FASE: DASHBOARD ══ */}
      {fase === "dashboard" && autenticado && (
        <>
          {/* Header dashboard */}
          <div className="px-5 pt-5 pb-4"
            style={{ background:"linear-gradient(135deg,#071528,#112F5C)", borderBottom:"1px solid rgba(0,181,255,.1)" }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[18px] font-black text-white">
                  <span style={{color:"#00B5FF"}}>VTC</span> Madrid
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,.6)" }}>
                  {autenticado.nombre}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/reservar"
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full no-underline transition-all"
                  style={{ background:"rgba(0,181,255,.15)", color:"#00B5FF", border:"1px solid rgba(0,181,255,.3)" }}>
                  + Reserva
                </Link>
                <button onClick={logout}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full transition-all"
                  style={{ background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.7)", border:"1px solid rgba(255,255,255,.15)" }}>
                  Salir
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

            {/* Viaje activo */}
            {viajeActivo && (
              <div className="rounded-xl p-4" style={{ background:"rgba(34,199,139,.1)", border:"2px solid rgba(34,199,139,.4)" }}>
                <div className="text-[11px] font-bold mb-3" style={{ color:"#22c78b" }}>🟢 Viaje en curso</div>
                <div className="flex gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{background:"#22c78b"}} />
                  <div className="text-[12px] font-semibold text-white">{viajeActivo.direccion_origen}</div>
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{background:"#ff4d4d"}} />
                  <div className="text-[12px] font-semibold text-white">{viajeActivo.direccion_destino}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={finalizarViaje}
                    className="flex-1 py-2.5 rounded-xl font-bold text-[12px] text-white transition-all hover:-translate-y-0.5"
                    style={{background:"#22c78b",border:"none"}}>
                    ✓ Finalizar Viaje
                  </button>
                  <button onClick={()=>setActivo(null)}
                    className="py-2.5 px-4 rounded-xl font-bold text-[11px] text-white/60 transition-colors"
                    style={{background:"transparent",border:"1.5px solid #1a2f4a"}}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* ⭐ BOTÓN QR PARA INSPECCIÓN (prominente) */}
            <button
              onClick={() => setQrModal(true)}
              className="w-full rounded-xl font-black text-[15px] text-white transition-all duration-200 hover:-translate-y-1 neon-pulse"
              style={{
                background: "linear-gradient(135deg,#112F5C,#1a3a6b)",
                border:     "1.5px solid rgba(0,181,255,.3)",
                padding:    "18px 24px",
                display:    "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                boxShadow: "0 4px 24px rgba(0,181,255,.2)",
                letterSpacing: ".3px",
              }}
            >
              <span style={{ fontSize: 24 }}>▣</span>
              VER QR PARA INSPECCIÓN
            </button>

            {/* Stats del día */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Viajes hoy",    value: viajesHoy.length,       color: "#00B5FF" },
                { label: "💵 Efectivo",   value: fmtEur(efectivoHoy),    color: "#22c78b" },
                { label: "💳 Tarjeta",    value: fmtEur(tarjetaHoy),     color: "#7A5FFF" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background:"rgba(13,31,54,.9)", border:"1px solid #1a2f4a" }}>
                  <div className="text-[14px] font-black" style={{color: s.color}}>{s.value}</div>
                  <div className="text-[9px] text-brand-muted mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Lista de viajes */}
            <div className="text-[12px] font-black text-white">Últimos viajes</div>
            <div className="rounded-xl overflow-hidden" style={{ border:"1px solid #1a2f4a" }}>
              {viajes.length === 0 && (
                <div className="text-center py-8 text-brand-muted text-[12px]">Sin viajes registrados</div>
              )}
              {viajes.slice(0, 12).map((v, i) => {
                const bp = badgePago[v.forma_pago] || badgePago.EFECTIVO;
                return (
                  <div
                    key={v.id}
                    className="p-3 cursor-pointer transition-colors"
                    style={{ borderBottom: i < viajes.length - 1 ? "1px solid #1a2f4a" : "none" }}
                    onClick={() => window.open(`/api/hoja-ruta/${v.codigo_viaje}`, "_blank")}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,181,255,.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-[9px]" style={{color:"#8898aa"}}>{v.codigo_viaje}</span>
                      <span className="text-[13px] font-black text-white">{fmtEur(v.precio_final)}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-white mb-1 truncate">{v.direccion_destino}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-brand-muted truncate">{v.direccion_origen}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: bp.bg, color: bp.color }}>
                        {v.forma_pago}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>

    {/* Modal QR */}
    {qrModal && (
      <ModalQR
        viaje={viajeActivo || viajes[0] || null}
        conductor={autenticado}
        onClose={() => setQrModal(false)}
      />
    )}

    <Toast msg={toast?.msg} tipo={toast?.tipo} />
    </div>
  );
}
