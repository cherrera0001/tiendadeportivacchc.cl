'use strict';

const params = new URLSearchParams(location.search);
document.getElementById('codigo').textContent =
  params.get('codigo') || params.get('external_reference') || '—';
