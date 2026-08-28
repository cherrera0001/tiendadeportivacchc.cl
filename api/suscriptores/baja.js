import { getDb } from '../../lib/db.js';
import { handleBaja } from '../../lib/handlers/suscriptores.js';

export default async function handler(req, res) {
  await getDb();
  return handleBaja(req, res);
}
