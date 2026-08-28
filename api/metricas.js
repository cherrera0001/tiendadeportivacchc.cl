import { getDb } from '../lib/db.js';
import { handleMetricas } from '../lib/handlers/metricas.js';

export default async function handler(req, res) {
  await getDb();
  return handleMetricas(req, res);
}
