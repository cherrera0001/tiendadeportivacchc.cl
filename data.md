# Data — Tienda deportiva CCHC

Versión: 1.2  
Compañero de: `spec.md`, `CLAUDE.md`, `docs/arquitectura-datos.md`

Fuente de verdad de **datos**: modelo OLTP, contratos JSON, semilla, eventos, KPIs y fórmulas.

Principio: el navegador **muestra** y **propone**; la BD y el webhook de Mercado Pago **deciden**.

Local: PGlite (Postgres) en `data/pglite`. Producción: Postgres (`DATABASE_URL`).

---

## 1. Fuentes de verdad

| Dato | Fuente | No es fuente |
|---|---|---|
| Precio, stock, nombre, fotos | `productos` + `producto_imagenes` | `js/app.js`, body del checkout |
| Categorías | `categorias` | HTML |
| Suscriptores | `suscriptores` | `localStorage` |
| Pedido y cobro | `pedidos` + MP webhook / simulación | Toast simulado v1 |
| Contador público | `visitas_contador` | Cifra hardcodeada del hero |
| Funnel / BI | `eventos` + `GET /api/metricas` | El contador M3 |
| Tráfico bruto | Cloudflare Web Analytics (prod) | Postgres |

---

## 2. Convenciones

- CLP: enteros, sin decimales
- Correos: `trim` + minúsculas antes de UNIQUE
- Tiempos: `timestamptz` UTC
- IDs: `bigint generated always as identity`
- Borrado de productos: `activo = false`
- Eventos: `nombre` exactamente como en la sección 6

Reglas comerciales (aplicación, no tabla):

- `DESPACHO_COSTO = 4990`
- `DESPACHO_UMBRAL = 59990`
- `STOCK_BAJO = 5`
- `costo_despacho = 0` si `subtotal >= 59990` o `subtotal = 0`; si no, `4990`

---

## 3. Modelo OLTP

### 3.1 `categorias`

| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| slug | text UNIQUE | `running`, `futbol`, `gimnasio`, `ciclismo`, `outdoor` |
| nombre | text | |
| icono | text | emoji UI |
| orden | int | |

### 3.2 `productos`

| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | seed 1–20 |
| categoria_id | bigint FK | |
| nombre, slug, marca | text | slug UNIQUE |
| descripcion | text | ficha |
| precio | int NOT NULL | CLP |
| precio_antes | int NULL | oferta |
| stock | int NOT NULL CHECK (>= 0) | |
| evaluacion | numeric(2,1) | |
| resenas | int | |
| insignia | text NULL | `oferta` \| `nuevo` |
| destacado | int | |
| activo | boolean DEFAULT true | |
| created_at, updated_at | timestamptz | |

### 3.3 `producto_imagenes`

| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| producto_id | bigint FK | |
| url | text | `/media/{id}.svg` en local |
| alt | text | |
| orden | int | 0 = portada |

### 3.4 `suscriptores`

| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| correo | text UNIQUE NOT NULL | |
| nombre | text NULL | |
| origen | text | `newsletter` \| `checkout` |
| consentimiento_at | timestamptz NOT NULL | |
| activo | boolean DEFAULT true | |
| token_baja | text UNIQUE | |
| created_at | timestamptz | |
| unsubscribed_at | timestamptz NULL | |

### 3.5 `pedidos`

| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| codigo | text UNIQUE | `CCHC-000104` |
| estado | text | `pendiente` \| `pagado` \| `rechazado` \| `cancelado` |
| correo, nombre, telefono, direccion | text | |
| subtotal, costo_despacho, total | int | |
| mp_preference_id, mp_payment_id | text NULL | |
| created_at, pagado_at | timestamptz | |

### 3.6 `pedido_items`

Snapshot de nombre y `precio_unitario` al momento del checkout.

### 3.7 `visitas_contador`

Una fila `clave = 'home'`, `total` bigint. Incremento atómico. Rate limit por cookie `visita_ok` (30 min), no en esta tabla.

### 3.8 `eventos`

| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| nombre | text NOT NULL | catálogo §6 |
| ocurrido_at | timestamptz | |
| session_id | text NULL | UUID anónimo |
| producto_id | bigint NULL | |
| pedido_id | bigint NULL | |
| valor_clp | int NULL | |
| payload | jsonb | |

No guardar IP en claro.

---

## 4. SQL de creación

