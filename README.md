# 🚗 VTC Madrid 2026 — Plataforma de Gestión Completa

**Stack:** Next.js 14 · Supabase · Vercel · Google Maps  
**Proyecto Supabase:** `mwjewdguvvmgzajfbjev.supabase.co` ✅

---

## 📁 ESTRUCTURA DE CARPETAS

```
vtc-final/
│
├── .env.local                    ← ✅ Credenciales ya configuradas
├── .env.vercel                   ← ✅ Para importar en Vercel Dashboard
├── .gitignore                    ← ⚠️  .env.local NUNCA a Git
├── package.json
├── next.config.mjs
├── tailwind.config.mjs
├── postcss.config.mjs
│
├── config/
│   └── vtc_setup.js              ← ⭐ ÚNICO ARCHIVO A EDITAR (datos titular, tarifas)
│
├── lib/
│   ├── supabase.js               ← ✅ Cliente Supabase ya conectado
│   ├── calculator.js             ← Motor de precios VTC 2026
│   ├── rvtc.js                   ← Integración Ministerio RVTC
│   └── hojaRuta.js               ← Generador Contrato PDF + QR
│
├── app/
│   ├── layout.jsx                ← Layout raíz
│   ├── page.jsx                  ← Redirige a /reservar
│   ├── globals.css
│   │
│   ├── inicio/page.jsx           ← Selección de rol (Admin/Conductor/Cliente)
│   ├── reservar/page.jsx         ← 🎯 Formulario 3 pasos (diseño 5.html)
│   ├── conductor/page.jsx        ← Panel conductor + PIN numpad + QR inspección
│   ├── admin/
│   │   ├── login/page.jsx        ← Login Admin (email + contraseña)
│   │   └── page.jsx              ← Panel Admin (liquidación + viajes + PINs)
│   │
│   └── api/
│       ├── calcular/route.js     ← POST: Calcular precio en tiempo real
│       ├── viajes/route.js       ← GET/POST: Viajes
│       ├── conductores/route.js  ← GET/POST/PUT: Conductores + PINs
│       ├── admin/
│       │   └── resumen/route.js  ← GET: Liquidación mensual
│       └── hoja-ruta/
│           └── [codigo]/route.js ← GET: Hoja de Ruta HTML (imprimible)
│
└── supabase/
    └── schema.sql                ← ✅ Script completo para ejecutar en Supabase
```

---

## 🚀 DESPLIEGUE EN 5 PASOS

### PASO 1 — Ejecutar el Schema en Supabase

1. Abre: [dashboard.supabase.com/project/mwjewdguvvmgzajfbjev](https://dashboard.supabase.com/project/mwjewdguvvmgzajfbjev)
2. Ve a **Database → SQL Editor**
3. Copia y ejecuta **todo** el contenido de `supabase/schema.sql`
4. Verifica que se crearon las tablas: `usuarios`, `conductores`, `viajes`

### PASO 2 — Crear Admin en Supabase Auth

1. En Supabase: **Authentication → Users → Invite User**
2. Introduce el email del admin (ej: `admin@tuempresa.com`)
3. El admin recibirá un email para crear su contraseña
4. Con esas credenciales accederá a `/admin/login`

### PASO 3 — Rellenar config/vtc_setup.js

Edita los campos marcados con `RELLENAR_AQUÍ`:
```js
DATOS_TITULAR: {
  nombre:       "TU EMPRESA VTC S.L.",
  nif:          "B-XXXXXXXX",
  licencia_vtc: "VTC-M-0001",
  matricula:    "1234-ABC",
  ...
}
```

### PASO 4 — Subir a GitHub

```bash
# 1. Crear repo en github.com (privado recomendado)
git init
git add .
git commit -m "VTC Madrid 2026 - Initial commit"
git remote add origin https://github.com/TU-USUARIO/vtc-madrid
git push -u origin main
```

### PASO 5 — Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. Importa el repo de GitHub
3. En **Environment Variables**, añade TODAS las variables de `.env.vercel`
4. Haz clic en **Deploy**

---

## 🔑 VARIABLES DE ENTORNO PARA VERCEL

Copia estas variables tal cual en **Vercel → Settings → Environment Variables:**

```
NEXT_PUBLIC_SUPABASE_URL          = https://mwjewdguvvmgzajfbjev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJhbGci...U8ratVAm6zh9a1UD6Q4Uoay5akgUKnArOxx_PAvo1F8
SUPABASE_SERVICE_ROLE_KEY         = eyJhbGci...C4On-1nbZ0O_TJwQtA-d7zdsAKgb9UC6zrp3B5N0jwI
NEXT_PUBLIC_GMAPS_KEY             = AIzaSyDxdjJ1HyJoVgeP6NFoS2i4va-tdRjrJIA
NEXT_PUBLIC_APP_URL               = https://TU-PROYECTO.vercel.app
MINISTERIO_API_KEY                = (Pendiente — solicitar al Ministerio)
MINISTERIO_OP_CODE                = (Pendiente — solicitar al Ministerio)
SUPABASE_PUBLISHABLE_KEY          = sb_publishable__wydvaX2f8wk_kYA8g_J7A_ID_7fmT5
SUPABASE_SECRET_KEY               = sb_secret_2sK4eVnpd4EuzXQ3nvrTyw_YgDwYcNC
```

---

## 🔐 SISTEMA DE ACCESO

| Rol       | URL          | Método                          |
|-----------|--------------|----------------------------------|
| Admin     | `/admin/login` | Email + Contraseña (Supabase Auth) |
| Conductor | `/conductor`   | Nombre en lista + PIN 4 dígitos  |
| Cliente   | `/reservar`    | Sin login                        |

**PIN por defecto de conductores: `1234`** → Cambiar desde Panel Admin → Pestaña PINs.

---

## 📱 RUTAS DE LA APLICACIÓN

| Ruta | Descripción |
|------|-------------|
| `/inicio` | Selección de rol |
| `/reservar` | Formulario 3 pasos cliente |
| `/conductor` | Dashboard + PIN + QR inspección |
| `/admin` | Panel administrador completo |
| `/admin/login` | Login admin |
| `/api/calcular` | Calcular precio VTC |
| `/api/viajes` | CRUD viajes |
| `/api/conductores` | Auth PIN + gestión |
| `/api/admin/resumen` | Liquidación mensual |
| `/api/hoja-ruta/[codigo]` | Contrato PDF con QR |

---

## ⚖️ NORMATIVA IMPLEMENTADA

| Obligación | Implementación | Base Legal |
|-----------|----------------|------------|
| Precontratación mínima | Bloqueo < 15 min | Art. 182bis LOTT |
| Precio cerrado | Inamovible desde cálculo | Art. 7 RD 1057/2015 |
| Comunicación RVTC previa | `comunicarServicio()` | RD 1076/2017 |
| Campos Art. 24 | `buildPayload()` | Orden FOM/36/2008 |
| Fallback manual | `PENDIENTE_MANUAL` + log TXT | Cap. 9 Manual RVTC |

---

## 🔄 WHITE LABEL — CLONAR PARA NUEVO CLIENTE

```bash
git clone [repo] vtc-cliente-nuevo
cd vtc-cliente-nuevo
# 1. Editar config/vtc_setup.js con los datos del nuevo cliente
# 2. Crear nuevo proyecto en Supabase → ejecutar schema.sql
# 3. Crear nuevo repo GitHub + nuevo proyecto Vercel
# 4. git push → deploy automático
```

Cada cliente tiene: GitHub propio + Supabase propio + Vercel propio.
