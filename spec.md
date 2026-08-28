# Spec — Tienda deportiva CCHC

Versión: 1.2  
Repo: `F:\CCHC\tienda-deportiva`  
Remoto: `https://github.com/cherrera0001/tiendadeportivacchc.cl.git`  
Producto: Cámara / tiendadeportivacchc.cl  
Documentos hermanos: `CLAUDE.md` (cómo construir), `data.md` (qué datos existen y cómo se miden), `docs/arquitectura-datos.md` (núcleo PostgreSQL, archivos, inventario, hoja de ruta v3)

Este archivo es la fuente de verdad de **qué** se construye, **en qué orden** y **cuándo un módulo está terminado**. No se implementa nada que no esté aquí o en `data.md`.

---

## 1. Contexto

La v1 es una **web estática** (`index.html`, `css/styles.css`, `js/app.js`): catálogo, filtros, carrito y newsletter en el navegador. El catálogo estaba hardcodeado, el stock se reiniciaba al recargar, el correo no se persistía y “Ir a pagar” simulaba el cobro.

La v2 mejora la **arquitectura** sin tirar el front: el HTML/CSS/JS se conservan como capa de presentación. La verdad de negocio pasa a API + base de datos.

- **Local:** Node (Express) + PGlite (Postgres embebido en `data/`). Comando: `npm run dev` → `http://localhost:3000`
- **Producción:** GitHub (código), Vercel (app + `/api`), Cloudflare (DNS, CDN, R2, WAF), Postgres (Neon) vía `DATABASE_URL`, Mercado Pago Checkout Pro (CLP)

---

## 2. Objetivos

1. Registrar correos con consentimiento y formar una BD de clientes/suscriptores.
2. Mostrar productos con fotos, detalle, precio (CLP, IVA incluido) y stock real de backend.
3. Contar ingresos a la página de forma centralizada (no `localStorage`).
4. Cobrar con Mercado Pago y descontar stock solo con pago confirmado.
5. Dejar el sistema **data-driven**: eventos y KPIs definidos en `data.md`, no cifras ficticias en el hero.

### No objetivos (v2 — ya entregada)

- App móvil nativa.
- Marketplace multi-vendedor.
- Reescritura a React/Next.js de la tienda pública.
- Publicar el mismo sitio en Vercel y Cloudflare Pages a la vez.
- NoSQL, base vectorial o blobs de fotos dentro de Postgres como núcleo.

### Alcance v3 (no implementar hasta cerrar preguntas en `docs/arquitectura-datos.md` §9)

Variantes talla/color, reserva de stock, R2, usuarios/roles admin, promociones, despachos, devoluciones, panel. Orden: M7–M12 en la sección 8.

---

## 3. Actores

| Actor | Necesidad |
|---|---|
| Visitante | Ver catálogo, filtrar, armar carrito, pagar, suscribirse |
| Operador CCHC | Ver métricas, y en v3 administrar catálogo/pedidos con rol |
| Agente (Cursor/Claude) | Construir según spec + `docs/arquitectura-datos.md` |
| Sistemas | Mercado Pago, Vercel, Cloudflare, GitHub |

---

## 4. Requisitos funcionales

### RF-01 Suscriptores
El formulario `#formulario-newsletter` envía `POST /api/suscriptores`. El servidor valida, normaliza, persiste y respeta consentimiento y baja. El front no finge éxito si la API falla.

### RF-02 Catálogo
El front obtiene productos de `GET /api/productos`. Cada ítem incluye fotos, detalle, precio, precio anterior opcional, stock, categoría, marca. El array `PRODUCTOS` de `js/app.js` no es fuente de verdad.

### RF-03 Ficha
Debe existir detalle de producto (panel) con descripción, imagen, precio y stock.

### RF-04 Stock
El stock vive en la BD. El carrito valida en cliente de forma optimista. Al checkout el servidor **relee** precio y stock. No se descuenta al agregar al carrito. Se descuenta cuando el pago está `approved` (webhook MP o simulación de desarrollo).

