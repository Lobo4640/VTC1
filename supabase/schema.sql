-- ================================================================
--  SCHEMA DEFINITIVO — VTC Madrid 2026
--  Proyecto Supabase: mwjewdguvvmgzajfbjev.supabase.co
--
--  INSTRUCCIONES:
--  1. Abre: https://supabase.com/dashboard/project/mwjewdguvvmgzajfbjev
--  2. Database → SQL Editor → New query
--  3. Pega TODO y pulsa "Run"
-- ================================================================

-- ── EXTENSIONES ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- bcrypt para PINs

-- ================================================================
--  TABLA: conductores
--  Acceso mediante PIN de 4 dígitos (hash bcrypt, nunca texto plano)
-- ================================================================
CREATE TABLE IF NOT EXISTS conductores (
  id            BIGSERIAL PRIMARY KEY,
  nombre        TEXT      NOT NULL,
  dni           TEXT,
  telefono      TEXT,
  activo        BOOLEAN   NOT NULL DEFAULT TRUE,

  -- PIN hasheado con bcrypt — NUNCA se almacena en texto plano
  pin_hash      TEXT      NOT NULL DEFAULT crypt('1234', gen_salt('bf')),

  -- Estadísticas acumuladas (actualizadas por trigger)
  total_viajes  INTEGER   NOT NULL DEFAULT 0,
  total_km      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_ingresos NUMERIC(10,2) NOT NULL DEFAULT 0,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conductores iniciales (PIN: 1234 — cambiar desde Panel Admin)
INSERT INTO conductores (nombre, pin_hash) VALUES
  ('Conductor 1', crypt('1234', gen_salt('bf'))),
  ('Conductor 2', crypt('1234', gen_salt('bf')))
ON CONFLICT DO NOTHING;

-- RLS: solo el service_role puede operar (acceso exclusivo desde backend)
ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conductores_service_only" ON conductores
  USING (auth.role() = 'service_role');

-- ================================================================
--  TABLA: viajes
--  Registro completo de cada servicio VTC
-- ================================================================
CREATE TABLE IF NOT EXISTS viajes (
  id                      BIGSERIAL PRIMARY KEY,

  -- Identificador único del viaje (ej: VTC-A1B2C-3D4)
  codigo_viaje            TEXT NOT NULL UNIQUE
                          DEFAULT ('VTC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FOR 5))
                                  || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 3 FOR 3))),

  -- ── CONDUCTOR ──────────────────────────────────────────────
  conductor_id            BIGINT REFERENCES conductores(id) ON DELETE SET NULL,
  conductor_nombre        TEXT   NOT NULL DEFAULT 'Sin asignar',

  -- ── RUTA ───────────────────────────────────────────────────
  direccion_origen        TEXT   NOT NULL,
  direccion_destino       TEXT   NOT NULL,
  distancia_km            NUMERIC(8,2)  DEFAULT 0,
  duracion_min            INTEGER       DEFAULT 0,

  -- ── PRECIO CERRADO (inamovible tras confirmación) ──────────
  tarifa_nombre           TEXT,
  precio_base             NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_final            NUMERIC(10,2) NOT NULL,
  precio_iva              NUMERIC(10,2) NOT NULL DEFAULT 0,
  desglose_precio         JSONB,          -- conceptos detallados
  fue_negociado           BOOLEAN NOT NULL DEFAULT FALSE,

  -- ── PAGO ───────────────────────────────────────────────────
  forma_pago              TEXT NOT NULL DEFAULT 'EFECTIVO'
                          CHECK (forma_pago IN ('EFECTIVO','TARJETA','BIZUM','TRANSFERENCIA')),

  -- ── DATOS DEL CLIENTE (privados — nunca al Ministerio) ─────
  cliente_nombre          TEXT,
  cliente_telefono        TEXT,
  cliente_dni             TEXT,   -- Requerido para RVTC (Art. 24 FOM/36/2008)
  cliente_email           TEXT,
  pasajeros               INTEGER DEFAULT 1,

  -- ── ESTADO ─────────────────────────────────────────────────
  estado                  TEXT NOT NULL DEFAULT 'EN_CURSO'
                          CHECK (estado IN ('PENDIENTE','EN_CURSO','COMPLETADO','CANCELADO')),

  -- ── MINISTERIO RVTC ────────────────────────────────────────
  estado_ministerio       TEXT NOT NULL DEFAULT 'PENDIENTE'
                          CHECK (estado_ministerio IN (
                            'PENDIENTE','COMUNICADO','CONFIRMADO',
                            'ANULADO','PENDIENTE_MANUAL','ERROR'
                          )),
  codigo_ministerio       TEXT,           -- Código asignado por el RVTC
  payload_ministerio      JSONB,          -- Payload enviado (sin datos personales)
  error_ministerio        TEXT,

  -- ── EXTRAS ─────────────────────────────────────────────────
  extras_json             JSONB,          -- {maleta,mascota,silla}
  notas                   TEXT,

  -- ── TIMESTAMPS ─────────────────────────────────────────────
  fecha_reserva           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_inicio_servicio   TIMESTAMPTZ,
  fecha_fin_servicio      TIMESTAMPTZ,
  fecha_fin_estimada      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_viajes_conductor   ON viajes (conductor_id);
