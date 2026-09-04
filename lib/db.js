import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { seedIfEmpty } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SCHEMA = path.join(__dirname, 'schema.sql');

let ready;

async function conectarPglite() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const dir = path.join(DATA_DIR, 'pglite');
  const db = new PGlite(dir);
  await db.waitReady;
  const sql = fs.readFileSync(SCHEMA, 'utf8');
  await db.exec(sql);
  await seedIfEmpty(db);
  return {
    async query(text, params = []) {
      const result = await db.query(text, params);
      return result.rows || [];
    },
    async exec(text) {
      return db.exec(text);
    }
  };
}

async function conectarPostgres(url) {
  const esLocal = /localhost|127\.0\.0\.1/.test(url);
  const esSupabase = /supabase\.com/.test(url);

  // Configuración SSL:
  // - Sin SSL para localhost
  // - Con rejectUnauthorized=false para Supabase en desarrollo
  // - Con rejectUnauthorized=true en producción (Vercel)
  let sslConfig = undefined;

  if (!esLocal) {
    // Para Supabase y otros proveedores remotos
    sslConfig = {
      rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
      ca: process.env.DATABASE_CA_CERT || undefined
    };
  }

  const pool = new pg.Pool({
    connectionString: url,
    max: 3,
    ssl: sslConfig
  });

  const sql = fs.readFileSync(SCHEMA, 'utf8');
  await pool.query(sql);
  await seedIfEmpty(pool);
  return {
    async query(text, params = []) {
      const result = await pool.query(text, params);
      return result.rows || [];
    },
    async exec(text) {
      return pool.query(text);
    }
  };
}

export async function getDb() {
  if (!ready) {
    ready = process.env.DATABASE_URL
      ? conectarPostgres(process.env.DATABASE_URL)
      : conectarPglite();
  }
  return ready;
}

export async function query(text, params = []) {
  const db = await getDb();
  return db.query(text, params);
}

export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}
