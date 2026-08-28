# Kickoff v2 — Tienda deportiva CCHC (Claude Code CLI)

Eres el agente de implementación de este repositorio. No eres un consultor: construyes en disco, módulo a módulo.

Directorio de trabajo: `F:\CCHC\tienda-deportiva`  
Remoto: `https://github.com/cherrera0001/tiendadeportivacchc.cl.git`  
UI actual: web estática `index.html` + `css/styles.css` + `js/app.js` (marca Cámara). Conservar el front; no reescribir a React/Next en v2.

## Paso 0 — Leyes del repo (obligatorio, en este orden)

1. Lee `CLAUDE.md` (protocolo).
2. Lee `spec.md` (alcance y orden M0…M6).
3. Lee `data.md` (tablas, JSON, eventos, seed, KPIs).
4. Si **falta alguno** de esos tres archivos: DETENTE. Dilo explícito y no inventes el modelo.

Si los tres existen, no reabras arquitectura ni cambies el stack de v2.

## Stack v2 (cerrado)

- Front: HTML/CSS/JS actuales
- API local: Express (`npm run dev`)
- API prod: Vercel `/api/*`
- BD local: PGlite; prod: Postgres (`DATABASE_URL`)
- Fotos: `/media/:id.svg` o R2
- DNS/CDN/WAF: Cloudflare
- Código: GitHub
- Pagos: Mercado Pago Checkout Pro, moneda CLP, enteros
- MCP (GitHub, Vercel, Cloudflare): operación, no es la BD

Prohibido: Cloudflare Pages + Vercel a la vez; Access Token de MP en el cliente; descontar stock en el navegador; confiar en el precio que manda el front.

## Cómo trabajar

- Un solo módulo a la vez. El módulo activo = el más bajo de M0…M6 cuya DoD en `spec.md` §8 **no** esté cumplida.
- No adelantes M5 ni M6 “porque conviene” si los anteriores no cierran.
- No inventes columnas, eventos ni KPIs: si falta algo, primero el diff en `data.md` / `spec.md`.
- Idioma UI y mensajes de API: español (es-CL). Precios: `es-CL` / CLP sin decimales.
- Secretos: solo `.env` local (gitignored). Crea `.env.example` sin valores reales.
- No hagas `git commit` ni `git push` salvo que yo lo pida.
- No uses force push a `main`.
- Al cerrar un módulo: lista evidencia de la DoD. Luego pasa al siguiente **salvo** que la DoD falle: entonces para y reporta el bloqueo.

## Orden (no alterar)

M0 Plataforma → M1 Catálogo → M2 Suscriptores → M3 Visitas → M4 Medios → M5 Mercado Pago → M6 Analítica.

M7 (admin, Next.js, login, tallas) está fuera de v2: no lo construyas.

## Arranque de esta sesión

1. Inspecciona el repo (archivos, git remote, si ya hay `api/`, `server/`, env).
2. Declara en una línea: “Módulo activo: M# — \<nombre\>”.
3. Implementa ese módulo hasta su DoD.
4. Verifica (`curl` o `npm run dev`).
5. Repite 2–4 con el siguiente módulo.

## Conservar del front

IDs y flujos actuales (`#formulario-newsletter`, `#grilla-productos`, `#btn-pagar`, carrito, filtros, tema, accesibilidad).  
Reglas comerciales en servidor: despacho 4990, gratis desde 59990, stock bajo = 5.

## Primera tarea si M0 no está cerrado

- `.gitignore` (`.env`, `node_modules`, `data/`)
- `.env.example` con los nombres canónicos de `CLAUDE.md`
- `npm run dev` sirve el estático y la API
- `README.md` que apunte a `spec.md`, `CLAUDE.md`, `data.md`

Empieza ahora por el Paso 0 (lectura). Luego el módulo activo.

---

## Cómo lanzarlo en PowerShell

```powershell
cd F:\CCHC\tienda-deportiva
claude
```

Al abrir la sesión, pega este archivo completo. Sesiones siguientes:

```powershell
claude --continue
```

O prompt corto:

```text
Lee CLAUDE.md, spec.md y data.md.
Inspecciona el repo, declara el módulo activo (el más bajo sin DoD) e impleméntalo.
No saltes módulos. No commits salvo que lo pida.
```
