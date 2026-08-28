import { query, queryOne } from './db.js';
import { registrarEvento } from './eventos.js';

export async function completarPagoAprobado({ pedidoId, mpPaymentId = null }) {
  const pedido = await queryOne('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
  if (!pedido) return { ok: false, motivo: 'no_encontrado' };
  if (pedido.estado === 'pagado') return { ok: true, idempotente: true, pedido };

  const items = await query(
    'SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = $1',
    [pedidoId]
  );

  for (const item of items) {
    const actualizado = await query(
      `UPDATE productos
       SET stock = stock - $1, updated_at = now()
       WHERE id = $2 AND stock >= $1
       RETURNING id`,
      [item.cantidad, item.producto_id]
    );
    if (!actualizado.length) {
      return { ok: false, motivo: 'sin_stock', pedido };
    }
  }

  const filas = await query(
    `UPDATE pedidos
     SET estado = 'pagado',
         mp_payment_id = COALESCE($1, mp_payment_id),
         pagado_at = now()
     WHERE id = $2 AND estado = 'pendiente'
     RETURNING *`,
    [mpPaymentId, pedidoId]
  );

  if (!filas.length) {
    const otra = await queryOne('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
    if (otra?.estado === 'pagado') return { ok: true, idempotente: true, pedido: otra };
    return { ok: false, motivo: 'conflicto', pedido: otra };
  }

  const pagado = filas[0];
  await registrarEvento({
    nombre: 'purchase',
    pedidoId: Number(pagado.id),
    valorClp: Number(pagado.total),
    payload: { codigo: pagado.codigo }
  });

  return { ok: true, idempotente: false, pedido: pagado };
}
