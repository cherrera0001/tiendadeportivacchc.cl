import { query, queryOne } from './db.js';

export async function imagenesDe(productoId) {
  const rows = await query(
    'SELECT url, alt, orden FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden, id',
    [productoId]
  );
  return rows.map((r) => ({
    url: r.url,
    alt: r.alt,
    orden: Number(r.orden)
  }));
}

export function mapProducto(row, imagenes) {
  return {
    id: Number(row.id),
    nombre: row.nombre,
    slug: row.slug,
    marca: row.marca,
    categoria: row.categoria_slug,
    categoriaNombre: row.categoria_nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    precioAntes: row.precio_antes == null ? null : Number(row.precio_antes),
    evaluacion: Number(row.evaluacion),
    resenas: Number(row.resenas),
    stock: Number(row.stock),
    insignia: row.insignia,
    destacado: Number(row.destacado),
    imagenes
  };
}

export async function listarProductos({ categoria, q } = {}) {
  const params = [];
  const filtros = ['p.activo = true'];

  if (categoria && categoria !== 'todas') {
    params.push(categoria);
    filtros.push(`c.slug = $${params.length}`);
  }
  if (q && String(q).trim()) {
    params.push(`%${String(q).trim().toLowerCase()}%`);
    filtros.push(`(lower(p.nombre) LIKE $${params.length} OR lower(p.marca) LIKE $${params.length})`);
  }

  const rows = await query(
    `SELECT p.*, c.slug AS categoria_slug, c.nombre AS categoria_nombre
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE ${filtros.join(' AND ')}
     ORDER BY p.destacado DESC, p.id`,
    params
  );

  const lista = [];
  for (const row of rows) {
    lista.push(mapProducto(row, await imagenesDe(row.id)));
  }
  return lista;
}

export async function obtenerProducto(id) {
  const row = await queryOne(
    `SELECT p.*, c.slug AS categoria_slug, c.nombre AS categoria_nombre
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE p.id = $1 AND p.activo = true`,
    [id]
  );
  if (!row) return null;
  return mapProducto(row, await imagenesDe(row.id));
}
