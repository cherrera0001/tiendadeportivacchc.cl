import crypto from 'crypto';
import { query, queryOne } from '../db.js';
import { STOCK_BAJO } from '../config.js';
import { sendError, sendJson } from '../http.js';

function accesoMetricasPermitido(req) {
  const esperado = process.env.METRICAS_TOKEN;
  if (!esperado) {
    // Sin token configurado: abierto solo fuera de producción.
    return process.env.NODE_ENV !== 'production';
  }
  const auth = String(req.headers.authorization || '');
  const recibido = Buffer.from(auth.startsWith('Bearer ') ? auth.slice(7) : '');
  const objetivo = Buffer.from(esperado);
  return recibido.length === objetivo.length && crypto.timingSafeEqual(recibido, objetivo);
}

export async function handleMetricas(req, res) {
  if (req.method !== 'GET') return sendError(res, 405, 'validacion', 'Método no permitido');
  if (!accesoMetricasPermitido(req)) {
    return sendError(res, 401, 'no_autorizado', 'Necesitas el token de métricas.');
  }

  const funnel = await queryOne(`
    SELECT
      count(*) FILTER (WHERE nombre = 'page_view')::int AS visitas,
      count(*) FILTER (WHERE nombre = 'add_to_cart')::int AS carritos,
      count(*) FILTER (WHERE nombre = 'begin_checkout')::int AS checkouts,
      count(*) FILTER (WHERE nombre = 'purchase')::int AS compras,
      coalesce(avg(valor_clp) FILTER (WHERE nombre = 'purchase'), 0)::int AS ticket,
      coalesce(sum(valor_clp) FILTER (WHERE nombre = 'purchase'), 0)::int AS ingresos
    FROM eventos
  `);

  const visitas = Number(funnel?.visitas || 0);
  const compras = Number(funnel?.compras || 0);

  const extra = await queryOne(`
    SELECT
      (SELECT count(*)::int FROM suscriptores WHERE activo = true) AS suscriptores,
      (SELECT count(*)::int FROM productos WHERE activo = true) AS productos,
      (SELECT count(*)::int FROM productos WHERE activo = true AND stock <= $1) AS stock_bajo,
      (SELECT count(*)::int FROM productos WHERE activo = true AND stock = 0) AS quiebre,
      (SELECT total FROM visitas_contador WHERE clave = 'home') AS visitas_vitrina,
      (SELECT coalesce(round(avg(evaluacion)::numeric, 1), 0) FROM productos WHERE activo = true) AS evaluacion
  `, [STOCK_BAJO]);

  sendJson(res, 200, {
    visitas,
    carritos: Number(funnel?.carritos || 0),
    checkouts: Number(funnel?.checkouts || 0),
    compras,
    conversion: visitas ? Number((compras / visitas).toFixed(4)) : 0,
    ticket: Number(funnel?.ticket || 0),
    ingresos: Number(funnel?.ingresos || 0),
    suscriptores: Number(extra?.suscriptores || 0),
    productos: Number(extra?.productos || 0),
    stockBajo: Number(extra?.stock_bajo || 0),
    quiebre: Number(extra?.quiebre || 0),
    visitasVitrina: Number(extra?.visitas_vitrina || 0),
    evaluacion: Number(extra?.evaluacion || 0)
  });
}
