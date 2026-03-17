import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGOS_DIR = path.join(__dirname, '..', '..', '..', 'public', 'logos');

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: LOGOS_DIR,
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/\s+/g, '-').toLowerCase();
      cb(null, safe);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(svg|png|jpg|jpeg|webp)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

const router = Router();
router.use(requireAuth);

const VALID_KEYS = ['settings', 'hero', 'services', 'platforms', 'partnership', 'certifications', 'testimonials', 'careers', 'contact'];

// --- Logo routes (must be before /:key) ---

// GET /api/content/logos/list
router.get('/logos/list', (_req: Request, res: Response) => {
  if (!fs.existsSync(LOGOS_DIR)) { res.json([]); return; }
  const files = fs.readdirSync(LOGOS_DIR).filter(f => /\.(svg|png|jpg|jpeg|webp)$/i.test(f)).sort();
  res.json(files.map(f => ({ filename: f, path: `/logos/${f}` })));
});

// POST /api/content/logos/upload
router.post('/logos/upload', logoUpload.single('logo'), (req: Request, res: Response) => {
  const file = req.file;
  if (!file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  res.json({ filename: file.filename, path: `/logos/${file.filename}` });
});

// --- Content key routes ---

// GET /api/content/:key
router.get('/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  if (!VALID_KEYS.includes(key)) { res.status(400).json({ error: 'Invalid content key' }); return; }
  const row = db.prepare('SELECT value FROM site_content WHERE key = ?').get(key) as any;
  res.json(row ? JSON.parse(row.value) : {});
});

// PUT /api/content/:key
router.put('/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  if (!VALID_KEYS.includes(key)) { res.status(400).json({ error: 'Invalid content key' }); return; }
  const value = JSON.stringify(req.body);
  db.prepare(
    `INSERT INTO site_content (key, value, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`
  ).run(key, value);
  res.json({ ok: true });
});

export default router;
