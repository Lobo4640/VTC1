"use client";
import { useState, useEffect } from "react";

const fmtEur = (n) => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n||0);

export default function ConductorPage() {
  const [fase,          setFase]     = useState("seleccionar"); // seleccionar | pin | dashboard
  const [conductores,   setConds]    = useState([]);
  const [seleccionado,  setSel]      = useState(null);
  const [pinBuffer,     setPinBuf]   = useState("");
  const [pinError,      setPinError] = useState("");
  const [autenticado,   setAuth]     = useState(null);  // { id, nombre }
  const [viajes,        setViajes]   = useState([]);
  const [viajeActivo,   setActivo]   = useState(null);
  const [qrModal,       setQrModal]  = useState(false);
  const [toast,         setToast]    = useState(null);

  const showToast = (msg,tipo="") => { setToast({msg,tipo}); setTimeout(()=>setToast(null),2800); };

  useEffect(() => { cargarConductores(); }, []);
  useEffect(() => { if (autenticado) cargarViajesConductor(); }, [autenticado]);

  async function cargarConductores() {
    try {
      const r = await fetch("/api/conductores");
      const d = await r.json();
      setConds(d.conductores||[]);
    } catch(e) { console.error(e); }
  }

  function seleccionarConductor(c) {
    setSel(c); setPinBuf(""); setPinError(""); setFase("pin");
  }

  function presionarNumpad(key) {
    if (key === "⌫") {
      setPinBuf(p => p.slice(0,-1));
    } else if (pinBuffer.length < 4) {
      const nuevo = pinBuffer + key;
      setPinBuf(nuevo);
      if (nuevo.length === 4) verificarPin(nuevo);
    }
  }

  async function verificarPin(pin) {
    setPinError("");
    try {
      const r = await fetch("/api/conductores",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ conductor_id: seleccionado.id, pin }),
      });
      const d = await r.json();
      if (r.ok && d.autenticado) {
        setAuth(d.conductor);
        setFase("dashboard");
        showToast(`✅ Bienvenido, ${d.conductor.nombre}`,"ok");
      } else {
        setPinBuf(""); setPinError("❌ PIN incorrecto. Inténtalo de nuevo.");
        setTimeout(()=>setPinError(""),2000);
      }
    } catch(e) { setPinBuf(""); setPinError("Error de conexión"); }
  }

  async function cargarViajesConductor() {
    try {
      const r = await fetch(`/api/viajes?conductor=${autenticado.id}`);
      const d = await r.json();
      setViajes(d.viajes||[]);
    } catch(e) { console.error(e); }
  }

  function logout() {
    setAuth(null); setSel(null); setPinBuf(""); setFase("seleccionar");
  }

  const qrUrl = viajeActivo
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `${window.location.origin}/verificar/${viajeActivo.codigo_viaje}`
      )}`
    : null;

  const shell = {
    width:"100%",maxWidth:420,background:"#fff",borderRadius:36,overflow:"hidden",
    boxShadow:"0 0 0 9px #0c1e3a,0 0 0 11px #1a3566,0 50px 100px rgba(0,0,0,.6)",
    display:"flex",flexDirection:"column",minHeight:820,fontFamily:"Montserrat,sans-serif"
  };

  return (
    <div style={{display:"flex",justifyContent:"center",padding:"32px 16px",minHeight:"100vh"}}>
    <div style={shell}>

      {/* ── FASE: SELECCIONAR CONDUCTOR ── */}
      {fase==="seleccionar" && (
        <>
          <div style={{background:"linear-gradient(135deg,#112F5C,#1a3a6b)",padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:"#fff"}}><span style={{color:"#00B5FF"}}>VTC</span> Conductor</div>
              <a href="/inicio" style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:11,fontWeight:700,padding:"6px 12px",borderRadius:20,textDecoration:"none"}}>← Volver</a>
            </div>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",gap:20}}>
            <div style={{fontSize:36}}>🚗</div>
            <div style={{fontSize:20,fontWeight:900,color:"#112F5C",textAlign:"center"}}>¿Quién eres?</div>
            <div style={{fontSize:12,color:"#8898aa"}}>Selecciona tu nombre</div>
            <div style={{width:"100%",display:"flex",flexDirection:"column",gap:10}}>
              {conductores.map(c=>(
                <button key={c.id} onClick={()=>seleccionarConductor(c)}
                  style={{width:"100%",padding:16,border:"2px solid #edf2f7",borderRadius:14,background:"#fff",fontFamily:"Montserrat,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .2s",textAlign:"left"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#112F5C,#00B5FF)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18,flexShrink:0}}>
                    {c.nombre?.[0]||"?"}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#112F5C"}}>{c.nombre}</div>
                    <div style={{fontSize:11,color:"#8898aa"}}>Conductor VTC · {c.total_viajes||0} viajes</div>
                  </div>
                </button>
              ))}
              {conductores.length===0 && <div style={{textAlign:"center",color:"#8898aa",fontSize:12}}>⏳ Cargando conductores...</div>}
            </div>
          </div>
        </>
      )}

      {/* ── FASE: PIN ── */}
      {fase==="pin" && (
        <>
          <div style={{background:"linear-gradient(135deg,#112F5C,#1a3a6b)",padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:"#fff"}}><span style={{color:"#00B5FF"}}>VTC</span> PIN</div>
              <button onClick={()=>setFase("seleccionar")} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:11,fontWeight:700,padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit"}}>← Cambiar</button>
            </div>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",gap:16}}>
            {/* Avatar */}
            <div style={{width:60,height:60,borderRadius:"50%",background:"linear-gradient(135deg,#112F5C,#00B5FF)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:24}}>
              {seleccionado?.nombre?.[0]||"?"}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:"#112F5C"}}>{seleccionado?.nombre}</div>
            <div style={{fontSize:12,color:"#8898aa"}}>Introduce tu PIN de 4 dígitos</div>

            {/* Dots */}
            <div style={{display:"flex",gap:14}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${i<pinBuffer.length?(pinError?"#ff4d4d":"#112F5C"):"#edf2f7"}`,background:i<pinBuffer.length?(pinError?"#ff4d4d":"#112F5C"):"transparent",transition:"all .2s"}}/>
              ))}
            </div>
            {pinError && <div style={{color:"#ff4d4d",fontSize:12,fontWeight:700}}>{pinError}</div>}
            {!pinError && <div style={{minHeight:18}}/>}

            {/* Numpad */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,width:"100%",maxWidth:260}}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i)=>{
                if (!k) return <div key={i}/>;
                return (
                  <button key={k} onClick={()=>presionarNumpad(k)}
                    style={{aspectRatio:"1",borderRadius:"50%",border:"1.5px solid #edf2f7",background:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:k==="⌫"?16:20,fontWeight:700,cursor:"pointer",transition:"all .15s",color:k==="⌫"?"#8898aa":"#112F5C",display:"flex",alignItems:"center",justifyContent:"center"}}
                    onMouseDown={e=>e.currentTarget.style.transform="scale(.92)"}
                    onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── FASE: DASHBOARD CONDUCTOR ── */}
      {fase==="dashboard" && autenticado && (
        <>
          <div style={{background:"linear-gradient(135deg,#112F5C,#1a3a6b)",padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:20,fontWeight:900,color:"#fff"}}><span style={{color:"#00B5FF"}}>VTC</span> Madrid</div>
                <div style={{color:"rgba(255,255,255,.7)",fontSize:11,marginTop:2}}>{autenticado.nombre}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <a href="/reservar" style={{background:"rgba(0,181,255,.2)",border:"1px solid rgba(0,181,255,.3)",color:"#00B5FF",fontSize:11,fontWeight:700,padding:"6px 12px",borderRadius:20,textDecoration:"none"}}>+ Reserva</a>
                <button onClick={logout} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:11,fontWeight:700,padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit"}}>Salir</button>
              </div>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:16}}>

            {/* Viaje activo */}
            {viajeActivo && (
              <div style={{background:"linear-gradient(135deg,rgba(34,199,139,.12),rgba(34,199,139,.05))",border:"2px solid #22c78b",borderRadius:16,padding:16,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:800,color:"#22c78b",marginBottom:10}}>🟢 Viaje en curso</div>
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",gap:8,marginBottom:6}}><span style={{width:8,height:8,borderRadius:"50%",background:"#22c78b",marginTop:4,flexShrink:0,display:"inline-block"}}/>
                    <div><div style={{fontSize:12,fontWeight:600,color:"#112F5C"}}>{viajeActivo.direccion_origen}</div><div style={{fontSize:9,color:"#8898aa"}}>Origen</div></div>
                  </div>
                  <div style={{display:"flex",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:"#ff4d4d",marginTop:4,flexShrink:0,display:"inline-block"}}/>
                    <div><div style={{fontSize:12,fontWeight:600,color:"#112F5C"}}>{viajeActivo.direccion_destino}</div><div style={{fontSize:9,color:"#8898aa"}}>Destino</div></div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{ setActivo(null); showToast("✅ Viaje finalizado","ok"); }} style={{flex:1,padding:10,borderRadius:10,border:"none",background:"#22c78b",color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:800,cursor:"pointer"}}>✓ Finalizar</button>
                  <button onClick={()=>setActivo(null)} style={{padding:"10px 14px",borderRadius:10,border:"1.5px solid #edf2f7",background:"transparent",color:"#8898aa",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
                </div>
              </div>
            )}

            {/* ⭐ BOTÓN GIGANTE QR INSPECCIÓN */}
            <button onClick={()=>setQrModal(true)} style={{
              width:"100%",padding:20,borderRadius:18,border:"none",
              background:"linear-gradient(135deg,#112F5C,#1a3a6b)",color:"#fff",
              fontFamily:"Montserrat,sans-serif",fontSize:14,fontWeight:900,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:12,
              transition:"all .2s",boxShadow:"0 4px 20px rgba(17,47,92,.3)",
              letterSpacing:.3,marginBottom:16,
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(17,47,92,.4)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 4px 20px rgba(17,47,92,.3)"}}>
              <span style={{fontSize:26}}>▣</span>
              VER QR PARA INSPECCIÓN
            </button>

            {/* Stats hoy */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <div style={{background:"#fff",border:"1.5px solid #edf2f7",borderRadius:14,padding:14}}>
                <div style={{fontSize:9,fontWeight:800,color:"#8898aa",textTransform:"uppercase"}}>Viajes hoy</div>
                <div style={{fontSize:22,fontWeight:900,color:"#00B5FF",marginTop:4}}>
                  {viajes.filter(v=>new Date(v.fecha_reserva).toDateString()===new Date().toDateString()).length}
                </div>
              </div>
              <div style={{background:"#fff",border:"1.5px solid #edf2f7",borderRadius:14,padding:14}}>
                <div style={{fontSize:9,fontWeight:800,color:"#8898aa",textTransform:"uppercase"}}>Facturado hoy</div>
                <div style={{fontSize:22,fontWeight:900,color:"#22c78b",marginTop:4}}>
                  {fmtEur(viajes.filter(v=>new Date(v.fecha_reserva).toDateString()===new Date().toDateString()).reduce((a,v)=>a+(parseFloat(v.precio_final)||0),0))}
                </div>
              </div>
            </div>

            {/* Últimos viajes */}
            <div style={{fontSize:13,fontWeight:800,color:"#112F5C",marginBottom:12}}>Últimos viajes</div>
            <div style={{background:"#fff",border:"1.5px solid #edf2f7",borderRadius:14,overflow:"hidden"}}>
              {viajes.slice(0,10).map((v,i)=>(
                <div key={v.id} style={{padding:"12px 14px",borderBottom:i<viajes.length-1?"1px solid #edf2f7":"none",cursor:"pointer"}}
                  onClick={()=>window.open(`/api/hoja-ruta/${v.codigo_viaje}`,"_blank")}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div style={{fontSize:9,fontFamily:"monospace",fontWeight:700,color:"#8898aa"}}>{v.codigo_viaje}</div>
                    <div style={{fontSize:13,fontWeight:800,color:"#112F5C"}}>{fmtEur(v.precio_final)}</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:"#112F5C",marginBottom:2}}>{v.direccion_destino}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:9,color:"#8898aa"}}>{v.direccion_origen}</div>
                    <span style={{display:"inline-block",padding:"1px 7px",borderRadius:20,fontSize:8,fontWeight:800,
                      background:v.forma_pago==="EFECTIVO"?"#22c78b22":v.forma_pago==="TARJETA"?"#00B5FF22":"#7A5FFF22",
                      color:v.forma_pago==="EFECTIVO"?"#22c78b":v.forma_pago==="TARJETA"?"#00B5FF":"#7A5FFF"}}>
                      {v.forma_pago}
                    </span>
                  </div>
                </div>
              ))}
              {viajes.length===0 && <div style={{textAlign:"center",padding:24,color:"#8898aa",fontSize:12}}>Sin viajes registrados</div>}
            </div>
          </div>
        </>
      )}

    </div>

    {/* ── MODAL QR INSPECCIÓN ── */}
    {qrModal && (
      <div style={{position:"fixed",inset:0,background:"rgba(7,21,40,.92)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setQrModal(false)}>
        <div style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:360,fontFamily:"Montserrat,sans-serif",animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)"}} onClick={e=>e.stopPropagation()}>
          {/* Header oficial */}
          <div style={{background:"#112F5C",color:"#fff",padding:14,borderRadius:"14px 14px 0 0",margin:"-24px -24px 20px",textAlign:"center"}}>
            <div style={{fontSize:9,letterSpacing:2,color:"rgba(255,255,255,.6)",fontWeight:800}}>DOCUMENTO OFICIAL</div>
            <div style={{fontSize:16,fontWeight:900,marginTop:4}}>HOJA DE RUTA DIGITAL</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.6)",marginTop:2}}>VTC Madrid</div>
          </div>

          {/* QR */}
          <div style={{textAlign:"center",marginBottom:16}}>
            {viajeActivo && qrUrl ? (
              <img src={qrUrl} alt="QR" width={180} height={180} style={{border:"3px solid #112F5C",borderRadius:12}}/>
            ) : (
              <div style={{width:180,height:180,border:"3px solid #edf2f7",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",background:"#f8fafc"}}>
                <div style={{textAlign:"center",color:"#8898aa"}}>
                  <div style={{fontSize:32,marginBottom:8}}>▣</div>
                  <div style={{fontSize:11,fontWeight:600}}>Sin viaje activo</div>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:16,fontSize:12}}>
            {[
              ["Conductor",     autenticado?.nombre||"—"],
              ["Último viaje",  viajeActivo?.codigo_viaje||viajes[0]?.codigo_viaje||"—"],
              ["Licencia VTC",  "VTC-M-0001"],
              ["Estado RVTC",   viajeActivo?.estado_ministerio==="COMUNICADO"||viajes[0]?.estado_ministerio==="COMUNICADO"?"✓ Registrado":"⏳ Pendiente"],
            ].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #edf2f7"}}>
                <span style={{color:"#8898aa",fontWeight:600}}>{l}</span>
                <strong style={{color:"#112F5C"}}>{v}</strong>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:10}}>
            {(viajeActivo||viajes[0]) && (
              <a href={`/api/hoja-ruta/${(viajeActivo||viajes[0]).codigo_viaje}`} target="_blank" rel="noopener noreferrer" style={{flex:2,textDecoration:"none"}}>
                <button style={{width:"100%",padding:13,borderRadius:12,border:"none",background:"#112F5C",color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:800,cursor:"pointer"}}>📄 Contrato Completo</button>
              </a>
            )}
            <button onClick={()=>setQrModal(false)} style={{flex:1,padding:13,borderRadius:12,border:"1.5px solid #edf2f7",background:"transparent",color:"#112F5C",fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cerrar</button>
          </div>
        </div>
      </div>
    )}

    {/* TOAST */}
    {toast && (
      <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:toast.tipo==="err"?"#ff4d4d":toast.tipo==="ok"?"#22c78b":"#112F5C",color:"#fff",padding:"12px 20px",borderRadius:25,fontSize:12,fontWeight:700,zIndex:300,whiteSpace:"nowrap",fontFamily:"Montserrat,sans-serif"}}>
        {toast.msg}
      </div>
    )}
    </div>
  );
}
