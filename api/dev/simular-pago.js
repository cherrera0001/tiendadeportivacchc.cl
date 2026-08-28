import { getDb } from '../../lib/db.js';
import { handleSimularPago } from '../../lib/handlers/simular-pago.js';

export default async function handler(req, res) {
  await getDb();
  return handleSimularPago(req, res);
}
