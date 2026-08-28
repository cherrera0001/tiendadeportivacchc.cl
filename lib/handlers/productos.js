import { listarProductos, obtenerProducto } from '../catalogo.js';
import { paramId, sendError, sendJson } from '../http.js';

export async function handleProductos(req, res) {
  if (req.method !== 'GET') return sendError(res, 405, 'validacion', 'Método no permitido');
  const query = req.query || {};
  const productos = await listarProductos({
    categoria: query.categoria,
    q: query.q
  });
  sendJson(res, 200, { productos });
}

export async function handleProductoId(req, res) {
  if (req.method !== 'GET') return sendError(res, 405, 'validacion', 'Método no permitido');
  const id = Number(paramId(req));
  if (!id) return sendError(res, 400, 'validacion', 'Identificador inválido');
  const producto = await obtenerProducto(id);
  if (!producto) return sendError(res, 404, 'no_encontrado', 'Producto no encontrado');
  sendJson(res, 200, { producto });
}