CREATE INDEX IF NOT EXISTS idx_viajes_fecha       ON viajes (fecha_reserva DESC);
CREATE INDEX IF NOT EXISTS idx_viajes_estado      ON viajes (estado);
CREATE INDEX IF NOT EXISTS idx_viajes_ministerio  ON viajes (estado_ministerio);
CREATE INDEX IF NOT EXISTS idx_viajes_pago        ON viajes (forma_pago);
CREATE INDEX IF NOT EXISTS idx_viajes_codigo      ON viajes (codigo_viaje);
CREATE INDEX IF NOT EXISTS idx_viajes_mes         ON viajes (DATE_TRUNC('month', fecha_reserva));

-- RLS
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viajes_service_only" ON viajes
  USING (auth.role() = 'service_role');

-- ================================================================
--  TABLA: usuarios_admin
--  Vinculada a Supabase Auth — solo para administradores
-- ================================================================
CREATE TABLE IF NOT EXISTS usuarios_admin (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  nombre     TEXT NOT NULL DEFAULT 'Admin',
  rol        TEXT NOT NULL DEFAULT 'admin' CHECK (rol IN ('admin','superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_self_read" ON usuarios_admin
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- ================================================================
--  TRIGGERS
-- ================================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_conductores_updated
  BEFORE UPDATE ON conductores
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER tg_viajes_updated
  BEFORE UPDATE ON viajes
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Actualizar estadísticas del conductor al completar un viaje
CREATE OR REPLACE FUNCTION fn_actualizar_stats_conductor()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado = 'COMPLETADO'
     AND (OLD.estado IS DISTINCT FROM 'COMPLETADO')
     AND NEW.conductor_id IS NOT NULL
  THEN
    UPDATE conductores SET
      total_viajes   = total_viajes + 1,
      total_km       = total_km + COALESCE(NEW.distancia_km, 0),
      total_ingresos = total_ingresos + COALESCE(NEW.precio_final, 0)
    WHERE id = NEW.conductor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_viaje_completado
  AFTER INSERT OR UPDATE ON viajes
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_stats_conductor();

-- ================================================================
--  VISTA: resumen_mensual
--  Agrega facturación por conductor y forma de pago
-- ================================================================
CREATE OR REPLACE VIEW resumen_mensual AS
SELECT
  DATE_TRUNC('month', v.fecha_reserva)   AS mes,
  c.id                                    AS conductor_id,
  c.nombre                                AS conductor_nombre,

  COUNT(v.id)                             AS total_viajes,
  ROUND(SUM(v.precio_final)::NUMERIC, 2)  AS total_facturado,
  ROUND(SUM(v.precio_iva)::NUMERIC, 2)    AS total_iva,
  ROUND(AVG(v.precio_final)::NUMERIC, 2)  AS ticket_medio,
  ROUND(SUM(v.distancia_km)::NUMERIC, 1)  AS total_km,

  -- Desglose por forma de pago
  ROUND(SUM(CASE WHEN v.forma_pago = 'EFECTIVO'      THEN v.precio_final ELSE 0 END)::NUMERIC, 2) AS total_efectivo,
  ROUND(SUM(CASE WHEN v.forma_pago = 'TARJETA'       THEN v.precio_final ELSE 0 END)::NUMERIC, 2) AS total_tarjeta,
  ROUND(SUM(CASE WHEN v.forma_pago = 'BIZUM'         THEN v.precio_final ELSE 0 END)::NUMERIC, 2) AS total_bizum,
  ROUND(SUM(CASE WHEN v.forma_pago = 'TRANSFERENCIA' THEN v.precio_final ELSE 0 END)::NUMERIC, 2) AS total_transferencia,

  -- Contadores extra
  COUNT(CASE WHEN v.fue_negociado                          THEN 1 END) AS viajes_negociados,
  COUNT(CASE WHEN v.estado_ministerio = 'PENDIENTE_MANUAL' THEN 1 END) AS pendientes_ministerio

FROM viajes v
JOIN conductores c ON c.id = v.conductor_id
WHERE v.estado = 'COMPLETADO'
GROUP BY DATE_TRUNC('month', v.fecha_reserva), c.id, c.nombre
ORDER BY mes DESC, c.nombre;

-- ================================================================
--  FUNCIONES DE SEGURIDAD (PINS)
-- ================================================================

-- Verificar PIN del conductor (compara bcrypt)
CREATE OR REPLACE FUNCTION verificar_pin_conductor(
  p_conductor_id BIGINT,
  p_pin          TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER   -- ejecuta con privilegios del creador
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT pin_hash INTO v_hash
  FROM conductores
  WHERE id = p_conductor_id AND activo = TRUE;

  IF v_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN crypt(p_pin, v_hash) = v_hash;
END;
$$;

-- Cambiar PIN del conductor (solo Admin vía service_role)
CREATE OR REPLACE FUNCTION cambiar_pin_conductor(
  p_conductor_id BIGINT,
  p_nuevo_pin    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF LENGTH(p_nuevo_pin) <> 4 OR p_nuevo_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'El PIN debe ser exactamente 4 dígitos numéricos';
  END IF;

  UPDATE conductores
  SET pin_hash = crypt(p_nuevo_pin, gen_salt('bf'))
  WHERE id = p_conductor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conductor % no encontrado', p_conductor_id;
  END IF;
END;
$$;

-- ================================================================
--  VERIFICACIÓN FINAL
-- ================================================================
-- Al ejecutar correctamente verás en Table Editor:
--   ✅ conductores        (2 filas: Conductor 1 y 2, PIN: 1234)
--   ✅ viajes
--   ✅ usuarios_admin
-- Y en Database → Views:
--   ✅ resumen_mensual
-- ================================================================
