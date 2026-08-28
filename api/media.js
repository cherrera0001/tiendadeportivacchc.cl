import { getDb } from '../lib/db.js';
import { handleMedia } from '../lib/handlers/media.js';

export default async function handler(req, res) {
  await getDb();
  return handleMedia(req, res);
}
