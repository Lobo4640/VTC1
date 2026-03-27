/**
 * ================================================================
 *  /config/vtc_setup.js  —  CONFIGURACIÓN CENTRAL VTC MADRID 2026
 *  ⚠️  Este es el ÚNICO archivo que debes editar para personalizar
 *      la plataforma para cada licencia/cliente.
 * ================================================================
 */

const VTC_CONFIG = {

  // ── DATOS DEL TITULAR DE LA LICENCIA VTC ─────────────────────
  DATOS_TITULAR: {
    nombre:          "RELLENAR AQUÍ",   // Nombre completo o razón social
    nif:             "RELLENAR AQUÍ",   // NIF/CIF del titular
    licencia_vtc:    "RELLENAR AQUÍ",   // Ej: "VTC-M-0001"
    matricula:       "RELLENAR AQUÍ",   // Ej: "1234-ABC"
    vehiculo_marca:  "RELLENAR AQUÍ",   // Ej: "Mercedes-Benz"
    vehiculo_modelo: "RELLENAR AQUÍ",   // Ej: "Clase E"
    vehiculo_color:  "RELLENAR AQUÍ",   // Ej: "Negro"
    telefono:        "RELLENAR AQUÍ",   // Ej: "+34 600 000 000"
    email:           "RELLENAR AQUÍ",   // Email de contacto
    direccion:       "RELLENAR AQUÍ",   // Dirección fiscal
    ciudad:          "Madrid",
    // Datos para el Contrato Digital (HOJA DE RUTA)
    nif_arrendador:  "RELLENAR AQUÍ",   // Mismo NIF que titular en modelo 1 vehículo
  },

  // ── TARIFAS VTC MADRID 2026 ───────────────────────────────────
  TARIFAS: {
    // Tarifa DIURNA (07:00h - 22:00h)
    T1: {
      nombre:           "Tarifa 1 · Diurna",
      bajada_bandera:   3.50,            // RELLENAR AQUÍ — € bajada de bandera
      precio_km:        1.45,            // RELLENAR AQUÍ — €/km
      precio_minuto:    0.22,            // RELLENAR AQUÍ — €/minuto
      minimo_legal:     15.00,           // Mínimo legal VTC Madrid 2026
    },
    // Tarifa NOCTURNA (22:00h - 07:00h) y fines de semana
    T2: {
      nombre:           "Tarifa 2 · Nocturna/Festivos",
      bajada_bandera:   4.50,            // RELLENAR AQUÍ
      precio_km:        1.80,            // RELLENAR AQUÍ
      precio_minuto:    0.30,            // RELLENAR AQUÍ
      minimo_legal:     18.00,
    },
    // Suplementos fijos
    SUPLEMENTOS: {
      aeropuerto:       35.00,           // RELLENAR AQUÍ — Tarifa plana MAD
      aeropuerto_max:   45.00,           // Precio máximo aeropuerto si supera por km
      nocturnidad_mult: 1.25,            // Multiplicador nocturno (+25%)
      festivo_mult:     1.20,            // Multiplicador festivos (+20%)
      maleta_extra:     3.00,            // € por maleta adicional (1 incluida gratis)
      mascota:          5.00,            // € suplemento mascota
      silla_bebe:       3.00,            // € suplemento silla bebé
    },
    // IVA aplicable
    iva:                0.10,            // 10% — Transporte de viajeros
    // Tarifa dinámica: multiplicador máximo permitido (1.0 = sin multiplicador)
    DINAMICA: {
      multiplicador_max: 1.5,            // RELLENAR AQUÍ — Máx. 1.5x precio base
      activa:            false,          // Activar/desactivar tarifa dinámica
    },
  },

  // ── REGLAS LEGALES VTC (NO MODIFICAR) ────────────────────────
  LEGAL: {
    precontratacion_minutos: 15,         // Mínimo legal Art. 182bis LOTT
    precio_cerrado:          true,       // Precio inamovible una vez aceptado
    registro_previo_inicio:  true,       // Comunicar al RVTC ANTES de iniciar
  },

  // ── CONDUCTORES (Hasta 2 por defecto) ─────────────────────────
  // Los PINs se gestionan desde el Panel de Admin en Supabase.
  // Esto es solo información de display.
  CONDUCTORES: [
    {
      id:      1,
      nombre:  "RELLENAR AQUÍ",         // Nombre del conductor 1
      dni:     "RELLENAR AQUÍ",         // DNI del conductor 1
    },
    {
      id:      2,
      nombre:  "RELLENAR AQUÍ",         // Nombre del conductor 2
      dni:     "RELLENAR AQUÍ",         // DNI del conductor 2
    },
  ],

  // ── CREDENCIALES RVTC — MINISTERIO DE TRANSPORTES ────────────
  // Obtener en: https://sede.fomento.gob.es/RegistroVTC/
  // Contacto soporte: registrovtc@mitma.es
  RVTC_CREDS: {
    // URL del endpoint de la API del Ministerio
    api_url:          process.env.MINISTERIO_API_URL    || "https://api.mitma.es/vtc/v1",
    // API Key asignada por el Ministerio al operador
    api_key:          process.env.MINISTERIO_API_KEY    || "RELLENAR AQUÍ",
    // Código de operador asignado al titular de la licencia
    codigo_operador:  process.env.MINISTERIO_OP_CODE    || "RELLENAR AQUÍ",
    // Código INE de provincia (Madrid = 28)
    ine_provincia:    "28",
    // Código INE de municipio (Madrid capital = 079)
    ine_municipio:    "079",
    // Timeout en ms antes de marcar como PENDIENTE_MANUAL
    timeout_ms:       8000,
  },

  // ── SUPABASE ──────────────────────────────────────────────────
  SUPABASE: {
    url:              process.env.NEXT_PUBLIC_SUPABASE_URL      || "RELLENAR AQUÍ",
    anon_key:         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "RELLENAR AQUÍ",
    service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY     || "RELLENAR AQUÍ",
  },

  // ── GOOGLE MAPS ───────────────────────────────────────────────
  GOOGLE_MAPS: {
    api_key: process.env.NEXT_PUBLIC_GMAPS_KEY || "RELLENAR AQUÍ",
  },

  // ── BRANDING ──────────────────────────────────────────────────
  BRANDING: {
    nombre_app:    "VTC Madrid",
    color_primario: "#112F5C",
    color_acento:   "#00B5FF",
    color_verde:    "#22c78b",
    font:           "Montserrat",
  },

  // ── FORMAS DE PAGO ────────────────────────────────────────────
  FORMAS_PAGO: ["EFECTIVO", "TARJETA", "BIZUM", "TRANSFERENCIA"],

};

export default VTC_CONFIG;
