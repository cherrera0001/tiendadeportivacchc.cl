# CLAUDE.md — Tienda deportiva CCHC

Instrucciones para cualquier agente (Claude, Cursor, Copilot) que trabaje en este repositorio.

## Documentos de verdad (leer en este orden)

1. **Este archivo** — cómo trabajar y qué está prohibido.
2. `spec.md` — qué se construye y el orden de módulos (M0–M12).
3. `data.md` — modelo vigente (v2) y objetivo (v3).
4. `docs/arquitectura-datos.md` — núcleo PostgreSQL, archivos, inventario, Redis/search/vectores, riesgos.

Si hay conflicto: `spec.md` manda el **alcance y el orden**; `docs/arquitectura-datos.md` manda el **tipo de dato y el stack de datos**; `data.md` manda **columnas, eventos y contratos**. No inventar tablas ni motores.

---

## Qué es este repo

- Ruta: `F:\CCHC\tienda-deportiva`
- GitHub: `cherrera0001/tiendadeportivacchc.cl`
- Marca UI: Cámara; negocio: CCHC / tiendadeportivacchc.cl
- Idioma de UI y commits: español
- **v2 (código actual):** web + API, catálogo plano, newsletter, visitas, MP, métricas. PGlite local / Postgres prod.
- **v3 (documentado, no codear hasta M7 y preguntas §9 de arquitectura):** variantes, reserva de stock, R2, admin, promociones, despachos, devoluciones.

Arranque local:

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`. Prompt CLI: `prompts/kickoff-claude-code.md`.

---

## Protocolo de construcción (obligatorio)

1. Módulo activo = el más bajo de `spec.md` §8 cuya DoD no esté cumplida.
2. v2 (M0–M6) está entregada. No reabrir el stack de v2. El trabajo nuevo es M7+ **después** de responder las preguntas de validación en `docs/arquitectura-datos.md` §9 (como mínimo: bodega única, talla enumerada vs texto, volumen 12 meses, ¿Postgres managed antes o junto a variantes?).
3. No adelantar M8 (R2) sin M7 (SKU), ni admin (M12) sin M9 (roles).
4. Toda tabla o evento nuevo se documenta primero en `data.md`.
5. No introducir Mongo, Firebase, Dynamo, Pinecone, Weaviate, ni fotos en `BYTEA`.

---

## Stack de datos (cerrado)

| Capa | Tecnología | Notas |
|---|---|---|
| Núcleo OLTP | **PostgreSQL** | Única fuente de verdad de dinero, stock, pedidos |
| Local | PGlite (dialecto Postgres) | Emulador; prod es Postgres real (`DATABASE_URL`) |
| Archivos | Cloudflare R2 (prod); `/media` o `uploads/` local | Metadatos en tabla `archivos`; **nunca** blobs pesados en la BD |
| API | Express `server/index.js` + Vercel `api/` | |
| Front tienda | HTML/CSS/JS actuales | No reescribir a Next por moda |
| Pagos | Mercado Pago Checkout Pro, CLP entero | Token solo servidor |
| Borde | Cloudflare DNS/CDN/WAF | No Cloudflare Pages + Vercel a la vez |
| Redis / Meilisearch / pgvector | — | Solo con síntoma medible (`arquitectura-datos.md` §3.4) |

JSONB: permitido solo donde `data.md` §11.9 lo lista. Stock, precio vigente, estado de pedido y correo **no** van solo en JSONB.

---

## Conservar del front actual

- Secciones, carrito, filtros, tema, accesibilidad
- `Intl.NumberFormat('es-CL', { currency: 'CLP', maximumFractionDigits: 0 })`
- Despacho `4990` / umbral `59990`, `STOCK_BAJO = 5` en `lib/config.js`
- IDs: `#formulario-newsletter`, `#grilla-productos`, `#btn-pagar`

---

## Convenciones de código

- Cliente: `fetch` + JSON; errores `{ "error": "codigo", "mensaje": "…" }`
- Precio y stock: enteros; el cliente no manda el precio a cobrar
- v2 checkout: `productoId`; v3: `varianteId`
- Eventos: snake_case de `data.md`
- Inventario v3: `disponible = stock_fisico - stock_reservado`; reserva al checkout; venta al webhook `approved`; ledger `stock_movimientos`
- Secretos: nunca en git

---

## Secretos y env

```
PORT=3000
PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=
TURNSTILE_SECRET_KEY=
TURNSTILE_SITE_KEY=
ALLOW_PAYMENT_SIMULATION=true
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PUBLIC=
R2_BUCKET_PRIVATE=
```

Front: `MP_PUBLIC_KEY`, site key Turnstile. Nunca `MP_ACCESS_TOKEN` ni keys R2.

---

## MCP

GitHub, Vercel, Cloudflare: deploys, DNS, R2, PRs.  
No usar MCP como base de datos ni para guardar pedidos. No pegar tokens de producción en el chat.

---

## Prohibido

- Descontar stock en el cliente o al agregar al carrito
- Confiar en el precio del navegador
- Cachear `POST /api/webhooks/mercadopago`
- Núcleo NoSQL o vectorial; imágenes como blob SQL
- Redis/buscador/vectores “por si acaso”
- `git push --force` a `main` salvo pedido explícito
- Implementar M7–M12 sin actualizar `data.md` y sin las preguntas mínimas de arquitectura
- Login de comprador, marketplace o Next.js en la tienda pública sin cambio de `spec.md`

---

## Verificación local (v2)

```bash
curl -s http://localhost:3000/api/productos
curl -s -X POST http://localhost:3000/api/visitas
curl -s http://localhost:3000/api/metricas
```

v3 se verifica según la DoD de cada módulo (reserva no sobrevende, URL firmada, rol admin).

---

## Commits

Solo cuando el usuario lo pida. Mensaje en español con módulo: `M7: variantes y reserva de stock`.
