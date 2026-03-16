import { Router, Request, Response } from 'express';
import db from '../db.js';
import {
  verifyPassword,
  createToken,
  setTokenCookie,
  clearTokenCookie,
  requireAuth,
  AuthPayload,
} from '../auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = createToken({ userId: user.id, username: user.username });
  setTokenCookie(res, token);
  res.json({ id: user.id, username: user.username, displayName: user.displayName });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  clearTokenCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const payload = (req as any).user as AuthPayload;
  const user = db.prepare('SELECT id, username, displayName FROM users WHERE id = ?').get(payload.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
