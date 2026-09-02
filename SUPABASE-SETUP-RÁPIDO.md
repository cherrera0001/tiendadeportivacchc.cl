# Setup Rápido — Supabase PostgreSQL

**Objetivo**: Conectar tienda-deportiva a PostgreSQL en la nube (Supabase) en 5 minutos.

---

## 🎯 PASOS RÁPIDOS

### 1️⃣ Crear proyecto Supabase (2 min)

```
1. Ve a https://supabase.com/dashboard
2. Clic en "New Project"
3. Nombre: tienda-deportiva-cchc
4. Password: (crea una fuerte, ej: 3xG7#mK9pL2@wQ5nR)
5. Region: South America (São Paulo) ← ⭐ IMPORTANTE
6. Plan: Free (está bien para MVP)
7. Clic "Create new project" (espera 2-3 minutos)
```

### 2️⃣ Obtener CONNECTION STRING (1 min)

```
1. Abierto el proyecto, ve a Settings (abajo) → Database
2. En la sección "Connection string", selecciona "URI"
3. Verás algo como:
   postgresql://postgres:PASSWORD@db.qxyzabc123.supabase.co:5432/postgres
4. CÓPIALA COMPLETA (sin espacios)
```

### 3️⃣ Actualizar .env (1 min)

Edita `F:\CCHC\tienda-deportiva\.env` y rellena:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.qxyzabc123.supabase.co:5432/postgres
```

**REEMPLAZA**:
- `PASSWORD` → la contraseña que creaste
- `qxyzabc123` → el código del proyecto Supabase

### 4️⃣ Reiniciar servidor (1 min)

```bash
# Terminal en F:\CCHC\tienda-deportiva
npm run dev
```

**Esperado en los logs**:
```
✅ Cámara CCHC en http://localhost:3000
```

### 5️⃣ Verificar que funciona

```bash
# En otra terminal:
curl http://localhost:3000/api/productos | head -c 100

# Deberías ver JSON con productos
```

---

## ✅ CHECKLIST

- [ ] Proyecto Supabase creado
- [ ] CONNECTION STRING copiada
- [ ] `.env` actualizado con `DATABASE_URL`
- [ ] Servidor corriendo (`npm run dev`)
- [ ] APIs respondiendo (curl test)
- [ ] Supabase Dashboard muestra tablas (SQL Editor)

---

## 🔍 VERIFICACIÓN EN SUPABASE DASHBOARD

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Clic en **"SQL Editor"** (lado izquierdo)
3. En la query, escribe:
   ```sql
   SELECT COUNT(*) as total FROM productos;
   ```
4. Clic en **"Run"**
5. **Esperado**: `total: 20`

---

## ⚠️ ERRORES COMUNES

| Error | Solución |
|---|---|
| `ECONNREFUSED` | Verifica que copiaste CONNECTION STRING completa y correcta |
| `password authentication failed` | Verifica la contraseña en CONNECTION STRING |
| `database "postgres" does not exist` | La BD se creará automáticamente con el primer request |
| `tables do not exist` | El schema.sql se ejecuta automáticamente, espera 10 segundos |

---

## 🚀 SIGUIENTE: DEPLOY A VERCEL

Una vez que funciona localmente:

1. Ve a Vercel Project Settings → Environment Variables
2. Agrega la **misma** `DATABASE_URL`
3. Haz `git commit` y `git push` a main
4. Vercel despliega automáticamente
5. Verifica en https://tu-dominio.com que funciona

---

**Listo**. Proporciona la CONNECTION STRING aquí o en tu .env, y el servidor automaticamente la usará. 🎉
