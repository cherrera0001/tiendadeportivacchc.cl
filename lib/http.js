export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function sendError(res, status, codigo, mensaje) {
  sendJson(res, status, { error: codigo, mensaje });
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

export function cookieValue(req, nombre) {
  const header = req.headers.cookie || '';
  const partes = header.split(';');
  for (const parte of partes) {
    const [k, ...rest] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(rest.join('='));
  }
  return '';
}

export function paramId(req) {
  if (req.params && req.params.id) return req.params.id;
  if (req.query && req.query.id) return req.query.id;
  const match = String(req.url || '').match(/\/productos\/(\d+)/);
  return match ? match[1] : '';
}

export function normalizarCorreo(valor) {
  return String(valor || '').trim().toLowerCase();
}

export function correoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizarCorreo(valor));
}