### RF-05 Visitas
Al cargar la home, `POST /api/visitas` incrementa un contador atómico (con rate limit por cookie) y devuelve el total. El hero lo muestra. Este número **no** reemplaza el funnel de BI (`page_view`).

### RF-06 Checkout Mercado Pago
“Ir a pagar” llama `POST /api/checkout`. El servidor crea pedido `pendiente`, preferencia Checkout Pro (CLP enteros) si hay token, y devuelve `init_point`. Sin token, en desarrollo, redirige a simulación (`ALLOW_PAYMENT_SIMULATION`). `POST /api/webhooks/mercadopago` confirma el pago. Páginas: `/pago/exito.html`, `/pago/pendiente.html`, `/pago/fallo.html`. El Access Token **nunca** va al front.

### RF-07 Analítica
Cada acción de negocio emite eventos del catálogo en `data.md`. `purchase` solo lo emite el backend.

### RF-08 Medios
Fotos locales en v2: `GET /media/:id.svg` (placeholder de categoría). En producción las URLs pueden apuntar a R2; se guardan en `producto_imagenes.url`.

---

## 5. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | UI en español (es-CL); precios `es-CL` / CLP sin decimales |
| RNF-02 | Secretos solo en `.env` / Vercel; `.env` en `.gitignore` |
| RNF-03 | HTTPS público para webhooks MP (producción) |
| RNF-04 | No cachear webhooks |
| RNF-05 | Turnstile en newsletter cuando hay claves; en local se omite |
| RNF-06 | Accesibilidad existente se mantiene |
| RNF-07 | Ley 19.628: consentimiento, finalidad, baja |
| RNF-08 | Un PR / un módulo en trabajo colaborativo |

---

## 6. Arquitectura

```
Visitante → Express local (:3000)  o  Cloudflare → Vercel
         → API /api/*
         → PGlite (local) o Postgres (prod)
         → Mercado Pago (si hay token)
```

| Sistema | Hace | No hace |
|---|---|---|
| GitHub | Repo, PRs | Hosting de la tienda |
| Vercel | HTML/JS + funciones `/api` | DNS ni almacén de fotos |
| Cloudflare | DNS, CDN, R2, WAF | Checkout ni webhook MP |
| Postgres/PGlite | Productos, stock, pedidos, suscriptores, eventos | Bytes de fotos/PDF (van a R2) |
| MCP | Deploys, logs, DNS, PRs | Persistir pedidos |

---

## 7. Stack cerrado (v2)

- Front: HTML + CSS + JS actual (sin framework)
- API local: Express en `server/index.js`
- API prod: mismos handlers en `api/` (Vercel)
- BD local: PGlite (`data/pglite`)
- BD prod: **PostgreSQL** (`DATABASE_URL`) — único OLTP; ver `docs/arquitectura-datos.md`
- Pagos: Mercado Pago Checkout Pro, `CLP`
- Fotos local: SVG `/media/:id.svg`
- Fotos prod (v3 M8): Cloudflare R2; metadatos en Postgres, no BYTEA

---

## 8. Módulos y orden de construcción

**Regla:** no se abre el módulo N+1 hasta que N cumple su DoD. En este repo v1.1 los módulos M0–M6 se entregan juntos en local, pero el orden lógico se mantiene.

### M0 — Plataforma
`.gitignore`, `.env.example`, `package.json`, `README.md`, `npm run dev`, `vercel.json`.  
**DoD:** el estático y la API responden en `http://localhost:3000`.

### M1 — Catálogo
Tablas `categorias`, `productos`, `producto_imagenes`; seed 5 categorías + 20 productos; `GET /api/productos` y `GET /api/productos/:id`; front con `fetch`; ficha de detalle.  
**DoD:** recargar muestra los 20 productos desde la BD.

### M2 — Suscriptores
`POST /api/suscriptores`; consentimiento; baja `GET /api/suscriptores/baja?token=`.  
**DoD:** correo válido queda en BD; repetido no duplica.

### M3 — Visitas
`POST /api/visitas`; cookie de rate limit; hero con total.  
**DoD:** dos navegadores suben el contador; F5 no suma 1:1.

