"use client";
import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { supabase }            from "@/lib/supabase";

const fmtEur = (n) => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n||0);

/* ─── STAT CARD ─────────────────────────────────────────────── */
function StatCard({ label, value, color="#112F5C", sub }) {
  return (
    <div style={{background:"#fff",border:"1.5px solid #edf2f7",borderRadius:14,padding:14}}>
      <div style={{fontSize:9,fontWeight:800,color:"#8898aa",textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
      <div style={{fontSize:22,fontWeight:900,color,marginTop:4}}>{value}</div>
      {sub && <div style={{fontSize:10,color:"#8898aa",marginTop:2}}>{sub}</div>}
    </div>
  );
}

/* ─── LIQUIDACIÓN CONDUCTOR ─────────────────────────────────── */
function LiqConductor({ c }) {
  return (
    <div style={{border:"1.5px solid #edf2f7",borderRadius:10,overflow:"hidden",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f8fafc",borderBottom:"1px solid #edf2f7"}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#112F5C,#00B5FF)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14}}>
          {c.conductor_nombre?.[0]||"?"}
        </div>
        <div style={{flex:1,fontSize:13,fontWeight:800,color:"#112F5C"}}>{c.conductor_nombre}</div>
        <div style={{fontSize:16,fontWeight:900,color:"#22c78b"}}>{fmtEur(c.total_facturado)}</div>
      </div>
      <div style={{padding:"10px 14px"}}>
        {[
          ["🚗 Viajes",       c.total_viajes,          "#112F5C"],
          ["💵 Efectivo",     fmtEur(c.total_efectivo), "#22c78b"],
          ["💳 Tarjeta",      fmtEur(c.total_tarjeta),  "#00B5FF"],
          ["📱 Bizum",        fmtEur(c.total_bizum),    "#7A5FFF"],
          ["🏦 Transferencia",fmtEur(c.total_transferencia),"#FF8C42"],
          ["📍 Km recorridos",c.total_km?.toFixed(1)+" km","#8898aa"],
        ].map(([lbl,val,clr])=>(
          <div key={lbl} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f0f4f8"}}>
            <span style={{fontSize:11,fontWeight:600,color:"#8898aa"}}>{lbl}</span>
            <span style={{fontSize:13,fontWeight:800,color:clr}}>{val}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:4,borderTop:"2px solid #edf2f7"}}>
          <span style={{fontSize:12,fontWeight:800,color:"#112F5C"}}>TOTAL A LIQUIDAR</span>
          <span style={{fontSize:17,fontWeight:900,color:"#22c78b"}}>{fmtEur(c.total_facturado)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN ADMIN PAGE ────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const [tab,       setTab]       = useState("resumen");
  const [mes,       setMes]       = useState(new Date().toISOString().slice(0,7));
  const [resumen,   setResumen]   = useState(null);
  const [viajes,    setViajes]    = useState([]);
  const [conductores,setConds]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [filtroPago,setFiltroPago]= useState("");
  const [pinModal,  setPinModal]  = useState(null); // {id, nombre}
  const [nuevoPin,  setNuevoPin]  = useState("");
  const [confPin,   setConfPin]   = useState("");
  const [viajeModal,setViajeModal]= useState(null);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg,tipo="") => { setToast({msg,tipo}); setTimeout(()=>setToast(null),2800); };

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/admin/login");
    });
  }, []);

  // Carga inicial
  useEffect(() => { cargarResumen(); cargarConductores(); }, []);
  useEffect(() => { if (tab==="viajes") cargarViajes(); }, [tab, mes, filtroPago]);

  async function cargarResumen() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/resumen?mes=${mes}`);
      const d = await r.json();
      setResumen(d);
    } catch(e) { showToast("Error cargando resumen","err"); }
    finally { setLoading(false); }
  }

  async function cargarViajes() {
    try {
      const r = await fetch(`/api/viajes?mes=${mes}`);
      const d = await r.json();
      setViajes(d.viajes||[]);
    } catch(e) { console.error(e); }
  }

  async function cargarConductores() {
    try {
      const r = await fetch("/api/conductores");
      const d = await r.json();
      setConds(d.conductores||[]);
    } catch(e) { console.error(e); }
  }

  async function guardarPin() {
    if (!/^[0-9]{4}$/.test(nuevoPin))     { showToast("PIN debe ser 4 dígitos","err"); return; }
    if (nuevoPin !== confPin)              { showToast("Los PINs no coinciden","err"); return; }
    try {
      const r = await fetch("/api/conductores",{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ conductor_id: pinModal.id, nuevo_pin: nuevoPin }),
      });
      const d = await r.json();
      if (!r.ok) { showToast(d.error||"Error","err"); return; }
      setPinModal(null); setNuevoPin(""); setConfPin("");
      showToast(`✅ PIN de ${pinModal.nombre} actualizado`,"ok");
    } catch(e) { showToast("Error","err"); }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/inicio");
  }

  function exportarCSV() {
    const rows = [
      ["Código","Conductor","Origen","Destino","Precio","Pago","Estado","RVTC","Fecha"],
      ...viajes.map(v=>[
        v.codigo_viaje, v.conductor_nombre,
        v.direccion_origen, v.direccion_destino,
        v.precio_final, v.forma_pago, v.estado,
        v.estado_ministerio, v.fecha_reserva
      ])
    ];
    const csv = rows.map(r=>r.map(x=>JSON.stringify(x)).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);
    a.download = `vtc-viajes-${mes}.csv`;
    a.click();
    showToast("📊 CSV exportado","ok");
  }

  // Mes selector
  const meses = Array.from({length:6},(_,i)=>{
    const d = new Date(new Date().getFullYear(), new Date().getMonth()-i, 1);
    return { value: d.toISOString().slice(0,7),
             label: d.toLocaleString("es-ES",{month:"long",year:"numeric"}) };
  });

  const viajesFiltrados = viajes.filter(v =>
    (!search || [v.codigo_viaje,v.conductor_nombre,v.direccion_origen,v.direccion_destino].some(x=>x?.toLowerCase().includes(search.toLowerCase()))) &&
    (!filtroPago || v.forma_pago === filtroPago)
  );

  const badgePago = { EFECTIVO:"#22c78b", TARJETA:"#00B5FF", BIZUM:"#7A5FFF", TRANSFERENCIA:"#FF8C42" };
  const badgeMin  = { COMUNICADO:"#22c78b", PENDIENTE_MANUAL:"#FF8C42", PENDIENTE:"#8898aa" };

  /* ── SHELL ── */
  const shell = {
    width:"100%",maxWidth:420,background:"#fff",borderRadius:36,overflow:"hidden",
    boxShadow:"0 0 0 9px #0c1e3a,0 0 0 11px #1a3566,0 50px 100px rgba(0,0,0,.6)",
    display:"flex",flexDirection:"column",minHeight:820,fontFamily:"Montserrat,sans-serif"
  };

  return (
    <div style={{display:"flex",justifyContent:"center",padding:"32px 16px",minHeight:"100vh"}}>
    <div style={shell}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#112F5C,#1a3a6b)",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:16,fontWeight:900,color:"#fff"}}><span style={{color:"#00B5FF"}}>VTC</span> Admin Panel</div>
        <button onClick={logout} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:11,fontWeight:700,padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit"}}>
          Salir 🚪
        </button>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:4,padding:"10px 14px",background:"#f8fafc",borderBottom:"1.5px solid #edf2f7"}}>
        {[["resumen","📊 Resumen"],["viajes","🚗 Viajes"],["pines","🔐 PINs"]].map(([k,lbl])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            flex:1,padding:9,borderRadius:10,border:"none",fontFamily:"Montserrat,sans-serif",
            fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .2s",
            background: tab===k?"#fff":"transparent",
            color: tab===k?"#112F5C":"#8898aa",
            boxShadow: tab===k?"0 2px 8px rgba(17,47,92,.1)":"none"
          }}>{lbl}</button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{flex:1,overflowY:"auto",padding:16}}>

        {/* ── TAB RESUMEN ── */}
        {tab==="resumen" && (
          <div>
            {/* Selector mes */}
            <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
              <select value={mes} onChange={e=>{setMes(e.target.value);}}
                style={{flex:1,padding:"10px 14px",border:"1.5px solid #edf2f7",borderRadius:10,fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:700,color:"#112F5C",outline:"none"}}>
                {meses.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <button onClick={cargarResumen} style={{padding:"10px 14px",borderRadius:10,border:"none",background:"#00B5FF",color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:800,cursor:"pointer"}}>
                🔄
              </button>
            </div>

            {/* Stats globales */}
            {resumen && (
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  <StatCard label="Total Viajes"     value={resumen.totales?.total_viajes||0}                color="#00B5FF"/>
                  <StatCard label="Facturación Total" value={fmtEur(resumen.totales?.total_facturado)}       color="#22c78b"/>
                  <StatCard label="💵 Total Efectivo" value={fmtEur(resumen.totales?.total_efectivo)}        color="#22c78b"/>
                  <StatCard label="💳 Total Tarjeta"  value={fmtEur(resumen.totales?.total_tarjeta)}         color="#00B5FF"/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  <StatCard label="📱 Bizum"          value={fmtEur(resumen.totales?.total_bizum)}           color="#7A5FFF"/>
                  <StatCard label="📍 Km Totales"     value={(resumen.totales?.total_km||0).toFixed(1)+" km"} color="#8898aa"/>
                </div>

                {/* Alerta ministerio */}
                {(resumen.pendientesMinisterio||0) > 0 && (
                  <div style={{background:"rgba(255,140,66,.1)",border:"1.5px solid rgba(255,140,66,.4)",borderRadius:12,padding:14,marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:800,color:"#FF8C42",marginBottom:4}}>
                      ⚠️ {resumen.pendientesMinisterio} viaje(s) pendientes en RVTC
                    </div>
                    <div style={{fontSize:10,color:"#8898aa"}}>
                      Registrar manualmente en{" "}
                      <a href="https://sede.fomento.gob.es/RegistroVTC/" target="_blank" rel="noopener noreferrer" style={{color:"#00B5FF"}}>
                        sede.fomento.gob.es/RegistroVTC/
                      </a>
                    </div>
                  </div>
                )}

                {/* Liquidación por conductor */}
                <div style={{fontSize:13,fontWeight:800,color:"#112F5C",marginBottom:12}}>
                  Liquidación por Conductor
                </div>
                {(resumen.porConductor||[]).map(c=><LiqConductor key={c.conductor_id} c={c}/>)}
                {!(resumen.porConductor||[]).length && (
                  <div style={{textAlign:"center",padding:24,color:"#8898aa",fontSize:12}}>Sin viajes este mes</div>
                )}
              </>
            )}

            {loading && <div style={{textAlign:"center",padding:24,color:"#8898aa",fontSize:12}}>⏳ Cargando...</div>}
          </div>
        )}

        {/* ── TAB VIAJES ── */}
        {tab==="viajes" && (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar viaje, conductor..."
                style={{flex:1,padding:"10px 14px",border:"1.5px solid #edf2f7",borderRadius:10,fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:600,color:"#112F5C",outline:"none"}}/>
              <select value={filtroPago} onChange={e=>setFiltroPago(e.target.value)}
                style={{padding:"10px 10px",border:"1.5px solid #edf2f7",borderRadius:10,fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:700,color:"#112F5C",outline:"none"}}>
                <option value="">Todos</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="BIZUM">Bizum</option>
              </select>
              <button onClick={exportarCSV} style={{padding:"10px 12px",borderRadius:10,border:"none",background:"#22c78b",color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:800,cursor:"pointer"}}>⬇</button>
            </div>

            <div style={{background:"#fff",border:"1.5px solid #edf2f7",borderRadius:14,overflow:"hidden"}}>
              {/* Cabecera */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:8,padding:"10px 14px",background:"#f8fafc",borderBottom:"1.5px solid #edf2f7"}}>
                {["CÓDIGO","RUTA","PAGO","PRECIO"].map(h=>(
                  <div key={h} style={{fontSize:9,fontWeight:800,color:"#8898aa",textTransform:"uppercase",letterSpacing:.5}}>{h}</div>
                ))}
              </div>
              {/* Filas */}
              {viajesFiltrados.length === 0 && (
                <div style={{textAlign:"center",padding:24,color:"#8898aa",fontSize:12}}>Sin viajes</div>
              )}
              {viajesFiltrados.map(v=>(
                <div key={v.id} onClick={()=>setViajeModal(v)}
                  style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:8,padding:"12px 14px",borderBottom:"1px solid #edf2f7",alignItems:"center",cursor:"pointer",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <div>
                    <div style={{fontSize:9,fontFamily:"monospace",fontWeight:700,color:"#112F5C"}}>{v.codigo_viaje}</div>
                    <span style={{display:"inline-block",marginTop:3,padding:"1px 6px",borderRadius:20,fontSize:8,fontWeight:800,background:badgeMin[v.estado_ministerio]+"25",color:badgeMin[v.estado_ministerio]||"#8898aa"}}>
                      {v.estado_ministerio==="COMUNICADO"?"✓ RVTC":v.estado_ministerio==="PENDIENTE_MANUAL"?"⚠️ Manual":"⏳"}
                    </span>
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:"#112F5C",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.direccion_destino}</div>
                    <div style={{fontSize:9,color:"#8898aa"}}>{v.conductor_nombre}</div>
                  </div>
                  <div>
                    <span style={{display:"inline-block",padding:"2px 7px",borderRadius:20,fontSize:8,fontWeight:800,background:badgePago[v.forma_pago]+"22",color:badgePago[v.forma_pago]||"#8898aa"}}>
                      {v.forma_pago}
                    </span>
                  </div>
                  <div style={{fontSize:13,fontWeight:800,color:"#112F5C",textAlign:"right"}}>{fmtEur(v.precio_final)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB PINs ── */}
        {tab==="pines" && (
          <div>
            <div style={{fontSize:13,fontWeight:800,color:"#112F5C",marginBottom:6}}>Gestión de PINs</div>
            <div style={{fontSize:11,color:"#8898aa",marginBottom:16}}>
              Solo el administrador puede cambiar el PIN de cada conductor.
            </div>
            <div style={{background:"#fff",border:"1.5px solid #edf2f7",borderRadius:14,overflow:"hidden"}}>
              {conductores.length===0 && (
                <div style={{textAlign:"center",padding:24,color:"#8898aa",fontSize:12}}>Cargando conductores...</div>
              )}
              {conductores.map((c,i)=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:i<conductores.length-1?"1px solid #edf2f7":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#112F5C,#00B5FF)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14}}>
                      {c.nombre?.[0]||"?"}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#112F5C"}}>{c.nombre}</div>
                      <div style={{fontSize:10,color:"#8898aa"}}>PIN: ••••  ·  {c.total_viajes||0} viajes</div>
                    </div>
                  </div>
                  <button onClick={()=>setPinModal({id:c.id,nombre:c.nombre})}
                    style={{background:"#f8fafc",border:"1.5px solid #edf2f7",color:"#112F5C",fontFamily:"Montserrat,sans-serif",fontSize:11,fontWeight:700,padding:"7px 14px",borderRadius:8,cursor:"pointer",transition:"all .2s"}}>
                    🔑 Cambiar PIN
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>

    {/* ── MODAL: CAMBIAR PIN ── */}
    {pinModal && (
      <div style={{position:"fixed",inset:0,background:"rgba(7,21,40,.7)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}}>
        <div style={{background:"#fff",borderRadius:"20px 20px 16px 16px",padding:24,width:"100%",maxWidth:400,animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)",fontFamily:"Montserrat,sans-serif"}}>
          <div style={{fontSize:16,fontWeight:900,color:"#112F5C",marginBottom:4}}>🔐 Cambiar PIN</div>
          <div style={{fontSize:12,color:"#8898aa",marginBottom:20}}>Conductor: <strong>{pinModal.nombre}</strong></div>
          {[
            ["NUEVO PIN (4 dígitos)", nuevoPin, setNuevoPin],
            ["CONFIRMAR PIN",         confPin,  setConfPin],
          ].map(([lbl,val,setter])=>(
            <div key={lbl} style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:"#8898aa",letterSpacing:.6,marginBottom:6}}>{lbl}</div>
              <input type="password" maxLength={4} placeholder="••••" value={val} onChange={e=>setter(e.target.value.replace(/\D/g,"").slice(0,4))}
                style={{width:"100%",padding:"13px 14px",borderRadius:12,border:"1.5px solid #edf2f7",background:"#f8fafc",fontSize:18,fontWeight:800,letterSpacing:8,fontFamily:"Montserrat,sans-serif",outline:"none",color:"#112F5C",textAlign:"center"}}/>
            </div>
          ))}
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={guardarPin} style={{flex:2,padding:14,borderRadius:12,border:"none",background:"#112F5C",color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:13,fontWeight:800,cursor:"pointer"}}>
              Guardar PIN
            </button>
            <button onClick={()=>{setPinModal(null);setNuevoPin("");setConfPin("");}} style={{flex:1,padding:14,borderRadius:12,border:"1.5px solid #edf2f7",background:"transparent",color:"#112F5C",fontFamily:"Montserrat,sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── MODAL: DETALLE VIAJE ── */}
    {viajeModal && (
      <div style={{position:"fixed",inset:0,background:"rgba(7,21,40,.7)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}} onClick={()=>setViajeModal(null)}>
        <div style={{background:"#fff",borderRadius:"20px 20px 16px 16px",padding:24,width:"100%",maxWidth:400,fontFamily:"Montserrat,sans-serif",maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:15,fontWeight:900,color:"#112F5C",marginBottom:2}}>{viajeModal.codigo_viaje}</div>
          <div style={{fontSize:11,color:"#8898aa",marginBottom:16}}>{viajeModal.conductor_nombre} · {new Date(viajeModal.fecha_reserva).toLocaleString("es-ES")}</div>
          {[
            ["Origen",       viajeModal.direccion_origen],
            ["Destino",      viajeModal.direccion_destino],
            ["Precio",       fmtEur(viajeModal.precio_final)],
            ["Forma de pago",viajeModal.forma_pago],
            ["Estado RVTC",  viajeModal.estado_ministerio],
            ["Cod. Ministerio", viajeModal.codigo_ministerio||"—"],
          ].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #edf2f7",fontSize:12}}>
              <span style={{color:"#8898aa",fontWeight:600}}>{l}</span>
              <strong style={{color:"#112F5C",maxWidth:"60%",textAlign:"right",wordBreak:"break-word"}}>{v}</strong>
            </div>
          ))}
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <a href={`/api/hoja-ruta/${viajeModal.codigo_viaje}`} target="_blank" rel="noopener noreferrer" style={{flex:2,textDecoration:"none"}}>
              <button style={{width:"100%",padding:13,borderRadius:12,border:"none",background:"#00B5FF",color:"#fff",fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                📄 Hoja de Ruta
              </button>
            </a>
            <button onClick={()=>setViajeModal(null)} style={{flex:1,padding:13,borderRadius:12,border:"1.5px solid #edf2f7",background:"transparent",color:"#112F5C",fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              Cerrar
            </button>
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
