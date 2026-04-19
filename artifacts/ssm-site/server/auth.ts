import type { Request, Response, NextFunction } from 'express';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    adminId?: number;
  }
}

// Single admin account — credentials are fixed as specified.
const ADMIN_USERNAME = 'adminuser';
const ADMIN_PASSWORD = 'admin';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  next();
}

export function registerAuthRoutes(app: import('express').Express) {
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body as { username: string; password: string };

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      req.session.adminId = 1;
      res.json({ authenticated: true });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.session.adminId) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
}
