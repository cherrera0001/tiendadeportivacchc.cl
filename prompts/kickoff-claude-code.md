# Kickoff — Tienda deportiva CCHC (Claude Code CLI)

Eres el agente de implementación de este repositorio. No eres un consultor: construyes en disco, módulo a módulo.

Directorio: `F:\CCHC\tienda-deportiva`  
Remoto: `https://github.com/cherrera0001/tiendadeportivacchc.cl.git`  
Marca UI: Cámara. Conservar el front HTML/CSS/JS de la tienda pública.

## Paso 0 — Lectura obligatoria (en este orden)

1. `CLAUDE.md`
2. `spec.md`
3. `data.md`
4. `docs/arquitectura-datos.md`

Si falta alguno: DETENTE. No inventes el modelo ni el motor de datos.

## Decisiones de datos (no reabrir)

- Núcleo: **PostgreSQL** (PGlite solo en local). No Mongo, Firebase, Dynamo ni base vectorial como sistema de registro.
- Archivos: object storage (R2) + tabla `archivos`. Nunca `BYTEA` de fotos.
- JSONB: solo lo listado en `data.md` §11.9.
- Redis, Meilisearch, pgvector: solo con síntoma medible (`arquitectura-datos.md` §3.4).
- Precio y stock los decide el servidor. Token de Mercado Pago nunca en el cliente.

## Cómo trabajar

- Módulo activo = el más bajo de `spec.md` §8 sin DoD.
- **M0–M6 (v2) están entregados.** No reescribas el catálogo plano “porque v3 existe”.
- **M7–M12 (v3):** no codear hasta que las preguntas de `docs/arquitectura-datos.md` §9 mínimas (bodega, talla, volumen, orden go-live vs variantes) tengan respuesta en spec o en un mensaje del usuario.
- Tablas nuevas → primero `data.md`. Inventario v3: reserva al checkout, venta al webhook, ledger `stock_movimientos`.
- Idioma: es-CL. CLP sin decimales.
- No commit ni push salvo que el usuario lo pida. No force push a `main`.

## Orden

v2: M0 → M1 → M2 → M3 → M4 → M5 → M6 (hecho).  
v3: M7 variantes/reservas → M8 R2 → M9 roles → M10 promociones → M11 despachos/devoluciones → M12 panel admin.

## Arranque de sesión

1. Inspecciona el repo.
2. Declara: “Módulo activo: M# — nombre” (si v2 está cerrado, el activo es M7 **solo** si las preguntas §9 están resueltas; si no, informa el bloqueo y no inventes SKU).
3. Implementa hasta la DoD.
4. Verifica con `npm run dev` y `curl`.

## Conservar

IDs actuales del front. Despacho 4990 / umbral 59990 / stock bajo 5.

## PowerShell

```powershell
cd F:\CCHC\tienda-deportiva
claude
```

Pega este archivo. Continuar: `claude --continue`

Prompt corto:

```text
Lee CLAUDE.md, spec.md, data.md y docs/arquitectura-datos.md.
Declara el módulo activo e impleméntalo. No saltes a NoSQL ni a Redis.
No commits salvo que lo pida.
```
