export const DESPACHO_COSTO = 4990;
export const DESPACHO_UMBRAL = 59990;
export const STOCK_BAJO = 5;
export const VISITA_COOKIE_MAX_AGE = 30 * 60;

export function costoDespacho(subtotal) {
  if (!subtotal || subtotal >= DESPACHO_UMBRAL) return 0;
  return DESPACHO_COSTO;
}

export function siteUrl() {
  return (process.env.PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function simulacionPermitida() {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.MP_ACCESS_TOKEN) return false;
  return process.env.ALLOW_PAYMENT_SIMULATION === 'true';
}

export const EVENTOS_CLIENTE = new Set(['page_view', 'product_view', 'add_to_cart']);
export const EVENTOS_BACKEND = new Set(['begin_checkout', 'purchase', 'newsletter_signup']);
