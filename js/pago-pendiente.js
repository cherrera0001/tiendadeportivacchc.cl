'use strict';

const params = new URLSearchParams(location.search);
const codigo = params.get('codigo') || params.get('external_reference') || '';
document.getElementById('codigo').textContent = codigo || '—';
const simular = params.get('simular') === '1';
const caja = document.getElementById('caja-simular');
if (simular && codigo) {
  caja.hidden = false;
  caja.classList.remove('oculto');
  document.getElementById('nota-mp').classList.add('oculto');
}
document.getElementById('btn-simular')?.addEventListener('click', async () => {
  const mensaje = document.getElementById('mensaje-simular');
  const boton = document.getElementById('btn-simular');
  boton.disabled = true;
  mensaje.textContent = 'Confirmando…';
  try {
    const resp = await fetch('/api/dev/simular-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.mensaje || 'No se pudo simular');
    location.href = data.redirect || ('/pago/exito.html?codigo=' + encodeURIComponent(codigo));
  } catch (err) {
    mensaje.className = 'mensaje-formulario error';
    mensaje.textContent = err.message;
    boton.disabled = false;
  }
});
