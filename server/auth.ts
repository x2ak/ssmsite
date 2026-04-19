import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { getAdminByUsername } from './storage';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    adminId?: number;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  next();
}

export function registerAuthRoutes(app: import('express').Express) {
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body as { username: string; password: string };

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      const user = await getAdminByUsername(username);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      req.session.adminId = user.id;
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
