import { query } from './db.js';

export async function registrarEvento({ nombre, sessionId = null, productoId = null, pedidoId = null, valorClp = null, payload = {} }) {
  await query(
    `INSERT INTO eventos (nombre, session_id, producto_id, pedido_id, valor_clp, payload)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [nombre, sessionId, productoId, pedidoId, valorClp, JSON.stringify(payload || {})]
  );
}
