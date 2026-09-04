# 🔧 Configuración de Variables de Entorno

## 📋 Archivos de configuración

### `.env` (Credenciales Supabase Production - en .gitignore)
Contiene las credenciales reales de Supabase en producción. **NUNCA commitear.**

```env
DATABASE_URL=postgres://postgres.dpsvguapsqpqlpajkmni:mIYx7ymCnU4Ogk8o@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

NEXT_PUBLIC_SUPABASE_URL=https://dpsvguapsqpqlpajkmni.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# (más credenciales...)
```

### `.env.local` (Desarrollo Local - en .gitignore)
Usa PGlite en local sin DATABASE_URL. Creado automáticamente.

```env
PORT=3000
PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
# DATABASE_URL está VACÍO (usa PGlite)
ALLOW_PAYMENT_SIMULATION=true
```

### `.env.production.example` (Template para Vercel)
Plantilla documentada de variables para Vercel production.

---

## 🚀 Flujo de configuración

### Desarrollo Local
```bash
# 1. Cargar .env.local (si existe) o .env con DATABASE_URL vacío
# 2. PGlite se usa automáticamente
# 3. Datos locales en /data/pglite/

npm run dev
# http://localhost:3000
```

### Vercel Preview/Staging
```bash
# 1. Crear rama staging
git checkout -b staging

# 2. Vercel automáticamente despliega preview
# URL: https://tienda-deportiva-staging.vercel.app

# 3. Variables en Vercel (Environment: Preview):
DATABASE_URL=postgres://... (Supabase)
ALLOW_PAYMENT_SIMULATION=false (si quieres usar MP sandbox)
```

### Vercel Production (main)
```bash
# 1. Push a main
git push origin main

# 2. Vercel automáticamente despliega
# URL: https://tiendadeportivacchc.cl (o dominio custom)

# 3. Variables en Vercel (Environment: Production):
DATABASE_URL=postgres://... (Supabase)
MP_ACCESS_TOKEN=APP_USR_... (Mercado Pago live)
MP_PUBLIC_KEY=APP_USR_...
MP_WEBHOOK_SECRET=whsec_...
ALLOW_PAYMENT_SIMULATION=false
```

---

## 🔑 Credenciales Supabase (Guardadas en .env)

```
Proyecto: dpsvguapsqpqlpajkmni
URL: https://dpsvguapsqpqlpajkmni.supabase.co

Usuario: postgres
Contraseña: mIYx7ymCnU4Ogk8o
Host: db.dpsvguapsqpqlpajkmni.supabase.co

Connection String (pgbouncer para Vercel):
postgres://postgres.dpsvguapsqpqlpajkmni:mIYx7ymCnU4Ogk8o@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💾 Jerarquía de carga

Node.js carga variables en este orden:

1. **Proceso** (variables del sistema)
2. **.env.local** (si existe, desarrollo local)
3. **.env** (credenciales de producción)
4. **Defaults en código**

---

## ✅ Verificación

### Local (PGlite)
```bash
npm run dev
# Logs: "usando PGlite" o similar
# BD local en: /data/pglite/
```

### Vercel
```bash
vercel logs --prod
# Logs: "conectado a postgres://..." (URL de Supabase)
```

---

## 🚨 Importante

- **NUNCA** commitear `.env` (contiene credenciales reales)
- **NUNCA** usar credenciales de producción en desarrollo
- **SIEMPRE** usar .env.local para desarrollo local
- **SIEMPRE** configurar variables en Vercel Settings (no en .env)

---

## 📞 Troubleshooting

### "DATABASE_URL no está configurada"
→ Usar .env.local (PGlite local) o verifica .env tiene DATABASE_URL

### "Error conectando a Supabase" en local
→ Normal en Windows con pgbouncer. Usa .env.local con PGlite en local.

### "Database error en Vercel"
→ Verifica que DATABASE_URL está configurada en Vercel Settings

---

**Resumen**: 
- **Local**: .env.local (PGlite)
- **Vercel**: Variables en Settings (Supabase real)
