/* =========================================================
   Cámara — Artículos deportivos
   Lógica de la tienda (consume /api)

   Secciones:
     1. Datos (categorías; catálogo desde API)
     2. Utilidades
     3. Estado de la aplicación
     4. Render: categorías, filtros y productos
     5. Carrito y checkout
     6. Ficha, tema, menú, newsletter
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

/** Catálogo vivo: lo llena GET /api/productos */
let PRODUCTOS = [];

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

const precio = (valor) => formateadorPeso.format(valor);

const estrellas = (valor) => '★'.repeat(Math.round(valor)) + '☆'.repeat(5 - Math.round(valor));

const descuento = (actual, antes) => Math.round((1 - actual / antes) * 100);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const normalizar = (texto) => String(texto)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

function retardar(fn, ms = 220) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), ms);
  };
}

function sessionId() {
  try {
    let id = sessionStorage.getItem('cchc_sid');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('cchc_sid', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

function emitirEvento(nombre, extra = {}) {
  fetch('/api/eventos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, sessionId: sessionId(), ...extra })
  }).catch(() => {});
}

function iconoCategoria(slug) {
  return (CATEGORIAS.find((c) => c.id === slug) || {}).icono || '🏅';
}

function urlImagen(p) {
  if (p.imagenes && p.imagenes[0] && p.imagenes[0].url) return p.imagenes[0].url;
  return '';
}

/* ---------- 3) ESTADO ---------- */

const estado = {
  categoria: 'todas',
  busqueda: '',
  orden: 'destacados',
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
  const img = urlImagen(p);
  const media = img
    ? `<img src="${escapar(img)}" alt="" width="480" height="360" loading="lazy">`
    : `<span aria-hidden="true">${iconoCategoria(p.categoria)}</span>`;

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

  const stock = p.stock <= 0
    ? '<p class="producto__stock producto__stock--bajo">Sin stock</p>'
    : p.stock <= STOCK_BAJO
      ? `<p class="producto__stock producto__stock--bajo">¡Últimas ${p.stock} unidades!</p>`
      : `<p class="producto__stock">${p.stock} unidades disponibles</p>`;

  const deshabilitado = p.stock <= 0 ? ' disabled' : '';

  return `
    <article class="producto">
      <button class="producto__figura" type="button" data-detalle="${p.id}" aria-label="Ver detalle de ${escapar(p.nombre)}">
        ${insignia}
        ${media}
      </button>
      <div class="producto__cuerpo">
        <span class="producto__categoria">${escapar(categoria ? categoria.nombre : p.categoriaNombre || '')}</span>
        <h3 class="producto__nombre">${escapar(p.nombre)}</h3>
        <p class="producto__marca">${escapar(p.marca)}</p>
        <p class="producto__evaluacion">
          <span class="producto__estrellas" aria-hidden="true">${estrellas(p.evaluacion)}</span>
          <span>${String(p.evaluacion).replace('.', ',')} (${p.resenas})</span>
        </p>
        <div class="producto__precios">${precios}</div>
        ${stock}
        <button class="boton boton--primario boton--ancho" type="button" data-agregar="${p.id}"${deshabilitado}>
          ${p.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}
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
  $$('[data-detalle]', contenedor).forEach((boton) => {
    boton.addEventListener('click', () => abrirFicha(Number(boton.dataset.detalle)));
  });
}

function actualizarHero() {
  const nProd = $('#cifra-productos');
  const nEval = $('#cifra-evaluacion');
  if (nProd) nProd.textContent = String(PRODUCTOS.length);
  if (nEval && PRODUCTOS.length) {
    const media = PRODUCTOS.reduce((acc, p) => acc + Number(p.evaluacion || 0), 0) / PRODUCTOS.length;
    nEval.textContent = `${media.toFixed(1).replace('.', ',')} / 5`;
  }
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
  emitirEvento('add_to_cart', { productoId: id, valorClp: producto.precio });
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
      const img = urlImagen(p);
      const figura = img
        ? `<img src="${escapar(img)}" alt="">`
        : iconoCategoria(p.categoria);
      lineas.push(`
        <div class="linea-carrito">
          <div class="linea-carrito__figura" aria-hidden="true">${figura}</div>
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
    abrirFichaPanel(false);
    panel.hidden = false;
    velo.hidden = false;
    velo.classList.remove('oculto');
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

function validarCorreo(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

async function pagar() {
  const correo = $('#pago-correo').value;
  if (!validarCorreo(correo)) {
    mostrarAviso('Ingresa un correo válido para el pedido');
    $('#pago-correo').focus();
    return;
  }

  const items = [];
  estado.carrito.forEach((cantidad, productoId) => {
    items.push({ productoId, cantidad });
  });

  $('#btn-pagar').disabled = true;
  try {
    const resp = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        correo,
        nombre: $('#pago-nombre').value,
        telefono: $('#pago-telefono').value,
        direccion: $('#pago-direccion').value
      })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.mensaje || 'No se pudo iniciar el pago');
    estado.carrito.clear();
    pintarCarrito();
    window.location.href = data.initPoint;
  } catch (err) {
    mostrarAviso(err.message);
    $('#btn-pagar').disabled = estado.carrito.size === 0;
  }
}

/* ---------- 6) FICHA E INTERFAZ ---------- */

function abrirFichaPanel(abrir) {
  const panel = $('#ficha-producto');
  const velo = $('#velo-ficha');
  if (!panel) return;

  if (abrir) {
    abrirCarrito(false);
    panel.hidden = false;
    velo.hidden = false;
    velo.classList.remove('oculto');
    requestAnimationFrame(() => panel.classList.add('abierto'));
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#btn-cerrar-ficha').focus();
  } else {
    panel.classList.remove('abierto');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      panel.hidden = true;
      velo.hidden = true;
      velo.classList.add('oculto');
    }, 260);
  }
}

