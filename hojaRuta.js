/**
 * lib/hojaRuta.js — GENERADOR HOJA DE RUTA / CONTRATO DIGITAL
 * QR legal para inspecciones de tráfico
 */
import CFG from "@/config/vtc_setup";

const { DATOS_TITULAR: D, TARIFAS: T } = CFG;

export function generarHTMLHojaRuta(viaje) {
  const qrData = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_APP_URL || "https://vtc.vercel.app"}/verificar/${viaje.codigo_viaje}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}`;

  const fecha = (iso) => new Date(iso).toLocaleString("es-ES", {
    weekday:"long", day:"numeric", month:"long", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });

  const estadoBadge = viaje.estado_ministerio === "COMUNICADO"
    ? `<span style="background:#22c78b;color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">✓ REGISTRADO RVTC</span>`
    : `<span style="background:#ff8c42;color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">⚠️ PENDIENTE MANUAL</span>`;

  const conceptos = viaje.desglose_precio?.conceptos
    ?.map(c => `<tr><td>${c.concepto}</td><td style="text-align:right;font-family:monospace">${c.importe.toFixed(2)} €</td></tr>`)
    .join("") || "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hoja de Ruta — ${viaje.codigo_viaje}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Montserrat",sans-serif;background:#f8fafc;color:#112F5C;padding:20px}
.doc{max-width:700px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(17,47,92,.15)}
.header{background:linear-gradient(135deg,#112F5C,#1a3a6b);color:#fff;padding:24px 28px;display:flex;justify-content:space-between;align-items:flex-start}
.logo{font-size:24px;font-weight:900;letter-spacing:-.5px}.logo span{color:#00B5FF}
.header-right{text-align:right;font-size:11px;opacity:.8}
.titulo{background:#00B5FF;color:#fff;text-align:center;padding:10px;font-size:12px;font-weight:800;letter-spacing:2px}
.content{padding:24px 28px}
.ref-bar{background:#f0f7ff;border:1.5px solid #00B5FF;border-radius:10px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.ref-code{font-size:18px;font-weight:900;color:#112F5C;font-family:monospace}
.section{margin-bottom:18px;border:1px solid #edf2f7;border-radius:10px;overflow:hidden}
.section-title{background:#112F5C;color:#fff;padding:7px 14px;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}
.section-body{padding:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.campo-label{font-size:9px;font-weight:700;color:#8898aa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.campo-valor{font-size:13px;font-weight:600;color:#112F5C}
.campo-valor.mono{font-family:monospace;font-size:15px;font-weight:800}
table{width:100%;border-collapse:collapse;font-size:12px}
table th{background:#f8fafc;padding:6px 10px;text-align:left;font-weight:700;font-size:10px;color:#8898aa;border-bottom:1.5px solid #edf2f7}
table td{padding:6px 10px;border-bottom:1px solid #f0f4f8}
.total-row td{font-weight:800;font-size:14px;background:#f0f7ff;border-top:2px solid #112F5C}
.sello{display:inline-block;border:2px solid #00B5FF;color:#00B5FF;padding:4px 14px;font-size:9px;font-weight:800;letter-spacing:1px;border-radius:4px;margin-top:8px;text-transform:uppercase}
.qr-section{display:flex;gap:20px;align-items:center;margin-top:20px;padding:18px;background:#f0f7ff;border-radius:12px;border:1.5px solid #00B5FF}
.qr-info h3{font-size:13px;font-weight:800;color:#112F5C;margin-bottom:6px}
.qr-info p{font-size:10px;color:#8898aa;line-height:1.6}
.footer{background:#112F5C;color:rgba(255,255,255,.7);text-align:center;padding:12px;font-size:9px}
@media print{body{background:#fff;padding:0}.doc{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    <div>
      <div class="logo"><span>VTC</span> ${D.nombre}</div>
      <div style="font-size:11px;margin-top:4px;opacity:.8">CIF: ${D.nif} · Lic. ${D.licencia_vtc}</div>
      <div style="font-size:10px;opacity:.7;margin-top:2px">${D.direccion}</div>
    </div>
    <div class="header-right">
      <div style="font-size:10px;margin-bottom:4px">Emitido: ${new Date().toLocaleString("es-ES")}</div>
      ${estadoBadge}
      ${viaje.codigo_ministerio ? `<div style="font-size:10px;margin-top:4px">RVTC: <strong>${viaje.codigo_ministerio}</strong></div>` : ""}
    </div>
  </div>

  <div class="titulo">CONTRATO DE TRANSPORTE VTC — HOJA DE RUTA DIGITAL</div>

  <div class="content">
    <div class="ref-bar">
      <div><div class="campo-label">Código de Viaje</div><div class="ref-code">${viaje.codigo_viaje}</div></div>
      <div style="text-align:right"><div class="campo-label">Estado</div><div style="font-size:13px;font-weight:700;color:#22c78b">${viaje.estado}</div></div>
    </div>

    <div class="section">
      <div class="section-title">📍 Datos del Servicio</div>
      <div class="section-body">
        <div class="grid">
          <div><div class="campo-label">Origen</div><div class="campo-valor">${viaje.direccion_origen}</div></div>
          <div><div class="campo-label">Destino</div><div class="campo-valor">${viaje.direccion_destino}</div></div>
          <div><div class="campo-label">Fecha y Hora</div><div class="campo-valor">${viaje.fecha_inicio_servicio ? fecha(viaje.fecha_inicio_servicio) : "—"}</div></div>
          <div><div class="campo-label">Conductor</div><div class="campo-valor">${viaje.conductor_nombre}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🚗 Vehículo y Autorización</div>
      <div class="section-body">
        <div class="grid">
          <div><div class="campo-label">Matrícula</div><div class="campo-valor mono">${D.matricula}</div></div>
          <div><div class="campo-label">Vehículo</div><div class="campo-valor">${D.vehiculo_marca} ${D.vehiculo_modelo}</div></div>
          <div><div class="campo-label">Licencia VTC</div><div class="campo-valor mono">${D.licencia_vtc}</div></div>
          <div><div class="campo-label">Titular</div><div class="campo-valor">${D.nombre} (${D.nif})</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">💶 Precio Cerrado del Servicio</div>
      <div class="section-body">
        <table>
          <thead><tr><th>Concepto</th><th style="text-align:right">Importe</th></tr></thead>
          <tbody>
            ${conceptos}
            <tr><td style="color:#8898aa;font-style:italic">IVA (10%)</td><td style="text-align:right;font-family:monospace">${viaje.precio_iva?.toFixed(2) || "0.00"} €</td></tr>
          </tbody>
          <tfoot><tr class="total-row"><td>PRECIO TOTAL (IVA incluido)</td><td style="text-align:right;font-family:monospace">${viaje.precio_final?.toFixed(2)} €</td></tr></tfoot>
        </table>
        <div style="text-align:right;margin-top:10px">
          <div class="sello">⚖️ PRECIO CERRADO — ART. 7 RD 1057/2015</div>
        </div>
        <p style="font-size:9px;color:#8898aa;margin-top:8px">Forma de pago: <strong>${viaje.forma_pago}</strong>${viaje.fue_negociado ? " · Precio negociado entre las partes" : ""}</p>
      </div>
    </div>

    <div class="qr-section">
      <img src="${qrUrl}" width="120" height="120" alt="QR Verificación" style="border:2px solid #112F5C;border-radius:8px"/>
      <div class="qr-info">
        <h3>🔍 Verificación Digital — Válido ante Inspección</h3>
        <p>Este QR verifica la autenticidad del contrato y el estado de comunicación con el Registro de Servicios VTC del Ministerio de Transportes.</p>
        <p style="margin-top:6px;font-family:monospace;font-size:9px;color:#00B5FF">${process.env.NEXT_PUBLIC_APP_URL}/verificar/${viaje.codigo_viaje}</p>
      </div>
    </div>

    <div style="margin-top:14px;font-size:9px;color:#8898aa;line-height:1.6;border-top:1px solid #edf2f7;padding-top:12px">
      <strong>CLÁUSULAS LEGALES:</strong> Servicio de arrendamiento de vehículo con conductor al amparo de Lic. VTC ${D.licencia_vtc}. Precio cerrado conforme al Art. 7 RD 1057/2015. Servicio comunicado al RVTC del Ministerio de Transportes (RD 1076/2017). Precontratación mínima 15 min. (Art. 182bis LOTT). Tratamiento de datos: RGPD (UE) 2016/679 y LOPDGDD. Responsable: ${D.nombre} (${D.nif}).
    </div>
  </div>

  <div class="footer">${D.nombre} · ${D.licencia_vtc} · ${D.matricula} · Tel: ${D.telefono} · Código: ${viaje.codigo_viaje}</div>
</div>
</body>
</html>`;
}
