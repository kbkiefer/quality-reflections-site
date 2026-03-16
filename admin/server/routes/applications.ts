import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESUMES_DIR = path.join(__dirname, '..', '..', 'uploads', 'resumes');
fs.mkdirSync(RESUMES_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: RESUMES_DIR,
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

const router = Router();

// POST /api/applications — PUBLIC (no auth)
router.post('/', upload.single('resume'), (req: Request, res: Response) => {
  const { jobListingId, name, email, phone, formData } = req.body;
  if (!name || !email) { res.status(400).json({ error: 'name and email required' }); return; }
  const resumePath = req.file ? `/uploads/resumes/${req.file.filename}` : '';
  const result = db.prepare(`INSERT INTO applications (jobListingId, name, email, phone, resumePath, formData, status) VALUES (?, ?, ?, ?, ?, ?, 'new')`).run(jobListingId || null, name, email, phone || '', resumePath, formData || '{}');
  res.status(201).json({ id: result.lastInsertRowid, message: 'Application submitted' });
});

// All routes below require auth
router.use(requireAuth);

router.get('/', (req: Request, res: Response) => {
  const { status, jobListingId } = req.query;
  let sql = `SELECT a.*, j.title as jobTitle FROM applications a LEFT JOIN job_listings j ON j.id = a.jobListingId WHERE 1=1`;
  const params: any[] = [];
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (jobListingId) { sql += ' AND a.jobListingId = ?'; params.push(jobListingId); }
  sql += ' ORDER BY a.createdAt DESC';
  const apps = db.prepare(sql).all(...params);
  res.json(apps);
});

router.get('/:id', (req: Request, res: Response) => {
  const app = db.prepare(`SELECT a.*, j.title as jobTitle FROM applications a LEFT JOIN job_listings j ON j.id = a.jobListingId WHERE a.id = ?`).get(req.params.id);
  if (!app) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(app);
});

router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const valid = ['new', 'reviewed', 'contacted', 'rejected'];
  if (!valid.includes(status)) { res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` }); return; }
  const result = db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

router.patch('/:id/notes', (req: Request, res: Response) => {
  const { notes } = req.body;
  const result = db.prepare('UPDATE applications SET notes = ? WHERE id = ?').run(notes || '', req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

router.get('/:id/resume', (req: Request, res: Response) => {
  const app = db.prepare('SELECT resumePath FROM applications WHERE id = ?').get(req.params.id) as any;
  if (!app?.resumePath) { res.status(404).json({ error: 'No resume found' }); return; }
  const filePath = path.join(__dirname, '..', '..', app.resumePath.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Resume file missing' }); return; }
  res.download(filePath);
});

export default router;
