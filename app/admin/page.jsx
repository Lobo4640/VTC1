"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Forzamos renderizado dinámico para evitar fallos en el build de Vercel
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helpers de formato
const fmtEur = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

const fmtFecha = (iso) => iso
  ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
  : "—";

// ── COMPONENTES INTERNOS ───────────────────────────────────────────

function StatCard({ label, value, color = "#00B5FF", sub, big }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(13,31,54,.9)", border: "1px solid #1a2f4a" }}>
      <div className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: "#8898aa" }}>{label}</div>
      <div className={`font-black ${big ? "text-[24px]" : "text-[20px]"}`} style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "#8898aa" }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.total), 1);
  const W = 300;
  const H = 80;
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const barH = (d.total / max) * H;
        const x = i * (W / data.length) + 3;
        const barW = W / data.length - 6;
        return (
          <g key={i}>
            <rect x={x} y={H - barH} width={barW} height={barH} rx={4} fill={i === data.length - 1 ? "#00B5FF" : "#1a3a6b"} />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fill="#8898aa" fontSize={8}>{d.mes}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LiquidacionCard({ c }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1.5px solid #1a2f4a" }}>
      <button className="w-full flex items-center gap-3 p-4 text-left bg-[#0d1f36]" onClick={() => setOpen(!open)}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white bg-gradient-to-br from-[#112F5C] to-[#00B5FF]">
          {c.conductor_nombre?.[0] || "?"}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-black text-white">{c.conductor_nombre}</div>
          <div className="text-[10px] text-[#8898aa]">{c.total_viajes} viajes · {c.total_km} km</div>
        </div>
        <div className="text-right">
          <div className="text-[16px] font-black text-[#22c78b]">{fmtEur(c.total_facturado)}</div>
        </div>
      </button>
      {open && (
        <div className="p-4 bg-[#071528] border-t border-[#1a2f4a]">
           <div className="flex justify-between text-[11px] py-1"><span>💵 Efectivo</span><span className="text-[#22c78b]">{fmtEur(c.total_efectivo)}</span></div>
           <div className="flex justify-between text-[11px] py-1"><span>💳 Tarjeta</span><span className="text-[#00B5FF]">{fmtEur(c.total_tarjeta)}</span></div>
           <div className="flex justify-between text-[11px] py-1"><span>📱 Bizum</span><span className="text-[#7A5FFF]">{fmtEur(c.total_bizum)}</span></div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState("resumen");
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [resumen, setResumen] = useState(null);
  const [conductores, setConds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroPago, setFiltro] = useState("");
  const [toast, setToast] = useState(null);
  
  const [pinModal, setPinModal] = useState(null);
  const [nuevoPin, setNuevoPin] = useState("");
  const [confPin, setConfPin] = useState("");
  const [viajeModal, setViajeModal] = useState(null);

  const showToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Verificación de Seguridad
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  // 2. Carga de datos
  useEffect(() => {
    if (!loading) {
      cargarResumen();
      cargarConductores();
    }
  }, [mes, loading]);

  async function cargarResumen() {
    try {
      const r = await fetch(`/api/admin/resumen?mes=${mes}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al cargar");
      setResumen(d);
    } catch (e) {
      showToast(e.message, "err");
    }
  }

  async function cargarConductores() {
    try {
      const r = await fetch("/api/conductores");
      const d = await r.json();
      setConds(d.conductores || []);
    } catch (e) { console.error(e); }
  }

  async function guardarPin() {
    if (nuevoPin.length !== 4 || nuevoPin !== confPin) {
      showToast("Los PINs deben coincidir y tener 4 dígitos", "err");
      return;
    }
    try {
      const r = await fetch("/api/conductores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conductor_id: pinModal.id, nuevo_pin: nuevoPin }),
      });
      if (!r.ok) throw new Error("Error al actualizar");
      showToast("✅ PIN actualizado correctamente");
      setPinModal(null);
    } catch (e) { showToast(e.message, "err"); }
  }

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // Filtrado de viajes con protección contra nulos
  const viajesFiltrados = (resumen?.ultimosViajes || []).filter((v) => {
    const matchesSearch = !search || 
      (v.codigo_viaje?.toLowerCase().includes(search.toLowerCase())) ||
      (v.conductor_nombre?.toLowerCase().includes(search.toLowerCase())) ||
      (v.direccion_destino?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesPago = !filtroPago || v.forma_pago === filtroPago;
    return matchesSearch && matchesPago;
  });

  if (loading) return <div className="min-h-screen bg-[#050e1a] flex items-center justify-center text-white">Verificando acceso...</div>;

  return (
    <div className="min-h-screen bg-[#050e1a] py-8 px-4 flex justify-center">
      <div className="w-full max-w-[460px] bg-[#0d1f36] rounded-[2rem] flex flex-col min-h-[800px] border border-[#1a2f4a] shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-5 flex justify-between items-center bg-gradient-to-r from-[#071528] to-[#112F5C] border-b border-white/10">
          <h1 className="text-white font-black text-lg">VTC <span className="text-[#00B5FF]">ADMIN</span></h1>
          <button onClick={logout} className="text-[10px] font-bold text-white/60 border border-white/20 px-3 py-1.5 rounded-full hover:bg-white/10">SALIR 🚪</button>
        </div>

        {/* TABS */}
        <div className="flex p-2 bg-black/20">
          {["resumen", "viajes", "pines"].map((t) => (
            <button key={t} onClick={() => setTab(t)} 
              className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${tab === t ? "bg-white text-[#112F5C]" : "text-[#8898aa]"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 p-5 overflow-y-auto">
          {tab === "resumen" && (
            <div className="space-y-4">
              <select value={mes} onChange={(e) => setMes(e.target.value)} className="w-full bg-[#0d1f36] border border-[#1a2f4a] text-white p-3 rounded-xl font-bold text-sm outline-none">
                <option value={new Date().toISOString().slice(0, 7)}>Mes Actual</option>
                <option value="2024-03">Marzo 2024</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <StatCard label="VIAJES" value={resumen?.totales?.total_viajes || 0} big />
                <StatCard label="FACTURADO" value={fmtEur(resumen?.totales?.total_facturado)} color="#22c78b" big />
              </div>

              <div className="bg-[#0d1f36] border border-[#1a2f4a] p-4 rounded-2xl">
                <div className="text-[10px] font-bold text-[#8898aa] mb-4">TENDENCIA</div>
                <BarChart data={resumen?.tendencia} />
              </div>

              <div className="space-y-2">
                <div className="text-white font-bold text-xs">LIQUIDACIÓN CONDUCTORES</div>
                {resumen?.porConductor?.map(c => <LiquidacionCard key={c.conductor_id} c={c} />)}
              </div>
            </div>
          )}

          {tab === "viajes" && (
            <div className="space-y-4">
              <input type="text" placeholder="Buscar viaje o conductor..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0d1f36] border border-[#1a2f4a] p-3 rounded-xl text-white text-xs outline-none focus:border-[#00B5FF]" />
              
              <div className="space-y-2">
                {viajesFiltrados.map(v => (
                  <div key={v.id} onClick={() => setViajeModal(v)} className="bg-[#0d1f36] border border-[#1a2f4a] p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/5">
                    <div className="max-w-[70%]">
                      <div className="text-white font-bold text-[11px] truncate">{v.direccion_destino}</div>
                      <div className="text-[#8898aa] text-[9px]">{v.conductor_nombre}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-black text-sm">{fmtEur(v.precio_final)}</div>
                      <div className="text-[8px] font-bold text-[#22c78b]">{v.forma_pago}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "pines" && (
            <div className="space-y-3">
              {conductores.map(c => (
                <div key={c.id} className="bg-[#0d1f36] border border-[#1a2f4a] p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-white font-bold text-sm">{c.nombre}</div>
                    <div className="text-[#8898aa] text-[10px]">PIN: ****</div>
                  </div>
                  <button onClick={() => setPinModal(c)} className="bg-[#00B5FF]/10 text-[#00B5FF] text-[10px] font-bold px-4 py-2 rounded-lg border border-[#00B5FF]/20">CAMBIAR PIN</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PIN */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-[#0d1f36] w-full max-w-[350px] p-6 rounded-3xl border border-[#1a2f4a]">
            <h2 className="text-white font-bold mb-4">Nuevo PIN para {pinModal.nombre}</h2>
            <input type="password" maxLength={4} value={nuevoPin} onChange={e => setNuevoPin(e.target.value.replace(/\D/g,""))} placeholder="Nuevo PIN" className="w-full bg-[#071528] border border-[#1a2f4a] p-4 rounded-xl text-white text-center text-2xl tracking-[10px] mb-3" />
            <input type="password" maxLength={4} value={confPin} onChange={e => setConfPin(e.target.value.replace(/\D/g,""))} placeholder="Confirmar PIN" className="w-full bg-[#071528] border border-[#1a2f4a] p-4 rounded-xl text-white text-center text-2xl tracking-[10px] mb-6" />
            <div className="flex gap-2">
              <button onClick={guardarPin} className="flex-1 bg-[#00B5FF] text-white font-bold py-3 rounded-xl">GUARDAR</button>
              <button onClick={() => setPinModal(null)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-bold text-xs shadow-2xl z-[100] ${toast.tipo === 'err' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
