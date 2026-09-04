# Guía de Deploy: Vercel + Supabase PostgreSQL

Este documento describe cómo desplegar la tienda deportiva CCHC a producción en Vercel con Supabase como base de datos PostgreSQL.

## Requisitos previos

1. **Cuenta Vercel**: https://vercel.com
2. **Proyecto Supabase**: https://supabase.com con PostgreSQL activo
3. **Mercado Pago**: Credenciales de producción (access token, public key, webhook secret)
4. **Cloudflare Turnstile**: Claves para verificación de formularios
5. **Dominio**: tiendadeportivacchc.cl (o similar) en Vercel

---

## Paso 1: Preparar Supabase PostgreSQL

### 1.1 Obtener credenciales de conexión

1. Ir a **Supabase Dashboard** → Proyecto → **Settings** → **Database**
2. Copiar la cadena de conexión bajo "Connection String":
   - Usar la versión con **pgbouncer** (pooling recomendado para Vercel)
   - Ejemplo: `postgresql://postgres.XXXX:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`
3. **Guardar** esta URL (la usaremos en Vercel)

### 1.2 Crear tablas y seed (opcional)

Si Supabase está vacía, ejecutar en el SQL Editor de Supabase:

```sql
-- Ver archivo lib/schema.sql en este repo
-- Copiar y ejecutar el schema completo
```

O dejar que la API lo ejecute automáticamente en el primer request (está configurado en `lib/db.js`).

---

## Paso 2: Preparar credenciales de terceros

### 2.1 Mercado Pago (Production)

1. Ir a https://www.mercadopago.com.ar/settings/account/credentials
2. Activar modo producción (cambiar de sandbox a live)
3. Copiar:
   - **MP_ACCESS_TOKEN**: Token de acceso (APP_USR_...)
   - **MP_PUBLIC_KEY**: Clave pública (APP_USR_...)
   - **MP_WEBHOOK_SECRET**: Secreto para verificar webhooks

### 2.2 Cloudflare Turnstile

1. Ir a https://dash.cloudflare.com → Turnstile
2. Crear o seleccionar sitio
3. Copiar:
   - **TURNSTILE_SITE_KEY**: Clave del sitio (pública)
   - **TURNSTILE_SECRET_KEY**: Clave secreta (solo servidor)

---

## Paso 3: Conectar repositorio a Vercel

### 3.1 Crear proyecto en Vercel

1. Ir a https://vercel.com/new
2. Seleccionar "Import Git Repository"
3. Conectar repositorio: `cherrera0001/tiendadeportivacchc.cl`
4. Vercel detectará automáticamente que es un proyecto Node.js

### 3.2 Configurar variables de entorno

En la página de configuración del proyecto, ir a **Settings** → **Environment Variables** y añadir:

#### Variables de Producción (Environment: Production)

```
PORT=3000
PUBLIC_SITE_URL=https://tiendadeportivacchc.cl
DATABASE_URL=postgresql://postgres.XXXX:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
MP_ACCESS_TOKEN=APP_USR_XXXXXXXXXXXXXXXXXXXXXXX
MP_PUBLIC_KEY=APP_USR_XXXXXXXXXXXXXXXXXXXXXXX
MP_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXX
TURNSTILE_SECRET_KEY=0x4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
TURNSTILE_SITE_KEY=1x00000000000000000000AA
ALLOW_PAYMENT_SIMULATION=false
NODE_ENV=production
```

#### Variables de Preview/Staging (Environment: Preview)

```
DATABASE_URL=postgresql://postgres.XXXX:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
MP_ACCESS_TOKEN=APP_USR_XXXXXXXXXXXXXXXXXXXXXXX (testing/sandbox si disponible)
ALLOW_PAYMENT_SIMULATION=false
NODE_ENV=production
```

#### Variables de Desarrollo (Environment: Development)

```
DATABASE_URL= (dejar vacío para PGlite local)
ALLOW_PAYMENT_SIMULATION=true
NODE_ENV=development
```

---

## Paso 4: Configurar webhook de Mercado Pago

### 4.1 URL de webhook

En Mercado Pago, ir a **Account Settings** → **Webhooks** → **Payments**

Registrar URL:
```
https://tiendadeportivacchc.cl/api/webhooks/mercadopago
```

O si aún no tiene dominio:
```
https://<proyecto>.vercel.app/api/webhooks/mercadopago
```

### 4.2 Eventos a escuchar

- `payment.created`
- `payment.updated`

---

## Paso 5: Deploy inicial

### 5.1 Trigger automático

Una vez conectado, Vercel desplegará automáticamente cuando hagas push a `main`.

### 5.2 Deploy manual (opcional)

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Paso 6: Verificar deploy

### 6.1 Comprobar estado en Vercel

1. Ir a https://vercel.com/dashboard
2. Ver logs en **Deployments** → último deployment → **View Function Logs**

### 6.2 Probar endpoints básicos

```bash
# Productos
curl -s https://tiendadeportivacchc.cl/api/productos | jq

# Métricas (sin auth)
curl -s https://tiendadeportivacchc.cl/api/metricas | jq

# Health check (si existe)
curl -s https://tiendadeportivacchc.cl/
```

