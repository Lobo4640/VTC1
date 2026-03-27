# 🚗 VTC Madrid 2026 — Plataforma Completa

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Supabase · Vercel

---

## 📋 ARCHIVOS GENERADOS

```
vtc-platform/
├── config/
│   └── vtc_setup.js          ← ⭐ EDITAR PRIMERO — toda la configuración aquí
├── lib/
│   ├── calculator.js          ← Motor de precios VTC 2026
│   ├── rvtc.js               ← Integración Ministerio (comunicarServicio)
│   ├── hojaRuta.js           ← Contrato PDF + QR inspección
│   └── supabase.js           ← Clientes Supabase
├── app/api/
│   ├── viajes/route.js       ← POST crear viaje / GET listar
│   ├── conductores/route.js  ← Auth PIN conductores / Cambiar PIN
│   ├── admin/resumen/route.js ← Reportes mensuales con liquidación
│   └── hoja-ruta/[codigo]/route.js ← PDF Hoja de Ruta
├── supabase/
│   └── schema.sql            ← Script SQL completo (EJECUTAR EN SUPABASE)
└── vtc-platform.html         ← 🎯 APP COMPLETA — abrir en navegador
```

---

## 🚀 INICIO RÁPIDO (5 pasos)

### 1. Crear proyecto Supabase
1. Ve a [supabase.com](https://supabase.com) → New Project
2. SQL Editor → pega y ejecuta `supabase/schema.sql`

### 2. Crear el Admin en Supabase
1. Supabase Dashboard → Authentication → Users → "Invite user"
2. Introduce el email del admin (ej: `admin@tuempresa.com`)
3. El admin recibirá un email para establecer su contraseña

### 3. Configurar `/config/vtc_setup.js`
Rellena TODOS los campos marcados con `// RELLENAR AQUÍ`:
- `DATOS_TITULAR`: NIF, matrícula, licencia VTC
- `TARIFAS`: precios por km, tiempo, bajada de bandera
- `RVTC_CREDS`: credenciales del Ministerio

### 4. Variables de entorno (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://XXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MINISTERIO_API_URL=https://api.mitma.es/vtc/v1
MINISTERIO_API_KEY=TU_API_KEY
MINISTERIO_OP_CODE=OP-MADRID-XXXX
NEXT_PUBLIC_APP_URL=https://tu-vtc.vercel.app
NEXT_PUBLIC_GMAPS_KEY=AIzaSy...
```

### 5. Deploy en Vercel
```bash
npm install
vercel --prod
```

---

## 🔐 SISTEMA DE ACCESO

### Admin (Email + Contraseña)
- Accede con las credenciales creadas en Supabase Auth
- Ve facturación total, liquidación mensual por conductor
- Gestiona los PINs de los conductores desde su panel

### Conductor (Selección de nombre + PIN de 4 dígitos)
- NO usa Supabase Auth
- Selecciona su nombre de la lista
- Introduce su PIN de 4 dígitos (asignado por el Admin)
- PIN por defecto al crear: `0000` (cambiar desde panel Admin)

---

## 📊 TABLAS SUPABASE

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Admins (vinculados a Supabase Auth) |
| `conductores` | Conductores con campo `pin_hash` (bcrypt) |
| `viajes` | Todos los viajes con datos completos |
| `resumen_mensual` | Vista SQL para el panel de Admin |

### Funciones SQL incluidas
- `verificar_pin_conductor(id, pin)` → verifica PIN con bcrypt
- `cambiar_pin_conductor(id, nuevo_pin)` → actualiza PIN hasheado

---

## ⚖️ NORMATIVA IMPLEMENTADA

| Regla | Implementación |
|-------|---------------|
| Precontratación 15 min (Art. 182bis LOTT) | `validarPrecontratacion()` bloquea reservas < 15 min |
| Precio cerrado (Art. 7 RD 1057/2015) | Precio calculado antes de confirmar, inamovible |
| Comunicación RVTC previa al inicio | `comunicarServicio()` llamada antes de `EN_CURSO` |
| Registro campos Art. 24 FOM/36/2008 | `buildPayload()` en `rvtc.js` |
| Formato carga masiva TXT (Cap. 9 Manual) | `generarLineaTXT()` como fallback |

---

## 🤝 MODO NEGOCIACIÓN

El conductor (cuando está logueado) puede:
1. Calcular el precio automático
2. Introducir un precio acordado con el cliente en el campo "Modo Negociación"
3. El precio negociado sustituye al calculado
4. El viaje queda marcado como `fue_negociado = true` en Supabase

---

## ⚠️ PENDIENTE DE REGISTRO MANUAL

Si la API del Ministerio falla:
1. El viaje **continúa** normalmente
2. Se marca como `PENDIENTE_MANUAL` en Supabase
3. Se muestra alerta en el panel Admin
4. Se imprime en consola el payload + línea TXT para carga masiva
5. Admin debe registrar manualmente en [sede.fomento.gob.es/RegistroVTC/](https://sede.fomento.gob.es/RegistroVTC/)

---

## 📄 HOJA DE RUTA DIGITAL

- URL: `/api/hoja-ruta/{codigo-viaje}`
- Incluye QR verificable en tiempo real
- Válida ante inspecciones de tráfico
- Muestra: matrícula, licencia VTC, ruta, precio cerrado, estado RVTC
- El conductor puede abrirla desde su panel con el botón "VER QR PARA INSPECCIÓN"

---

## 💡 MODELO WHITE LABEL (Multi-cliente)

Para cada nuevo cliente/licencia:
```bash
git clone [repo] vtc-cliente-nuevo
cd vtc-cliente-nuevo
# 1. Editar config/vtc_setup.js
# 2. Crear proyecto nuevo en Supabase + ejecutar schema.sql
# 3. Crear proyecto nuevo en Vercel
# 4. git push → deploy automático
```
Cada cliente tiene: su repo GitHub, su Supabase, su Vercel, su config.js.
