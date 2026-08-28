import crypto from 'crypto';
import { query, queryOne } from '../db.js';
import { registrarEvento } from '../eventos.js';
import { correoValido, normalizarCorreo, readBody, sendError, sendJson } from '../http.js';

async function verificarTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
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

  const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  const turnstileOk = await verificarTurnstile(body.turnstileToken, ip);
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

export async function handleBaja(req, res) {
  const token = (req.query && req.query.token) || new URL(req.url, 'http://localhost').searchParams.get('token');
  if (!token) return sendError(res, 400, 'validacion', 'Falta el token de baja');

  const fila = await query(
    `UPDATE suscriptores
     SET activo = false, unsubscribed_at = now()
     WHERE token_baja = $1 AND activo = true
     RETURNING id`,
    [token]
  );

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const ok = fila.length > 0;
  res.end(`<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><title>Baja</title></head>
<body style="font-family:system-ui;padding:2rem;max-width:40rem">
<h1>${ok ? 'Te diste de baja' : 'Enlace no válido o ya usado'}</h1>
<p>${ok ? 'No te enviaremos más correos de Cámara.' : 'Si crees que es un error, escribe a hola@camara.cl'}</p>
<p><a href="/">Volver a la tienda</a></p>
</body></html>`);
}