### M4 — Medios y borde
`/media/:id.svg`; `<img>` en card y ficha; Turnstile opcional.  
**DoD:** cada producto tiene imagen servida por la API/estático.

### M5 — Checkout
`POST /api/checkout`; webhook MP; simulación local; descuento de stock idempotente; páginas de retorno.  
**DoD:** flujo local completo; stock no baja si el pago no se confirma; webhook/simulación repetida no descuenta dos veces.

### M6 — Analítica
`POST /api/eventos`; `GET /api/metricas`; `/metricas.html`; hero sin cifras inventadas.  
**DoD:** SQL/API del embudo: visitas, add_to_cart, begin_checkout, purchase.

### M7 — Variantes e inventario (v3)
SKU por talla/color; `stock_fisico` / `stock_reservado`; migración desde `productos.precio` y `productos.stock`. Reserva al checkout. Ver `docs/arquitectura-datos.md` §3.6 y `data.md` §11.  
**DoD:** no se puede vender una talla sin stock; dos checkouts concurrentes no sobrevenden; el carrito envía `varianteId`.

### M8 — Archivos (R2)
Tabla `archivos`; bytes en R2 (local: disco `uploads/` con el mismo metadato). Nada en `BYTEA`.  
**DoD:** foto de producto y un adjunto de pedido privado con URL firmada.

### M9 — Usuarios y roles
Staff (`admin`, `operador`); sin login de comprador salvo spec extra.  
**DoD:** ABM de catálogo exige sesión; el anónimo no escribe productos.

### M10 — Promociones
Vigencia, % o monto, productos incluidos; cálculo en servidor.  
**DoD:** el total del pedido coincide con la regla; el cliente no manda el descuento.

### M11 — Despachos y devoluciones
`despachos`, `devoluciones`, movimientos de stock de vuelta o merma.  
**DoD:** un pedido pagado puede marcarse enviado; una devolución aceptada deja trazabilidad.

### M12 — Panel admin
UI mínima (puede ser HTML del mismo origen). No Next.js por defecto.  
**DoD:** operador carga producto, variante, foto y ve pedidos.

**Fuera de v3:** app nativa, marketplace, Redis/Meilisearch/pgvector (solo con evidencia, `docs/arquitectura-datos.md` §3.4).

---

## 9. Contratos entre módulos

| De | Hacia | Contrato |
|---|---|---|
| Front | API | JSON UTF-8; errores `{ "error": "codigo", "mensaje": "..." }` |
| API | BD | Esquema `data.md` |
| API | MP | Preferencia e IPN; precios solo desde BD |
| Front | Analítica | Nombres de evento **exactos** de `data.md` |

Reglas comerciales en servidor:

- Despacho `$4.990`; gratis desde `$59.990`
- Stock bajo: 5 unidades
- Precios con IVA, CLP entero

---

## 10. Criterios de aceptación globales (v2 local)

- [ ] Newsletter persiste en BD
- [ ] Catálogo y stock salen de API
- [ ] Hay imagen y ficha con detalle
- [ ] Contador de visitas es compartido
- [ ] Checkout crea pedido; simulación o MP confirma y descuenta stock
- [ ] No hay Access Token en JS
- [ ] Hero usa cifras reales (productos, visitas, evaluación)
- [ ] `/metricas.html` muestra el embudo

---

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| Stock concurrente | UPDATE condicional; idempotencia por `mp_payment_id` / código |
| Precio manipulado | Ignorar precios del body; usar BD |
| Contador ≠ BI | M3 (cookie) vs `page_view` (cada carga) |
| Datos personales | Consentimiento, mínima data, baja |

---

## 12. Trazabilidad requisitos → módulos

| Requisito original | Módulos |
|---|---|
| Correos / BD clientes | M2, M6 |
| Productos, fotos, precio, stock | M1, M4, M5 |
| Contador de visitas | M3, M6 |
| Mercado Pago | M5 |
| Arquitectura GH / Vercel / CF / MCP | M0 |
| Variantes, admin, R2, despachos | M7–M12; `docs/arquitectura-datos.md` |
