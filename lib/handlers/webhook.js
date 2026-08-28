import crypto from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { query, queryOne } from '../db.js';
import { completarPagoAprobado } from '../pagos.js';
import { readBody, sendError, sendJson } from '../http.js';
import { limitar } from '../seguridad.js';

const TOLERANCIA_TS_MS = 5 * 60 * 1000;

// Firma de webhooks de Mercado Pago: x-signature = "ts=...,v1=...",
// v1 = HMAC-SHA256(secret, "id:{data.id};request-id:{x-request-id};ts:{ts};")
function firmaValida(req, dataId) {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) {
    // Sin secreto configurado: en producción se rechaza (fallar cerrado).
    return process.env.NODE_ENV !== 'production';
  }

  const partes = {};
  for (const trozo of String(req.headers['x-signature'] || '').split(',')) {
    const [k, ...v] = trozo.trim().split('=');
    if (k && v.length) partes[k.trim()] = v.join('=').trim();
  }
  const { ts, v1 } = partes;
  if (!ts || !v1) return false;

  const tsMs = String(ts).length > 11 ? Number(ts) : Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > TOLERANCIA_TS_MS) return false;

  const requestId = String(req.headers['x-request-id'] || '');
  let manifiesto = '';
  if (dataId) manifiesto += `id:${String(dataId).toLowerCase()};`;
  if (requestId) manifiesto += `request-id:${requestId};`;
  manifiesto += `ts:${ts};`;

  const esperado = Buffer.from(crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex'));
  const recibido = Buffer.from(String(v1));
  return esperado.length === recibido.length && crypto.timingSafeEqual(esperado, recibido);
}

export async function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end();
  }
  if (!limitar('webhook', req, res, 120)) return;

  let paymentId = '';
  try {
    const body = await readBody(req);
    paymentId = String(
      (req.query && (req.query['data.id'] || req.query.id)) ||
      body?.data?.id || body?.id || ''
    );
  } catch {
    return sendJson(res, 200, { ok: true });
  }

  if (!firmaValida(req, (req.query && req.query['data.id']) || paymentId)) {
    return sendError(res, 401, 'firma', 'Firma de webhook inválida');
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
