# Tienda deportiva CCHC (Cámara)

Sitio de artículos deportivos. La v1 era estática; la v2 agrega API, base de datos, suscriptores, visitas, checkout y métricas.

Documentos de construcción:

- [`spec.md`](spec.md) — qué se construye y en qué orden (M0–M12)
- [`CLAUDE.md`](CLAUDE.md) — protocolo para agentes
- [`data.md`](data.md) — modelo v2 vigente y modelo v3 objetivo
- [`docs/arquitectura-datos.md`](docs/arquitectura-datos.md) — PostgreSQL como núcleo, archivos, inventario, hoja de ruta
- [`prompts/kickoff-claude-code.md`](prompts/kickoff-claude-code.md) — prompt para Claude Code CLI

## Correr en local

Requisito: Node.js 18 o superior.

```bash
npm install
copy .env.example .env
npm run dev
```

En PowerShell: `Copy-Item .env.example .env`

Abrir [http://localhost:3000](http://localhost:3000).

- Catálogo: `GET /api/productos`
- Métricas: [http://localhost:3000/metricas.html](http://localhost:3000/metricas.html)
- Baja de newsletter: el token queda en la tabla `suscriptores`

Sin `MP_ACCESS_TOKEN`, el checkout usa **simulación local**: redirige a pago pendiente y un botón confirma el cobro (descuenta stock). Con token de Mercado Pago Checkout Pro, redirige a `init_point`.

## Arquitectura breve

| Entorno | App | Datos | Pagos |
|---|---|---|---|
| Local | Express `server/index.js` | PGlite en `data/` | Simulación o MP |
| Producción | Vercel (`api/` + estáticos) | Postgres `DATABASE_URL` | Mercado Pago |

Cloudflare queda para DNS, CDN, R2 y WAF cuando exista el dominio. GitHub es el remoto: `cherrera0001/tiendadeportivacchc.cl`. El núcleo de datos es **PostgreSQL** (ver `docs/arquitectura-datos.md`); las fotos no se guardan como blob en la BD.

MCP del proyecto (`.mcp.json`): Vercel (deploys y logs) y Cloudflare (bindings/R2 y observabilidad). Se autorizan con OAuth la primera vez (`/mcp` en Claude Code). El MCP de GitHub se conecta desde `/mcp` con la cuenta del usuario.

La carpeta `data/` no se versiona (base local).
