/**
 * lib/hojaRuta.js — GENERADOR DE HOJA DE RUTA DIGITAL
 * ─────────────────────────────────────────────────────
 * Genera el HTML del Contrato de Transporte VTC con QR legal.
 * Válido ante inspecciones de tráfico y control de transportes.
 *
 * Base: Art. 24 Orden FOM/36/2008 + RD 1076/2017
 */

// Datos del titular leídos de las variables de entorno
// (se sobreescriben con los valores reales de vtc_setup.js al importar)
const TITULAR = {
  nombre:    process.env.VTC_TITULAR_NOMBRE    || "VTC Madrid S.L.",
  nif:       process.env.VTC_TITULAR_NIF       || "B-XXXXXXXX",
  licencia:  process.env.VTC_LICENCIA_VTC      || "VTC-M-0001",
  matricula: process.env.VTC_MATRICULA         || "1234-ABC",
  marca:     process.env.VTC_VEHICULO_MARCA    || "Mercedes-Benz",
  modelo:    process.env.VTC_VEHICULO_MODELO   || "Clase E",
  telefono:  process.env.VTC_TELEFONO          || "+34 600 000 000",
  direccion: process.env.VTC_DIRECCION         || "Madrid, España",
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://vtc-madrid.vercel.app";

// ── HELPERS ─────────────────────────────────────────────────────
const fmtFechaLarga = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const fmtEur = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n ?? 0);

// ── BADGE DE ESTADO MINISTERIO ───────────────────────────────────
const buildEstadoBadge = (estadoMin) =>
  estadoMin === "COMUNICADO"
    ? `<span style="background:#0d4a32;color:#22c78b;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;border:1px solid rgba(34,199,139,.3)">✓ REGISTRADO RVTC</span>`
    : `<span style="background:#4a2500;color:#FF8C42;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;border:1px solid rgba(255,140,66,.3)">⚠️ PENDIENTE MANUAL</span>`;

// ── FILAS DEL DESGLOSE ───────────────────────────────────────────
const buildConceptoRows = (conceptos = []) =>
  conceptos
    .map(
      (c) => `
      <tr>
        <td style="padding:7px 12px;border-bottom:1px solid #1a2f4a;color:rgba(255,255,255,.8)">${c.concepto}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #1a2f4a;text-align:right;font-family:monospace;font-weight:700;color:#fff">${fmtEur(c.importe)}</td>
      </tr>`
    )
    .join("");

// ── GENERADOR PRINCIPAL ──────────────────────────────────────────
/**
 * @param {Object} viaje          - Fila completa de la tabla `viajes`
 * @param {Object} [titular]      - Override de los datos del titular (opcional)
 * @returns {string}              - HTML completo del contrato
 */
