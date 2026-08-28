import { simulacionPermitida } from '../config.js';
import { queryOne } from '../db.js';
import { completarPagoAprobado } from '../pagos.js';
import { readBody, sendError, sendJson } from '../http.js';
import { limitar } from '../seguridad.js';

export async function handleSimularPago(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'validacion', 'Método no permitido');
  if (!limitar('simular-pago', req, res, 10)) return;
  if (!simulacionPermitida()) {
    return sendError(res, 403, 'pago', 'La simulación de pago no está habilitada.');
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendError(res, 400, 'validacion', 'Cuerpo JSON inválido');
  }

  const codigo = String(body.codigo || '').trim();
  if (!codigo) return sendError(res, 400, 'validacion', 'Falta el código de pedido');

  const pedido = await queryOne('SELECT * FROM pedidos WHERE codigo = $1', [codigo]);
  if (!pedido) return sendError(res, 404, 'no_encontrado', 'Pedido no encontrado');

  const resultado = await completarPagoAprobado({
    pedidoId: Number(pedido.id),
    mpPaymentId: `sim-${codigo}`
  });

  if (!resultado.ok) {
    const mensaje = resultado.motivo === 'sin_stock'
      ? 'El pago se registró en simulación pero no hay stock. Revisa el pedido a mano.'
      : 'No se pudo confirmar el pedido.';
    return sendError(res, 409, resultado.motivo || 'conflicto', mensaje);
  }

  sendJson(res, 200, {
    ok: true,
    idempotente: Boolean(resultado.idempotente),
    pedidoCodigo: codigo,
    redirect: `/pago/exito.html?codigo=${encodeURIComponent(codigo)}`
  });
}
