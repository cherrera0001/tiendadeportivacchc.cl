/**
 * Cargador inteligente de .env
 * Prioriza: .env.local (desarrollo) > .env (credenciales)
 */
import dotenv from 'dotenv';
import fs from 'fs';

export function loadEnv() {
  // Intentar cargar .env.local primero (desarrollo con PGlite)
  if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
  } else if (fs.existsSync('.env')) {
    // Fallback a .env (credenciales de producción)
    dotenv.config({ path: '.env' });
  }
  // Si no existe ninguno, usar variables de entorno del sistema (Vercel)
}
