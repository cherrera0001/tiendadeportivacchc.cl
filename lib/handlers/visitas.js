import { query, queryOne } from '../db.js';
import { VISITA_COOKIE_MAX_AGE } from '../config.js';
import { cookieValue, sendError, sendJson } from '../http.js';

export async function handleVisitas(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'validacion', 'Método no permitido');

  const yaConto = cookieValue(req, 'visita_ok') === '1';
  if (!yaConto) {
    await query(
      `UPDATE visitas_contador
       SET total = total + 1, actualizado_at = now()
       WHERE clave = 'home'`
    );
    res.setHeader('Set-Cookie', `visita_ok=1; Path=/; Max-Age=${VISITA_COOKIE_MAX_AGE}; SameSite=Lax`);
  }

  const fila = await queryOne('SELECT total FROM visitas_contador WHERE clave = $1', ['home']);
  sendJson(res, 200, { total: Number(fila?.total || 0) });
}
