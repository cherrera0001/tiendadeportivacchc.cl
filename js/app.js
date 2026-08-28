/* =========================================================
   Cámara — Artículos deportivos
   Lógica de la tienda (sin dependencias externas)

   Secciones:
     1. Datos (categorías y catálogo)
     2. Utilidades
     3. Estado de la aplicación
     4. Render: categorías, filtros y productos
     5. Carrito
     6. Interfaz: tema, menú, newsletter
     7. Arranque
   ========================================================= */
'use strict';

/* ---------- 1) DATOS ---------- */

const CATEGORIAS = [
  { id: 'running',   nombre: 'Running',   icono: '👟' },
  { id: 'futbol',    nombre: 'Fútbol',    icono: '⚽' },
  { id: 'gimnasio',  nombre: 'Gimnasio',  icono: '🏋️' },
  { id: 'ciclismo',  nombre: 'Ciclismo',  icono: '🚴' },
  { id: 'outdoor',   nombre: 'Outdoor',   icono: '🏕️' }
];

/**
 * Catálogo de demostración.
 * precioAntes = null cuando el producto no está en oferta.
 */
const PRODUCTOS = [
  { id: 1,  nombre: 'Zapatilla Velocity Pro 4',   marca: 'Aurex',      categoria: 'running',  precio: 119990, precioAntes: 159990, evaluacion: 4.8, resenas: 214, stock: 12, icono: '👟', insignia: 'oferta',  destacado: 5 },
  { id: 2,  nombre: 'Zapatilla Trail Andes GTX',  marca: 'Kumbre',     categoria: 'running',  precio: 149990, precioAntes: null,   evaluacion: 4.7, resenas: 96,  stock: 7,  icono: '👟', insignia: 'nuevo',   destacado: 4 },
  { id: 3,  nombre: 'Polera técnica DryFlow',     marca: 'Aurex',      categoria: 'running',  precio: 24990,  precioAntes: 32990,  evaluacion: 4.5, resenas: 341, stock: 48, icono: '👕', insignia: 'oferta',  destacado: 3 },
  { id: 4,  nombre: 'Calza compresión Elite',     marca: 'Nébula',     categoria: 'running',  precio: 34990,  precioAntes: null,   evaluacion: 4.6, resenas: 127, stock: 22, icono: '🩳', insignia: null,      destacado: 2 },

  { id: 5,  nombre: 'Botín Estadio FG',           marca: 'Torrent',    categoria: 'futbol',   precio: 89990,  precioAntes: 119990, evaluacion: 4.6, resenas: 178, stock: 9,  icono: '👟', insignia: 'oferta',  destacado: 5 },
  { id: 6,  nombre: 'Balón oficial Liga Pro',     marca: 'Torrent',    categoria: 'futbol',   precio: 39990,  precioAntes: null,   evaluacion: 4.9, resenas: 402, stock: 34, icono: '⚽', insignia: null,      destacado: 4 },
  { id: 7,  nombre: 'Canilleras Carbon Shield',   marca: 'Torrent',    categoria: 'futbol',   precio: 18990,  precioAntes: 24990,  evaluacion: 4.3, resenas: 88,  stock: 3,  icono: '🛡️', insignia: 'oferta',  destacado: 1 },
  { id: 8,  nombre: 'Guantes de arquero GripX',   marca: 'Nébula',     categoria: 'futbol',   precio: 44990,  precioAntes: null,   evaluacion: 4.4, resenas: 61,  stock: 15, icono: '🧤', insignia: null,      destacado: 2 },

  { id: 9,  nombre: 'Set mancuernas 2 × 10 kg',   marca: 'IronBase',   categoria: 'gimnasio', precio: 79990,  precioAntes: 99990,  evaluacion: 4.7, resenas: 233, stock: 18, icono: '🏋️', insignia: 'oferta',  destacado: 5 },
  { id: 10, nombre: 'Kettlebell competición 16 kg', marca: 'IronBase', categoria: 'gimnasio', precio: 54990,  precioAntes: null,   evaluacion: 4.8, resenas: 145, stock: 11, icono: '🔔', insignia: null,      destacado: 3 },
  { id: 11, nombre: 'Colchoneta Pro 10 mm',       marca: 'Nébula',     categoria: 'gimnasio', precio: 22990,  precioAntes: 29990,  evaluacion: 4.5, resenas: 289, stock: 52, icono: '🧘', insignia: 'oferta',  destacado: 2 },
  { id: 12, nombre: 'Banco regulable multiuso',   marca: 'IronBase',   categoria: 'gimnasio', precio: 189990, precioAntes: null,   evaluacion: 4.6, resenas: 74,  stock: 4,  icono: '🪑', insignia: 'nuevo',   destacado: 4 },

  { id: 13, nombre: 'Bicicleta ruta Carbon R7',   marca: 'Kumbre',     categoria: 'ciclismo', precio: 1299990, precioAntes: 1499990, evaluacion: 4.9, resenas: 37, stock: 2, icono: '🚴', insignia: 'oferta',  destacado: 5 },
  { id: 14, nombre: 'Casco aero Ventus',          marca: 'Kumbre',     categoria: 'ciclismo', precio: 89990,  precioAntes: null,   evaluacion: 4.7, resenas: 112, stock: 16, icono: '⛑️', insignia: null,      destacado: 3 },
  { id: 15, nombre: 'Ciclocomputador GPS Track',  marca: 'Nébula',     categoria: 'ciclismo', precio: 149990, precioAntes: 179990, evaluacion: 4.4, resenas: 68,  stock: 8,  icono: '📟', insignia: 'oferta',  destacado: 2 },
  { id: 16, nombre: 'Portabidón aluminio',        marca: 'Kumbre',     categoria: 'ciclismo', precio: 9990,   precioAntes: null,   evaluacion: 4.2, resenas: 156, stock: 74, icono: '🥤', insignia: null,      destacado: 1 },

  { id: 17, nombre: 'Mochila trekking 45 L',      marca: 'Kumbre',     categoria: 'outdoor',  precio: 109990, precioAntes: 139990, evaluacion: 4.8, resenas: 91,  stock: 6,  icono: '🎒', insignia: 'oferta',  destacado: 4 },
  { id: 18, nombre: 'Carpa 3 estaciones Patagonia', marca: 'Kumbre',   categoria: 'outdoor',  precio: 219990, precioAntes: null,   evaluacion: 4.7, resenas: 53,  stock: 5,  icono: '⛺', insignia: 'nuevo',   destacado: 5 },
  { id: 19, nombre: 'Saco de dormir −5 °C',       marca: 'Nébula',     categoria: 'outdoor',  precio: 79990,  precioAntes: 94990,  evaluacion: 4.5, resenas: 104, stock: 13, icono: '🛏️', insignia: 'oferta',  destacado: 2 },
  { id: 20, nombre: 'Bastones trekking carbono',  marca: 'Kumbre',     categoria: 'outdoor',  precio: 49990,  precioAntes: null,   evaluacion: 4.6, resenas: 77,  stock: 21, icono: '🥢', insignia: null,      destacado: 3 }
];

