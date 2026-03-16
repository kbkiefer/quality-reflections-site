import { Router, Request, Response } from 'express';
import db from '../db.js';
import { hashPassword, requireAuth } from '../auth.js';

const router = Router();

// All user management routes require auth
router.use(requireAuth);

// GET /api/users
router.get('/', (_req: Request, res: Response) => {
  const users = db.prepare('SELECT id, username, displayName, createdAt FROM users').all();
  res.json(users);
});

// POST /api/users
router.post('/', (req: Request, res: Response) => {
  const { username, password, displayName } = req.body;
  if (!username || !password || !displayName) {
    res.status(400).json({ error: 'username, password, and displayName required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }

  const passwordHash = hashPassword(password);
  const result = db.prepare(
    'INSERT INTO users (username, passwordHash, displayName) VALUES (?, ?, ?)'
  ).run(username, passwordHash, displayName);

  res.status(201).json({ id: result.lastInsertRowid, username, displayName });
});

// DELETE /api/users/:id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount <= 1) {
    res.status(400).json({ error: 'Cannot delete the last admin user' });
    return;
  }

  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ ok: true });
});

// PUT /api/users/:id/password
router.put('/:id/password', (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'password required' });
    return;
  }

  const passwordHash = hashPassword(password);
  const result = db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(passwordHash, id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
