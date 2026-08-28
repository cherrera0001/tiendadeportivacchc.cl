import { getDb } from '../../lib/db.js';
import { handleWebhook } from '../../lib/handlers/webhook.js';

export default async function handler(req, res) {
  await getDb();
  return handleWebhook(req, res);
}
