import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Standard PostgreSQL pool — works with Railway, Supabase, and any TCP-accessible Postgres.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Replit's managed PostgreSQL uses a self-signed certificate, so TLS
  // hostname verification must be disabled in production. The connection
  // is still encrypted; only the cert is not verified against a CA.
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool, { schema });
