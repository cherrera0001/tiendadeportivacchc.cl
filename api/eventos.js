import { getDb } from '../lib/db.js';
import { handleEventos } from '../lib/handlers/eventos.js';

export default async function handler(req, res) {
  await getDb();
  return handleEventos(req, res);
}
