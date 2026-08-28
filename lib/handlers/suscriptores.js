import crypto from 'crypto';
import { query, queryOne } from '../db.js';
import { registrarEvento } from '../eventos.js';
import { correoValido, normalizarCorreo, readBody, sendError, sendJson } from '../http.js';
import { ipCliente, limitar } from '../seguridad.js';

async function verificarTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Sin clave configurada: abierto solo fuera de producción.
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: ip || '' });
  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body
  });
  const data = await resp.json();
  return Boolean(data.success);
}

export async function handleSuscriptores(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'validacion', 'Método no permitido');
  if (!limitar('suscriptores', req, res, 5)) return;

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendError(res, 400, 'validacion', 'Cuerpo JSON inválido');
  }

  if (body.consentimiento !== true && body.consentimiento !== 'true') {
    return sendError(res, 400, 'validacion', 'Debes aceptar el uso de tu correo para informarte.');
  }

  const correo = normalizarCorreo(body.correo);
  if (!correoValido(correo)) {
    return sendError(res, 400, 'validacion', 'Ingresa un correo electrónico válido.');
  }

  const turnstileOk = await verificarTurnstile(body.turnstileToken, ipCliente(req));
  if (!turnstileOk) {
    return sendError(res, 400, 'validacion', 'No pudimos verificar que no eres un robot.');
  }

  const existente = await queryOne('SELECT id, activo FROM suscriptores WHERE correo = $1', [correo]);
  if (existente) {
    if (!existente.activo) {
      await query(
        `UPDATE suscriptores
         SET activo = true, consentimiento_at = now(), unsubscribed_at = NULL, origen = 'newsletter'
         WHERE id = $1`,
        [existente.id]
      );
      await registrarEvento({ nombre: 'newsletter_signup', payload: { correoDominio: correo.split('@')[1] } });
      return sendJson(res, 200, { ok: true, estado: 'creado' });
    }
    return sendJson(res, 200, { ok: true, estado: 'ya_suscrito' });
  }

  const token = crypto.randomUUID();
  await query(
    `INSERT INTO suscriptores (correo, origen, consentimiento_at, token_baja)
     VALUES ($1, 'newsletter', now(), $2)`,
    [correo, token]
  );
  await registrarEvento({ nombre: 'newsletter_signup', payload: { correoDominio: correo.split('@')[1] } });
  sendJson(res, 200, { ok: true, estado: 'creado' });
}

const escaparHtml = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function paginaBaja(res, cuerpo) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><title>Baja</title></head>
<body style="font-family:system-ui;padding:2rem;max-width:40rem">
${cuerpo}
<p><a href="/">Volver a la tienda</a></p>
</body></html>`);
}

async function tokenDesdePost(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return String(req.body.token || '');
  }
  const raw = typeof req.body === 'string' ? req.body : await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
  if (!raw) return '';
  try {
    return String(JSON.parse(raw).token || '');
  } catch {
    return new URLSearchParams(raw).get('token') || '';
  }
}

export async function handleBaja(req, res) {
  // El token es un secreto: sin Referer y sin caches intermedios.
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const token = (req.query && req.query.token) || new URL(req.url, 'http://localhost').searchParams.get('token');
    if (!token) return sendError(res, 400, 'validacion', 'Falta el token de baja');

    // El GET no consume el token: solo muestra la confirmación (la baja va por POST).
    const suscriptor = await queryOne(
      'SELECT id FROM suscriptores WHERE token_baja = $1 AND activo = true',
      [token]
    );
    if (!suscriptor) {
      return paginaBaja(res, `<h1>Enlace no válido o ya usado</h1>
<p>Si crees que es un error, escribe a hola@camara.cl</p>`);
    }
    return paginaBaja(res, `<h1>Confirmar baja</h1>
<p>¿Quieres dejar de recibir correos de Cámara?</p>
<form method="post" action="/api/suscriptores/baja">
<input type="hidden" name="token" value="${escaparHtml(token)}">
<button type="submit">Sí, darme de baja</button>
</form>`);
  }

  if (req.method !== 'POST') return sendError(res, 405, 'validacion', 'Método no permitido');
  if (!limitar('baja', req, res, 10)) return;

  const token = await tokenDesdePost(req);
  if (!token) return sendError(res, 400, 'validacion', 'Falta el token de baja');

  const fila = await query(
    `UPDATE suscriptores
     SET activo = false, unsubscribed_at = now()
     WHERE token_baja = $1 AND activo = true
     RETURNING id`,
    [token]
  );

  const ok = fila.length > 0;
  paginaBaja(res, ok
    ? '<h1>Te diste de baja</h1>\n<p>No te enviaremos más correos de Cámara.</p>'
    : '<h1>Enlace no válido o ya usado</h1>\n<p>Si crees que es un error, escribe a hola@camara.cl</p>');
}