Ver `lib/schema.sql` (canónico en código). Resumen: las ocho tablas anteriores + índices `idx_eventos_nombre_tiempo`, `idx_productos_categoria`.

---

## 5. Contratos de API

Errores: `{ "error": "codigo", "mensaje": "..." }`  
Códigos: `validacion`, `no_encontrado`, `sin_stock`, `conflicto`, `pago`, `interno`.

### `GET /api/productos`

Query opcional: `categoria`, `q`.  
`{ "productos": [ ProductoListado ] }`

```json
{
  "id": 1,
  "nombre": "Zapatilla Velocity Pro 4",
  "slug": "zapatilla-velocity-pro-4",
  "marca": "Aurex",
  "categoria": "running",
  "categoriaNombre": "Running",
  "descripcion": "...",
  "precio": 119990,
  "precioAntes": 159990,
  "evaluacion": 4.8,
  "resenas": 214,
  "stock": 12,
  "insignia": "oferta",
  "destacado": 5,
  "imagenes": [{ "url": "/media/1.svg", "alt": "...", "orden": 0 }]
}
```

### `GET /api/productos/:id`

`{ "producto": ProductoListado }` o 404.

### `POST /api/suscriptores`

Body: `{ "correo": "a@b.cl", "consentimiento": true, "turnstileToken": "..." }`  
200: `{ "ok": true, "estado": "creado" | "ya_suscrito" }`

### `GET /api/suscriptores/baja?token=`

Marca `activo = false`. HTML o JSON de confirmación.

### `POST /api/visitas`

200: `{ "total": 1842 }`  
Cookie `visita_ok` evita inflar con F5.

### `POST /api/checkout`

Body: `{ "items": [{ "productoId": 1, "cantidad": 2 }], "correo", "nombre", "telefono", "direccion" }`  
Ignorar cualquier `precio` del cliente.  
200: `{ "pedidoCodigo": "CCHC-000104", "initPoint": "https://..." | "/pago/pendiente.html?..." }`

### `POST /api/webhooks/mercadopago`

Idempotente por `mp_payment_id`.

### `POST /api/dev/simular-pago`

Solo si `ALLOW_PAYMENT_SIMULATION=true` (local). Body: `{ "codigo": "CCHC-000104" }`. Ejecuta la misma confirmación que un pago `approved`.

### `POST /api/eventos`

Body: `{ "nombre": "add_to_cart", "sessionId": "...", "productoId": 1, "valorClp": 119990, "payload": {} }`  
Rechazar `purchase` y `begin_checkout` desde el cliente.

### `GET /api/metricas`

KPIs del período (default 90 días): visitas `page_view`, carritos, checkouts, compras, conversión, ticket, ingresos, suscriptores activos, productos activos, stock bajo.

---

## 6. Catálogo de eventos (cerrado)

| nombre | Quién lo escribe | Cuándo |
|---|---|---|
| `page_view` | front → `/api/eventos` | cada carga |
| `product_view` | front | abrir ficha |
| `add_to_cart` | front | clic agregar |
| `begin_checkout` | backend | se crea el pedido |
| `purchase` | backend | pago aprobado |
| `newsletter_signup` | backend | insert nuevo |

No crear otros nombres sin editar esta tabla.

---

## 7. KPIs y fórmulas (M6)

| KPI | Fórmula |
|---|---|
| Visitas (BI) | `count(*) filter (where nombre = 'page_view')` |
| Visitas (vitrina) | `visitas_contador.total` — no mezclar sin leyenda |
| Add to cart | `count(*) where nombre = 'add_to_cart'` |
| Checkouts | `count(*) where nombre = 'begin_checkout'` |
| Compras | `count(*) where nombre = 'purchase'` |
| Conversión visita→compra | `compras / nullif(visitas, 0)` |
| Ticket promedio | `avg(valor_clp) where nombre = 'purchase'` |
| Ingresos | `sum(valor_clp) where nombre = 'purchase'` |
| Suscriptores netos | `count suscriptores where activo` |
| Stock bajo | `productos where activo and stock <= 5` |

Cifras antiguas del hero (`1240`, `18500`) **no** se usan.

---

## 8. Semilla M1

Categorías: running, futbol, gimnasio, ciclismo, outdoor (iconos 👟⚽🏋️🚴🏕️).

Productos: los 20 del catálogo original en `js/app.js` (ids 1–20), con `slug` kebab-case y `descripcion` corta. Imagen `/media/{id}.svg`.

