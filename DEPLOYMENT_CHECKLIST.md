# Checklist de Deploy a Vercel + Supabase

Completar todos los puntos antes de hacer push a `main` o deployment en Vercel.

## ✅ Verificación Local

- [ ] Repositorio está limpio: `git status` muestra solo cambios deseados
- [ ] Servidor local funciona: `npm run dev`
- [ ] PGlite se inicia sin errores en la consola
- [ ] Pruebas básicas en local:
  - [ ] `GET http://localhost:3000/api/productos` → responde JSON
  - [ ] `GET http://localhost:3000/api/metricas` → responde JSON
  - [ ] `POST http://localhost:3000/api/visitas` → incrementa contador
  - [ ] Cargar home en `http://localhost:3000` → no hay errores en consola

## 🗄️ Supabase

- [ ] Proyecto Supabase está activo: https://supabase.com/dashboard
- [ ] PostgreSQL está corriendo (status = "Available")
- [ ] Copiar Connection String con **pgbouncer**:
  - [ ] Formato: `postgresql://postgres.XXXX:YYYY@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
  - [ ] **NO** usar la versión sin pgbouncer (puerto 5432)
- [ ] (Opcional) Ejecutar schema en SQL Editor de Supabase (o dejar que la API lo haga)
- [ ] Probar conexión desde local:
  ```bash
  DATABASE_URL="postgresql://..." npm run dev
  # Verificar que se conecta sin errores
  ```

## 💳 Mercado Pago

- [ ] Cuenta Mercado Pago verificada: https://www.mercadopago.com
- [ ] Modo de producción activado (NO sandbox):
  - [ ] URL: https://www.mercadopago.com/settings/account/credentials
  - [ ] Ver "Modo de producción" (no Sandbox)
- [ ] Credenciales de producción copiadas:
  - [ ] `MP_ACCESS_TOKEN` (comienza con `APP_USR_`)
  - [ ] `MP_PUBLIC_KEY` (también comienza con `APP_USR_`)
  - [ ] `MP_WEBHOOK_SECRET` (comienza con `whsec_`)
- [ ] Webhook de MP configurado:
  - [ ] URL: `https://tiendadeportivacchc.cl/api/webhooks/mercadopago`
  - [ ] Eventos: `payment.created`, `payment.updated`

## 🛡️ Cloudflare Turnstile (recomendado)

- [ ] Sitio Turnstile creado: https://dash.cloudflare.com → Turnstile
- [ ] Clave del sitio (pública) copiada: `TURNSTILE_SITE_KEY`
- [ ] Clave secreta copiada: `TURNSTILE_SECRET_KEY`
- [ ] Verificar que funciona en local (opcional)

## 🌐 Vercel

- [ ] Cuenta Vercel creada: https://vercel.com
- [ ] Repositorio conectado:
  - [ ] URL: https://github.com/cherrera0001/tiendadeportivacchc.cl
  - [ ] Vercel tiene acceso a lectura
- [ ] Proyecto creado en Vercel:
  - [ ] Name: `tienda-deportiva-cchc` (o similar)
  - [ ] Framework: Node.js (Vercel detecta automáticamente)
  - [ ] Root directory: `.` (raíz del repo)
- [ ] Variables de entorno configuradas en Vercel → Settings → Environment Variables:

### Production (Environment: Production)
- [ ] `PORT=3000`
- [ ] `PUBLIC_SITE_URL=https://tiendadeportivacchc.cl`
- [ ] `DATABASE_URL=postgresql://postgres.XXXX:...` (de Supabase)
- [ ] `MP_ACCESS_TOKEN=APP_USR_...`
- [ ] `MP_PUBLIC_KEY=APP_USR_...`
- [ ] `MP_WEBHOOK_SECRET=whsec_...`
- [ ] `TURNSTILE_SECRET_KEY=0x4AAA...` (si usas Turnstile)
- [ ] `TURNSTILE_SITE_KEY=1x0000...` (si usas Turnstile)
- [ ] `ALLOW_PAYMENT_SIMULATION=false`
- [ ] `NODE_ENV=production`

### Preview (Environment: Preview)
- [ ] Mismas variables que Production (o sandbox si prefieres testing)

### Development (Environment: Development)
- [ ] `DATABASE_URL=` (vacío para PGlite local)
- [ ] `ALLOW_PAYMENT_SIMULATION=true`
- [ ] `NODE_ENV=development`

## 🔐 Seguridad pre-deploy

