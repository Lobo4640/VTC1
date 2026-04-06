/**
 * ================================================================
 *  config/vtc_setup.js — CONFIGURACIÓN CENTRAL VTC MADRID 2026
 *
 *  ✅ Supabase ya conectado con tus credenciales reales.
 *  📝 Rellena los campos marcados con RELLENAR_AQUÍ
 * ================================================================
 */

const VTC_CONFIG = {

  // ── DATOS DEL TITULAR ────────────────────────────────────────
  DATOS_TITULAR: {
    nombre:          "RELLENAR_AQUÍ",        // Ej: "ELITE VTC MADRID S.L."
    nif:             "RELLENAR_AQUÍ",        // Ej: "B-12345678"
    licencia_vtc:    "RELLENAR_AQUÍ",        // Ej: "VTC-M-0001"
    matricula:       "RELLENAR_AQUÍ",        // Ej: "1234-ABC"
    vehiculo_marca:  "RELLENAR_AQUÍ",        // Ej: "Mercedes-Benz"
    vehiculo_modelo: "RELLENAR_AQUÍ",        // Ej: "Clase E"
    vehiculo_color:  "RELLENAR_AQUÍ",        // Ej: "Negro"
    telefono:        "RELLENAR_AQUÍ",        // Ej: "+34 600 000 000"
    email:           "RELLENAR_AQUÍ",        // Ej: "info@tuvtc.es"
    direccion:       "RELLENAR_AQUÍ",        // Dirección fiscal
    ciudad:          "Madrid",
    nif_arrendador:  "RELLENAR_AQUÍ",        // Mismo que nif en modelo 1 vehículo
  },

  // ── TARIFAS VTC MADRID 2026 ───────────────────────────────────
  TARIFAS: {
    T1: {
      nombre:        "Tarifa 1 · Diurna (07:00 – 22:00h)",
      bajada_bandera: 3.50,                  // RELLENAR_AQUÍ
      precio_km:      1.45,                  // RELLENAR_AQUÍ
      precio_minuto:  0.22,                  // RELLENAR_AQUÍ
      minimo_legal:  15.00,
    },
    T2: {
      nombre:        "Tarifa 2 · Nocturna/Festivos",
      bajada_bandera: 4.50,                  // RELLENAR_AQUÍ
      precio_km:      1.80,                  // RELLENAR_AQUÍ
      precio_minuto:  0.30,                  // RELLENAR_AQUÍ
      minimo_legal:  18.00,
    },
    SUPLEMENTOS: {
      aeropuerto:        35.00,
      aeropuerto_max:    45.00,
      nocturnidad_mult:   1.25,
      festivo_mult:       1.20,
      maleta_extra:       3.00,
      mascota:            5.00,
      silla_bebe:         3.00,
    },
    iva: 0.10,
    DINAMICA: {
      multiplicador_max: 1.5,
      activa: false,
    },
  },

  // ── REGLAS LEGALES VTC ────────────────────────────────────────
  LEGAL: {
    precontratacion_minutos: 15,
    precio_cerrado: true,
    registro_previo_inicio: true,
  },

  // ── CONDUCTORES ───────────────────────────────────────────────
  CONDUCTORES: [
    { id: 1, nombre: "RELLENAR_AQUÍ", dni: "RELLENAR_AQUÍ" },
    { id: 2, nombre: "RELLENAR_AQUÍ", dni: "RELLENAR_AQUÍ" },
  ],

  // ── SUPABASE ✅ YA CONFIGURADO ───────────────────────────────
  SUPABASE: {
    url:              "https://mwjewdguvvmgzajfbjev.supabase.co",
    anon_key:         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13amV3ZGd1dnZtZ3phamZiamV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjM5NjUsImV4cCI6MjA5MDE5OTk2NX0.U8ratVAm6zh9a1UD6Q4Uoay5akgUKnArOxx_PAvo1F8",
    service_role_key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13amV3ZGd1dnZtZ3phamZiamV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyMzk2NSwiZXhwIjoyMDkwMTk5OTY1fQ.C4On-1nbZ0O_TJwQtA-d7zdsAKgb9UC6zrp3B5N0jwI",
    publishable_key:  "sb_publishable__wydvaX2f8wk_kYA8g_J7A_ID_7fmT5",
    secret_key:       "sb_secret_2sK4eVnpd4EuzXQ3nvrTyw_YgDwYcNC",
  },

  // ── GOOGLE MAPS ✅ YA CONFIGURADO ────────────────────────────
  GOOGLE_MAPS: {
    api_key: "AIzaSyDxdjJ1HyJoVgeP6NFoS2i4va-tdRjrJIA",
  },

  // ── MINISTERIO RVTC ───────────────────────────────────────────
  RVTC_CREDS: {
    api_url:          "https://api.mitma.es/vtc/v1",
    api_key:          process.env.MINISTERIO_API_KEY    || "PENDIENTE_MINISTERIO",
    codigo_operador:  process.env.MINISTERIO_OP_CODE    || "PENDIENTE_MINISTERIO",
    ine_provincia:    "28",   // Madrid
    ine_municipio:    "079",  // Madrid capital
    timeout_ms:       8000,
  },

  // ── BRANDING ──────────────────────────────────────────────────
  BRANDING: {
    nombre_app:      "VTC Madrid",
    color_primario:  "#112F5C",
    color_acento:    "#00B5FF",
    color_verde:     "#22c78b",
    font:            "Montserrat",
    tagline:         "Tu conductor privado en Madrid",
  },

  FORMAS_PAGO: ["EFECTIVO", "TARJETA", "BIZUM", "TRANSFERENCIA"],
};

export default VTC_CONFIG;
