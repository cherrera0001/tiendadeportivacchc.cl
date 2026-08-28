import { MercadoPagoConfig, Payment } from 'mercadopago';
import { queryOne } from '../db.js';
import { completarPagoAprobado } from '../pagos.js';
import { query } from '../db.js';
import { readBody, sendJson } from '../http.js';

export async function handleWebhook(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405;
    return res.end();
  }

  let paymentId = '';
  try {
    if (req.method === 'GET') {
      paymentId = String((req.query && (req.query.id || req.query['data.id'])) || '');
    } else {
      const body = await readBody(req);
      paymentId = String(body?.data?.id || body?.id || '');
      if (!paymentId && req.query) paymentId = String(req.query.id || '');
    }
  } catch {
    return sendJson(res, 200, { ok: true });
  }

  if (!paymentId || !process.env.MP_ACCESS_TOKEN) {
    return sendJson(res, 200, { ok: true });
  }

  try {
    const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const api = new Payment(mp);
    const pago = await api.get({ id: paymentId });
    const codigo = pago.external_reference;
    if (!codigo) return sendJson(res, 200, { ok: true });

    const pedido = await queryOne('SELECT * FROM pedidos WHERE codigo = $1', [codigo]);
    if (!pedido) return sendJson(res, 200, { ok: true });

    if (pago.status === 'approved') {
      await completarPagoAprobado({
        pedidoId: Number(pedido.id),
        mpPaymentId: String(pago.id)
      });
    } else if (['rejected', 'cancelled'].includes(pago.status) && pedido.estado === 'pendiente') {
      await query(
        `UPDATE pedidos SET estado = $1 WHERE id = $2 AND estado = 'pendiente'`,
        [pago.status === 'cancelled' ? 'cancelado' : 'rechazado', pedido.id]
      );
    }
  } catch (err) {
    console.error('Webhook MP', err);
  }

  sendJson(res, 200, { ok: true });
}
