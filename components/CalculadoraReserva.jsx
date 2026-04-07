"use client";
/**
 * components/CalculadoraReserva.jsx
 * ─────────────────────────────────────────────
 * Calculadora de precio VTC reutilizable.
 * Stepper 3 pasos (fiel al diseño 5.html):
 *   Paso 1 → Ruta, fecha, extras
 *   Paso 2 → Precio cerrado desglosado
 *   Paso 3 → Datos del cliente + confirmar
 *
 * Props:
 *   conductorId?   {number}  — Si viene del panel conductor
 *   conductorNombre? {string}
 *   onExito?       {function(data)} — Callback al confirmar
 *   showNegocio?   {boolean} — Mostrar modo negociación
 */

import { useState } from "react";
import { calcularPrecio, validarPrecontratacion, fmtEur, fmtFecha } from "@/lib/calculator";

// ── Stepper ───────────────────────────────────────────────────────
function Stepper({ paso }) {
  const STEPS = ["RUTA", "PRECIO", "DATOS"];
  return (
    <div className="flex items-center pb-5">
      {STEPS.map((lbl, i) => {
        const n      = i + 1;
        const active = n === paso;
        const done   = n < paso;
        return (
          <div key={i} className="flex-1 flex flex-col items-center relative">
            {i < STEPS.length - 1 && (
              <div className="absolute top-[13px] left-[50%] w-full h-[2px] transition-all duration-500"
                style={{ background: done ? "#22c78b" : "rgba(255,255,255,.1)" }} />
            )}
            <div className="step-dot" style={{ zIndex: 1, transition:"all .35s cubic-bezier(.34,1.56,.64,1)" }}
              data-state={active ? "active" : done ? "done" : "inactive"}
              /* Inline porque no usamos el CSS class para evitar conflictos */
              {...(active
                ? { style:{ zIndex:1, width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,background:"#00B5FF",color:"#fff",border:"2px solid #00B5FF",transform:"scale(1.1)",boxShadow:"0 0 12px rgba(0,181,255,.5)",transition:"all .35s cubic-bezier(.34,1.56,.64,1)"} }
                : done
                ? { style:{ zIndex:1, width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,background:"#22c78b",color:"#fff",border:"2px solid #22c78b",transition:"all .35s"} }
                : { style:{ zIndex:1, width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.35)",border:"2px solid rgba(255,255,255,.12)",transition:"all .35s"} }
              )}
            >
              {done ? "✓" : n}
            </div>
            <span className="text-[8px] font-bold mt-1 tracking-wider"
              style={{ color: active ? "#00B5FF" : done ? "#22c78b" : "rgba(255,255,255,.3)" }}>
              {lbl}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Campo formulario ──────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] font-bold tracking-widest mb-2 ml-0.5" style={{ color:"#8898aa" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input con icono ───────────────────────────────────────────────
function IcoInput({ ico, value, onChange, placeholder, type="text", min, required }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none z-10">{ico}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        required={required}
        className="w-full text-white font-semibold rounded-xl outline-none transition-all"
        style={{
          padding:"13px 13px 13px 42px",
          background:"rgba(13,31,54,.9)",
          border:"1.5px solid #1a2f4a",
          fontSize:13,
          fontFamily:"Montserrat,sans-serif",
        }}
        onFocus={(e)=>{ e.target.style.borderColor="#00B5FF"; e.target.style.boxShadow="0 0 0 3px rgba(0,181,255,.12)"; }}
        onBlur={(e) =>{ e.target.style.borderColor="#1a2f4a"; e.target.style.boxShadow="none"; }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function CalculadoraReserva({
  conductorId     = null,
  conductorNombre = "Cliente",
  onExito         = null,
  showNegocio     = false,
}) {
  const [paso,     setPaso]    = useState(1);
  const [origen,   setOrigen]  = useState("");
  const [destino,  setDestino] = useState("");
  const [fecha,    setFecha]   = useState("");
  const [pax,      setPax]     = useState(1);
  const [extras,   setExtras]  = useState({ maleta:false, mascota:false, silla:false });
  const [negocio,  setNegocio] = useState(false);
  const [pNeg,     setPNeg]    = useState("");
  const [calc,     setCalc]    = useState(null);
  const [nombre,   setNombre]  = useState("");
  const [telefono, setTelefono]= useState("");
  const [dni,      setDni]     = useState("");
  const [pago,     setPago]    = useState("EFECTIVO");
  const [loading,  setLoading] = useState(false);
  const [resultado,setResult]  = useState(null);
  const [error,    setError]   = useState("");

  // ── Mínimo de fecha: ahora mismo (0 min de espera) ─────────
  const fechaMin = (() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  })();

  function showErr(msg) {
    setError(msg);
    setTimeout(() => setError(""), 3500);
  }

  function toggleExtra(k) {
    setExtras((p) => ({ ...p, [k]: !p[k] }));
  }

  // ── CALCULAR PRECIO ───────────────────────────────────────
  async function calcular() {
    if (!origen.trim())  return showErr("Introduce la dirección de origen");
    if (!destino.trim()) return showErr("Introduce la dirección de destino");
    if (!fecha)          return showErr("Selecciona fecha y hora del servicio");

    // Solo validar que no sea pasado absoluto (0 min permitido)
    const pre = validarPrecontratacion(fecha);
    if (!pre.valido) return showErr(pre.error);

    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/calcular", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ origen, destino, fecha, pax, extras }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al calcular");

      const precioCerrado = negocio && parseFloat(pNeg) > 0
        ? parseFloat(pNeg)
        : data.total;

      setCalc({ ...data, precioCerrado, negociado: negocio && !!pNeg });
      setPaso(2);
    } catch (e) {
      showErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── CONFIRMAR RESERVA ─────────────────────────────────────
  async function confirmar() {
    if (!nombre.trim())   return showErr("Nombre obligatorio");
    if (!telefono.trim()) return showErr("Teléfono obligatorio");
    if (!dni.trim())      return showErr("DNI/NIE obligatorio (normativa VTC)");

    setLoading(true);
    setError("");
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
          conductor_id:      conductorId,
          conductor_nombre:  conductorNombre,
          precio_negociado:  calc?.negociado ? calc.precioCerrado : null,
          km:                calc?.km,
          duracion:          calc?.duracionMin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al confirmar");

      setResult(data);
      setPaso(4);
      onExito?.(data);
    } catch (e) {
      showErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPaso(1); setOrigen(""); setDestino(""); setFecha(""); setPax(1);
    setExtras({maleta:false,mascota:false,silla:false}); setNegocio(false); setPNeg("");
    setCalc(null); setNombre(""); setTelefono(""); setDni(""); setPago("EFECTIVO");
    setResult(null); setError("");
  }

  const inputPlain = {
    width:"100%", padding:"13px 14px", borderRadius:12,
    border:"1.5px solid #1a2f4a", background:"rgba(13,31,54,.9)",
    color:"#fff", fontSize:13, fontFamily:"Montserrat,sans-serif",
    fontWeight:600, outline:"none",
  };

  return (
    <div className="flex flex-col">
      <Stepper paso={paso} />

      {/* Error global */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-[12px] font-bold fade-in"
          style={{ background:"rgba(255,77,77,.1)", border:"1px solid rgba(255,77,77,.25)", color:"#ff4d4d" }}>
          ❌ {error}
        </div>
      )}

      {/* ══ PASO 1: RUTA ══ */}
      {paso === 1 && (
        <div className="flex flex-col flex-1">
          <Field label="📍 ORIGEN">
            <IcoInput ico="📍" value={origen} onChange={setOrigen} placeholder="Dirección de recogida..." />
          </Field>
          <Field label="🏁 DESTINO">
            <IcoInput ico="🏁" value={destino} onChange={setDestino} placeholder="¿A dónde vamos?" />
          </Field>
          <Field label="📅 FECHA Y HORA">
            <input type="datetime-local" value={fecha} min={fechaMin}
              onChange={(e) => setFecha(e.target.value)}
              style={{ ...inputPlain, paddingLeft: 14 }} />
            <p className="text-[9px] mt-1 ml-0.5" style={{color:"#8898aa"}}>
              ⚡ Viajes inmediatos disponibles — sin espera mínima
            </p>
          </Field>

          {/* Pasajeros + Extras */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{color:"#8898aa"}}>PASAJEROS</div>
              <div className="flex items-center rounded-xl overflow-hidden"
                style={{ background:"rgba(7,21,40,.9)", border:"1.5px solid #1a2f4a" }}>
                <button onClick={() => setPax((p)=>Math.max(1,p-1))}
                  className="w-10 h-11 text-lg font-bold text-white hover:opacity-70 transition-opacity">−</button>
                <div className="flex-1 text-center text-[15px] font-black text-white">{pax}</div>
                <button onClick={() => setPax((p)=>Math.min(8,p+1))}
                  className="w-10 h-11 text-lg font-bold text-white hover:opacity-70 transition-opacity">+</button>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{color:"#8898aa"}}>EXTRAS</div>
              <div className="flex gap-2">
                {[["maleta","🧳"],["mascota","🐾"],["silla","👶"]].map(([k,ico]) => (
                  <button key={k} onClick={() => toggleExtra(k)}
                    className="px-2.5 py-2 rounded-lg text-sm transition-all"
                    style={{
                      borderColor: extras[k] ? "#00B5FF" : "#1a2f4a",
                      border: "1.5px solid",
                      background: extras[k] ? "rgba(0,181,255,.1)" : "rgba(7,21,40,.9)",
                    }}>
                    {ico}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modo negociación */}
          {showNegocio && (
            <>
              <label className="flex items-center gap-2 text-[12px] font-bold mb-3 cursor-pointer"
                style={{color:"#7A5FFF"}}>
                <input type="checkbox" checked={negocio} onChange={(e)=>setNegocio(e.target.checked)} />
                🤝 Precio negociado manualmente
              </label>
              {negocio && (
                <div className="mb-4 p-4 rounded-xl"
                  style={{ background:"rgba(122,95,255,.08)", border:"1.5px solid rgba(122,95,255,.3)" }}>
                  <div className="text-[10px] font-bold tracking-widest mb-2" style={{color:"#7A5FFF"}}>
                    PRECIO ACORDADO (€)
                  </div>
                  <input type="number" step="0.50" min="0" value={pNeg}
                    onChange={(e)=>setPNeg(e.target.value)} placeholder="Ej: 25.00"
                    style={{ ...inputPlain, borderColor:"rgba(122,95,255,.4)" }} />
                </div>
              )}
            </>
          )}

          <div className="mt-auto">
            <button onClick={calcular} disabled={loading}
              className="btn-neon w-full" style={{ opacity: loading ? .6 : 1 }}>
              {loading ? "⏳ Calculando..." : "Calcular Precio →"}
            </button>
          </div>
        </div>
      )}

      {/* ══ PASO 2: PRECIO ══ */}
      {paso === 2 && calc && (
        <div className="flex flex-col flex-1">
          {/* Hero precio */}
          <div className="rounded-2xl p-5 mb-4 text-center relative overflow-hidden"
            style={{ background:"linear-gradient(135deg,#071528,#112F5C)", border:"1px solid rgba(0,181,255,.15)" }}>
            <div className="absolute inset-0 opacity-20"
              style={{ background:"radial-gradient(circle at 80% 20%,#00B5FF,transparent 60%)" }} />
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{color:"rgba(255,255,255,.5)"}}>
              PRECIO CERRADO DEL SERVICIO
            </div>
            <div className="text-[46px] font-black text-white leading-none">{fmtEur(calc.precioCerrado)}</div>
            <div className="inline-block mt-2 px-3 py-1 rounded-full text-[9px] font-bold"
              style={{ background:"rgba(0,181,255,.15)", color:"#00B5FF", border:"1px solid rgba(0,181,255,.25)" }}>
              {calc.tarifa_nombre}
            </div>
            {calc.negociado && (
              <div className="mt-1 text-[10px] font-bold" style={{color:"#7A5FFF"}}>🤝 Precio negociado</div>
            )}
            <div className="flex gap-2 mt-4">
              {[
                {v:`${calc.km?.toFixed(1)} km`, l:"Distancia"},
                {v:`${calc.duracionMin} min`,    l:"Duración"},
                {v:fmtEur(calc.iva),              l:"IVA 10%"},
              ].map((s) => (
                <div key={s.l} className="flex-1 rounded-xl p-2 text-center"
                  style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.07)" }}>
                  <div className="text-[12px] font-black text-white">{s.v}</div>
                  <div className="text-[9px] mt-0.5" style={{color:"rgba(255,255,255,.4)"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Desglose */}
          <div className="p-4 rounded-xl mb-4" style={{ background:"rgba(13,31,54,.9)", border:"1px solid #1a2f4a" }}>
            <div className="text-[10px] font-bold tracking-widest mb-3" style={{color:"#8898aa"}}>DESGLOSE</div>
            {calc.conceptos?.map((c, i) => (
              <div key={i} className="flex justify-between mb-2">
                <span className="text-[11px]" style={{color:"rgba(255,255,255,.6)"}}>{c.concepto}</span>
                <span className="text-[11px] font-bold text-white">{fmtEur(c.importe)}</span>
              </div>
            ))}
            <div className="h-px my-2" style={{background:"#1a2f4a"}} />
            <div className="flex justify-between font-black text-[13px] text-white">
              <span>TOTAL (IVA inc.)</span>
              <span>{fmtEur(calc.precioCerrado)}</span>
            </div>
            <p className="text-[9px] text-center mt-2" style={{color:"#8898aa"}}>⚖️ Precio cerrado — Art. 7 RD 1057/2015</p>
          </div>

          {/* Ruta */}
          <div className="p-3 rounded-xl mb-4" style={{ background:"rgba(13,31,54,.9)", border:"1px solid #1a2f4a" }}>
            <div className="flex gap-3 mb-2">
              <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{background:"#22c78b"}} />
              <div><div className="text-[12px] font-semibold text-white">{origen}</div>
                <div className="text-[10px]" style={{color:"#8898aa"}}>{fmtFecha(fecha)}</div></div>
            </div>
            <div className="w-px h-3 ml-[3px] mb-2" style={{background:"#1a2f4a"}} />
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{background:"#ff4d4d"}} />
              <div><div className="text-[12px] font-semibold text-white">{destino}</div>
                <div className="text-[10px]" style={{color:"#8898aa"}}>{pax} {pax===1?"pasajero":"pasajeros"}</div></div>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button onClick={()=>setPaso(1)} className="btn-neon btn-dark flex-1">← Atrás</button>
            <button onClick={()=>setPaso(3)} className="btn-neon" style={{flex:2}}>Continuar →</button>
          </div>
        </div>
      )}

      {/* ══ PASO 3: DATOS ══ */}
      {paso === 3 && (
        <div className="flex flex-col flex-1">
          <div className="text-[13px] font-black text-white mb-4">Datos del viajero</div>

          <Field label="👤 NOMBRE COMPLETO">
            <IcoInput ico="👤" value={nombre} onChange={setNombre} placeholder="Nombre y apellidos" required />
          </Field>
          <Field label="📞 TELÉFONO">
            <IcoInput ico="📞" value={telefono} onChange={setTelefono} placeholder="+34 600 000 000" type="tel" />
          </Field>
          <Field label="🪪 DNI / NIE">
            <IcoInput ico="🪪" value={dni} onChange={(v)=>setDni(v.toUpperCase())} placeholder="12345678A" />
          </Field>
          <Field label="💳 FORMA DE PAGO">
            <select value={pago} onChange={(e)=>setPago(e.target.value)}
              style={{ ...inputPlain, paddingLeft:14 }}>
              <option value="EFECTIVO">💵 Efectivo</option>
              <option value="TARJETA">💳 Tarjeta</option>
              <option value="BIZUM">📱 Bizum</option>
              <option value="TRANSFERENCIA">🏦 Transferencia</option>
            </select>
          </Field>

          {/* Precio final */}
          <div className="flex justify-between items-center p-4 rounded-xl mb-4"
            style={{ background:"linear-gradient(135deg,#071528,#112F5C)", border:"1px solid rgba(0,181,255,.15)" }}>
            <div>
              <div className="text-[10px] font-bold tracking-widest" style={{color:"rgba(255,255,255,.5)"}}>PRECIO FINAL</div>
              <div className="text-[26px] font-black text-white">{fmtEur(calc?.precioCerrado||0)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px]" style={{color:"rgba(255,255,255,.5)"}}>Pago</div>
              <div className="text-[13px] font-black" style={{color:"#00B5FF"}}>{pago}</div>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button onClick={()=>setPaso(2)} className="btn-neon btn-dark flex-1">← Atrás</button>
            <button onClick={confirmar} disabled={loading}
              className="btn-neon" style={{flex:2, opacity:loading?.6:1}}>
              {loading ? "⏳ Registrando..." : "✓ Confirmar Reserva"}
            </button>
          </div>
        </div>
      )}

      {/* ══ PASO 4: ÉXITO ══ */}
      {paso === 4 && resultado && (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center py-6">
          <div className="text-[56px] pop">✅</div>
          <div className="text-[20px] font-black text-white">¡Reserva Confirmada!</div>
          <p className="text-[12px] max-w-[260px] leading-relaxed" style={{color:"#8898aa"}}>
            Tu VTC está registrado y comunicado al Ministerio de Transportes.
          </p>
          <div className="font-mono text-[16px] font-black px-6 py-3 rounded-xl tracking-widest"
            style={{ background:"rgba(7,21,40,.9)", border:"1.5px solid #1a2f4a", color:"#00B5FF" }}>
            {resultado.codigo_viaje}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <a href={`/api/hoja-ruta/${resultado.codigo_viaje}`} target="_blank" rel="noopener noreferrer">
              <button className="btn-neon w-full">📄 Ver Hoja de Ruta</button>
            </a>
            <button onClick={reset} className="btn-neon btn-dark w-full">Nueva Reserva →</button>
          </div>
        </div>
      )}
    </div>
  );
}
