import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { registerAuthRoutes } from './auth';
import { registerRoutes } from './routes';

// In the esbuild CJS bundle __dirname is a native global.
// In development (ESM via tsx) we resolve relative to cwd.
const distDir = path.resolve(process.cwd(), 'dist/public');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
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

app.listen(PORT, () => {
  console.log(`SSM-LTD server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-secret-change-in-production') {
    console.warn('⚠  SESSION_SECRET is not set or is using the development default. Change this in production.');
  }
});
