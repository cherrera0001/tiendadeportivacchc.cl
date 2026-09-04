import dotenv from 'dotenv';
import fs from 'fs';

// Cargar .env.local primero (desarrollo local con PGlite)
// Si no existe, cargar .env (credenciales de producción)
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../lib/db.js';
import { handleProductos, handleProductoId } from '../lib/handlers/productos.js';
import { handleSuscriptores, handleBaja } from '../lib/handlers/suscriptores.js';
import { handleVisitas } from '../lib/handlers/visitas.js';
import { handleEventos } from '../lib/handlers/eventos.js';
import { handleMetricas } from '../lib/handlers/metricas.js';
import { handleCheckout } from '../lib/handlers/checkout.js';
import { handleWebhook } from '../lib/handlers/webhook.js';
import { handleSimularPago } from '../lib/handlers/simular-pago.js';
import { handleMedia } from '../lib/handlers/media.js';
import { aplicarCabecerasSeguridad } from '../lib/seguridad.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, '..');
const app = express();
const puerto = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use((_req, res, next) => {
  aplicarCabecerasSeguridad(res);
  next();
});
app.use(express.json({ limit: '256kb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

app.get('/api/productos', wrap(handleProductos));
app.get('/api/productos/:id', wrap(handleProductoId));
app.post('/api/suscriptores', wrap(handleSuscriptores));
app.get('/api/suscriptores/baja', wrap(handleBaja));
app.post('/api/suscriptores/baja', wrap(handleBaja));
app.post('/api/visitas', wrap(handleVisitas));
app.post('/api/eventos', wrap(handleEventos));
app.get('/api/metricas', wrap(handleMetricas));
app.post('/api/checkout', wrap(handleCheckout));
app.post('/api/webhooks/mercadopago', wrap(handleWebhook));
app.post('/api/dev/simular-pago', wrap(handleSimularPago));
app.get('/media/:id', wrap(handleMedia));

// Solo assets del front: nunca servir la raíz del repo (.git, spec, package.json…)
app.use('/css', express.static(path.join(raiz, 'css')));
app.use('/js', express.static(path.join(raiz, 'js')));
app.use('/pago', express.static(path.join(raiz, 'pago')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(raiz, 'index.html'));
});
app.get('/metricas.html', (_req, res) => {
  res.sendFile(path.join(raiz, 'metricas.html'));
});

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({ error: 'validacion', mensaje: 'Cuerpo JSON inválido' });
  }
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'interno', mensaje: 'Ocurrió un error interno.' });
});

await getDb();

app.listen(puerto, () => {
  console.log(`Cámara CCHC en http://localhost:${puerto}`);
});