---

## 9. Privacidad

- Suscriptor: correo + consentimiento + origen
- Eventos: `session_id` anónimo (`sessionStorage`)
- Baja: `activo = false`, `unsubscribed_at = now()`
- No usar correos reales en seed

---

## 10. Mapa módulo → datos

| Módulo | Tablas | Endpoints | Eventos |
|---|---|---|---|
| M0 | — | salud del server | — |
| M1 | categorias, productos, producto_imagenes | GET productos | (product_view en ficha) |
| M2 | suscriptores | POST/GET baja | newsletter_signup |
| M3 | visitas_contador | POST visitas | — |
| M4 | producto_imagenes.url | GET /media | — |
| M5 | pedidos, pedido_items | checkout, webhook, simular | begin_checkout, purchase |
| M6 | eventos | POST eventos, GET metricas | catálogo completo |
| M7 | variantes, reservas_stock, stock_movimientos | checkout usa varianteId | — |
| M8 | archivos | upload + URL firmada | — |
| M9 | usuarios, roles, usuarios_roles, auditoria | admin API | — |
| M10 | promociones, promocion_productos | descuento en checkout | — |
| M11 | despachos, devoluciones | estados de envío/retorno | — |

---

## 11. Modelo objetivo v3 (no está en `lib/schema.sql` todavía)

Decisiones: `docs/arquitectura-datos.md`. Núcleo **PostgreSQL**. Fotos **fuera** de la BD. JSONB solo donde §3.5 lo permite.

### 11.1 `variantes`

SKU vendible. Talla y color son **columnas** (se filtran). `atributos_extra jsonb` para peso/material, no para stock.

| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| producto_id | bigint FK | |
| sku | text UNIQUE | |
| talla | text NULL | |
| color | text NULL | |
| precio, precio_antes | int | sustituye precio en `productos` |
| stock_fisico | int CHECK (>= 0) | |
| stock_reservado | int CHECK (>= 0) | `<= stock_fisico` |
| activo | boolean | |
| atributos_extra | jsonb | default `{}` |

`UNIQUE (producto_id, talla, color)` cuando ambos no son null. Migración v2: una variante default por producto.

### 11.2 `reservas_stock`

| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| variante_id | bigint FK | |
| pedido_id | bigint FK | |
| cantidad | int | |
| estado | text | `activa` \| `consumida` \| `expirada` \| `liberada` |
| expira_at | timestamptz | |
| created_at | timestamptz | |

### 11.3 `stock_movimientos`

Libro mayor. No se borra. `tipo`: `ajuste`, `reserva`, `liberacion`, `venta`, `devolucion`, `merma`.

### 11.4 `archivos`

Metadatos; bytes en R2 o `uploads/`. `visibilidad`: `publico` \| `privado`. `entidad_tipo`: `producto` \| `variante` \| `pedido` \| `devolucion`.

### 11.5 `pagos` (separado de `pedidos`)

Intentos de cobro. `mp_payment_id` UNIQUE. `payload_pasarela jsonb` sin PAN/CVV.

### 11.6 `despachos` / `devoluciones`

Estados de envío y retorno; FK a `pedidos`. Devolución aceptada genera `stock_movimientos`.

### 11.7 `usuarios` / `roles` / `usuarios_roles` / `auditoria`

Solo staff en v3. `auditoria.diff jsonb` del cambio.

### 11.8 `promociones` / `promocion_productos`

Vigencia, tipo `porcentaje` \| `monto`, tope. El checkout aplica en servidor.

### 11.9 Política JSONB (cerrada)

Permitido: `eventos.payload`, `pagos.payload_pasarela`, `despachos.respuesta_courier`, `variantes.atributos_extra`, `auditoria.diff`.  
Prohibido: stock, precio vigente, estado de pedido, correo, como único sitio del dato.

### 11.10 Carrito v3

Body de checkout: `{ "items": [{ "varianteId": 1, "cantidad": 2 }], ... }`. `productoId` solo queda en v2.

---

## 12. Índices v3 esenciales

Además de los de v2: `variantes(producto_id)`, `variantes(sku)`, `reservas_stock(variante_id, estado)`, `stock_movimientos(variante_id, created_at)`, `archivos(entidad_tipo, entidad_id)`, `pagos(mp_payment_id)`, `pedidos(estado, created_at)`.