/** Reglas comerciales */
const DESPACHO = { costo: 4990, umbralGratis: 59990 };
const STOCK_BAJO = 5;

/* ---------- 2) UTILIDADES ---------- */

const $  = (selector, ambito = document) => ambito.querySelector(selector);
const $$ = (selector, ambito = document) => Array.from(ambito.querySelectorAll(selector));

const formateadorPeso = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

/** 119990 → «$119.990» */
const precio = (valor) => formateadorPeso.format(valor);

/** 4.8 → «★★★★★» (redondeo al medio punto más cercano, simplificado) */
const estrellas = (valor) => '★'.repeat(Math.round(valor)) + '☆'.repeat(5 - Math.round(valor));

/** Porcentaje de descuento entero */
const descuento = (actual, antes) => Math.round((1 - actual / antes) * 100);

/** Evita inyección de HTML al interpolar texto */
const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/** Normaliza para búsqueda: minúsculas y sin tildes */
const normalizar = (texto) => String(texto)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

/** Retrasa la ejecución mientras se sigan produciendo eventos */
function retardar(fn, ms = 220) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), ms);
  };
}

/* ---------- 3) ESTADO ---------- */

const estado = {
  categoria: 'todas',
  busqueda: '',
  orden: 'destacados',
  /** Map<idProducto, cantidad> — en memoria, se reinicia al recargar */
  carrito: new Map()
};

/* ---------- 4) RENDER ---------- */