export function generarHTMLHojaRuta(viaje, titular = {}) {
  const T   = { ...TITULAR, ...titular };
  const qrData = `${APP_URL}/verificar/${viaje.codigo_viaje}`;
  const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&color=ffffff&bgcolor=071528&data=${encodeURIComponent(qrData)}`;

  const conceptos  = viaje.desglose_precio?.conceptos || [];
  const estadoBadge = buildEstadoBadge(viaje.estado_ministerio);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hoja de Ruta — ${viaje.codigo_viaje}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *  { box-sizing:border-box; margin:0; padding:0 }
    body {
      font-family:"Montserrat",sans-serif;
      background:#071528;
      color:#fff;
      padding:24px;
      min-height:100vh;
    }
    .doc {
      max-width:760px; margin:0 auto;
      background:#0d1f36;
      border-radius:18px;
      overflow:hidden;
      border:1px solid #1a2f4a;
      box-shadow:0 0 40px rgba(0,181,255,.08);
    }
    /* ── HEADER ── */
    .hdr {
      background:linear-gradient(135deg,#071528,#112F5C);
      padding:24px 28px;
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      border-bottom:1px solid rgba(0,181,255,.15);
    }
    .logo { font-size:22px; font-weight:900; color:#fff; letter-spacing:-.5px }
    .logo span { color:#00B5FF }
    .hdr-sub { font-size:11px; color:rgba(255,255,255,.55); margin-top:4px }
    /* ── TITLE BAR ── */
    .tit {
      background:linear-gradient(90deg,#00B5FF,#7A5FFF);
      text-align:center;
      padding:10px;
      font-size:11px;
      font-weight:800;
      color:#fff;
      letter-spacing:2.5px;
      text-transform:uppercase;
    }
    /* ── REF BAR ── */
    .ref-bar {
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:14px 28px;
      background:rgba(0,181,255,.06);
      border-bottom:1px solid #1a2f4a;
    }
    .ref-code { font-family:monospace; font-size:18px; font-weight:900; color:#00B5FF; letter-spacing:1px }
    /* ── CONTENIDO ── */
    .body { padding:24px 28px }
    .section {
      margin-bottom:18px;
      border:1px solid #1a2f4a;
      border-radius:12px;
      overflow:hidden;
    }
    .sec-title {
      background:rgba(0,181,255,.08);
      border-bottom:1px solid #1a2f4a;
      padding:8px 16px;
      font-size:10px;
      font-weight:800;
      letter-spacing:1.5px;
      text-transform:uppercase;
      color:#00B5FF;
    }
    .sec-body { padding:14px 16px }
    .grid-2  { display:grid; grid-template-columns:1fr 1fr; gap:12px }
    .lbl     { font-size:9px; font-weight:700; color:#8898aa; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px }
    .val     { font-size:13px; font-weight:600; color:#fff }
    .val-mono{ font-family:monospace; font-size:15px; font-weight:800; color:#00B5FF }
    /* ── TABLA PRECIO ── */
    table { width:100%; border-collapse:collapse; font-size:13px }
    th    { background:rgba(0,181,255,.06); padding:8px 12px; text-align:left; font-weight:700; font-size:10px; color:#8898aa; text-transform:uppercase; letter-spacing:.5px; border-bottom:1.5px solid #1a2f4a }
    .total-row td { font-weight:800; font-size:14px; background:rgba(0,181,255,.08); border-top:2px solid #00B5FF; padding:10px 12px; color:#fff }
    /* ── SELLO ── */
    .sello {
      display:inline-block;
      border:1.5px solid #00B5FF;
      color:#00B5FF;
      padding:4px 16px;
      font-size:9px;
      font-weight:800;
      letter-spacing:1.5px;
      border-radius:4px;
      text-transform:uppercase;
      margin-top:10px;
    }
    /* ── QR SECTION ── */
    .qr-section {
      display:flex;
      gap:20px;
      align-items:center;
      margin-top:20px;
      padding:20px;
      background:rgba(0,181,255,.05);
      border:1.5px solid rgba(0,181,255,.2);
      border-radius:14px;
    }
    .qr-img    { border:2px solid rgba(0,181,255,.4); border-radius:10px; flex-shrink:0 }
    .qr-info h3{ font-size:14px; font-weight:800; color:#fff; margin-bottom:8px }
    .qr-info p { font-size:10px; color:#8898aa; line-height:1.7 }
    .qr-url    { font-family:monospace; font-size:9px; color:#00B5FF; margin-top:8px; word-break:break-all }
    /* ── CLAUSULAS ── */
    .clausulas {
      margin-top:16px;
      font-size:9px;
      color:#8898aa;
      line-height:1.7;
      border-top:1px solid #1a2f4a;
      padding-top:14px;
    }
    /* ── FOOTER ── */
    .foot {
      background:rgba(0,0,0,.3);
      border-top:1px solid #1a2f4a;
      text-align:center;
      padding:12px;
      font-size:9px;
      color:rgba(255,255,255,.4);
    }
    /* Print */
    @media print {
      body     { background:#fff; padding:0 }
      .doc     { box-shadow:none; border-radius:0; border:none }
      .hdr     { background:linear-gradient(135deg,#071528,#112F5C) !important; -webkit-print-color-adjust:exact }
      .tit     { background:linear-gradient(90deg,#00B5FF,#7A5FFF) !important; -webkit-print-color-adjust:exact }
    }
  </style>
</head>
<body>
<div class="doc">

  <!-- HEADER -->
  <div class="hdr">
    <div>
      <div class="logo"><span>VTC</span> ${T.nombre}</div>
      <div class="hdr-sub">CIF: ${T.nif} &nbsp;·&nbsp; Lic. ${T.licencia}</div>
      <div class="hdr-sub" style="margin-top:2px">${T.direccion}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:rgba(255,255,255,.5);margin-bottom:6px">
        Emitido: ${new Date().toLocaleString("es-ES")}
      </div>
      ${estadoBadge}
      ${viaje.codigo_ministerio
        ? `<div style="font-size:10px;color:#8898aa;margin-top:6px">RVTC: <strong style="color:#fff">${viaje.codigo_ministerio}</strong></div>`
        : ""}
    </div>
  </div>

  <!-- TITLE -->
  <div class="tit">Contrato de Transporte — Hoja de Ruta Digital</div>

  <!-- REF -->
  <div class="ref-bar">
    <div>
      <div class="lbl">Código de Viaje</div>
      <div class="ref-code">${viaje.codigo_viaje}</div>
    </div>
    <div style="text-align:right">
      <div class="lbl">Estado</div>
      <div style="font-size:13px;font-weight:700;color:#22c78b">${viaje.estado || "—"}</div>
    </div>
  </div>

  <div class="body">

    <!-- DATOS DEL SERVICIO -->
    <div class="section">
      <div class="sec-title">📍 Datos del Servicio</div>
      <div class="sec-body">
        <div class="grid-2">
          <div>
            <div class="lbl">Origen</div>
            <div class="val">${viaje.direccion_origen || "—"}</div>
          </div>
          <div>
            <div class="lbl">Destino</div>
            <div class="val">${viaje.direccion_destino || "—"}</div>
          </div>
          <div>
            <div class="lbl">Fecha y Hora del Servicio</div>
            <div class="val">${fmtFechaLarga(viaje.fecha_inicio_servicio)}</div>
          </div>
          <div>
            <div class="lbl">Conductor</div>
            <div class="val">${viaje.conductor_nombre || "—"}</div>
          </div>
          <div>
            <div class="lbl">Pasajeros</div>
            <div class="val">${viaje.pasajeros || 1}</div>
          </div>
          <div>
            <div class="lbl">Forma de Pago</div>
            <div class="val">${viaje.forma_pago || "—"}${viaje.fue_negociado ? " · <span style='color:#7A5FFF'>Precio negociado</span>" : ""}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- VEHÍCULO -->
    <div class="section">
      <div class="sec-title">🚗 Vehículo y Autorización VTC</div>
      <div class="sec-body">
        <div class="grid-2">
          <div>
            <div class="lbl">Matrícula</div>
            <div class="val-mono">${T.matricula}</div>
          </div>
          <div>
            <div class="lbl">Vehículo</div>
            <div class="val">${T.marca} ${T.modelo}</div>
          </div>
          <div>
            <div class="lbl">Licencia VTC</div>
            <div class="val-mono">${T.licencia}</div>
          </div>
          <div>
            <div class="lbl">Titular Autorización</div>
            <div class="val">${T.nombre} (${T.nif})</div>
          </div>
        </div>
      </div>
    </div>

    <!-- PRECIO CERRADO -->
    <div class="section">
      <div class="sec-title">💶 Precio Cerrado del Servicio</div>
      <div class="sec-body">
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th style="text-align:right">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${buildConceptoRows(conceptos)}
            <tr>
              <td style="padding:7px 12px;border-bottom:1px solid #1a2f4a;color:#8898aa;font-style:italic">IVA (10%)</td>
              <td style="padding:7px 12px;border-bottom:1px solid #1a2f4a;text-align:right;font-family:monospace;color:#8898aa">${fmtEur(viaje.precio_iva)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>PRECIO TOTAL (IVA incluido)</td>
              <td style="text-align:right;font-family:monospace">${fmtEur(viaje.precio_final)}</td>
            </tr>
          </tfoot>
        </table>
        <div style="text-align:right">
          <div class="sello">⚖️ Precio Cerrado — Art. 7 RD 1057/2015</div>
        </div>
      </div>
    </div>

    <!-- QR DE VERIFICACIÓN -->
    <div class="qr-section">
      <img class="qr-img" src="${qrSrc}" width="140" height="140" alt="QR Verificación">
      <div class="qr-info">
        <h3>🔍 Verificación Digital</h3>
        <p>
          Este código QR verifica la autenticidad del contrato y el estado
          del registro en el <strong style="color:#fff">RVTC del Ministerio de
          Transportes</strong>. Válido ante inspecciones de tráfico y control
          de transportes.
        </p>
        <div class="qr-url">${qrData}</div>
      </div>
    </div>

    <!-- CLÁUSULAS -->
    <div class="clausulas">
      <strong style="color:rgba(255,255,255,.6)">CLÁUSULAS LEGALES:</strong>
      Servicio de arrendamiento de vehículo con conductor al amparo de la autorización
      VTC ${T.licencia}, conforme al RD 1076/2017 y la Orden FOM/36/2008.
      Precio cerrado e inamovible (Art. 7 RD 1057/2015).
      Servicio comunicado al Registro de Servicios VTC del Ministerio de Transportes
      con carácter previo al inicio (RD 1076/2017).
      Tratamiento de datos conforme al RGPD (UE) 2016/679 y LOPDGDD.
      Responsable del tratamiento: ${T.nombre} (${T.nif}).
    </div>

  </div><!-- /body -->

  <div class="foot">
    ${T.nombre} &nbsp;·&nbsp; ${T.licencia} &nbsp;·&nbsp; ${T.matricula}
    &nbsp;·&nbsp; ${T.telefono}
    &nbsp;·&nbsp; Código: ${viaje.codigo_viaje}
  </div>

</div><!-- /doc -->
</body>
</html>`;
}

// ── DATOS MÍNIMOS PARA EL QR (verificación pública) ─────────────
export function buildQRData(viaje) {
  return {
    codigo:          viaje.codigo_viaje,
    matricula:       TITULAR.matricula,
    licencia:        TITULAR.licencia,
    titular:         TITULAR.nif,
    estado_ministerio: viaje.estado_ministerio,
    codigo_rvtc:     viaje.codigo_ministerio || null,
    url_verificar:   `${APP_URL}/verificar/${viaje.codigo_viaje}`,
  };
}
