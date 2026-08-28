import { getDb } from '../../lib/db.js';
import { handleProductoId } from '../../lib/handlers/productos.js';

export default async function handler(req, res) {
  await getDb();
  return handleProductoId(req, res);
}
