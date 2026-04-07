"use client";
/**
 * app/page.jsx — LANDING PAGE VTC MADRID 2026
 * ─────────────────────────────────────────────
 * · Sección hero con calculadora de precios integrada
 * · Stepper 3 pasos (Ruta → Precio → Contacto)
 * · Sección Blog con artículos Markdown
 * · Paleta oscura: #071528 · #00B5FF · #7A5FFF
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { calcularPrecio, validarPrecontratacion, fmtEur, fmtFecha, TARIFAS } from "@/lib/calculator";

// ── HELPERS ──────────────────────────────────────────────────────
const getFechaMin = () => {
  // ⚡ 0 minutos de antelación — viajes inmediatos
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
};

// ── COMPONENTE STEPPER ────────────────────────────────────────────
function Stepper({ paso }) {
  const steps = ["Ruta", "Precio", "Contacto"];
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((lbl, i) => {
        const n       = i + 1;
        const active  = n === paso;
        const done    = n < paso;
        return (
          <div key={i} className="flex-1 flex flex-col items-center relative">
            {/* línea */}
            {i < steps.length - 1 && (
              <div
                className="absolute top-[13px] left-[50%] w-full h-[2px] transition-all duration-500"
                style={{
                  background: done
                    ? "rgba(34,199,139,.8)"
                    : "rgba(255,255,255,.1)",
                }}
              />
            )}
            {/* dot */}
            <div
              className={`step-dot z-10 transition-all duration-300 ${
                active ? "active" : done ? "done" : "inactive"
              }`}
            >
              {done ? "✓" : n}
            </div>
            {/* label */}
            <span
              className="text-[8px] font-bold mt-1 tracking-wider transition-colors duration-300"
              style={{
                color: active
                  ? "#00B5FF"
                  : done
                  ? "#22c78b"
                  : "rgba(255,255,255,.3)",
              }}
            >
              {lbl.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── COMPONENTE INPUT CON ICONO ────────────────────────────────────
function IcoInput({ ico, value, onChange, placeholder, type = "text", min, step }) {
  return (
    <div className="relative">
      <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[14px] pointer-events-none z-10">
        {ico}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="vtc-input"
      />
    </div>
  );
}

// ── CAMPO DE FORMULARIO ───────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] font-bold text-brand-muted tracking-widest mb-2 ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────
function Toast({ msg, tipo }) {
  if (!msg) return null;
  const bg = tipo === "err" ? "#4a0d0d" : tipo === "ok" ? "#0d4a32" : "#112F5C";
  const bd = tipo === "err"
    ? "rgba(255,77,77,.3)"
    : tipo === "ok"
    ? "rgba(34,199,139,.3)"
    : "rgba(0,181,255,.3)";
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-3xl text-[12px] font-bold text-white z-50 whitespace-nowrap fade-in"
      style={{ background: bg, border: `1px solid ${bd}` }}
    >
      {msg}
    </div>
  );
}

