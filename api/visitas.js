import { getDb } from '../lib/db.js';
import { handleVisitas } from '../lib/handlers/visitas.js';

export default async function handler(req, res) {
  await getDb();
  return handleVisitas(req, res);
}