- [ ] **NO hay secretos en .env** (credenciales en Vercel, no en git)
- [ ] **NO há `MP_ACCESS_TOKEN` en JavaScript** (solo servidor)
- [ ] **NO hay keys de Supabase en el cliente** (solo en servidor)
- [ ] `.gitignore` incluye:
  - [ ] `.env`
  - [ ] `.env.local`
  - [ ] `data/` (base de datos local PGlite)
  - [ ] `node_modules/`
- [ ] `vercel.json` está configurado con CSP y headers de seguridad

## 📋 Código

- [ ] Todos los archivos de API están en `/api/`:
  - [ ] `api/productos.js`
  - [ ] `api/productos/[id].js`
  - [ ] `api/suscriptores.js`
  - [ ] `api/suscriptores/baja.js`
  - [ ] `api/visitas.js`
  - [ ] `api/eventos.js`
  - [ ] `api/metricas.js`
  - [ ] `api/checkout.js`
  - [ ] `api/webhooks/mercadopago.js`
  - [ ] `api/dev/simular-pago.js` (solo desarrollo)
  - [ ] `api/media.js`
- [ ] Todos usan `export default async function handler(req, res)`
- [ ] `lib/db.js` usa `DATABASE_URL` si está disponible
- [ ] No hay `server/index.js` ejecutándose en Vercel (solo imports)
- [ ] `package.json`:
  - [ ] `"type": "module"` (ESM)
  - [ ] `"start"` script presente

## 📦 Git

- [ ] Branch principal es `main`
- [ ] Todos los cambios están committeados: `git status` limpio
- [ ] Commit message sigue formato: `M0: descripción`
- [ ] No hay cambios sin push:
  ```bash
  git push origin main
  ```

## 🚀 Deploy inicial

- [ ] Ir a https://vercel.com/dashboard
- [ ] Clickear en proyecto
- [ ] Debería estar haciendo deploy automáticamente (o clickear "Redeploy")
- [ ] Ver logs: **Deployments** → último → **View Function Logs**
- [ ] Esperar a que termine (status = "Ready")

## ✔️ Post-deploy

### Inmediato
- [ ] Status en Vercel es "Ready" (no "Error")
- [ ] Logs no muestran errores de DATABASE_URL
- [ ] URL de preview o producción es accesible

### Pruebas funcionales
- [ ] `https://tiendadeportivacchc.cl/api/productos` → responde JSON
- [ ] `https://tiendadeportivacchc.cl/api/metricas` → responde JSON
- [ ] Home carga sin errores: `https://tiendadeportivacchc.cl`
- [ ] Checkout funciona:
  1. Agregar producto al carrito
  2. Llenar correo y dirección
  3. Clickear "Pagar"
  4. MP redirige a checkout
  5. (Opcional: pagar con tarjeta de prueba de MP)
- [ ] Webhook de MP funciona:
  - [ ] Ir a MP Dashboard → Webhooks → "Re-entregar eventos"
  - [ ] Ver que no hay errores en Vercel logs

### Base de datos
- [ ] Conectar a Supabase desde SQL Editor:
  ```sql
  SELECT COUNT(*) FROM productos;
  SELECT COUNT(*) FROM pedidos;
  SELECT * FROM pedidos ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Datos están siendo registrados correctamente

### Monitoreo
- [ ] Activar alertas en Vercel:
  - [ ] Settings → Notifications
  - [ ] Failed deployments
  - [ ] Production errors
- [ ] En Supabase:
  - [ ] Monitoring → Logs
  - [ ] Alertar si hay errores de conexión

## 🆘 Si algo falla

1. **Revisar logs de Vercel**:
   ```bash
   vercel logs --prod
   ```

2. **Revisar logs de Supabase**:
   - Dashboard → Logs → Query Performance

3. **Verificar variables de entorno**:
   ```bash
   vercel env list
   ```

4. **Verificar conexión a BD**:
   - Testear `DATABASE_URL` localmente

5. **Rollback** si es necesario:
   ```bash
   vercel rollback
   ```

## 📞 Checklist final (antes de marcar como listo)

- [ ] ✅ Todos los puntos anteriores completados
- [ ] ✅ Sin errores en consola (local y Vercel)
- [ ] ✅ Funcionalidades core funcionan (catálogo, checkout, métricas)
- [ ] ✅ Base de datos está siendo actualizada
- [ ] ✅ Webhooks funcionan
- [ ] ✅ Deploy está listo para ir live

---

**Completado por**: ________________  
**Fecha**: _______________  
**URL de producción**: https://tiendadeportivacchc.cl  
**URL de Vercel**: https://tienda-deportiva-cchc.vercel.app  
