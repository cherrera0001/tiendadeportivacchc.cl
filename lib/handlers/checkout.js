import crypto from 'crypto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { costoDespacho, simulacionPermitida, siteUrl } from '../config.js';
import { query, queryOne } from '../db.js';
import { registrarEvento } from '../eventos.js';
import { correoValido, normalizarCorreo, readBody, sendError, sendJson } from '../http.js';

export async function handleCheckout(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'validacion', 'Método no permitido');

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendError(res, 400, 'validacion', 'Cuerpo JSON inválido');
  }

  const correo = normalizarCorreo(body.correo);
  if (!correoValido(correo)) {
    return sendError(res, 400, 'validacion', 'Necesitamos un correo válido para el pedido.');
  }

  const itemsIn = Array.isArray(body.items) ? body.items : [];
  if (!itemsIn.length) return sendError(res, 400, 'validacion', 'El carrito está vacío.');

  const lineas = [];
  let subtotal = 0;

  for (const item of itemsIn) {
    const productoId = Number(item.productoId);
    const cantidad = Number(item.cantidad);
    if (!productoId || !Number.isInteger(cantidad) || cantidad < 1) {
      return sendError(res, 400, 'validacion', 'Hay un ítem inválido en el carrito.');
    }
    const producto = await queryOne(
      'SELECT id, nombre, precio, stock, activo FROM productos WHERE id = $1',
      [productoId]
    );
    if (!producto || !producto.activo) {
      return sendError(res, 404, 'no_encontrado', 'Un producto del carrito ya no está disponible.');
    }
    if (Number(producto.stock) < cantidad) {
      return sendError(res, 409, 'sin_stock', `No hay stock suficiente de ${producto.nombre}.`);
    }
    const precio = Number(producto.precio);
    subtotal += precio * cantidad;
    lineas.push({
      productoId: Number(producto.id),
      nombre: producto.nombre,
      precio,
      cantidad
    });
  }

  const despacho = costoDespacho(subtotal);
  const total = subtotal + despacho;
  const codigo = `CCHC-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;

  const pedidoRows = await query(
    `INSERT INTO pedidos (codigo, estado, correo, nombre, telefono, direccion, subtotal, costo_despacho, total)
     VALUES ($1, 'pendiente', $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, codigo`,
    [
      codigo,
      correo,
      body.nombre ? String(body.nombre).slice(0, 120) : null,
      body.telefono ? String(body.telefono).slice(0, 40) : null,
      body.direccion ? String(body.direccion).slice(0, 240) : null,
      subtotal,
      despacho,
      total
    ]
  );
  const pedido = pedidoRows[0];

  for (const linea of lineas) {
    await query(
      `INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio_unitario, cantidad)
       VALUES ($1, $2, $3, $4, $5)`,
      [pedido.id, linea.productoId, linea.nombre, linea.precio, linea.cantidad]
    );
  }

  await registrarEvento({
    nombre: 'begin_checkout',
    pedidoId: Number(pedido.id),
    valorClp: total,
    payload: { codigo }
  });

  const token = process.env.MP_ACCESS_TOKEN;
  if (token) {
    try {
      const mp = new MercadoPagoConfig({ accessToken: token });
      const preference = new Preference(mp);
      const base = siteUrl();
      const mpItems = lineas.map((l) => ({
        title: l.nombre.slice(0, 120),
        quantity: l.cantidad,
        unit_price: l.precio,
        currency_id: 'CLP'
      }));
      if (despacho > 0) {
        mpItems.push({
          title: 'Despacho',
          quantity: 1,
          unit_price: despacho,
          currency_id: 'CLP'
        });
      }
      const creada = await preference.create({
        body: {
          items: mpItems,
          payer: { email: correo },
          back_urls: {
            success: `${base}/pago/exito.html?codigo=${codigo}`,
            pending: `${base}/pago/pendiente.html?codigo=${codigo}`,
            failure: `${base}/pago/fallo.html?codigo=${codigo}`
          },
          auto_return: 'approved',
          notification_url: `${base}/api/webhooks/mercadopago`,
          external_reference: codigo,
          statement_descriptor: 'CAMARA CCHC'
        }
      });
      await query('UPDATE pedidos SET mp_preference_id = $1 WHERE id = $2', [creada.id, pedido.id]);
      const initPoint = creada.init_point || creada.sandbox_init_point;
      return sendJson(res, 200, { pedidoCodigo: codigo, initPoint });
    } catch (err) {
      console.error('Mercado Pago', err);
      return sendError(res, 502, 'pago', 'No pudimos crear el pago en Mercado Pago. Intenta de nuevo.');
    }
  }

  if (simulacionPermitida()) {
    return sendJson(res, 200, {
      pedidoCodigo: codigo,
      initPoint: `/pago/pendiente.html?codigo=${encodeURIComponent(codigo)}&simular=1`
    });
  }

  sendError(res, 503, 'pago', 'Mercado Pago no está configurado en este entorno.');
}
