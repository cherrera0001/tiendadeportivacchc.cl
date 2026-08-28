import { EVENTOS_CLIENTE } from '../config.js';
import { registrarEvento } from '../eventos.js';
import { readBody, sendError, sendJson } from '../http.js';

export async function handleEventos(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'validacion', 'Método no permitido');

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendError(res, 400, 'validacion', 'Cuerpo JSON inválido');
  }

  const nombre = String(body.nombre || '');
  if (!EVENTOS_CLIENTE.has(nombre)) {
    return sendError(res, 400, 'validacion', 'Evento no permitido desde el cliente');
  }

  await registrarEvento({
    nombre,
    sessionId: body.sessionId ? String(body.sessionId).slice(0, 80) : null,
    productoId: body.productoId ? Number(body.productoId) : null,
    valorClp: body.valorClp != null ? Number(body.valorClp) : null,
    payload: body.payload && typeof body.payload === 'object' ? body.payload : {}
  });

  sendJson(res, 200, { ok: true });
}
