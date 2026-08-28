'use strict';

(function () {
  const fmt = new Intl.NumberFormat('es-CL');
  const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  const estado = document.getElementById('estado-metricas');

  function cargar(token) {
    fetch('/api/metricas', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      .then((r) => {
        if (r.status === 401) throw new Error('auth');
        if (!r.ok) throw new Error('http');
        return r.json();
      })
      .then((m) => {
        estado.textContent = 'Datos en vivo desde /api/metricas.';
        const items = [
          ['Visitas (page_view)', fmt.format(m.visitas)],
          ['Visitas vitrina (cookie 30 min)', fmt.format(m.visitasVitrina)],
          ['Add to cart', fmt.format(m.carritos)],
          ['Checkouts', fmt.format(m.checkouts)],
          ['Compras', fmt.format(m.compras)],
          ['Conversión visita → compra', (m.conversion * 100).toFixed(2) + ' %'],
          ['Ticket promedio', clp.format(m.ticket || 0)],
          ['Ingresos', clp.format(m.ingresos || 0)],
          ['Suscriptores activos', fmt.format(m.suscriptores)],
          ['Productos activos', fmt.format(m.productos)],
          ['Stock bajo (≤ 5)', fmt.format(m.stockBajo)],
          ['Quiebre (stock 0)', fmt.format(m.quiebre)],
          ['Evaluación promedio', String(m.evaluacion).replace('.', ',')]
        ];
        document.getElementById('tarjetas-metricas').innerHTML = items.map(([t, d]) =>
          `<article class="beneficio"><h3>${t}</h3><p>${d}</p></article>`
        ).join('');
      })
      .catch((err) => {
        if (err && err.message === 'auth') {
          const nuevo = prompt('Estas métricas requieren el token de administración:');
          if (nuevo) {
            sessionStorage.setItem('cchc_metricas_token', nuevo);
            cargar(nuevo);
            return;
          }
          estado.textContent = 'Acceso restringido: falta el token de métricas.';
          return;
        }
        estado.textContent = 'No se pudieron cargar las métricas. ¿Está corriendo npm run dev?';
      });
  }

  cargar(sessionStorage.getItem('cchc_metricas_token') || '');
})();
