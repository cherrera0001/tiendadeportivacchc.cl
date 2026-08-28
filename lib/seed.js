const CATEGORIAS = [
  { slug: 'running', nombre: 'Running', icono: '👟', orden: 1 },
  { slug: 'futbol', nombre: 'Fútbol', icono: '⚽', orden: 2 },
  { slug: 'gimnasio', nombre: 'Gimnasio', icono: '🏋️', orden: 3 },
  { slug: 'ciclismo', nombre: 'Ciclismo', icono: '🚴', orden: 4 },
  { slug: 'outdoor', nombre: 'Outdoor', icono: '🏕️', orden: 5 }
];

const PRODUCTOS = [
  { slug: 'zapatilla-velocity-pro-4', nombre: 'Zapatilla Velocity Pro 4', marca: 'Aurex', categoria: 'running', precio: 119990, precioAntes: 159990, evaluacion: 4.8, resenas: 214, stock: 12, insignia: 'oferta', destacado: 5, descripcion: 'Zapatilla de entrenamiento con placa reactiva y upper transpirable para ritmos de 4:30 a 5:30 min/km.' },
  { slug: 'zapatilla-trail-andes-gtx', nombre: 'Zapatilla Trail Andes GTX', marca: 'Kumbre', categoria: 'running', precio: 149990, precioAntes: null, evaluacion: 4.7, resenas: 96, stock: 7, insignia: 'nuevo', destacado: 4, descripcion: 'Trail con membrana impermeable y suela multidireccional para senderos húmedos de la cordillera.' },
  { slug: 'polera-tecnica-dryflow', nombre: 'Polera técnica DryFlow', marca: 'Aurex', categoria: 'running', precio: 24990, precioAntes: 32990, evaluacion: 4.5, resenas: 341, stock: 48, insignia: 'oferta', destacado: 3, descripcion: 'Polera de secado rápido con costuras planas. Ideal para rodajes y gimnasio.' },
  { slug: 'calza-compresion-elite', nombre: 'Calza compresión Elite', marca: 'Nébula', categoria: 'running', precio: 34990, precioAntes: null, evaluacion: 4.6, resenas: 127, stock: 22, insignia: null, destacado: 2, descripcion: 'Calza de compresión media con bolsillo trasero para geles o llave.' },
  { slug: 'botin-estadio-fg', nombre: 'Botín Estadio FG', marca: 'Torrent', categoria: 'futbol', precio: 89990, precioAntes: 119990, evaluacion: 4.6, resenas: 178, stock: 9, insignia: 'oferta', destacado: 5, descripcion: 'Botín de firme ground con empeine sintético de toque limpio y taco cónico.' },
  { slug: 'balon-oficial-liga-pro', nombre: 'Balón oficial Liga Pro', marca: 'Torrent', categoria: 'futbol', precio: 39990, precioAntes: null, evaluacion: 4.9, resenas: 402, stock: 34, insignia: null, destacado: 4, descripcion: 'Balón termosellado de 32 paneles, peso y circunferencia de competencia.' },
  { slug: 'canilleras-carbon-shield', nombre: 'Canilleras Carbon Shield', marca: 'Torrent', categoria: 'futbol', precio: 18990, precioAntes: 24990, evaluacion: 4.3, resenas: 88, stock: 3, insignia: 'oferta', destacado: 1, descripcion: 'Canilleras livianas con cáscara rígida y correas de silicona antideslizante.' },
  { slug: 'guantes-de-arquero-gripx', nombre: 'Guantes de arquero GripX', marca: 'Nébula', categoria: 'futbol', precio: 44990, precioAntes: null, evaluacion: 4.4, resenas: 61, stock: 15, insignia: null, destacado: 2, descripcion: 'Látex alemán 4 mm y corte negativo para bloqueo en días secos.' },
  { slug: 'set-mancuernas-2x10-kg', nombre: 'Set mancuernas 2 × 10 kg', marca: 'IronBase', categoria: 'gimnasio', precio: 79990, precioAntes: 99990, evaluacion: 4.7, resenas: 233, stock: 18, insignia: 'oferta', destacado: 5, descripcion: 'Par de mancuernas recubiertas, hexagonales para no rodar en el suelo.' },
  { slug: 'kettlebell-competicion-16-kg', nombre: 'Kettlebell competición 16 kg', marca: 'IronBase', categoria: 'gimnasio', precio: 54990, precioAntes: null, evaluacion: 4.8, resenas: 145, stock: 11, insignia: null, destacado: 3, descripcion: 'Kettlebell de competición con manilla uniforme y base plana.' },
  { slug: 'colchoneta-pro-10-mm', nombre: 'Colchoneta Pro 10 mm', marca: 'Nébula', categoria: 'gimnasio', precio: 22990, precioAntes: 29990, evaluacion: 4.5, resenas: 289, stock: 52, insignia: 'oferta', destacado: 2, descripcion: 'Colchoneta NBR de 10 mm con correa. Para suelo, core y movilidad.' },
  { slug: 'banco-regulable-multiuso', nombre: 'Banco regulable multiuso', marca: 'IronBase', categoria: 'gimnasio', precio: 189990, precioAntes: null, evaluacion: 4.6, resenas: 74, stock: 4, insignia: 'nuevo', destacado: 4, descripcion: 'Banco de 7 inclinaciones, estructura de acero y tapiz de alta densidad.' },
  { slug: 'bicicleta-ruta-carbon-r7', nombre: 'Bicicleta ruta Carbon R7', marca: 'Kumbre', categoria: 'ciclismo', precio: 1299990, precioAntes: 1499990, evaluacion: 4.9, resenas: 37, stock: 2, insignia: 'oferta', destacado: 5, descripcion: 'Cuadro de carbono, grupo 2×11 y ruedas 700c. Talla M de exhibición.' },
  { slug: 'casco-aero-ventus', nombre: 'Casco aero Ventus', marca: 'Kumbre', categoria: 'ciclismo', precio: 89990, precioAntes: null, evaluacion: 4.7, resenas: 112, stock: 16, insignia: null, destacado: 3, descripcion: 'Casco aerodinámico con 18 ventilaciones y ajuste occipital micrométrico.' },
  { slug: 'ciclocomputador-gps-track', nombre: 'Ciclocomputador GPS Track', marca: 'Nébula', categoria: 'ciclismo', precio: 149990, precioAntes: 179990, evaluacion: 4.4, resenas: 68, stock: 8, insignia: 'oferta', destacado: 2, descripcion: 'GPS con mapas, batería de 20 h y sensores ANT+/Bluetooth.' },
  { slug: 'portabidon-aluminio', nombre: 'Portabidón aluminio', marca: 'Kumbre', categoria: 'ciclismo', precio: 9990, precioAntes: null, evaluacion: 4.2, resenas: 156, stock: 74, insignia: null, destacado: 1, descripcion: 'Portabidón de aluminio 6061 con tornillos incluidos. 28 g.' },
  { slug: 'mochila-trekking-45-l', nombre: 'Mochila trekking 45 L', marca: 'Kumbre', categoria: 'outdoor', precio: 109990, precioAntes: 139990, evaluacion: 4.8, resenas: 91, stock: 6, insignia: 'oferta', destacado: 4, descripcion: 'Mochila 45 L con espalda ventilada, cover de lluvia y acceso frontal.' },
  { slug: 'carpa-3-estaciones-patagonia', nombre: 'Carpa 3 estaciones Patagonia', marca: 'Kumbre', categoria: 'outdoor', precio: 219990, precioAntes: null, evaluacion: 4.7, resenas: 53, stock: 5, insignia: 'nuevo', destacado: 5, descripcion: 'Carpa 2 personas, doble techo 3000 mm y varillas de aluminio.' },
  { slug: 'saco-de-dormir-menos-5', nombre: 'Saco de dormir −5 °C', marca: 'Nébula', categoria: 'outdoor', precio: 79990, precioAntes: 94990, evaluacion: 4.5, resenas: 104, stock: 13, insignia: 'oferta', destacado: 2, descripcion: 'Saco sintético límite −5 °C, corte momia y bolsa de compresión.' },
  { slug: 'bastones-trekking-carbono', nombre: 'Bastones trekking carbono', marca: 'Kumbre', categoria: 'outdoor', precio: 49990, precioAntes: null, evaluacion: 4.6, resenas: 77, stock: 21, insignia: null, destacado: 3, descripcion: 'Bastones telescópicos de carbono, empuñadura EVA y dragonera ajustable.' }
];