function pintarCategorias() {
  const contenedor = $('#grilla-categorias');
  if (!contenedor) return;

  contenedor.innerHTML = CATEGORIAS.map((cat) => {
    const total = PRODUCTOS.filter((p) => p.categoria === cat.id).length;
    return `
      <button class="categoria" type="button" data-categoria="${cat.id}">
        <span class="categoria__icono" aria-hidden="true">${cat.icono}</span>
        <span class="categoria__nombre">${escapar(cat.nombre)}</span>
        <span class="categoria__conteo">${total} productos</span>
      </button>`;
  }).join('');

  $$('.categoria', contenedor).forEach((boton) => {
    boton.addEventListener('click', () => {
      estado.categoria = boton.dataset.categoria;
      sincronizarFiltros();
      pintarProductos();
      $('#catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function pintarFiltros() {
  const contenedor = $('#filtros');
  if (!contenedor) return;

  const opciones = [{ id: 'todas', nombre: 'Todas' }, ...CATEGORIAS];

  contenedor.innerHTML = opciones.map((opcion) => `
    <button class="filtro" type="button" data-categoria="${opcion.id}"
            aria-pressed="${opcion.id === estado.categoria}">
      ${escapar(opcion.nombre)}
    </button>`).join('');

  $$('.filtro', contenedor).forEach((boton) => {
    boton.addEventListener('click', () => {
      estado.categoria = boton.dataset.categoria;
      sincronizarFiltros();
      pintarProductos();
    });
  });
}

function sincronizarFiltros() {
  $$('#filtros .filtro').forEach((boton) => {
    boton.setAttribute('aria-pressed', String(boton.dataset.categoria === estado.categoria));
  });
}

/** Aplica filtro de categoría, búsqueda y orden */
function productosVisibles() {
  const consulta = normalizar(estado.busqueda.trim());

  let lista = PRODUCTOS.filter((p) => {
    const coincideCategoria = estado.categoria === 'todas' || p.categoria === estado.categoria;
    if (!coincideCategoria) return false;
    if (!consulta) return true;

    const texto = normalizar(`${p.nombre} ${p.marca} ${p.categoria}`);
    return texto.includes(consulta);
  });

  const ordenadores = {
    'destacados':  (a, b) => b.destacado - a.destacado || b.evaluacion - a.evaluacion,
    'precio-asc':  (a, b) => a.precio - b.precio,
    'precio-desc': (a, b) => b.precio - a.precio,
    'evaluacion':  (a, b) => b.evaluacion - a.evaluacion || b.resenas - a.resenas,
    'nombre':      (a, b) => a.nombre.localeCompare(b.nombre, 'es')
  };

  lista = lista.slice().sort(ordenadores[estado.orden] || ordenadores.destacados);
  return lista;
}

function plantillaProducto(p) {
  const categoria = CATEGORIAS.find((c) => c.id === p.categoria);

  const insignia = p.insignia === 'oferta'
    ? `<span class="producto__insignia producto__insignia--oferta">-${descuento(p.precio, p.precioAntes)} %</span>`
    : p.insignia === 'nuevo'
      ? '<span class="producto__insignia producto__insignia--nuevo">Nuevo</span>'
      : '';

  const precios = p.precioAntes
    ? `<span class="producto__precio">${precio(p.precio)}</span>
       <span class="producto__precio-antes">${precio(p.precioAntes)}</span>
       <span class="producto__descuento">-${descuento(p.precio, p.precioAntes)} %</span>`
    : `<span class="producto__precio">${precio(p.precio)}</span>`;

  const stock = p.stock <= STOCK_BAJO
    ? `<p class="producto__stock producto__stock--bajo">¡Últimas ${p.stock} unidades!</p>`
    : `<p class="producto__stock">${p.stock} unidades disponibles</p>`;

  return `
    <article class="producto">
      <figure class="producto__figura" role="img" aria-label="${escapar(p.nombre)}">
        ${insignia}
        <span aria-hidden="true">${p.icono}</span>
      </figure>
      <div class="producto__cuerpo">
        <span class="producto__categoria">${escapar(categoria ? categoria.nombre : '')}</span>
        <h3 class="producto__nombre">${escapar(p.nombre)}</h3>
        <p class="producto__marca">${escapar(p.marca)}</p>
        <p class="producto__evaluacion">
          <span class="producto__estrellas" aria-hidden="true">${estrellas(p.evaluacion)}</span>
          <span>${String(p.evaluacion).replace('.', ',')} (${p.resenas})</span>
        </p>
        <div class="producto__precios">${precios}</div>
        ${stock}
        <button class="boton boton--primario boton--ancho" type="button" data-agregar="${p.id}">
          Agregar al carrito
        </button>
      </div>
    </article>`;
}

function pintarProductos() {
  const contenedor = $('#grilla-productos');
  const conteo = $('#resultado-conteo');
  const vacio = $('#sin-resultados');
  if (!contenedor) return;

  const lista = productosVisibles();

  contenedor.innerHTML = lista.map(plantillaProducto).join('');
  vacio.classList.toggle('oculto', lista.length > 0);

  const etiquetaCategoria = estado.categoria === 'todas'
    ? 'todas las categorías'
    : (CATEGORIAS.find((c) => c.id === estado.categoria) || {}).nombre;

  conteo.textContent = lista.length === 1
    ? `1 producto en ${etiquetaCategoria}.`
    : `${lista.length} productos en ${etiquetaCategoria}.`;

  $$('[data-agregar]', contenedor).forEach((boton) => {
    boton.addEventListener('click', () => agregarAlCarrito(Number(boton.dataset.agregar)));
  });
}

/* ---------- 5) CARRITO ---------- */

function agregarAlCarrito(id) {
  const producto = PRODUCTOS.find((p) => p.id === id);
  if (!producto) return;

  const actual = estado.carrito.get(id) || 0;
  if (actual >= producto.stock) {
    mostrarAviso(`Sin más stock de ${producto.nombre}`);
    return;
  }

  estado.carrito.set(id, actual + 1);
  pintarCarrito();
  mostrarAviso(`${producto.nombre} agregado al carrito`);
}

function cambiarCantidad(id, delta) {
  const producto = PRODUCTOS.find((p) => p.id === id);
  if (!producto) return;

  const nueva = (estado.carrito.get(id) || 0) + delta;

  if (nueva <= 0) {
    estado.carrito.delete(id);
  } else if (nueva > producto.stock) {
    mostrarAviso(`Solo quedan ${producto.stock} unidades`);
    return;
  } else {
    estado.carrito.set(id, nueva);
  }

  pintarCarrito();
}

function quitarDelCarrito(id) {
  estado.carrito.delete(id);
  pintarCarrito();
}

function totalesCarrito() {
  let subtotal = 0;
  let unidades = 0;

  estado.carrito.forEach((cantidad, id) => {
    const producto = PRODUCTOS.find((p) => p.id === id);
    if (!producto) return;
    subtotal += producto.precio * cantidad;
    unidades += cantidad;
  });

  const despacho = (subtotal === 0 || subtotal >= DESPACHO.umbralGratis) ? 0 : DESPACHO.costo;
  return { subtotal, despacho, total: subtotal + despacho, unidades };
}

function pintarCarrito() {
  const cuerpo = $('#carrito-cuerpo');
  const { subtotal, despacho, total, unidades } = totalesCarrito();

  if (estado.carrito.size === 0) {
    cuerpo.innerHTML = `
      <div class="carrito__vacio">
        <span aria-hidden="true">🛒</span>
        <p>Tu carrito está vacío.</p>
        <p>Agrega productos del catálogo para verlos aquí.</p>
      </div>`;
  } else {
    const lineas = [];
    estado.carrito.forEach((cantidad, id) => {
      const p = PRODUCTOS.find((item) => item.id === id);
      if (!p) return;
      lineas.push(`
        <div class="linea-carrito">
          <div class="linea-carrito__figura" aria-hidden="true">${p.icono}</div>
          <div>
            <p class="linea-carrito__nombre">${escapar(p.nombre)}</p>
            <p class="linea-carrito__precio">${precio(p.precio)} c/u</p>
            <div class="cantidad">
              <button type="button" data-menos="${p.id}" aria-label="Quitar una unidad de ${escapar(p.nombre)}">−</button>
              <output>${cantidad}</output>
              <button type="button" data-mas="${p.id}" aria-label="Agregar una unidad de ${escapar(p.nombre)}">+</button>
            </div>
          </div>
          <div class="linea-carrito__derecha">
            <span class="linea-carrito__total">${precio(p.precio * cantidad)}</span>
            <button class="linea-carrito__quitar" type="button" data-quitar="${p.id}">Quitar</button>
          </div>
        </div>`);
    });
    cuerpo.innerHTML = lineas.join('');

    $$('[data-mas]', cuerpo).forEach((b) => b.addEventListener('click', () => cambiarCantidad(Number(b.dataset.mas), 1)));
    $$('[data-menos]', cuerpo).forEach((b) => b.addEventListener('click', () => cambiarCantidad(Number(b.dataset.menos), -1)));
    $$('[data-quitar]', cuerpo).forEach((b) => b.addEventListener('click', () => quitarDelCarrito(Number(b.dataset.quitar))));
  }

  $('#carrito-subtotal').textContent = precio(subtotal);
  $('#carrito-despacho').textContent = despacho === 0 && subtotal > 0 ? 'Gratis' : precio(despacho);
  $('#carrito-total').textContent = precio(total);
  $('#contador-carrito').textContent = unidades;
  $('#btn-pagar').disabled = estado.carrito.size === 0;

  const nota = $('#carrito-nota');
  if (subtotal > 0 && subtotal < DESPACHO.umbralGratis) {
    nota.textContent = `Te faltan ${precio(DESPACHO.umbralGratis - subtotal)} para el despacho gratis.`;
  } else if (subtotal >= DESPACHO.umbralGratis) {
    nota.textContent = '¡Despacho gratis aplicado!';
  } else {
    nota.textContent = '';
  }
}

function abrirCarrito(abrir) {
  const panel = $('#panel-carrito');
  const velo = $('#velo');
  const boton = $('#btn-carrito');

  if (abrir) {
    panel.hidden = false;
    velo.hidden = false;
    velo.classList.remove('oculto');
    // Un frame de espera para que la transición se aplique
    requestAnimationFrame(() => panel.classList.add('abierto'));
    panel.setAttribute('aria-hidden', 'false');
    boton.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    $('#btn-cerrar-carrito').focus();
  } else {
    panel.classList.remove('abierto');
    panel.setAttribute('aria-hidden', 'true');
    boton.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => {
      panel.hidden = true;
      velo.hidden = true;
      velo.classList.add('oculto');
    }, 260);
  }
}

function pagar() {
  const { total, unidades } = totalesCarrito();
  mostrarAviso(`Pedido simulado: ${unidades} artículo(s) por ${precio(total)}`);
  estado.carrito.clear();
  pintarCarrito();
  setTimeout(() => abrirCarrito(false), 900);
}

/* ---------- 6) INTERFAZ ---------- */

let temporizadorAviso;
function mostrarAviso(texto) {
  const aviso = $('#aviso');
  aviso.textContent = texto;
  aviso.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove('visible'), 2400);
}

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  $('#icono-tema').textContent = tema === 'oscuro' ? '☀' : '◐';
}

function alternarTema() {
  const actual = document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
  aplicarTema(actual === 'oscuro' ? 'claro' : 'oscuro');
}

function validarCorreo(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

function conectarEventos() {
  // Búsqueda con retardo
  $('#busqueda').addEventListener('input', retardar((evento) => {
    estado.busqueda = evento.target.value;
    pintarProductos();
  }));

  // Orden
  $('#orden').addEventListener('change', (evento) => {
    estado.orden = evento.target.value;
    pintarProductos();
  });

  // Carrito
  $('#btn-carrito').addEventListener('click', () => abrirCarrito(true));
  $('#btn-cerrar-carrito').addEventListener('click', () => abrirCarrito(false));
  $('#velo').addEventListener('click', () => abrirCarrito(false));
  $('#btn-pagar').addEventListener('click', pagar);

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && $('#panel-carrito').classList.contains('abierto')) {
      abrirCarrito(false);
    }
  });

  // Tema
  $('#btn-tema').addEventListener('click', alternarTema);

  // Menú móvil
  const btnMenu = $('#btn-menu');
  const navegacion = $('#navegacion');
  btnMenu.addEventListener('click', () => {
    const abierta = navegacion.classList.toggle('abierta');
    btnMenu.setAttribute('aria-expanded', String(abierta));
  });
  $$('#navegacion a').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      navegacion.classList.remove('abierta');
      btnMenu.setAttribute('aria-expanded', 'false');
    });
  });

  // Newsletter
  $('#formulario-newsletter').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const campo = $('#correo');
    const mensaje = $('#mensaje-newsletter');

    if (!validarCorreo(campo.value)) {
      mensaje.textContent = 'Ingresa un correo electrónico válido.';
      mensaje.className = 'mensaje-formulario error';
      campo.focus();
      return;
    }

    mensaje.textContent = '¡Listo! Revisa tu bandeja para confirmar la suscripción.';
    mensaje.className = 'mensaje-formulario exito';
    campo.value = '';
  });
}

/* ---------- 7) ARRANQUE ---------- */

function iniciar() {
  const prefiereOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  aplicarTema(prefiereOscuro ? 'oscuro' : 'claro');

  $('#anio').textContent = new Date().getFullYear();

  pintarCategorias();
  pintarFiltros();
  pintarProductos();
  pintarCarrito();
  conectarEventos();
}

document.addEventListener('DOMContentLoaded', iniciar);
