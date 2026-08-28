import { sendError } from './http.js';

export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

export function aplicarCabecerasSeguridad(res) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

export function ipCliente(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || (req.socket && req.socket.remoteAddress) || 'desconocida';
}

// Ventanas fijas por IP+endpoint. En Vercel el mapa vive por instancia
// caliente: es un freno parcial; el freno global lo da Cloudflare.
const ventanas = new Map();

export function permitirPeticion(bucket, req, limite, ventanaMs) {
  const ahora = Date.now();
  const clave = `${bucket}:${ipCliente(req)}`;
  const registro = ventanas.get(clave);
  if (!registro || ahora - registro.inicio >= ventanaMs) {
    if (ventanas.size > 10000) {
      for (const [k, v] of ventanas) {
        if (ahora - v.inicio >= ventanaMs) ventanas.delete(k);
      }
    }
    ventanas.set(clave, { inicio: ahora, total: 1 });
    return true;
  }
  registro.total += 1;
  return registro.total <= limite;
}

export function limitar(bucket, req, res, limite, ventanaMs = 60000) {
  if (permitirPeticion(bucket, req, limite, ventanaMs)) return true;
  sendError(res, 429, 'limite', 'Demasiadas solicitudes. Intenta de nuevo en un momento.');
  return false;
}
