import { queryOne } from '../db.js';

const PALETA = {
  running: { bg: '#fff1e8', fg: '#c2410c', icon: '👟' },
  futbol: { bg: '#ecfdf5', fg: '#15803d', icon: '⚽' },
  gimnasio: { bg: '#f1f5f9', fg: '#0f172a', icon: '🏋️' },
  ciclismo: { bg: '#eff6ff', fg: '#1d4ed8', icon: '🚴' },
  outdoor: { bg: '#f7fee7', fg: '#3f6212', icon: '🏕️' }
};

function escapeXml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export async function handleMedia(req, res) {
  const raw = (req.params && req.params.id)
    || (req.query && req.query.id)
    || '';
  const id = Number(String(raw).replace(/\.svg$/i, ''));
  if (!id) {
    res.statusCode = 404;
    return res.end();
  }

  const producto = await queryOne(
    `SELECT p.nombre, p.marca, c.slug, c.icono
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE p.id = $1`,
    [id]
  );
  if (!producto) {
    res.statusCode = 404;
    return res.end();
  }

  const pal = PALETA[producto.slug] || PALETA.running;
  const icono = producto.icono || pal.icon;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="${escapeXml(producto.nombre)}">
  <rect width="800" height="600" fill="${pal.bg}"/>
  <text x="400" y="280" text-anchor="middle" font-size="120">${icono}</text>
  <text x="400" y="400" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="28" font-weight="700" fill="${pal.fg}">${escapeXml(producto.marca)}</text>
  <text x="400" y="445" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="20" fill="#475569">${escapeXml(producto.nombre)}</text>
</svg>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end(svg);
}
