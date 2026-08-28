import { getDb } from '../lib/db.js';
import { handleCheckout } from '../lib/handlers/checkout.js';

export default async function handler(req, res) {
  await getDb();
  return handleCheckout(req, res);
}