async function abrirFicha(id) {
  let producto = PRODUCTOS.find((p) => p.id === id);
  try {
    const resp = await fetch(`/api/productos/${id}`);
    const data = await resp.json();
    if (resp.ok && data.producto) producto = data.producto;
  } catch { /* usa el del listado */ }

  if (!producto) return;

  emitirEvento('product_view', { productoId: id });
  $('#ficha-nombre').textContent = producto.nombre;

  const img = urlImagen(producto);
  const media = img
    ? `<img class="ficha__imagen" src="${escapar(img)}" alt="${escapar(producto.nombre)}">`
    : '';

  const stock = producto.stock <= 0
    ? '<p class="producto__stock producto__stock--bajo">Sin stock</p>'
    : producto.stock <= STOCK_BAJO
      ? `<p class="producto__stock producto__stock--bajo">¡Últimas ${producto.stock} unidades!</p>`
      : `<p class="producto__stock">${producto.stock} unidades disponibles</p>`;

  $('#ficha-cuerpo').innerHTML = `
    ${media}
    <p class="producto__marca">${escapar(producto.marca)} · ${escapar(producto.categoriaNombre || '')}</p>
    <p>${escapar(producto.descripcion || '')}</p>
    <div class="producto__precios">
      <span class="producto__precio">${precio(producto.precio)}</span>
      ${producto.precioAntes ? `<span class="producto__precio-antes">${precio(producto.precioAntes)}</span>` : ''}
    </div>
    ${stock}
    <div class="ficha__acciones">
      <button class="boton boton--primario boton--ancho" type="button" data-agregar-ficha="${producto.id}" ${producto.stock <= 0 ? 'disabled' : ''}>
        Agregar al carrito
      </button>
    </div>`;

  const btn = $('[data-agregar-ficha]');
  if (btn) {
    btn.addEventListener('click', () => {
      agregarAlCarrito(producto.id);
      abrirFichaPanel(false);
      abrirCarrito(true);
    });
  }

  abrirFichaPanel(true);
}

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

function conectarEventos() {
  $('#busqueda').addEventListener('input', retardar((evento) => {
    estado.busqueda = evento.target.value;
    pintarProductos();
  }));

  $('#orden').addEventListener('change', (evento) => {
    estado.orden = evento.target.value;
    pintarProductos();
  });

  $('#btn-carrito').addEventListener('click', () => abrirCarrito(true));
  $('#btn-cerrar-carrito').addEventListener('click', () => abrirCarrito(false));
  $('#velo').addEventListener('click', () => abrirCarrito(false));
  $('#btn-pagar').addEventListener('click', pagar);
  $('#btn-cerrar-ficha').addEventListener('click', () => abrirFichaPanel(false));
  $('#velo-ficha').addEventListener('click', () => abrirFichaPanel(false));

  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    if ($('#ficha-producto').classList.contains('abierto')) abrirFichaPanel(false);
    else if ($('#panel-carrito').classList.contains('abierto')) abrirCarrito(false);
  });

  $('#btn-tema').addEventListener('click', alternarTema);

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

  $('#formulario-newsletter').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const campo = $('#correo');
    const mensaje = $('#mensaje-newsletter');
    const consentimiento = $('#consentimiento');

    if (!validarCorreo(campo.value)) {
      mensaje.textContent = 'Ingresa un correo electrónico válido.';
      mensaje.className = 'mensaje-formulario error';
      campo.focus();
      return;
    }
    if (!consentimiento.checked) {
      mensaje.textContent = 'Marca la casilla de consentimiento para continuar.';
      mensaje.className = 'mensaje-formulario error';
      consentimiento.focus();
      return;
    }

    try {
      const resp = await fetch('/api/suscriptores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: campo.value,
          consentimiento: true
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje || 'No se pudo guardar el correo');
      mensaje.className = 'mensaje-formulario exito';
      mensaje.textContent = data.estado === 'ya_suscrito'
        ? 'Este correo ya estaba en nuestra lista.'
        : 'Listo. Quedaste en la base de clientes.';
      campo.value = '';
      consentimiento.checked = false;
    } catch (err) {
      mensaje.className = 'mensaje-formulario error';
      mensaje.textContent = err.message;
    }
  });
}

async function cargarCatalogo() {
  const resp = await fetch('/api/productos');
  if (!resp.ok) throw new Error('No se pudo cargar el catálogo');
  const data = await resp.json();
  PRODUCTOS = data.productos || [];
}

async function registrarVisita() {
  try {
    const resp = await fetch('/api/visitas', { method: 'POST' });
    const data = await resp.json();
    const nodo = $('#cifra-visitas');
    if (nodo && data.total != null) nodo.textContent = Number(data.total).toLocaleString('es-CL');
  } catch { /* el hero queda en — */ }
}

/* ---------- 7) ARRANQUE ---------- */

async function iniciar() {
  const prefiereOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  aplicarTema(prefiereOscuro ? 'oscuro' : 'claro');
  $('#anio').textContent = new Date().getFullYear();
  conectarEventos();
  emitirEvento('page_view');
  registrarVisita();

  try {
    await cargarCatalogo();
  } catch {
    $('#resultado-conteo').textContent = 'No pudimos cargar el catálogo. ¿Está corriendo npm run dev?';
    $('#sin-resultados').classList.remove('oculto');
    $('#sin-resultados').textContent = 'El servidor local no responde. En la carpeta del proyecto ejecuta npm install && npm run dev y abre http://localhost:3000';
    return;
  }

  actualizarHero();
  pintarCategorias();
  pintarFiltros();
  pintarProductos();
  pintarCarrito();
}

document.addEventListener('DOMContentLoaded', iniciar);