// ── TARJETA BLOG ─────────────────────────────────────────────────
function BlogCard({ post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass-card block p-5 group no-underline"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="badge badge-blue">{post.category || "VTC"}</span>
        <span className="text-[10px] text-brand-muted">{post.date}</span>
      </div>
      <h3 className="text-[15px] font-bold text-white mb-2 group-hover:text-brand-blue transition-colors leading-snug">
        {post.title}
      </h3>
      <p className="text-[12px] text-brand-muted line-clamp-3 leading-relaxed">
        {post.excerpt}
      </p>
      <div className="mt-4 text-[11px] font-bold text-brand-blue group-hover:underline">
        Leer artículo →
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function HomePage() {
  // ── Estado calculadora ─────────────────────────────────────
  const [paso,     setPaso]    = useState(1);
  const [origen,   setOrigen]  = useState("");
  const [destino,  setDestino] = useState("");
  const [fecha,    setFecha]   = useState("");
  const [pax,      setPax]     = useState(1);
  const [extras,   setExtras]  = useState({ maleta: false, mascota: false, silla: false });
  const [negocio,  setNegocio] = useState(false);
  const [pNeg,     setPNeg]    = useState("");
  const [calc,     setCalc]    = useState(null);
  const [nombre,   setNombre]  = useState("");
  const [telefono, setTelefono]= useState("");
  const [dni,      setDni]     = useState("");
  const [pago,     setPago]    = useState("EFECTIVO");
  const [loading,  setLoading] = useState(false);
  const [resultado,setResult]  = useState(null);
  const [toast,    setToast]   = useState(null);

  // ── Estado Blog ─────────────────────────────────────────────
  const [posts, setPosts] = useState([]);

  const showToast = (msg, tipo = "info") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // Cargar últimos posts del blog
  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts?.slice(0, 3) || []))
      .catch(() => {});
  }, []);

  // ── Calcular precio ─────────────────────────────────────────
  async function handleCalcular() {
    if (!origen.trim())  { showToast("Introduce la dirección de origen", "err");  return; }
    if (!destino.trim()) { showToast("Introduce la dirección de destino", "err"); return; }
    if (!fecha)          { showToast("Selecciona la fecha y hora del servicio", "err"); return; }

    // ⚡ Precontratación 0 min — solo verificar que no sea pasado
    const pre = validarPrecontratacion(fecha);
    if (!pre.valido) { showToast(pre.error, "err"); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/calcular", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ origen, destino, fecha, pax, extras }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al calcular", "err"); return; }

      // Modo negociación: sustituir precio si el conductor introduce uno
      let precioCerrado = data.total;
      let negociado     = false;
      if (negocio && pNeg && parseFloat(pNeg) > 0) {
        precioCerrado = parseFloat(pNeg);
        negociado     = true;
      }
      setCalc({ ...data, precioCerrado, negociado });
      setPaso(2);
    } catch (e) {
      showToast("Error de conexión. Inténtalo de nuevo.", "err");
    } finally {
      setLoading(false);
    }
  }

  // ── Confirmar reserva ────────────────────────────────────────
  async function handleConfirmar() {
    if (!nombre.trim())   { showToast("Nombre obligatorio", "err");  return; }
    if (!telefono.trim()) { showToast("Teléfono obligatorio", "err"); return; }
    if (!dni.trim())      { showToast("DNI/NIE obligatorio (normativa VTC)", "err"); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/viajes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          direccion_origen:  origen,
          direccion_destino: destino,
          fecha_servicio:    fecha,
          extras, pax,
          forma_pago:        pago,
          cliente_nombre:    nombre,
          cliente_telefono:  telefono,
          cliente_dni:       dni,
          precio_negociado:  calc?.negociado ? calc.precioCerrado : null,
          km:                calc?.km,
          duracion:          calc?.duracionMin,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al confirmar", "err"); return; }
      setResult(data);
      setPaso(4);
      showToast("✅ ¡Reserva confirmada!", "ok");
    } catch (e) {
      showToast("Error de conexión.", "err");
    } finally {
      setLoading(false);
    }
  }

  function resetear() {
    setPaso(1); setOrigen(""); setDestino(""); setFecha(""); setPax(1);
    setExtras({ maleta: false, mascota: false, silla: false });
    setNegocio(false); setPNeg(""); setCalc(null);
    setNombre(""); setTelefono(""); setDni(""); setPago("EFECTIVO");
    setResult(null);
  }

  // ── SHELL MÓVIL ──────────────────────────────────────────────
  const shell = (
    <div className="w-full max-w-[420px] bg-[#0d1f36] rounded-[2rem] overflow-hidden flex flex-col"
      style={{ minHeight: 760, boxShadow: "0 0 0 8px #050e1a, 0 0 0 10px #112F5C, 0 40px 80px rgba(0,0,0,.7)" }}>

      {/* HEADER */}
      <div className="sticky top-0 z-50 px-5 pt-5 pb-0"
        style={{ background: "linear-gradient(135deg,#071528,#112F5C)", borderBottom: "1px solid rgba(0,181,255,.1)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-[20px] font-black text-white tracking-tight">
            <span className="text-brand-blue">VTC</span> Madrid
          </div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-blue">PRECIO CERRADO</span>
            {paso > 1 && paso < 4 && (
              <button onClick={()=>setPaso(p=>p-1)}
                className="text-[11px] font-bold text-white/60 hover:text-white transition-colors px-2">
                ✕
              </button>
            )}
          </div>
        </div>
        <Stepper paso={paso} />
      </div>

      {/* ── PASO 1: RUTA ── */}
      {paso === 1 && (
        <div className="p-5 flex flex-col flex-1">
          <Field label="📍 ORIGEN">
            <IcoInput ico="📍" value={origen} onChange={setOrigen} placeholder="Dirección de recogida..." />
          </Field>
          <Field label="🏁 DESTINO">
            <IcoInput ico="🏁" value={destino} onChange={setDestino} placeholder="¿A dónde vamos?" />
          </Field>
          <Field label="📅 FECHA Y HORA">
            <input type="datetime-local" value={fecha} min={getFechaMin()}
              onChange={(e) => setFecha(e.target.value)}
              className="vtc-input vtc-input-plain" />
            <p className="text-[9px] text-brand-muted mt-1 ml-1">⚡ Viajes inmediatos disponibles</p>
          </Field>

          {/* Pasajeros + Extras */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-[10px] font-bold text-brand-muted tracking-widest mb-2">PASAJEROS</div>
              <div className="flex items-center bg-[#071528] border border-brand-border rounded-xl overflow-hidden">
                <button onClick={() => setPax((p) => Math.max(1, p - 1))}
                  className="w-10 h-11 text-lg font-bold text-white hover:bg-white/5 transition-colors">−</button>
                <div className="flex-1 text-center text-[15px] font-black text-white">{pax}</div>
                <button onClick={() => setPax((p) => Math.min(8, p + 1))}
                  className="w-10 h-11 text-lg font-bold text-white hover:bg-white/5 transition-colors">+</button>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-brand-muted tracking-widest mb-2">EXTRAS</div>
              <div className="flex gap-2">
                {[["maleta","🧳"],["mascota","🐾"],["silla","👶"]].map(([k,ico]) => (
                  <button key={k} onClick={() => setExtras(p => ({ ...p, [k]: !p[k] }))}
                    className="px-2 py-2 rounded-lg border text-sm transition-all"
                    style={{
                      borderColor: extras[k] ? "#00B5FF" : "#1a2f4a",
                      background:  extras[k] ? "rgba(0,181,255,.1)" : "rgba(13,31,54,.9)",
                    }}>{ico}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Modo negociación */}
          <label className="flex items-center gap-2 cursor-pointer text-[12px] font-bold text-[#7A5FFF] mb-3">
            <input type="checkbox" checked={negocio} onChange={e => setNegocio(e.target.checked)} className="cursor-pointer" />
            🤝 Modo Negociación (precio manual)
          </label>
          {negocio && (
            <div className="mb-4 p-4 rounded-xl border" style={{ background: "rgba(122,95,255,.08)", borderColor: "rgba(122,95,255,.3)" }}>
              <div className="text-[10px] font-bold text-[#7A5FFF] tracking-widest mb-2">PRECIO ACORDADO (€)</div>
              <input type="number" step="0.50" min="0" value={pNeg}
                onChange={e => setPNeg(e.target.value)} placeholder="Ej: 25.00"
                className="vtc-input vtc-input-plain" style={{ borderColor: "rgba(122,95,255,.4)" }} />
            </div>
          )}

          <div className="mt-auto">
            <button onClick={handleCalcular} disabled={loading}
              className="btn-neon w-full">
              {loading ? <span className="spin">⏳</span> : "Calcular Precio →"}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2: PRECIO ── */}
      {paso === 2 && calc && (
        <div className="p-5 flex flex-col flex-1">
          {/* Price hero */}
          <div className="rounded-2xl p-5 mb-4 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#071528,#112F5C)", border: "1px solid rgba(0,181,255,.15)" }}>
            <div className="absolute inset-0 opacity-20"
              style={{ background: "radial-gradient(circle at 80% 20%,#00B5FF,transparent 60%)" }} />
            <div className="text-[10px] font-bold text-white/50 tracking-widest mb-1">PRECIO CERRADO</div>
            <div className="text-[48px] font-black text-white leading-none">
              {fmtEur(calc.precioCerrado)}
            </div>
            <div className="inline-block mt-2 px-3 py-1 rounded-full text-[9px] font-bold"
              style={{ background: "rgba(0,181,255,.15)", color: "#00B5FF", border: "1px solid rgba(0,181,255,.25)" }}>
              {calc.tarifa_nombre}
            </div>
            {calc.negociado && (
              <div className="mt-1 text-[10px] font-bold" style={{ color: "#7A5FFF" }}>🤝 Precio negociado</div>
            )}
            {/* Stats */}
            <div className="flex gap-2 mt-4">
              {[
                { v: `${calc.km?.toFixed(1)} km`, l: "Distancia" },
                { v: `${calc.duracionMin} min`,   l: "Duración" },
                { v: fmtEur(calc.iva),             l: "IVA 10%" },
              ].map((s) => (
                <div key={s.l} className="flex-1 rounded-xl p-2 text-center"
                  style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.07)" }}>
                  <div className="text-[12px] font-black text-white">{s.v}</div>
                  <div className="text-[9px] text-white/40 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Desglose */}
          <div className="rounded-xl p-3 mb-4 text-[12px]"
            style={{ background: "rgba(13,31,54,.9)", border: "1px solid #1a2f4a" }}>
            <div className="text-[10px] font-bold text-brand-muted tracking-widest mb-3">DESGLOSE</div>
            <div className="flex flex-col gap-2">
              {calc.conceptos?.map((c, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-white/60">{c.concepto}</span>
                  <span className="font-bold text-white">{fmtEur(c.importe)}</span>
                </div>
              ))}
            </div>
            <div className="h-px my-2" style={{ background: "#1a2f4a" }} />
            <div className="flex justify-between font-black text-[13px] text-white">
              <span>TOTAL (IVA inc.)</span>
              <span>{fmtEur(calc.precioCerrado)}</span>
            </div>
            <p className="text-[9px] text-brand-muted text-center mt-2">⚖️ Precio cerrado — Art. 7 RD 1057/2015</p>
          </div>

          {/* Ruta resumen */}
          <div className="rounded-xl p-3 mb-4"
            style={{ background: "rgba(13,31,54,.9)", border: "1px solid #1a2f4a" }}>
            <div className="flex gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand-green mt-1 shrink-0" />
              <div>
                <div className="text-[12px] font-semibold text-white">{origen}</div>
                <div className="text-[10px] text-brand-muted">{fmtFecha(fecha)}</div>
              </div>
            </div>
            <div className="w-px h-3 bg-brand-border ml-[3px] mb-2" />
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-red mt-1 shrink-0" />
              <div>
                <div className="text-[12px] font-semibold text-white">{destino}</div>
                <div className="text-[10px] text-brand-muted">{pax} {pax === 1 ? "pasajero" : "pasajeros"}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button onClick={() => setPaso(1)} className="btn-neon btn-dark flex-1">← Atrás</button>
            <button onClick={() => setPaso(3)} className="btn-neon" style={{ flex: 2 }}>Continuar →</button>
          </div>
        </div>
      )}

      {/* ── PASO 3: DATOS CLIENTE ── */}
      {paso === 3 && (
        <div className="p-5 flex flex-col flex-1">
          <div className="text-[13px] font-black text-white mb-4">Datos del viajero</div>

          <Field label="👤 NOMBRE COMPLETO">
            <IcoInput ico="👤" value={nombre} onChange={setNombre} placeholder="Nombre y apellidos" />
          </Field>
          <Field label="📞 TELÉFONO">
            <IcoInput ico="📞" value={telefono} onChange={setTelefono} placeholder="+34 600 000 000" type="tel" />
          </Field>
          <Field label="🪪 DNI / NIE">
            <IcoInput ico="🪪" value={dni} onChange={v => setDni(v.toUpperCase())} placeholder="12345678A" />
          </Field>
          <Field label="💳 FORMA DE PAGO">
            <select value={pago} onChange={e => setPago(e.target.value)}
              className="vtc-input vtc-input-plain">
              <option value="EFECTIVO">💵 Efectivo</option>
              <option value="TARJETA">💳 Tarjeta</option>
              <option value="BIZUM">📱 Bizum</option>
              <option value="TRANSFERENCIA">🏦 Transferencia</option>
            </select>
          </Field>

          {/* Precio final */}
          <div className="flex justify-between items-center p-4 rounded-xl mb-4"
            style={{ background: "linear-gradient(135deg,#071528,#112F5C)", border: "1px solid rgba(0,181,255,.15)" }}>
            <div>
              <div className="text-[10px] text-white/50 font-bold tracking-widest">PRECIO FINAL</div>
              <div className="text-[26px] font-black text-white">{fmtEur(calc?.precioCerrado || 0)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/50">Pago</div>
              <div className="text-[13px] font-black text-brand-blue">{pago}</div>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button onClick={() => setPaso(2)} className="btn-neon btn-dark flex-1">← Atrás</button>
            <button onClick={handleConfirmar} disabled={loading}
              className="btn-neon" style={{ flex: 2 }}>
              {loading ? "⏳ Registrando..." : "✓ Confirmar Reserva"}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 4: CONFIRMACIÓN ── */}
      {paso === 4 && resultado && (
        <div className="p-8 flex flex-col items-center justify-center flex-1 gap-4 text-center">
          <div className="text-[64px] pop">✅</div>
          <div className="text-[22px] font-black text-white">¡Reserva Confirmada!</div>
          <p className="text-[12px] text-brand-muted max-w-[280px] leading-relaxed">
            Tu VTC está registrado y comunicado al Ministerio de Transportes.
          </p>
          <div className="font-mono text-[18px] font-black bg-[#071528] border border-brand-border rounded-xl px-6 py-3 text-brand-blue tracking-widest">
            {resultado.codigo_viaje}
          </div>
          <div className="flex flex-col gap-2 w-full mt-2">
            <a href={`/api/hoja-ruta/${resultado.codigo_viaje}`} target="_blank" rel="noopener noreferrer">
              <button className="btn-neon w-full">📄 Ver Hoja de Ruta</button>
            </a>
            <button onClick={resetear} className="btn-neon btn-dark w-full">
              Nueva Reserva →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── RENDER COMPLETO ───────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════════════════
          SECCIÓN HERO — calculadora centrada
      ════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-start pt-10 pb-16 px-4 min-h-screen">
        {/* Glow de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse, #00B5FF 0%, transparent 70%)" }} />

        {/* Eyebrow */}
        <div className="mb-4 slide-up">
          <span className="badge badge-blue text-[10px]">
            ⚡ Viajes inmediatos disponibles
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[2.4rem] sm:text-[3rem] font-black text-white text-center leading-tight mb-3 slide-up max-w-2xl"
          style={{ animationDelay: ".05s" }}>
          Tu conductor privado<br />
          <span className="text-brand-blue text-glow">en Madrid</span>
        </h1>

        <p className="text-[14px] text-brand-muted text-center max-w-md mb-8 leading-relaxed slide-up"
          style={{ animationDelay: ".1s" }}>
          Precio cerrado garantizado · Registro automático en el Ministerio
          de Transportes · 100% legal
        </p>

        {/* Calculadora — shell móvil */}
        <div className="w-full flex justify-center slide-up" style={{ animationDelay: ".15s" }}>
          {shell}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SECCIÓN CARACTERÍSTICAS
      ════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-[1.6rem] font-black text-white text-center mb-10">
          ¿Por qué elegir <span className="text-brand-blue">VTC Madrid</span>?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              ico: "⚖️",
              title: "Precio Cerrado Legal",
              desc: "El precio se calcula antes de empezar y es inamovible. Art. 7 RD 1057/2015.",
              color: "#00B5FF",
            },
            {
              ico: "🏛️",
              title: "Registro RVTC Automático",
              desc: "Cada viaje se comunica al Ministerio de Transportes antes de iniciarse.",
              color: "#7A5FFF",
            },
            {
              ico: "⚡",
              title: "Viajes Inmediatos",
              desc: "Reserva ahora mismo para un servicio inmediato sin tiempos de espera mínimos.",
              color: "#22c78b",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6 text-center">
              <div className="text-[40px] mb-3 float">{f.ico}</div>
              <h3 className="text-[14px] font-black text-white mb-2">{f.title}</h3>
              <p className="text-[12px] text-brand-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SECCIÓN TARIFAS
      ════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 py-8 pb-16">
        <h2 className="text-[1.4rem] font-black text-white text-center mb-8">
          Tarifas VTC Madrid 2026
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[TARIFAS.T1, TARIFAS.T2].map((t, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[14px] font-black text-white">{t.nombre}</div>
                </div>
                <span className={`badge ${i === 0 ? "badge-blue" : "badge-violet"}`}>
                  {i === 0 ? "☀️ Diurna" : "🌙 Nocturna"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { lbl: "Bajada bandera", val: `${t.bajada_bandera.toFixed(2)}€` },
                  { lbl: "Por km",         val: `${t.precio_km.toFixed(2)}€` },
                  { lbl: "Por minuto",     val: `${t.precio_minuto.toFixed(2)}€` },
                ].map((x) => (
                  <div key={x.lbl} className="text-center p-2 rounded-lg"
                    style={{ background: "rgba(0,0,0,.3)", border: "1px solid #1a2f4a" }}>
                    <div className="text-[14px] font-black text-brand-blue">{x.val}</div>
                    <div className="text-[9px] text-brand-muted mt-0.5">{x.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-brand-muted">
                Mínimo legal: <strong className="text-white">{t.minimo_legal.toFixed(2)}€</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SECCIÓN BLOG
      ════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[1.4rem] font-black text-white">
            Blog & Guías VTC
          </h2>
          <Link href="/blog" className="text-[12px] font-bold text-brand-blue hover:underline">
            Ver todos →
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-10 text-center text-brand-muted text-[13px]">
            <div className="text-[32px] mb-3">📝</div>
            Próximamente — artículos sobre normativa VTC, consejos y guías
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-brand-border py-10 px-4 text-center">
        <div className="text-brand-muted text-[11px] leading-7">
          <div className="font-black text-white text-[14px] mb-1">
            <span className="text-brand-blue">VTC</span> Madrid 2026
          </div>
          Servicio de Arrendamiento de Vehículo con Conductor · Madrid<br />
          Normativa RD 1076/2017 · Orden FOM/36/2008 · Precio cerrado Art. 7 RD 1057/2015
          <div className="flex justify-center gap-6 mt-4 text-[11px]">
            <Link href="/blog"           className="hover:text-white transition-colors">Blog</Link>
            <Link href="/admin/login"    className="hover:text-white transition-colors">Admin</Link>
            <Link href="/conductor"      className="hover:text-white transition-colors">Conductor</Link>
            <Link href="/privacidad"     className="hover:text-white transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}
    </>
  );
}
