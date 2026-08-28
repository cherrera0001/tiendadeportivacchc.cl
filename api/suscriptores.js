import { getDb } from '../lib/db.js';
import { handleBaja, handleSuscriptores } from '../lib/handlers/suscriptores.js';

export default async function handler(req, res) {
  await getDb();
  if (req.method === 'GET') return handleBaja(req, res);
  return handleSuscriptores(req, res);
}
