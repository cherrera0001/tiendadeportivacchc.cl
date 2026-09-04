# Análisis de Arquitectura — Tienda Deportiva CCHC

**Fecha**: 2026-09-02  
**Versión**: v2 (M0–M6) + Supabase PostgreSQL integrado

---

## 1. ANÁLISIS: VARIABLE NEXT_PUBLIC_SUPABASE_ANON_KEY

### ¿Dónde se consume?

**Resultado**: **NO SE CONSUME EN NINGÚN LADO DEL CÓDIGO**

```
Búsqueda global: grep -r "NEXT_PUBLIC_SUPABASE_ANON_KEY" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.html"
Resultado: ∅ (vacío)
```

### ¿Por qué está en `.env`?

La variable fue agregada como **referencia** desde Vercel/Supabase, pero:

1. **No se necesita en servidor Express** — Express se conecta directamente a PostgreSQL con `DATABASE_URL`
2. **No se necesita en front HTML/CSS/JS vanilla** — El front no hace llamadas directas a Supabase, todo pasa por APIs Express
3. **Se necesitaría SI**: El proyecto fuera Next.js + Supabase client en el navegador

### Estructura actual (v2)

```
┌─────────────────────────────────────────────────────────┐
│                  Front (HTML/CSS/JS)                     │
│         (NO TIENE CLIENTE DE SUPABASE)                   │
│                                                          │
│  ✅ fetch() a APIs Express locales                       │
│  ❌ NO CONSUME NEXT_PUBLIC_SUPABASE_ANON_KEY             │
└────────────────────┬────────────────────────────────────┘
                     │ fetch /api/*
                     ↓
┌─────────────────────────────────────────────────────────┐
│            Express Server (Node.js)                      │
│      Conecta a Supabase con DATABASE_URL                │
│                                                          │
│  ✅ CONSUME: DATABASE_URL (PostgreSQL directo)           │
│  ✅ CONSUME: MP_ACCESS_TOKEN, TURNSTILE, etc.           │
│  ❌ NO CONSUME: NEXT_PUBLIC_SUPABASE_ANON_KEY            │
└────────────────────┬────────────────────────────────────┘
                     │ pg.Pool
                     ↓
┌─────────────────────────────────────────────────────────┐
│        Supabase PostgreSQL                              │
│   dpsvguapsqpqlpajkmni.supabase.co                      │
│                                                          │
│  (No requiere ANON_KEY en servidor — conexión directa)  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. VARIABLES DE ENTORNO — USO REAL

| Variable | Tipo | ¿Se Usa? | Dónde | Por qué |
|---|---|---|---|---|
| **DATABASE_URL** | Credencial BD | ✅ SÍ | `lib/db.js` (conexión PostgreSQL) | Conexión servidor → Supabase |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | API Key frontend | ❌ NO | — | Front no necesita cliente Supabase |
| **SUPABASE_SERVICE_ROLE_KEY** | Clave admin | ❌ NO | — | No se usan operaciones admin desde app |
| **SUPABASE_JWT_SECRET** | JWT signing | ❌ NO | — | No hay auth custom en servidor |
| **NEXT_PUBLIC_SUPABASE_URL** | URL Supabase | ❌ NO | — | Front no llama a Supabase directamente |
| **MP_ACCESS_TOKEN** | Mercado Pago | ✅ SÍ | `lib/handlers/checkout.js` | Crear preferencias de pago |
| **TURNSTILE_SECRET_KEY** | Cloudflare | ✅ SÍ | `lib/handlers/suscriptores.js` | Verificar tokens anti-bot |
| **ALLOW_PAYMENT_SIMULATION** | Flag dev | ✅ SÍ | `lib/config.js` | Simular pagos en local sin token MP |

---

## 3. DIAGRAMA DE ARQUITECTURA COMPLETO

```
╔════════════════════════════════════════════════════════════════════════════╗
║                     TIENDA DEPORTIVA CCHC v2                              ║
║                    Arquitectura de Sistemas                               ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                        CAPA 1: CLIENTE (Frontend)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  index.html (HTML estático con JS vanilla, sin frameworks)                 │
│  ├─ js/app.js (lógica de tienda, carrito, newsletter)                      │
│  ├─ css/styles.css (estilos responsive)                                    │
│  └─ Metadata y SEO                                                         │
│                                                                             │
│  NO TIENE:                                                                  │
│  ✗ Next.js / React / Vue                                                   │
│  ✗ Cliente Supabase (@supabase/supabase-js)                               │
│  ✗ Variables NEXT_PUBLIC_*                                                │
│                                                                             │
│  COMUNICA CON:                                                             │
│  → fetch() a APIs Express locales (/api/*)                               │
│  → localStorage para carrito y sesión                                      │
│  → Eventos a Google Analytics (opcional)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                    fetch /api/* (JSON request/response)
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CAPA 2: SERVIDOR (API Express.js)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  server/index.js (Express en puerto 3000)                                  │
│  │                                                                         │
│  ├─ Middleware:                                                           │
│  │  ├─ CORS headers                                                       │
│  │  ├─ Rate limiting (by IP + cookie)                                     │
│  │  ├─ Seguridad: CSP, X-Frame-Options, HTTPS headers                     │
│  │  └─ JSON parsing + error handling                                      │
│  │                                                                         │
│  ├─ RUTAS (handlers en lib/handlers/):                                    │
│  │  │                                                                      │
│  │  ├─ GET  /api/productos           → handleProductos()                  │
│  │  ├─ GET  /api/productos/:id       → handleProductoId()                 │
│  │  ├─ POST /api/suscriptores        → handleSuscriptores() + Turnstile   │
│  │  ├─ GET  /api/suscriptores/baja   → handleBaja()                       │
│  │  ├─ POST /api/visitas             → handleVisitas() + cookie ratelimit │
│  │  ├─ POST /api/eventos             → handleEventos()                    │
│  │  ├─ GET  /api/metricas            → handleMetricas()                   │
│  │  ├─ POST /api/checkout            → handleCheckout() + MP preference   │
│  │  ├─ POST /api/webhooks/mercadopago → handleWebhook() + firma HMAC      │
│  │  ├─ POST /api/dev/simular-pago    → handleSimularPago()               │
│  │  └─ GET  /media/:id               → handleMedia() (SVG categorías)     │
│  │                                                                         │
│  └─ Importa credenciales:                                                 │
│     ├─ ✅ DATABASE_URL (PostgreSQL directo)                               │
│     ├─ ✅ MP_ACCESS_TOKEN (Mercado Pago)                                  │
│     ├─ ✅ TURNSTILE_SECRET_KEY (Cloudflare)                               │
│     └─ ✅ ALLOW_PAYMENT_SIMULATION (flag desarrollo)                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                  pg.Pool / sql query execution
                                   │
        ↙                          ↓                          ↘
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ STRIPE / MERCADO │    │ SUPABASE         │    │ CLOUDFLARE       │
│    PAGO          │    │ PostgreSQL       │    │  Turnstile/WAF   │
└──────────────────┘    └──────────────────┘    └──────────────────┘
        │                        │                         │
        │                        │                         │
   POST request        pg.Pool Connection         HTTPS verification
   /api/checkout       dpsvguapsqpqlpajkmni       Webhook signature
                       .supabase.co               validation
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              CAPA 3: BASE DE DATOS (Supabase PostgreSQL)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Servidor: aws-0-us-east-1.pooler.supabase.com:6543                       │
│  Database: postgres                                                        │
│  User: postgres.dpsvguapsqpqlpajkmni                                       │
│                                                                             │
│  TABLAS (schema.sql):                                                      │
│  ├─ categorias          (5 registros: running, futbol, gimnasio, etc.)    │
│  ├─ productos           (20 registros con precio, stock, evaluación)      │
│  ├─ producto_imagenes   (metadatos de imágenes, URLs)                     │
│  ├─ suscriptores        (correos, tokens baja, consentimiento)            │
│  ├─ pedidos             (estado, monto, referencia MP)                     │
│  ├─ pedido_items        (lineas del pedido, snapshot de precio)           │
│  ├─ visitas_contador    (contador atómico por cookie)                     │
│  └─ eventos             (page_view, add_to_cart, purchase, etc.)          │
│                                                                             │
│  DATOS CRÍTICOS:                                                          │
│  ✅ Dinero (pedidos, precios)                                             │
│  ✅ Stock (cantidad disponible)                                            │
│  ✅ Clientes (suscriptores)                                                │
│  ✅ Pagos (referencia a MP)                                                │
│  ✗ Fotos (van a Cloudflare R2 en v3)                                      │
│  ✗ Archivos pesados (BYTEA prohibido)                                     │
│                                                                             │
│  CREDENCIAL USADA:                                                        │
│  DATABASE_URL=postgres://postgres.dpsvguapsqpqlpajkmni:***@               │
│  aws-0-us-east-1.pooler.supabase.com:6543/postgres                        │
│                                                                             │
│  NO USADAS:                                                               │
│  ✗ NEXT_PUBLIC_SUPABASE_ANON_KEY  (sería para cliente en front)           │
│  ✗ SUPABASE_SERVICE_ROLE_KEY      (sería para admin operations)           │
│  ✗ SUPABASE_JWT_SECRET            (sería para auth custom)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                    INSERT/UPDATE/SELECT SQL
                                   │
        ↙                          │                          ↘
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Logs (stdout)    │    │ Backups auto     │    │ Monitoring       │
│ (Vercel/local)   │    │ (Supabase)       │    │ (Supabase dash)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘

```

---

## 4. FLUJOS DE DATOS PRINCIPALES

### Flujo 1: Consulta de Productos

```
Front: GET /api/productos
  ↓
Express: handleProductos()
  ├─ query: SELECT * FROM productos WHERE activo=true
  ├─ JOIN categorias c ON c.id = p.categoria_id
  └─ query: SELECT * FROM producto_imagenes WHERE producto_id=?
  ↓
Supabase: Retorna JSON
  ↓
Front: JSON.parse() y renderiza grid de productos
```

### Flujo 2: Newsletter (Suscriptor)

```
Front: POST /api/suscriptores { correo, consentimiento, turnstileToken }
  ↓
Express: handleSuscriptores()
  ├─ Verifica turnstileToken con Cloudflare
  ├─ Valida correo con regex
  ├─ Normaliza: trim + toLowerCase
  └─ INSERT INTO suscriptores (correo, consentimiento_at, token_baja)
  ↓
Supabase: UNIQUE constraint en correo (no duplica)
  ↓
Express: Registra evento: { nombre: 'newsletter_signup', payload: {...} }
  ↓
Front: Muestra "¡Suscrito!"
```

### Flujo 3: Checkout → Pago

```
Front: POST /api/checkout { items, correo, nombre, direccion }
  ↓
Express: handleCheckout()
  ├─ Valida correo
  ├─ Para cada item:
  │  ├─ SELECT precio, stock FROM productos WHERE id=?
  │  ├─ Verifica stock >= cantidad (en servidor, no cliente)
  │  └─ Calcula subtotal
  ├─ Calcula despacho: if subtotal >= 59990 → 0; else → 4990
  ├─ INSERT INTO pedidos (codigo, estado='pendiente', subtotal, total)
  ├─ INSERT INTO pedido_items x N (snapshot de precio)
  ├─ Si MP_ACCESS_TOKEN:
  │  └─ POST a MP API crear preferencia
  └─ Si no MP: redirige a /pago/pendiente.html?codigo=CCHC-ABC
  ↓
Supabase: Almacena pedido pendiente
  ↓
Front: Redirige a Mercado Pago o simulación local
```

### Flujo 4: Webhook MP → Confirmación de Pago

```
Mercado Pago: POST /api/webhooks/mercadopago { data.id, x-signature }
  ↓
Express: handleWebhook()
  ├─ Verifica firma HMAC-SHA256 (seguridad)
  ├─ GET payment details de MP API
  ├─ Busca pedido por external_reference (codigo)
  ├─ Si status='approved':
  │  ├─ Llama completarPagoAprobado()
  │  ├─ UPDATE pedidos SET estado='pagado', mp_payment_id=?
  │  ├─ UPDATE productos SET stock = stock - ? (idempotente por mp_payment_id)
  │  └─ INSERT INTO eventos { nombre: 'purchase', valor_clp, ... }
  └─ Si status='rejected': UPDATE estado='rechazado'
  ↓
Supabase: Stock actualizado atómicamente (WHERE estado='pendiente')
  ↓
Front: Página /pago/exito.html o /pago/fallo.html
```

---

## 5. FLUJO DE DESPLIEGUE (v2 → PRODUCCIÓN)

```
Local                    GitHub                    Vercel (Prod)
├─ npm run dev  ────→  git push main  ────→  Auto-deploy
├─ .env (local)         └─ gitignored             ├─ Env vars:
├─ PGlite/Supabase         (no sube)              │  ├─ DATABASE_URL ✅
└─ Servidor 3000                                  │  ├─ MP_ACCESS_TOKEN
                                                   │  ├─ TURNSTILE_* ✅
                                          Build:   │  └─ ALLOW_PAYMENT...=false
                                          ├─ npm install
                                          ├─ npm run build (si aplica)
                                          └─ npm run dev (en Vercel Functions)
                                          
                                          Runtime:
                                          └─ Conecta a Supabase PostgreSQL
                                             con DATABASE_URL
```

---

## 6. RESUMEN: ¿POR QUÉ NO SE USA NEXT_PUBLIC_SUPABASE_ANON_KEY?

| Aspecto | Razón |
|---|---|
| **Arquitectura** | Express backend hace queries directo a PostgreSQL. Front no accede BD. |
| **Stack** | HTML/CSS/JS vanilla, no Next.js. NEXT_PUBLIC prefijo no es relevante. |
| **Seguridad** | Tokens en cliente = riesgo. Express encapsula toda lógica. |
| **Patrón** | Server-driven API (como GraphQL, REST). No RPC client-side. |
| **Escalabilidad** | Rate limits, validaciones, lógica de negocio en servidor. Front es solo UI. |

### Cuándo SÍ se usaría:

- Si fuera **Next.js** + Supabase client en el navegador (js-sdk)
- Si el front hiciera queries directo a BD (tipo Firebase, Amplify)
- Si usara row-level security (RLS) en Supabase

Pero **aquí: NO aplica**. El proyecto es arquitectura tradicional servidor → BD.

---

## 7. CONCLUSIÓN

```
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY   → Presente en .env pero NO CONSUMIDA
✅ DATABASE_URL                     → Consumida por Express → Supabase
✅ Arquitectura es segura           → Backend maneja todo
✅ Listo para producción            → Vercel + Supabase
```

**Si necesitas frontend directo a Supabase**: Tendrías que reescribir a Next.js + Supabase client, pero NO es necesario para esta tienda. El design actual es mejor.
