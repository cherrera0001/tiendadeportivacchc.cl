# Quick Start: Deploy Vercel + Supabase en 10 pasos

## 1. Obtener CONNECTION STRING de Supabase

```
Supabase Dashboard → Settings → Database → Connection Pooling
Copiar: postgresql://postgres.XXXX:YYYY@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

## 2. Obtener credenciales Mercado Pago (Production)

```
https://www.mercadopago.com/settings/account/credentials (Modo Live)
Copiar: MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET
```

## 3. Obtener claves Turnstile (Cloudflare)

```
https://dash.cloudflare.com → Turnstile
Copiar: TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
```

## 4. Conectar Vercel al repositorio

```
https://vercel.com/new
Seleccionar: cherrera0001/tiendadeportivacchc.cl
Framework: Node.js (auto-detectado)
```

## 5. Añadir variables de entorno en Vercel

**Environment: Production**

```
PORT=3000
PUBLIC_SITE_URL=https://tiendadeportivacchc.cl
DATABASE_URL=postgresql://postgres.XXXX:YYYY@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
MP_ACCESS_TOKEN=APP_USR_...
MP_PUBLIC_KEY=APP_USR_...
MP_WEBHOOK_SECRET=whsec_...
TURNSTILE_SECRET_KEY=0x4AAA...
TURNSTILE_SITE_KEY=1x0000...
ALLOW_PAYMENT_SIMULATION=false
NODE_ENV=production
```

## 6. Configurar webhook en Mercado Pago

```
Ir a: https://www.mercadopago.com/settings/account/webhooks
Registrar URL: https://tiendadeportivacchc.cl/api/webhooks/mercadopago
Eventos: payment.created, payment.updated
```

## 7. Verificar dominio en Vercel

```
Vercel Dashboard → Settings → Domains
Añadir: tiendadeportivacchc.cl
Seguir instrucciones de DNS
```

## 8. Hacer push a main

```bash
git add .
git commit -m "Deploy: configuración Vercel + Supabase"
git push origin main
```

Vercel desplegará automáticamente.

## 9. Esperar deploy y verificar

```bash
vercel logs --prod
```

Buscar errores de:
- DATABASE_URL no disponible
- MP_ACCESS_TOKEN no configurado
- TURNSTILE_SECRET_KEY no configurado

## 10. Pruebas post-deploy

```bash
# Productos
curl https://tiendadeportivacchc.cl/api/productos

# Métricas
curl https://tiendadeportivacchc.cl/api/metricas

# Visitas (debe contar)
curl -X POST https://tiendadeportivacchc.cl/api/visitas
```

---

## Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| 502 Bad Gateway | Revisar logs Vercel: `vercel logs --prod` |
| DATABASE_URL error | Copiar exacto de Supabase (con pgbouncer) |
| Webhook rechazado | Verificar MP_WEBHOOK_SECRET exacto |
| Turnstile falla | Verificar TURNSTILE_SECRET_KEY en Vercel |
| Productos no carga | Supabase no tiene datos; ejecutar schema o esperar seed automático |

---

## URLs útiles

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard
- Mercado Pago: https://www.mercadopago.com/settings/account/credentials
- Cloudflare: https://dash.cloudflare.com

---

**Tiempo estimado**: 15-20 minutos (si tienes todas las credenciales listas)
