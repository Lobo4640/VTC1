-- ================================================================
--  SUPABASE SCHEMA — VTC MADRID 2026
--  Proyecto: mwjewdguvvmgzajfbjev.supabase.co
--
--  INSTRUCCIONES:
--  1. Ve a https://supabase.com/dashboard/project/mwjewdguvvmgzajfbjev
--  2. Abre: Database → SQL Editor
--  3. Pega TODO este contenido y haz clic en "Run"
-- ================================================================

-- ── EXTENSIONES ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── TABLA: usuarios (Admin — vinculado a Supabase Auth) ──────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  nombre     TEXT NOT NULL DEFAULT 'Admin',
  rol        TEXT NOT NULL DEFAULT 'admin' CHECK (rol IN ('admin','superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_self" ON usuarios
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- ── TABLA: conductores (PIN de 4 dígitos con bcrypt) ─────────────
CREATE TABLE IF NOT EXISTS conductores (
  id           BIGSERIAL PRIMARY KEY,
  nombre       TEXT    NOT NULL,
  dni          TEXT,
  telefono     TEXT,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  -- PIN hasheado con bcrypt. Nunca se almacena en texto plano.
  pin_hash     TEXT    NOT NULL DEFAULT crypt('1234', gen_salt('bf')),
  total_viajes INTEGER NOT NULL DEFAULT 0,
  total_km     NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conductores iniciales (PIN por defecto: 1234 — CAMBIAR DESDE PANEL ADMIN)
INSERT INTO conductores (nombre, pin_hash) VALUES
  ('Conductor 1', crypt('1234', gen_salt('bf'))),
  ('Conductor 2', crypt('1234', gen_salt('bf')))
ON CONFLICT DO NOTHING;

ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conductores_service" ON conductores
  USING (auth.role() = 'service_role');

-- ── TABLA: viajes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS viajes (
  id                       BIGSERIAL PRIMARY KEY,
  codigo_viaje             TEXT NOT NULL UNIQUE DEFAULT ('VTC-'||UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FOR 6))),

  -- Conductor
  conductor_id             BIGINT REFERENCES conductores(id),
  conductor_nombre         TEXT NOT NULL DEFAULT 'Sin asignar',

  -- Ruta
  direccion_origen         TEXT NOT NULL,
  direccion_destino        TEXT NOT NULL,
  distancia_km             NUMERIC(8,2) DEFAULT 0,
  duracion_min             INTEGER      DEFAULT 0,

  -- Precio cerrado (INAMOVIBLE una vez registrado)
  tarifa_nombre            TEXT,
  precio_base              NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_final             NUMERIC(10,2) NOT NULL,
  precio_iva               NUMERIC(10,2) NOT NULL DEFAULT 0,
  desglose_precio          JSONB,          -- Conceptos detallados
  fue_negociado            BOOLEAN NOT NULL DEFAULT FALSE,

  -- Pago
  forma_pago               TEXT NOT NULL DEFAULT 'EFECTIVO'
                           CHECK (forma_pago IN ('EFECTIVO','TARJETA','BIZUM','TRANSFERENCIA')),

  -- Datos del cliente (PRIVADOS — solo en Supabase, no van al Ministerio)
  cliente_nombre           TEXT,
  cliente_telefono         TEXT,
  cliente_dni              TEXT,    -- Requerido para el RVTC
  cliente_email            TEXT,
  pasajeros                INTEGER DEFAULT 1,

  -- Estado
  estado                   TEXT NOT NULL DEFAULT 'EN_CURSO'
                           CHECK (estado IN ('PENDIENTE','EN_CURSO','COMPLETADO','CANCELADO')),

  -- Ministerio RVTC
  estado_ministerio        TEXT NOT NULL DEFAULT 'PENDIENTE'
                           CHECK (estado_ministerio IN ('PENDIENTE','COMUNICADO','CONFIRMADO','ANULADO','PENDIENTE_MANUAL','ERROR')),
  codigo_ministerio        TEXT,
  payload_ministerio       JSONB,
  error_ministerio         TEXT,

  -- Extras
  extras_json              JSONB,
  notas                    TEXT,

  -- Timestamps
  fecha_reserva            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_inicio_servicio    TIMESTAMPTZ,
  fecha_fin_servicio       TIMESTAMPTZ,
  fecha_fin_estimada       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_viajes_conductor    ON viajes(conductor_id);
CREATE INDEX IF NOT EXISTS idx_viajes_fecha        ON viajes(fecha_reserva DESC);
CREATE INDEX IF NOT EXISTS idx_viajes_estado       ON viajes(estado);
CREATE INDEX IF NOT EXISTS idx_viajes_ministerio   ON viajes(estado_ministerio);
CREATE INDEX IF NOT EXISTS idx_viajes_pago         ON viajes(forma_pago);
CREATE INDEX IF NOT EXISTS idx_viajes_mes          ON viajes(DATE_TRUNC('month', fecha_reserva));

ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "viajes_service" ON viajes
  USING (auth.role() = 'service_role');

-- ── TRIGGERS: updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_conductores_upd
  BEFORE UPDATE ON conductores FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER tg_viajes_upd
  BEFORE UPDATE ON viajes      FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ── TRIGGER: Actualizar stats del conductor al completar viaje ────
CREATE OR REPLACE FUNCTION fn_conductor_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'COMPLETADO' AND (OLD.estado IS DISTINCT FROM 'COMPLETADO') THEN
    UPDATE conductores SET
      total_viajes = total_viajes + 1,
      total_km     = total_km + COALESCE(NEW.distancia_km, 0)
    WHERE id = NEW.conductor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_viaje_completado
  AFTER INSERT OR UPDATE ON viajes
  FOR EACH ROW EXECUTE FUNCTION fn_conductor_stats();

-- ── VISTA: resumen_mensual (para el Panel Admin) ──────────────────
CREATE OR REPLACE VIEW resumen_mensual AS
SELECT
  DATE_TRUNC('month', v.fecha_reserva)  AS mes,
  c.id                                   AS conductor_id,
  c.nombre                               AS conductor_nombre,
  COUNT(v.id)                            AS total_viajes,
  SUM(v.precio_final)                    AS total_facturado,
  SUM(v.precio_iva)                      AS total_iva,
  SUM(CASE WHEN v.forma_pago='EFECTIVO'      THEN v.precio_final ELSE 0 END) AS total_efectivo,
  SUM(CASE WHEN v.forma_pago='TARJETA'       THEN v.precio_final ELSE 0 END) AS total_tarjeta,
  SUM(CASE WHEN v.forma_pago='BIZUM'         THEN v.precio_final ELSE 0 END) AS total_bizum,
  SUM(CASE WHEN v.forma_pago='TRANSFERENCIA' THEN v.precio_final ELSE 0 END) AS total_transferencia,
  SUM(v.distancia_km)                    AS total_km,
  AVG(v.precio_final)                    AS ticket_medio,
  COUNT(CASE WHEN v.fue_negociado THEN 1 END)                    AS total_negociados,
  COUNT(CASE WHEN v.estado_ministerio='PENDIENTE_MANUAL' THEN 1 END) AS pendientes_ministerio
FROM viajes v
JOIN conductores c ON c.id = v.conductor_id
WHERE v.estado = 'COMPLETADO'
GROUP BY DATE_TRUNC('month', v.fecha_reserva), c.id, c.nombre
ORDER BY mes DESC, c.nombre;

-- ── FUNCIÓN: Verificar PIN del conductor ─────────────────────────
CREATE OR REPLACE FUNCTION verificar_pin_conductor(p_conductor_id BIGINT, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE v_hash TEXT;
BEGIN
  SELECT pin_hash INTO v_hash FROM conductores
  WHERE id = p_conductor_id AND activo = TRUE;
  IF v_hash IS NULL THEN RETURN FALSE; END IF;
  RETURN (crypt(p_pin, v_hash) = v_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FUNCIÓN: Cambiar PIN del conductor (solo Admin) ───────────────
CREATE OR REPLACE FUNCTION cambiar_pin_conductor(p_conductor_id BIGINT, p_nuevo_pin TEXT)
RETURNS VOID AS $$
BEGIN
  IF LENGTH(p_nuevo_pin) <> 4 OR p_nuevo_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'El PIN debe ser exactamente 4 dígitos numéricos';
  END IF;
  UPDATE conductores
  SET pin_hash = crypt(p_nuevo_pin, gen_salt('bf'))
  WHERE id = p_conductor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── VERIFICACIÓN FINAL ────────────────────────────────────────────
-- Al terminar deberías ver estas tablas en Table Editor:
-- ✅ usuarios
-- ✅ conductores  (con 2 filas: Conductor 1 y Conductor 2, PIN: 1234)
-- ✅ viajes
-- Y estas vistas:
-- ✅ resumen_mensual
