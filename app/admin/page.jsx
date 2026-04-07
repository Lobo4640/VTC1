"use client";
/**
 * app/admin/page.jsx — Dashboard del Administrador
 * · Resumen mensual con gráfica de tendencia
 * · Liquidación por conductor (Efectivo / Tarjeta / Bizum)
 * · Tabla de viajes con filtros y exportación CSV
 * · Gestor de PINs de conductores
 */

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { createClient }        from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const fmtEur = (n) =>
  new Intl.NumberFormat("es-ES", { style:"currency", currency:"EUR" }).format(n || 0);

const fmtFecha = (iso) => iso
  ? new Date(iso).toLocaleString("es-ES", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })
  : "—";

// ── COMPONENTES ───────────────────────────────────────────────────

function StatCard({ label, value, color = "#00B5FF", sub, big }) {
  return (
    <div className="rounded-xl p-4" style={{ background:"rgba(13,31,54,.9)", border:"1px solid #1a2f4a" }}>
      <div className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color:"#8898aa" }}>{label}</div>
      <div className={`font-black ${big ? "text-[24px]" : "text-[20px]"}`} style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color:"#8898aa" }}>{sub}</div>}
    </div>
  );
}

// Gráfica de barras SVG simple
function BarChart({ data }) {
  if (!data?.length) return null;
  const max    = Math.max(...data.map((d) => d.total), 1);
  const W      = 300;
  const H      = 80;
  const barW   = W / data.length - 6;

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const barH = (d.total / max) * H;
        const x    = i * (W / data.length) + 3;
        const y    = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4}
              fill={i === data.length - 1 ? "#00B5FF" : "#1a3a6b"} />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle"
              fill="#8898aa" fontSize={8} fontFamily="Montserrat,sans-serif">
              {d.mes}
            </text>
            {d.total > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                fill="#fff" fontSize={7} fontFamily="Montserrat,sans-serif">
                {fmtEur(d.total).replace("€","").trim()}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Fila de liquidación por conductor
function LiquidacionCard({ c }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border:"1.5px solid #1a2f4a" }}>
      <button
        className="w-full flex items-center gap-3 p-4 transition-colors text-left"
        style={{ background:"rgba(13,31,54,.9)" }}
        onClick={() => setOpen(!open)}
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[16px] text-white shrink-0"
          style={{ background:"linear-gradient(135deg,#112F5C,#00B5FF)" }}>
          {c.conductor_nombre?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-black text-white">{c.conductor_nombre}</div>
          <div className="text-[10px]" style={{ color:"#8898aa" }}>{c.total_viajes} viajes · {c.total_km} km</div>
        </div>
        <div className="text-right">
          <div className="text-[16px] font-black" style={{ color:"#22c78b" }}>{fmtEur(c.total_facturado)}</div>
          <div className="text-[9px]" style={{ color:"#8898aa" }}>total</div>
        </div>
        <div className="text-[12px] ml-2 transition-transform duration-200" style={{ color:"#8898aa", transform: open ? "rotate(180deg)" : "none" }}>▼</div>
      </button>

      {open && (
        <div className="p-4 fade-in" style={{ borderTop:"1px solid #1a2f4a", background:"rgba(7,21,40,.6)" }}>
          {[
            ["💵 Efectivo",      c.total_efectivo,      "#22c78b"],
            ["💳 Tarjeta",       c.total_tarjeta,       "#00B5FF"],
            ["📱 Bizum",         c.total_bizum,         "#7A5FFF"],
            ["🏦 Transferencia", c.total_transferencia, "#FF8C42"],
          ].map(([lbl, val, clr]) => (
            <div key={lbl} className="flex justify-between items-center py-2"
              style={{ borderBottom:"1px solid rgba(255,255,255,.06)" }}>
              <span className="text-[11px] font-semibold" style={{ color:"#8898aa" }}>{lbl}</span>
              <span className="text-[13px] font-black" style={{ color: clr }}>{fmtEur(val)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop:"2px solid #1a2f4a" }}>
            <span className="text-[12px] font-black text-white">TOTAL A LIQUIDAR</span>
            <span className="text-[18px] font-black" style={{ color:"#22c78b" }}>{fmtEur(c.total_facturado)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL ADMIN
// ═══════════════════════════════════════════════════════════════
export default function AdminPage() {
  const router = useRouter();

  const [tab,         setTab]      = useState("resumen");
  const [mes,         setMes]      = useState(new Date().toISOString().slice(0, 7));
  const [resumen,     setResumen]  = useState(null);
  const [conductores, setConds]    = useState([]);
  const [loading,     setLoading]  = useState(false);
  const [search,      setSearch]   = useState("");
  const [filtroPago,  setFiltro]   = useState("");
  const [toast,       setToast]    = useState(null);

  // Modal cambiar PIN
  const [pinModal,  setPinModal]  = useState(null);  // { id, nombre }
  const [nuevoPin,  setNuevoPin]  = useState("");
  const [confPin,   setConfPin]   = useState("");
  const [pinLoading,setPinLoad]   = useState(false);

  // Modal detalle viaje
  const [viajeModal, setViajeModal] = useState(null);

  const showToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/admin/login");
    });
  }, []);

  // ── Carga inicial ─────────────────────────────────────────
  useEffect(() => { cargarResumen(); cargarConductores(); }, [mes]);

  async function cargarResumen() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/resumen?mes=${mes}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResumen(d);
    } catch (e) {
      showToast("Error cargando resumen: " + e.message, "err");
    } finally {
      setLoading(false);
    }
  }

  async function cargarConductores() {
    try {
      const r = await fetch("/api/conductores");
      const d = await r.json();
      setConds(d.conductores || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function guardarPin() {
    if (!/^[0-9]{4}$/.test(nuevoPin))  { showToast("El PIN debe ser 4 dígitos", "err"); return; }
    if (nuevoPin !== confPin)           { showToast("Los PINs no coinciden", "err"); return; }
    setPinLoad(true);
    try {
      const r = await fetch("/api/conductores", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ conductor_id: pinModal.id, nuevo_pin: nuevoPin }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPinModal(null);
      setNuevoPin("");
      setConfPin("");
      showToast(`✅ PIN de ${pinModal.nombre} actualizado`);
    } catch (e) {
      showToast(e.message, "err");
    } finally {
      setPinLoad(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  function exportarCSV() {
    const viajes = resumen?.ultimosViajes || [];
    const rows = [
      ["Código","Conductor","Origen","Destino","Precio","IVA","Pago","Estado","RVTC","Fecha"],
      ...viajes.map((v) => [
        v.codigo_viaje, v.conductor_nombre, v.direccion_origen, v.direccion_destino,
        v.precio_final, v.precio_iva, v.forma_pago, v.estado, v.estado_ministerio, v.fecha_reserva,
      ]),
    ];
    const csv  = rows.map((r) => r.map((x) => JSON.stringify(x ?? "")).join(",")).join("\n");
    const link = document.createElement("a");
    link.href  = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
    link.download = `vtc-viajes-${mes}.csv`;
    link.click();
    showToast("📊 CSV exportado");
  }

  // Meses para el selector
  const mesesOpts = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    return {
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleString("es-ES", { month: "long", year: "numeric" }),
    };
  });

  // Filtros en tabla de viajes
  const viajesFiltrados = (resumen?.ultimosViajes || []).filter((v) =>
    (!search || [v.codigo_viaje, v.conductor_nombre, v.direccion_destino].some(
      (s) => s?.toLowerCase().includes(search.toLowerCase())
    )) &&
    (!filtroPago || v.forma_pago === filtroPago)
  );

  const badgePago = {
    EFECTIVO:      { bg:"rgba(34,199,139,.15)",  color:"#22c78b" },
    TARJETA:       { bg:"rgba(0,181,255,.15)",   color:"#00B5FF" },
    BIZUM:         { bg:"rgba(122,95,255,.15)",  color:"#7A5FFF" },
    TRANSFERENCIA: { bg:"rgba(255,140,66,.15)",  color:"#FF8C42" },
  };
  const badgeRVTC = {
    COMUNICADO:      { bg:"rgba(34,199,139,.15)",  color:"#22c78b", label:"✓ RVTC" },
    PENDIENTE_MANUAL:{ bg:"rgba(255,140,66,.15)",  color:"#FF8C42", label:"⚠️ Manual" },
    PENDIENTE:       { bg:"rgba(136,152,170,.15)", color:"#8898aa", label:"⏳" },
  };

  // ── SHELL ─────────────────────────────────────────────────
  const shellStyle = {
    width:"100%", maxWidth:460,
    background:"#0d1f36",
    borderRadius:"2rem",
    overflow:"hidden",
    display:"flex",
    flexDirection:"column",
    minHeight:760,
    boxShadow:"0 0 0 8px #050e1a, 0 0 0 10px #112F5C, 0 40px 80px rgba(0,0,0,.7)",
  };

  return (
    <div className="min-h-screen flex justify-center items-start py-8 px-4">
    <div style={shellStyle}>

      {/* HEADER */}
      <div className="px-5 py-4 flex justify-between items-center"
        style={{ background:"linear-gradient(135deg,#071528,#112F5C)", borderBottom:"1px solid rgba(0,181,255,.1)" }}>
        <div className="text-[16px] font-black text-white">
          <span style={{color:"#00B5FF"}}>VTC</span> Admin Panel
        </div>
        <button onClick={logout}
          className="text-[10px] font-bold px-3 py-1.5 rounded-full transition-all"
          style={{ background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.7)", border:"1px solid rgba(255,255,255,.15)" }}>
          Salir 🚪
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-3"
        style={{ background:"rgba(7,21,40,.8)", borderBottom:"1px solid #1a2f4a" }}>
        {[["resumen","📊 Resumen"],["viajes","🚗 Viajes"],["pines","🔐 PINs"]].map(([k,lbl]) => (
          <button key={k} onClick={()=>setTab(k)}
            className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: tab===k ? "#fff" : "transparent",
              color:       tab===k ? "#112F5C" : "#8898aa",
              boxShadow:   tab===k ? "0 2px 8px rgba(17,47,92,.15)" : "none",
            }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── RESUMEN ── */}
        {tab === "resumen" && (
          <div className="flex flex-col gap-4">
            {/* Selector mes */}
            <div className="flex gap-2">
              <select value={mes} onChange={(e) => setMes(e.target.value)}
                className="flex-1 py-2.5 px-3 rounded-xl text-[12px] font-bold text-white"
                style={{ background:"rgba(13,31,54,.9)", border:"1.5px solid #1a2f4a", outline:"none" }}>
                {mesesOpts.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <button onClick={cargarResumen}
                className="px-4 py-2.5 rounded-xl font-bold text-[12px] transition-all"
                style={{ background:"rgba(0,181,255,.15)", color:"#00B5FF", border:"1px solid rgba(0,181,255,.25)" }}>
                🔄
              </button>
            </div>

            {loading && (
              <div className="text-center py-8 text-brand-muted text-[12px]">⏳ Cargando...</div>
            )}

            {resumen && !loading && (
              <>
                {/* Stats globales */}
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Total Viajes"     value={resumen.totales?.total_viajes || 0}         color="#00B5FF" big />
                  <StatCard label="Facturación Total" value={fmtEur(resumen.totales?.total_facturado)}  color="#22c78b" big />
                  <StatCard label="💵 Efectivo"       value={fmtEur(resumen.totales?.total_efectivo)}   color="#22c78b" />
                  <StatCard label="💳 Tarjeta"        value={fmtEur(resumen.totales?.total_tarjeta)}    color="#00B5FF" />
                  <StatCard label="📱 Bizum"          value={fmtEur(resumen.totales?.total_bizum)}      color="#7A5FFF" />
                  <StatCard label="📍 Km totales"     value={`${resumen.totales?.total_km || 0} km`}    color="#8898aa" />
                </div>

                {/* Alerta RVTC */}
                {(resumen.pendientesMinisterio || 0) > 0 && (
                  <div className="p-4 rounded-xl fade-in"
                    style={{ background:"rgba(255,140,66,.1)", border:"1.5px solid rgba(255,140,66,.3)" }}>
                    <div className="text-[12px] font-black mb-1" style={{color:"#FF8C42"}}>
                      ⚠️ {resumen.pendientesMinisterio} viaje(s) pendientes en el RVTC
                    </div>
                    <a href="https://sede.fomento.gob.es/RegistroVTC/" target="_blank" rel="noopener noreferrer"
                      className="text-[11px] font-bold no-underline hover:underline" style={{color:"#00B5FF"}}>
                      Registrar en sede.fomento.gob.es →
                    </a>
                  </div>
                )}

                {/* Gráfica tendencia */}
                {resumen.tendencia?.length > 0 && (
                  <div className="p-4 rounded-xl" style={{ background:"rgba(13,31,54,.9)", border:"1px solid #1a2f4a" }}>
                    <div className="text-[10px] font-bold tracking-widest mb-3 uppercase" style={{color:"#8898aa"}}>
                      Tendencia 6 meses
                    </div>
                    <BarChart data={resumen.tendencia} />
                  </div>
                )}

                {/* Liquidación por conductor */}
                <div className="text-[12px] font-black text-white mt-2">Liquidación por Conductor</div>
                {(resumen.porConductor || []).map((c) => (
                  <LiquidacionCard key={c.conductor_id} c={c} />
                ))}
                {!(resumen.porConductor || []).length && (
                  <div className="text-center py-8 text-brand-muted text-[12px]">Sin viajes completados este mes</div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── VIAJES ── */}
        {tab === "viajes" && (
          <div className="flex flex-col gap-3">
            {/* Filtros */}
            <div className="flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar código, conductor..."
                className="flex-1 py-2.5 px-3 rounded-xl text-[12px] font-semibold text-white"
                style={{ background:"rgba(13,31,54,.9)", border:"1.5px solid #1a2f4a", outline:"none" }}
              />
              <select value={filtroPago} onChange={(e) => setFiltro(e.target.value)}
                className="py-2.5 px-2 rounded-xl text-[11px] font-bold text-white"
                style={{ background:"rgba(13,31,54,.9)", border:"1.5px solid #1a2f4a", outline:"none" }}>
                <option value="">Todo</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="BIZUM">Bizum</option>
              </select>
              <button onClick={exportarCSV}
                className="px-3 py-2.5 rounded-xl font-bold text-[11px]"
                style={{ background:"rgba(34,199,139,.15)", color:"#22c78b", border:"1px solid rgba(34,199,139,.25)" }}>
                ⬇ CSV
              </button>
            </div>

            {/* Tabla */}
            <div className="rounded-xl overflow-hidden" style={{ border:"1px solid #1a2f4a" }}>
              {/* Cabecera */}
              <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 px-3 py-2.5"
                style={{ background:"rgba(7,21,40,.8)", borderBottom:"1px solid #1a2f4a" }}>
                {["CÓDIGO","RUTA","PAGO","IMPORTE"].map((h) => (
                  <div key={h} className="text-[9px] font-bold tracking-widest" style={{color:"#8898aa"}}>{h}</div>
                ))}
              </div>

              {viajesFiltrados.length === 0 && (
                <div className="text-center py-8 text-brand-muted text-[12px]">Sin viajes</div>
              )}

              {viajesFiltrados.map((v, i) => {
                const bp   = badgePago[v.forma_pago] || badgePago.EFECTIVO;
                const br   = badgeRVTC[v.estado_ministerio] || badgeRVTC.PENDIENTE;
                return (
                  <div key={v.id}
                    className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 px-3 py-3 cursor-pointer transition-colors items-center"
                    style={{ borderBottom: i < viajesFiltrados.length - 1 ? "1px solid #1a2f4a" : "none" }}
                    onClick={() => setViajeModal(v)}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,181,255,.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <div className="font-mono text-[9px] font-bold" style={{color:"#8898aa"}}>{v.codigo_viaje?.slice(0,10)}</div>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                        style={{ background: br.bg, color: br.color }}>{br.label}</span>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-white truncate">{v.direccion_destino}</div>
                      <div className="text-[9px] truncate" style={{color:"#8898aa"}}>{v.conductor_nombre}</div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: bp.bg, color: bp.color }}>{v.forma_pago}</span>
                    </div>
                    <div className="text-[13px] font-black text-white text-right">{fmtEur(v.precio_final)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PINs ── */}
        {tab === "pines" && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[13px] font-black text-white mb-1">Gestión de PINs</div>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                Solo el administrador puede cambiar el PIN de acceso de cada conductor.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border:"1px solid #1a2f4a" }}>
              {conductores.length === 0 && (
                <div className="text-center py-8 text-brand-muted text-[12px]">⏳ Cargando...</div>
              )}
              {conductores.map((c, i) => (
                <div key={c.id}
                  className="flex items-center gap-3 p-4"
                  style={{ borderBottom: i < conductores.length - 1 ? "1px solid #1a2f4a" : "none" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-[16px] text-white shrink-0"
                    style={{ background:"linear-gradient(135deg,#112F5C,#00B5FF)" }}>
                    {c.nombre?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-black text-white">{c.nombre}</div>
                    <div className="text-[10px]" style={{color:"#8898aa"}}>PIN: ••••  ·  {c.total_viajes || 0} viajes</div>
                  </div>
                  <button onClick={() => { setPinModal({ id:c.id, nombre:c.nombre }); setNuevoPin(""); setConfPin(""); }}
                    className="px-3 py-2 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
                    style={{ background:"rgba(0,181,255,.12)", color:"#00B5FF", border:"1px solid rgba(0,181,255,.25)" }}>
                    🔑 Cambiar PIN
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>

    {/* ── MODAL CAMBIAR PIN ── */}
    {pinModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
        style={{ background:"rgba(5,14,26,.8)" }}
        onClick={()=>setPinModal(null)}>
        <div className="w-full max-w-[400px] rounded-2xl p-6 slide-up"
          style={{ background:"#0d1f36", border:"1px solid #1a2f4a" }}
          onClick={(e)=>e.stopPropagation()}>
          <div className="text-[16px] font-black text-white mb-1">🔐 Cambiar PIN</div>
          <div className="text-[12px] mb-5" style={{color:"#8898aa"}}>Conductor: <strong className="text-white">{pinModal.nombre}</strong></div>
          {[
            ["NUEVO PIN (4 DÍGITOS)", nuevoPin, setNuevoPin],
            ["CONFIRMAR PIN",          confPin,  setConfPin],
          ].map(([lbl, val, setter]) => (
            <div key={lbl} className="mb-4">
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{color:"#8898aa"}}>{lbl}</div>
              <input type="password" maxLength={4} placeholder="••••" value={val}
                onChange={(e) => setter(e.target.value.replace(/\D/g,"").slice(0,4))}
                className="w-full py-3 text-center text-[20px] font-black tracking-widest text-white rounded-xl"
                style={{ background:"rgba(7,21,40,.9)", border:"1.5px solid #1a2f4a", outline:"none", letterSpacing:12 }}
                onFocus={(e) => { e.target.style.borderColor="#00B5FF"; e.target.style.boxShadow="0 0 0 3px rgba(0,181,255,.12)"; }}
                onBlur={(e)  => { e.target.style.borderColor="#1a2f4a"; e.target.style.boxShadow="none"; }}
              />
            </div>
          ))}
          <div className="flex gap-3 mt-5">
            <button onClick={guardarPin} disabled={pinLoading}
              className="btn-neon flex-[2]" style={{ padding:"13px", fontSize:13, opacity:pinLoading?.6:1 }}>
              {pinLoading ? "⏳ Guardando..." : "Guardar PIN"}
            </button>
            <button onClick={()=>setPinModal(null)}
              className="flex-1 py-3 rounded-xl font-bold text-[12px] text-white/60 hover:text-white transition-colors"
              style={{ background:"transparent", border:"1.5px solid #1a2f4a" }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── MODAL DETALLE VIAJE ── */}
    {viajeModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
        style={{ background:"rgba(5,14,26,.8)" }}
        onClick={()=>setViajeModal(null)}>
        <div className="w-full max-w-[420px] rounded-2xl p-6 slide-up max-h-[80vh] overflow-y-auto"
          style={{ background:"#0d1f36", border:"1px solid #1a2f4a" }}
          onClick={(e)=>e.stopPropagation()}>
          <div className="font-mono text-[13px] font-black mb-1" style={{color:"#00B5FF"}}>{viajeModal.codigo_viaje}</div>
          <div className="text-[11px] mb-4" style={{color:"#8898aa"}}>{fmtFecha(viajeModal.fecha_reserva)}</div>
          {[
            ["Conductor",   viajeModal.conductor_nombre],
            ["Origen",      viajeModal.direccion_origen],
            ["Destino",     viajeModal.direccion_destino],
            ["Precio Final",fmtEur(viajeModal.precio_final)],
            ["IVA",         fmtEur(viajeModal.precio_iva)],
            ["Forma de Pago",viajeModal.forma_pago],
            ["Estado",      viajeModal.estado],
            ["Estado RVTC", viajeModal.estado_ministerio],
            ["Cod. RVTC",   viajeModal.codigo_ministerio || "—"],
          ].map(([l,v]) => (
            <div key={l} className="flex justify-between py-2" style={{borderBottom:"1px solid #1a2f4a", fontSize:12}}>
              <span style={{color:"#8898aa", fontWeight:600}}>{l}</span>
              <span className="font-bold text-white text-right max-w-[60%] break-words">{v}</span>
            </div>
          ))}
          <div className="flex gap-3 mt-5">
            <a href={`/api/hoja-ruta/${viajeModal.codigo_viaje}`} target="_blank" rel="noopener noreferrer"
              className="btn-neon flex-[2] no-underline" style={{padding:"12px",fontSize:12}}>
              📄 Hoja de Ruta
            </a>
            <button onClick={()=>setViajeModal(null)}
              className="flex-1 py-3 rounded-xl font-bold text-[12px] text-white/60 hover:text-white transition-colors"
              style={{background:"transparent",border:"1.5px solid #1a2f4a"}}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Toast */}
    {toast && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-3xl text-[12px] font-bold text-white fade-in"
        style={{
          background: toast.tipo === "err" ? "#4a0d0d" : "#0d4a32",
          border: `1px solid ${toast.tipo === "err" ? "rgba(255,77,77,.3)" : "rgba(34,199,139,.3)"}`,
        }}>
        {toast.msg}
      </div>
    )}
    </div>
  );
}
