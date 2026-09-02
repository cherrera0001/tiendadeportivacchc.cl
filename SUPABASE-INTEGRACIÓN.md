# Integración Supabase — PostgreSQL en la nube

**Objetivo**: Reemplazar PGlite local con PostgreSQL en Supabase para desarrollo y producción.

---

## 1. OBTENER CREDENCIALES DE SUPABASE

### Crear un proyecto en Supabase

1. Ve a https://supabase.com/dashboard
2. Clic en **"New Project"**
3. Completa:
   - **Project Name**: `tienda-deportiva-cchc`
   - **Database Password**: Crea una contraseña fuerte (guárdala)
   - **Region**: `South America (São Paulo)` (más cercano a Chile)
   - **Pricing Plan**: `Free` (suficiente para MVP)
4. Clic en **"Create new project"** (espera 2-3 min)

### Obtener CONNECTION STRING

Una vez creado el proyecto:

1. Ve a **Settings** → **Database** (esquina inferior izquierda)
2. Busca **"Connection string"** y selecciona **"URI"**
3. Copia la string que parece así:
   ```
   postgresql://postgres:TU_PASSWORD@db.XXXXXXXXXXXX.supabase.co:5432/postgres
   ```
4. **REEMPLAZA `TU_PASSWORD`** con la contraseña que creaste

---

## 2. VARIABLES DE ENTORNO REQUERIDAS

Actualiza tu `.env` con estas variables:

```env
# ========== SERVIDOR LOCAL ==========
PORT=3000
PUBLIC_SITE_URL=http://localhost:3000

# ========== BASE DE DATOS POSTGRESQL (Supabase) ==========
# Si está vacío → usa PGlite local
# Si tiene valor → conecta a Supabase
DATABASE_URL=postgresql://postgres:PASSWORD_AQUI@db.XXXXXXXXXXXX.supabase.co:5432/postgres

# ========== MERCADO PAGO ==========
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=

# ========== CLOUDFLARE TURNSTILE ==========
TURNSTILE_SECRET_KEY=
TURNSTILE_SITE_KEY=

# ========== DESARROLLO ==========
ALLOW_PAYMENT_SIMULATION=true
```

---

## 3. PROCESO DE INTEGRACIÓN

### Opción A: Usar Supabase desde el principio (RECOMENDADO)

```bash
# 1. Actualiza .env con DATABASE_URL de Supabase
# 2. Reinicia servidor local:
npm run dev

# El servidor automáticamente:
# ✅ Detectará DATABASE_URL
# ✅ Conectará a Supabase (no PGlite)
# ✅ Ejecutará schema.sql (crearará tablas)
# ✅ Ejecutará seed.sql (insertará 20 productos)
```

### Opción B: Migrar de PGlite a Supabase

```bash
# 1. Exporta datos de PGlite (si los necesitas)
#    (Supabase comienza con BD vacía)

# 2. Actualiza .env con DATABASE_URL

# 3. Reinicia servidor
npm run dev

# 4. Verifica que tablas y datos están en Supabase:
curl http://localhost:3000/api/productos
# Debe retornar 20 productos (seed automático)
```

---

## 4. VERIFICAR CONEXIÓN

### Desde Node.js (servidor local)

```bash
npm run dev
# Deberías ver en logs:
# "Cámara CCHC en http://localhost:3000"
```

### Desde tu aplicación

```bash
# Listar productos (verifica BD)
curl http://localhost:3000/api/productos

# Ver contador de visitas
curl -X POST http://localhost:3000/api/visitas

# Ver métricas
curl http://localhost:3000/api/metricas
```

### Desde Supabase Dashboard

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Clic en **"SQL Editor"**
3. Escribe:
   ```sql
   SELECT COUNT(*) FROM productos;
   SELECT COUNT(*) FROM suscriptores;
   SELECT COUNT(*) FROM pedidos;
   ```
4. Ejecuta y verifica que los datos están ahí

---

## 5. VERIFICACIÓN DE INTEGRIDAD

| Tabla | Registros esperados | Cómo verificar |
|---|---|---|
| `categorias` | 5 | `SELECT * FROM categorias;` |
| `productos` | 20 | `SELECT * FROM productos;` |
| `producto_imagenes` | ≥ 20 | `SELECT * FROM producto_imagenes;` |
| `suscriptores` | 0+ | `SELECT * FROM suscriptores;` |
| `pedidos` | 0+ | `SELECT * FROM pedidos;` |
| `visitas_contador` | 1 | `SELECT * FROM visitas_contador;` |
| `eventos` | 0+ | `SELECT * FROM eventos;` |

---

## 6. TROUBLESHOOTING

### Error: "ECONNREFUSED" o "connect ECONNREFUSED"

**Causa**: No puede conectar a Supabase  
**Solución**:
- Verifica que `DATABASE_URL` está correcta en `.env`
- Verifica que reemplazaste `PASSWORD_AQUI` con tu contraseña
- Verifica que copiaste la URL completa sin espacios
- Intenta de nuevo: `npm run dev`

### Error: "password authentication failed"

**Causa**: Contraseña incorrecta en DATABASE_URL  
**Solución**:
- Ve a Supabase Dashboard → Settings → Database
- Copia nuevamente la Connection String
- Reemplaza la URL en `.env`

### Tabla no existe / Schema no se crea

**Causa**: Schema.sql no se ejecutó  
**Solución**:
- Verifica que `lib/schema.sql` existe
- Verifica que `lib/db.js` está ejecutando `db.exec(sql)`
- Elimina carpeta `data/` (si la hay)
- Reinicia: `npm run dev`

---

## 7. DIFERENCIAS LOCALES vs SUPABASE

| Aspecto | PGlite (Local) | Supabase |
|---|---|---|
| **Ubicación** | Archivo `data/pglite` | Servidor en la nube |
| **Conexión** | Automática | Via `DATABASE_URL` |
| **Persistencia** | En tu máquina | En servidores Supabase |
| **Velocidad** | Muy rápida | Rápida (sin latencia perceptible) |
| **Backup** | Manual | Automático (Supabase) |
| **Límite** | Depende de disco | 500MB en plan Free |

---

## 8. PASOS FINALES

### Para desarrollo

1. ✅ Crea proyecto en Supabase
2. ✅ Obtén CONNECTION STRING
3. ✅ Actualiza `.env` con `DATABASE_URL`
4. ✅ Ejecuta `npm run dev`
5. ✅ Verifica APIs respondiendo

### Para producción (Vercel)

1. ✅ Ve a Vercel Project → Settings → Environment Variables
2. ✅ Agrega `DATABASE_URL` (misma string de Supabase)
3. ✅ Deploy con `git push` a main
4. ✅ Verifica en https://tu-dominio.com que funciona

---

## 📋 CHECKLIST

- [ ] Cuenta en Supabase creada
- [ ] Proyecto Supabase creado
- [ ] CONNECTION STRING obtenida y copiada
- [ ] `.env` actualizado con `DATABASE_URL`
- [ ] Servidor local iniciado (`npm run dev`)
- [ ] APIs respondiendo (curl test)
- [ ] Supabase Dashboard muestra tablas y datos
- [ ] Listo para producción en Vercel

---

**Próximo paso**: Proporciona tu `DATABASE_URL` (o crea el proyecto) y actualizaré el `.env` automáticamente. 🚀