export async function seedIfEmpty(db) {
  const conteo = await db.query('SELECT count(*)::int AS n FROM productos');
  const n = Number(conteo.rows[0]?.n || 0);
  if (n > 0) return;

  for (const cat of CATEGORIAS) {
    await db.query(
      'INSERT INTO categorias (slug, nombre, icono, orden) VALUES ($1, $2, $3, $4)',
      [cat.slug, cat.nombre, cat.icono, cat.orden]
    );
  }

  const cats = await db.query('SELECT id, slug FROM categorias');
  const idPorSlug = Object.fromEntries(cats.rows.map((c) => [c.slug, c.id]));

  for (const p of PRODUCTOS) {
    const inserted = await db.query(
      `INSERT INTO productos
        (categoria_id, nombre, slug, marca, descripcion, precio, precio_antes, stock, evaluacion, resenas, insignia, destacado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        idPorSlug[p.categoria],
        p.nombre,
        p.slug,
        p.marca,
        p.descripcion,
        p.precio,
        p.precioAntes,
        p.stock,
        p.evaluacion,
        p.resenas,
        p.insignia,
        p.destacado
      ]
    );
    const id = inserted.rows[0].id;
    await db.query(
      'INSERT INTO producto_imagenes (producto_id, url, alt, orden) VALUES ($1, $2, $3, 0)',
      [id, `/media/${id}.svg`, p.nombre]
    );
  }
}