### 6.3 Probar Mercado Pago

1. Ir a https://tiendadeportivacchc.cl
2. Agregar un producto al carrito
3. Hacer clic en "Pagar"
4. MP debe redirigir a checkout

### 6.4 Probar webhook

```bash
# En local, simular un webhook:
curl -X POST https://tiendadeportivacchc.cl/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=ABC..." \
  -d '{"data":{"id":"1234567890"},"type":"payment"}'
```

---

## Paso 7: Post-deploy (importante)

### 7.1 Revisar logs de producción

```bash
vercel logs --prod
```

Buscar errores de conexión a BD, webhooks, etc.

### 7.2 Probar carrito + checkout completo

1. Agregar producto
2. Llenar correo y dirección
3. Pagar (monto pequeño si es posible)
4. Verificar que se registró en BD (tabla `pedidos`)

### 7.3 Configurar dominio

En Vercel:
1. **Settings** → **Domains**
2. Añadir `tiendadeportivacchc.cl`
3. Apuntar DNS según instrucciones de Vercel

---

## Troubleshooting

### Error: "DATABASE_URL is not set"

**Causa**: Variable de entorno no está configurada en Vercel

**Solución**:
```bash
vercel env pull .env.local
# Editar .env.local con credenciales de Supabase
vercel env add DATABASE_URL
```

### Error: "PGLITE not available in Vercel"

**Causa**: Vercel intenta usar PGlite (solo para local) en producción

**Solución**: Asegurarse de que `DATABASE_URL` esté configurado en Vercel

### Error: "Webhook signature invalid"

**Causa**: `MP_WEBHOOK_SECRET` no coincide con Mercado Pago

**Solución**:
1. Copiar exactamente el secreto de MP Dashboard
2. Vercel env: `vercel env add MP_WEBHOOK_SECRET <secret>`
3. Redeploy

### Error: "413 Payload Too Large"

**Causa**: Request > 256KB (límite en `server/index.js`)

**Solución**: Aumentar límite en `express.json()` si es necesario (ver `server/index.js` línea 27)

---

## Monitoreo en producción

### Logs en tiempo real

```bash
vercel logs --prod --follow
```

### Alertas recomendadas

En Vercel Dashboard → **Settings** → **Notifications**:
- [ ] Failed deployments
- [ ] Production environment errors
- [ ] Custom thresholds (response time > 1s)

### Base de datos

En Supabase → **SQL Editor** → Query para revisar:

```sql
-- Últimos pedidos
SELECT id, codigo, total, estado, created_at FROM pedidos ORDER BY created_at DESC LIMIT 10;

-- Errores de stock
SELECT producto_id, stock FROM productos WHERE stock < 5;
```

---

## Rollback (emergencia)

Si algo sale mal en producción:

```bash
vercel list --prod
vercel rollback <deployment-url>
```

O revertiir commit en GitHub (Vercel redesplegará automáticamente).

---

## Variables de entorno completas (referencia)

| Variable | Obligatorio | Desarrollo | Producción | Ejemplo |
|----------|-----------|-----------|-----------|---------|
| `PORT` | No | 3000 | 3000 | 3000 |
| `PUBLIC_SITE_URL` | **Sí** | http://localhost:3000 | https://tiendadeportivacchc.cl | URL pública |
| `DATABASE_URL` | No (local si vacío) | (vacío) | postgresql://... (Supabase) | Conn string |
| `MP_ACCESS_TOKEN` | **Sí** en prod | (vacío) | APP_USR_... | Token Mercado Pago |
| `MP_PUBLIC_KEY` | **Sí** en prod | (vacío) | APP_USR_... | Clave pública MP |
| `MP_WEBHOOK_SECRET` | **Sí** en prod | (vacío) | whsec_... | Secreto MP |
| `TURNSTILE_SITE_KEY` | No | (vacío) | 1x... | Cloudflare público |
| `TURNSTILE_SECRET_KEY` | No | (vacío) | 0x... | Cloudflare secreto |
| `ALLOW_PAYMENT_SIMULATION` | No | true | false | Simular pago |
| `NODE_ENV` | No | development | production | Entorno |

---

## Checklist final

- [ ] Supabase PostgreSQL está activo y accesible
- [ ] DATABASE_URL funciona desde local (`npm run dev`)
- [ ] Mercado Pago está en modo producción
- [ ] Turnstile está configurado (opcional pero recomendado)
- [ ] Vercel está conectado al repositorio
- [ ] Todas las variables de entorno están en Vercel
- [ ] Webhook de MP apunta a URL correcta
- [ ] Primer deploy completó exitosamente
- [ ] Endpoints `/api/productos` y `/api/metricas` responden
- [ ] Checkout completo funciona (agregar + pagar)
- [ ] Base de datos registra pedidos correctamente

---

## Soporte

Para problemas específicos, revisar:
- `CLAUDE.md` — arquitectura y decisiones del proyecto
- `spec.md` — funcionalidades por módulo
- `docs/arquitectura-datos.md` — modelo de datos
- Logs de Vercel: `vercel logs --prod`
- Logs de Supabase: Dashboard → **Logs**
