import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import path from 'path';
import { registerAuthRoutes } from './auth';
import { registerRoutes } from './routes';
import { runMigrations } from './migrations';

const distDir = path.resolve(process.cwd(), 'dist/public');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// In production Replit assigns PORT dynamically — the server MUST bind to it.
// In development the Vite proxy expects the backend on BACKEND_PORT (5000).
const PORT = isProd
  ? (process.env.PORT || 3000)
  : (process.env.BACKEND_PORT || 5000);

// ── Trust Replit's reverse proxy so secure cookies and req.ip work correctly ──

app.set('trust proxy', 1);

// ── Session store ─────────────────────────────────────────────────────────────
// Use PostgreSQL so sessions survive restarts and work across multiple instances.

const PgSession = connectPgSimple(session);

const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false,
});

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      createTableIfMissing: true,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ── Routes ────────────────────────────────────────────────────────────────────

registerAuthRoutes(app);
registerRoutes(app);

// ── Static files (production) ─────────────────────────────────────────────────

if (isProd) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

async function start() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`SSM-LTD server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-secret-change-in-production') {
      console.warn('⚠  SESSION_SECRET is not set or is using the development default. Change this in production.');
    }
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
