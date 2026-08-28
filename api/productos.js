import { getDb } from '../lib/db.js';
import { handleProductos } from '../lib/handlers/productos.js';

export default async function handler(req, res) {
  await getDb();
  return handleProductos(req, res);
}
