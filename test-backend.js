#!/usr/bin/env node
/**
 * Test Backend Verification Script
 * Valida que toda la estructura del backend está correcta para Vercel
 */

import 'dotenv/config';
import { getDb } from './lib/db.js';
import { query, queryOne } from './lib/db.js';

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test('Módulos se importan sin errores', async () => {
  await import('./lib/http.js');
  await import('./lib/config.js');
  await import('./lib/eventos.js');
  await import('./lib/pagos.js');
  await import('./lib/catalogo.js');
  await import('./lib/seguridad.js');
});

test('Base de datos se inicializa', async () => {
  const db = await getDb();
  if (!db) throw new Error('BD no retorna objeto');
});

test('Schema se ejecuta sin errores', async () => {
  await getDb();
  // Si no hay error, el schema se ejecutó exitosamente
});

test('Tabla productos existe', async () => {
  const resultado = await query('SELECT COUNT(*) as count FROM productos', []);
  if (!Array.isArray(resultado)) throw new Error('Query no retorna array');
});

test('Tabla pedidos existe', async () => {
  const resultado = await query('SELECT COUNT(*) as count FROM pedidos', []);
  if (!Array.isArray(resultado)) throw new Error('Query no retorna array');
});

test('Handler productos se importa', async () => {
  const { handleProductos, handleProductoId } = await import('./lib/handlers/productos.js');
  if (!handleProductos || !handleProductoId) throw new Error('Handlers no exportados');
});

test('Handler checkout se importa', async () => {
  const { handleCheckout } = await import('./lib/handlers/checkout.js');
  if (!handleCheckout) throw new Error('Handler no exportado');
});

test('Handler webhook se importa', async () => {
  const { handleWebhook } = await import('./lib/handlers/webhook.js');
  if (!handleWebhook) throw new Error('Handler no exportado');
});

test('Variables de entorno necesarias están configuradas', () => {
  const requeridas = ['PORT', 'PUBLIC_SITE_URL', 'NODE_ENV'];
  for (const v of requeridas) {
    if (!process.env[v]) throw new Error(`${v} no está configurada`);
  }
});

test('Desarrollo: ALLOW_PAYMENT_SIMULATION está habilitado', () => {
  if (process.env.NODE_ENV !== 'production') {
    if (process.env.ALLOW_PAYMENT_SIMULATION !== 'true') {
      throw new Error('ALLOW_PAYMENT_SIMULATION debería ser true en desarrollo');
    }
  }
});

test('API endpoints se pueden importar', async () => {
  const endpoints = [
    './api/productos.js',
    './api/checkout.js',
    './api/webhooks/mercadopago.js',
    './api/metricas.js',
  ];
  for (const ep of endpoints) {
    const mod = await import(ep);
    if (!mod.default || typeof mod.default !== 'function') {
      throw new Error(`${ep} no exporta handler válido`);
    }
  }
});

// Ejecutar tests
(async () => {
  console.log('\n🧪 Backend Verification Tests\n');
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e) {
      console.log(`❌ ${name}`);
      console.log(`   → ${e.message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Resultados: ${passed}/${tests.length} pasados`);
  if (failed === 0) {
    console.log(`✅ Backend está LISTO para Vercel\n`);
    process.exit(0);
  } else {
    console.log(`❌ Hay ${failed} problemas a resolver\n`);
    process.exit(1);
  }
})();
