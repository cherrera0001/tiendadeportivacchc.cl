# CLAUDE.md — Tienda deportiva CCHC

Instrucciones para cualquier agente (Claude, Cursor, Copilot) que trabaje en este repositorio.

Leer **antes de tocar código**: `spec.md` (qué y en qué orden) y `data.md` (modelo, eventos, contratos). Si hay conflicto, gana `spec.md` para alcance y `data.md` para datos.

---

## Qué es este repo

- Ruta: `F:\CCHC\tienda-deportiva`
- GitHub: `cherrera0001/tiendadeportivacchc.cl`
- Marca UI: Cámara (artículos deportivos); negocio: CCHC / tiendadeportivacchc.cl
- Idioma de UI y commits: español
- Estado: web + API local (v2). Front conservado; datos en PGlite/Postgres.

Arranque local:

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`. Prompt CLI: `prompts/kickoff-claude-code.md`.

---

## Protocolo de construcción (obligatorio)

1. Identificar el **módulo actual** (M0…M6) según `spec.md` sección 8. El más bajo no terminado es el único que se implementa en trabajo incremental.
2. Leer en `data.md` las tablas, endpoints y eventos de ese módulo.
3. No adelantar Mercado Pago en M1 ni BI en M2 si se trabaja recortado.
4. Cumplir la Definición de terminado (DoD) del módulo.
5. No inventar columnas, eventos ni KPIs. Si falta algo, proponer cambio en `data.md` / `spec.md` primero.

---

## Stack que no se discute en v2

| Capa | Tecnología |
|---|---|
| Front | HTML/CSS/JS existentes |
| API local | Express `server/index.js` |
| API prod | Vercel `api/*` (mismos handlers en `lib/`) |
| BD local | PGlite en `data/` |
| BD prod | PostgreSQL (`DATABASE_URL`) |
| Fotos local | `/media/:id.svg` |
| Fotos prod | Cloudflare R2 (URLs en `producto_imagenes`) |
| DNS/CDN/WAF | Cloudflare |
| Código | GitHub |
| Pagos | Mercado Pago Checkout Pro, `CLP` |
| Agente ↔ nubes | MCP GitHub, Vercel, Cloudflare |

No desplegar la app en Cloudflare Pages. No segundo backend en un VPS salvo cambio de spec.

---

## Conservar del front actual

- Estructura de secciones, carrito, filtros, tema claro/oscuro, accesibilidad
- Formato de precios `Intl.NumberFormat('es-CL', { currency: 'CLP', maximumFractionDigits: 0 })`
- Constantes comerciales: despacho `costo: 4990`, `umbralGratis: 59990`, `STOCK_BAJO = 5` — en servidor (`lib/config.js`)
- IDs: `#formulario-newsletter`, `#grilla-productos`, `#btn-pagar`, etc.

---

## Convenciones de código

- JS del cliente: sin bundler; `fetch` + `async`
- API: JSON; errores `{ "error": "codigo", "mensaje": "legible en español" }`
- Precio y stock: enteros; el cliente no manda el precio a cobrar
- Nombres de evento: snake_case exacto de `data.md`
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
```

El front puede conocer `MP_PUBLIC_KEY` y la site key de Turnstile. `MP_ACCESS_TOKEN` solo servidor.

---

## MCP

Usar MCP para deploys Vercel, logs, DNS/R2 Cloudflare, PRs GitHub.  
No usar MCP para guardar suscriptores ni como base de datos.  
No pegar tokens de producción en el chat.

---

## Prohibido

- Descontar stock en el cliente o al abrir el carrito
- Confiar en el precio enviado por el navegador
- Cachear `POST /api/webhooks/mercadopago`
- Cifras inventadas en el hero
- `git push --force` a `main` salvo pedido explícito
- Ampliar a login, tallas o admin (M7) sin actualizar `spec.md`

---

## Verificación local

```bash
curl -s http://localhost:3000/api/productos
curl -s -X POST http://localhost:3000/api/visitas
curl -s http://localhost:3000/api/metricas
```

- **M1:** 20 productos en el JSON y en la grilla
- **M2:** insert + unique de correo
- **M3:** el contador no sube en cada F5 (misma cookie)
- **M5:** simular pago y ver stock
- **M6:** `/metricas.html` muestra el embudo

---

## Commits

Solo cuando el usuario lo pida. Mensajes en español, módulo en el mensaje: `M2: persiste suscriptores del newsletter`.
