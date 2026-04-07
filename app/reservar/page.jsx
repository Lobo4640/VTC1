"use client";
import { useState, useEffect, useRef } from "react";

/* ─── DATOS GLOBALES ─────────────────────────────────────────── */
const APP = {
  matricula: process.env.NEXT_PUBLIC_APP_URL ? "1234-ABC" : "1234-ABC",
  licencia:  "VTC-M-0001",
  nombre:    "VTC Madrid",
  gmapsKey:  "AIzaSyDxdjJ1HyJoVgeP6NFoS2i4va-tdRjrJIA",
};

const fmtEur = (n) => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n);
const fmtFecha = (str) => {
  if (!str) return "--";
  return new Date(str).toLocaleString("es-ES",{weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
};
const getFechaMin = () => {
  const d = new Date(Date.now() + 16*60000);
  d.setSeconds(0,0);
  return d.toISOString().slice(0,16);
};

/* ─── STEPPER ────────────────────────────────────────────────── */
function Stepper({ paso }) {
  const pasos = ["RUTA","PRECIO","CONFIRMAR"];
  return (
    <div style={{display:"flex",alignItems:"center",paddingBottom:16}}>
      {pasos.map((lbl,i) => (
        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,position:"relative"}}>
          {i < pasos.length-1 && (
            <div style={{
              position:"absolute",top:13,left:"50%",width:"100%",height:2,
              background: i < paso-1 ? "#22c78b" : "rgba(255,255,255,.15)",zIndex:0,transition:"background .4s"
            }}/>
          )}
          <div style={{
            width:26,height:26,borderRadius:"50%",zIndex:1,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:800,
            background: i+1 === paso ? "#00B5FF" : i+1 < paso ? "#22c78b" : "rgba(255,255,255,.12)",
            color: i+1 <= paso ? "#fff" : "rgba(255,255,255,.4)",
            border: `2px solid ${i+1===paso?"#00B5FF":i+1<paso?"#22c78b":"rgba(255,255,255,.15)"}`,
            transform: i+1===paso ? "scale(1.1)" : "none",
            transition:"all .35s cubic-bezier(.34,1.56,.64,1)"
          }}>
            {i+1 < paso ? "✓" : i+1}
          </div>
          <div style={{
            fontSize:8,fontWeight:700,marginTop:5,letterSpacing:.4,
            color: i+1===paso ? "#00B5FF" : i+1<paso ? "#22c78b" : "rgba(255,255,255,.35)"
          }}>{lbl}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── TOAST ──────────────────────────────────────────────────── */
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (text, tipo="") => {
    setMsg({text,tipo});
    setTimeout(() => setMsg(null), 2800);
  };
  return { msg, show };
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function ReservarPage() {
  const [paso, setPaso]           = useState(1);
  const [datos, setDatos]         = useState({});
  const [calc, setCalc]           = useState(null);
  const [pax, setPax]             = useState(1);
  const [extras, setExtras]       = useState({maleta:false,mascota:false,silla:false});
  const [confirmando, setConf]    = useState(false);
  const [exito, setExito]         = useState(null);
  const [negocio, setNegocio]     = useState(false);
  const [conductorMode]           = useState(false); // true si viene de /conductor
  const { msg, show }             = useToast();

  function upd(x) { setDatos(p => ({...p,...x})); }
  function toggleExtra(k) { setExtras(p => ({...p,[k]:!p[k]})); }

  /* ── Calcular precio ── */
  async function calcularPrecio() {
    if (!datos.origen || !datos.destino || !datos.fecha) {
      show("Rellena origen, destino y fecha","err"); return;
    }
    const diff = (new Date(datos.fecha) - new Date())/60000;
    if (diff < 15) { show(`⚖️ Mínimo 15 min. de antelación. Faltan ${Math.round(diff)} min.`,"err"); return; }

    try {
      const res  = await fetch("/api/calcular",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          origen:datos.origen, destino:datos.destino,
          fecha:datos.fecha, km:null, duracion:null, extras, pax
        })
      });
      const data = await res.json();
      if (!res.ok) { show(data.error||"Error calculando","err"); return; }

      let precioFinal = data.total;
      if (negocio && datos.precioNeg && parseFloat(datos.precioNeg) > 0) {
        precioFinal = parseFloat(datos.precioNeg);
      }
      setCalc({...data, precioFinal, fueNegociado: !!(negocio && datos.precioNeg)});
      setPaso(2);
    } catch(e) { show("Error de conexión","err"); }
  }

  /* ── Confirmar reserva ── */
  async function confirmarReserva() {
    if (!datos.nombre?.trim())  { show("Nombre obligatorio","err"); return; }
    if (!datos.telefono?.trim()){ show("Teléfono obligatorio","err"); return; }
    if (!datos.dni?.trim())     { show("DNI obligatorio (requerido por normativa VTC)","err"); return; }

    setConf(true);
    try {
      const res  = await fetch("/api/viajes",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          direccion_origen:  datos.origen,
          direccion_destino: datos.destino,
          fecha_servicio:    datos.fecha,
          extras, pax,
          forma_pago:       datos.pago || "EFECTIVO",
          cliente_nombre:   datos.nombre,
          cliente_telefono: datos.telefono,
          cliente_dni:      datos.dni,
          precio_negociado: calc?.fueNegociado ? calc.precioFinal : null,
        })
      });
      const data = await res.json();
      if (!res.ok) { show(data.error||"Error al confirmar","err"); return; }
      setExito(data);
      setPaso(4);
    } catch(e) { show("Error de conexión","err"); }
    finally { setConf(false); }
  }

  function resetear() {
    setPaso(1); setDatos({}); setCalc(null); setPax(1);
    setExtras({maleta:false,mascota:false,silla:false}); setExito(null); setNegocio(false);
  }

  /* ─── SHELL ─────────────────────────────────────────────────── */
  const shell = {
    width:"100%",maxWidth:420,background:"#fff",borderRadius:36,overflow:"hidden",
    boxShadow:"0 0 0 9px #0c1e3a,0 0 0 11px #1a3566,0 50px 100px rgba(0,0,0,.6)",
    display:"flex",flexDirection:"column",minHeight:820
  };

  return (
    <div style={{display:"flex",justifyContent:"center",padding:"32px 16px",minHeight:"100vh"}}>
      <div style={shell}>

        {/* HEADER */}
        <div style={{background:"linear-gradient(135deg,#112F5C,#1a3a6b)",padding:"18px 20px 0",position:"sticky",top:0,zIndex:60}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-.5px"}}>
              <span style={{color:"#00B5FF"}}>VTC</span> Madrid
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{background:"rgba(0,181,255,.15)",border:"1px solid rgba(0,181,255,.3)",color:"#00B5FF",fontSize:9,fontWeight:800,padding:"4px 10px",borderRadius:20}}>
                PRECIO CERRADO
              </span>
              <a href="/inicio" style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:11,fontWeight:700,padding:"6px 12px",borderRadius:20,textDecoration:"none"}}>
                ✕
              </a>
            </div>
          </div>
          <Stepper paso={paso} />
        </div>

        {/* PANEL 1: RUTA */}
        {paso === 1 && (
          <div style={{padding:20,flex:1,display:"flex",flexDirection:"column",gap:0}}>
            <Field label="📍 ORIGEN">
              <IcoInput ico="📍" id="origen" placeholder="Dirección de recogida..." value={datos.origen||""} onChange={v=>upd({origen:v})}/>
            </Field>
            <Field label="🏁 DESTINO">
              <IcoInput ico="🏁" id="destino" placeholder="¿A dónde vamos?" value={datos.destino||""} onChange={v=>upd({destino:v})}/>
            </Field>
            <Field label="📅 FECHA Y HORA">
              <input type="datetime-local" min={getFechaMin()} value={datos.fecha||""} onChange={e=>upd({fecha:e.target.value})}
                style={{width:"100%",padding:"13px 13px 13px 14px",borderRadius:12,border:"1.5px solid #edf2f7",background:"#f8fafc",fontSize:13,fontFamily:"inherit",outline:"none",color:"#112F5C",fontWeight:600}}/>
              <div style={{fontSize:9,color:"#8898aa",marginTop:4}}>⚖️ Mínimo 15 minutos de antelación (normativa VTC)</div>
            </Field>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"#8898aa",letterSpacing:.6,marginBottom:6}}>PASAJEROS</div>
                <div style={{display:"flex",alignItems:"center",background:"#f8fafc",border:"1.5px solid #edf2f7",borderRadius:12,overflow:"hidden"}}>
                  <button onClick={()=>setPax(p=>Math.max(1,p-1))} style={{background:"none",border:"none",width:42,height:46,fontSize:18,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>−</button>
                  <div style={{flex:1,textAlign:"center",fontSize:15,fontWeight:800,color:"#112F5C"}}>{pax}</div>
                  <button onClick={()=>setPax(p=>Math.min(8,p+1))} style={{background:"none",border:"none",width:42,height:46,fontSize:18,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>+</button>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"#8898aa",letterSpacing:.6,marginBottom:6}}>EXTRAS</div>
                <div style={{display:"flex",gap:6}}>
                  {[["maleta","🧳"],["mascota","🐾"],["silla","👶"]].map(([k,ico])=>(
                    <button key={k} onClick={()=>toggleExtra(k)} style={{
                      border:`1.5px solid ${extras[k]?"#00B5FF":"#edf2f7"}`,borderRadius:8,padding:"6px 8px",
                      cursor:"pointer",fontSize:14,background:extras[k]?"rgba(0,181,255,.07)":"#f8fafc",
                      transition:"all .2s",fontFamily:"inherit"
                    }}>{ico}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modo Negociación */}
            <div style={{marginBottom:14}}>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,fontWeight:700,color:"#7A5FFF"}}>
                <input type="checkbox" checked={negocio} onChange={e=>setNegocio(e.target.checked)} style={{cursor:"pointer"}}/> 🤝 Modo Negociación (sobrescribir precio)
              </label>
              {negocio && (
                <div style={{marginTop:10,background:"rgba(122,95,255,.08)",border:"1.5px solid rgba(122,95,255,.3)",borderRadius:12,padding:14}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#7A5FFF",marginBottom:8}}>PRECIO ACORDADO CON EL CLIENTE (€)</div>
                  <input type="number" placeholder="Ej: 25.00" step="0.50" min="0"
                    value={datos.precioNeg||""} onChange={e=>upd({precioNeg:e.target.value})}
                    style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid rgba(122,95,255,.4)",background:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",outline:"none",color:"#112F5C"}}/>
                </div>
              )}
            </div>

            <div style={{marginTop:"auto"}}>
              <Btn onClick={calcularPrecio} dark>Calcular Precio →</Btn>
            </div>
          </div>
        )}

        {/* PANEL 2: PRECIO */}
        {paso === 2 && calc && (
          <div style={{padding:20,flex:1,display:"flex",flexDirection:"column"}}>
            {/* Price hero */}
            <div style={{background:"linear-gradient(135deg,#112F5C,#1a3a6b)",borderRadius:18,padding:20,marginBottom:16,textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 20%,rgba(0,181,255,.15),transparent 60%)",pointerEvents:"none"}}/>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:.5,marginBottom:4}}>PRECIO CERRADO DEL SERVICIO</div>
              <div style={{fontSize:48,fontWeight:900,color:"#fff",lineHeight:1}}>{fmtEur(calc.precioFinal||calc.total)}</div>
              <div style={{display:"inline-block",marginTop:8,padding:"4px 12px",borderRadius:20,fontSize:9,fontWeight:800,background:"rgba(0,181,255,.2)",color:"#00B5FF",border:"1px solid rgba(0,181,255,.3)"}}>
                {calc.tarifa_nombre}
              </div>
              <div style={{display:"flex",gap:8,marginTop:14}}>
                {[
                  {v:calc.km?.toFixed(1)+" km",l:"Distancia"},
                  {v:calc.duracionMin+" min",l:"Duración"},
                  {v:fmtEur(calc.iva),l:"IVA 10%"},
                ].map(s=>(
                  <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.07)",borderRadius:10,padding:10,textAlign:"center",border:"1px solid rgba(255,255,255,.1)"}}>
                    <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{s.v}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,.5)",marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose */}
            <div style={{background:"#f8fafc",border:"1.5px solid #edf2f7",borderRadius:12,padding:12,marginBottom:14,fontSize:12}}>
              <div style={{fontSize:10,fontWeight:800,color:"#8898aa",letterSpacing:.5,marginBottom:8}}>DESGLOSE</div>
              {calc.conceptos?.map((c,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{color:"#8898aa"}}>{c.concepto}</span>
                  <span style={{fontWeight:700}}>{c.importe?.toFixed(2)}€</span>
                </div>
              ))}
              <div style={{height:1,background:"#edf2f7",margin:"8px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:13}}>
                <span style={{color:"#112F5C"}}>TOTAL (IVA inc.)</span>
                <span>{fmtEur(calc.precioFinal||calc.total)}</span>
              </div>
              {calc.fueNegociado && <div style={{fontSize:9,color:"#7A5FFF",fontWeight:700,marginTop:6}}>🤝 Precio negociado entre las partes</div>}
              <div style={{fontSize:9,color:"#8898aa",textAlign:"center",marginTop:6}}>⚖️ Precio cerrado — Art. 7 RD 1057/2015</div>
            </div>

            {/* Ruta */}
            <div style={{background:"#f8fafc",border:"1.5px solid #edf2f7",borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{display:"flex",gap:10,marginBottom:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#22c78b",marginTop:4,flexShrink:0}}/>
                <div><div style={{fontSize:12,fontWeight:600,color:"#112F5C"}}>{datos.origen}</div><div style={{fontSize:10,color:"#8898aa"}}>{fmtFecha(datos.fecha)}</div></div>
              </div>
              <div style={{height:1,background:"#edf2f7",margin:"4px 0 8px 18px"}}/>
              <div style={{display:"flex",gap:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#ff4d4d",marginTop:4,flexShrink:0}}/>
                <div><div style={{fontSize:12,fontWeight:600,color:"#112F5C"}}>{datos.destino}</div><div style={{fontSize:10,color:"#8898aa"}}>{pax} {pax===1?"pasajero":"pasajeros"}</div></div>
              </div>
            </div>

            <div style={{display:"flex",gap:10,marginTop:"auto"}}>
              <Btn onClick={()=>setPaso(1)} outline>← Atrás</Btn>
              <Btn onClick={()=>setPaso(3)} dark flex2>Continuar →</Btn>
            </div>
          </div>
        )}

        {/* PANEL 3: DATOS + CONFIRMAR */}
        {paso === 3 && (
          <div style={{padding:20,flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#112F5C",marginBottom:16}}>Datos del viajero</div>

            <Field label="👤 NOMBRE COMPLETO">
              <IcoInput ico="👤" placeholder="Nombre y apellidos" value={datos.nombre||""} onChange={v=>upd({nombre:v})}/>
            </Field>
            <Field label="📞 TELÉFONO">
              <IcoInput ico="📞" placeholder="+34 600 000 000" value={datos.telefono||""} onChange={v=>upd({telefono:v})} type="tel"/>
            </Field>
            <Field label="🪪 DNI / NIE">
              <IcoInput ico="🪪" placeholder="12345678A" value={datos.dni||""} onChange={v=>upd({dni:v.toUpperCase()})}/>
            </Field>
            <Field label="💳 FORMA DE PAGO">
              <select value={datos.pago||"EFECTIVO"} onChange={e=>upd({pago:e.target.value})}
                style={{width:"100%",padding:"13px 13px",borderRadius:12,border:"1.5px solid #edf2f7",background:"#f8fafc",fontSize:13,fontFamily:"inherit",outline:"none",color:"#112F5C",fontWeight:600}}>
                <option value="EFECTIVO">💵 Efectivo</option>
                <option value="TARJETA">💳 Tarjeta</option>
                <option value="BIZUM">📱 Bizum</option>
                <option value="TRANSFERENCIA">🏦 Transferencia</option>
              </select>
            </Field>

            {/* Precio final */}
            <div style={{background:"linear-gradient(135deg,#112F5C,#1a3a6b)",borderRadius:14,padding:14,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:700}}>PRECIO FINAL</div>
                <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>{fmtEur(calc?.precioFinal||calc?.total||0)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,.6)"}}>Forma de pago</div>
                <div style={{fontSize:13,fontWeight:800,color:"#00B5FF"}}>{datos.pago||"EFECTIVO"}</div>
              </div>
            </div>

            <div style={{display:"flex",gap:10,marginTop:"auto"}}>
              <Btn onClick={()=>setPaso(2)} outline>← Atrás</Btn>
              <Btn onClick={confirmarReserva} dark flex2 disabled={confirmando}>
                {confirmando ? "⏳ Registrando..." : "✓ Confirmar Reserva"}
              </Btn>
            </div>
          </div>
        )}

        {/* PANEL 4: ÉXITO */}
        {paso === 4 && exito && (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:16,textAlign:"center"}}>
            <div style={{fontSize:64,animation:"pop .5s cubic-bezier(.34,1.56,.64,1)"}}>✅</div>
            <div style={{fontSize:22,fontWeight:900,color:"#112F5C"}}>¡Reserva Confirmada!</div>
            <div style={{fontSize:12,color:"#8898aa",maxWidth:280,lineHeight:1.6}}>
              {exito.aviso
                ? `⚠️ ${exito.aviso}`
                : "Viaje registrado y comunicado al Ministerio de Transportes."}
            </div>
            <div style={{fontFamily:"monospace",fontSize:20,fontWeight:800,background:"#f8fafc",border:"1.5px solid #edf2f7",borderRadius:12,padding:"14px 24px",color:"#112F5C",letterSpacing:2}}>
              {exito.codigo_viaje}
            </div>
            <a href={`/api/hoja-ruta/${exito.codigo_viaje}`} target="_blank" rel="noopener noreferrer">
              <Btn dark>📄 Ver Hoja de Ruta</Btn>
            </a>
            <Btn onClick={resetear} outline>Nueva Reserva →</Btn>
          </div>
        )}
      </div>

      {/* Toast */}
      {msg && (
        <div style={{
          position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
          background:msg.tipo==="err"?"#ff4d4d":"#112F5C",color:"#fff",
          padding:"12px 20px",borderRadius:25,fontSize:12,fontWeight:700,
          zIndex:300,whiteSpace:"nowrap",fontFamily:"Montserrat,sans-serif"
        }}>{msg.text}</div>
      )}
    </div>
  );
}

/* ─── COMPONENTES AUXILIARES ─────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:800,color:"#8898aa",letterSpacing:.6,marginBottom:6,marginLeft:2}}>{label}</div>
      {children}
    </div>
  );
}

function IcoInput({ ico, placeholder, value, onChange, type="text", id }) {
  const s = {
    width:"100%",padding:"13px 13px 13px 40px",borderRadius:12,
    border:"1.5px solid #edf2f7",background:"#f8fafc",fontSize:13,
    fontFamily:"inherit",outline:"none",color:"#112F5C",fontWeight:600,
    transition:"all .2s"
  };
  return (
    <div style={{position:"relative"}}>
      <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none"}}>{ico}</span>
      <input id={id} type={type} placeholder={placeholder} value={value}
        onChange={e=>onChange(e.target.value)}
        style={s}
        onFocus={e=>{e.target.style.borderColor="#00B5FF";e.target.style.background="#fff";e.target.style.boxShadow="0 0 0 3px rgba(0,181,255,.1)"}}
        onBlur={e=>{e.target.style.borderColor="#edf2f7";e.target.style.background="#f8fafc";e.target.style.boxShadow="none"}}/>
    </div>
  );
}

function Btn({ children, onClick, dark, outline, flex2, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: flex2 ? 2 : undefined,width:flex2?undefined:"100%",
      padding:15,borderRadius:14,border:outline?"1.5px solid #edf2f7":"none",
      cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:800,
      fontFamily:"Montserrat,sans-serif",letterSpacing:.3,
      display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s",
      background:outline?"transparent":dark?"#112F5C":"#00B5FF",
      color:outline?"#112F5C":"#fff",opacity:disabled?.5:1
    }}>{children}</button>
  );
}
