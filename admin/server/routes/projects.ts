import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'projects');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|avif)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

const router = Router();
router.use(requireAuth);

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// GET /api/projects
router.get('/', (_req: Request, res: Response) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY displayOrder ASC, createdAt DESC').all();
  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', (req: Request, res: Response) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) { res.status(404).json({ error: 'Not found' }); return; }
  const photos = db.prepare('SELECT * FROM project_photos WHERE projectId = ? ORDER BY displayOrder ASC').all(req.params.id);
  res.json({ ...project as any, photos });
});

// POST /api/projects
router.post('/', (req: Request, res: Response) => {
  const { title, category, description, location, year, sqft, duration, value, services, gridCoord, status } = req.body;
  if (!title) { res.status(400).json({ error: 'Title required' }); return; }
  const slug = slugify(title);
  const maxOrder = (db.prepare('SELECT MAX(displayOrder) as m FROM projects').get() as any)?.m || 0;
  const result = db.prepare(`INSERT INTO projects (slug, title, category, description, location, year, sqft, duration, value, services, gridCoord, displayOrder, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(slug, title, category || '', description || '', location || '', year || '', sqft || '', duration || '', value || '', JSON.stringify(services || []), gridCoord || '', maxOrder + 1, status || 'draft');
  res.status(201).json({ id: result.lastInsertRowid, slug });
});

// PUT /api/projects/:id
router.put('/:id', (req: Request, res: Response) => {
  const { title, category, description, location, year, sqft, duration, value, services, coverImage, gridCoord, status } = req.body;
  const slug = title ? slugify(title) : undefined;
  const sets: string[] = [];
  const vals: any[] = [];
  if (title !== undefined) { sets.push('title = ?'); vals.push(title); }
  if (slug !== undefined) { sets.push('slug = ?'); vals.push(slug); }
  if (category !== undefined) { sets.push('category = ?'); vals.push(category); }
  if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
  if (location !== undefined) { sets.push('location = ?'); vals.push(location); }
  if (year !== undefined) { sets.push('year = ?'); vals.push(year); }
  if (sqft !== undefined) { sets.push('sqft = ?'); vals.push(sqft); }
  if (duration !== undefined) { sets.push('duration = ?'); vals.push(duration); }
  if (value !== undefined) { sets.push('value = ?'); vals.push(value); }
  if (services !== undefined) { sets.push('services = ?'); vals.push(JSON.stringify(services)); }
  if (coverImage !== undefined) { sets.push('coverImage = ?'); vals.push(coverImage); }
  if (gridCoord !== undefined) { sets.push('gridCoord = ?'); vals.push(gridCoord); }
  if (status !== undefined) { sets.push('status = ?'); vals.push(status); }
  sets.push("updatedAt = datetime('now')");
  if (sets.length <= 1) { res.status(400).json({ error: 'No fields to update' }); return; }
  vals.push(req.params.id);
  const result = db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// DELETE /api/projects/:id
router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// POST /api/projects/:id/photos
router.post('/:id/photos', upload.array('photos', 20), (req: Request, res: Response) => {
  const projectId = req.params.id;
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  const files = req.files as Express.Multer.File[];
  if (!files?.length) { res.status(400).json({ error: 'No files uploaded' }); return; }
  const maxOrder = (db.prepare('SELECT MAX(displayOrder) as m FROM project_photos WHERE projectId = ?').get(projectId) as any)?.m || 0;
  const insert = db.prepare('INSERT INTO project_photos (projectId, path, label, serviceTags, displayOrder) VALUES (?, ?, ?, ?, ?)');
  const photos = files.map((file, i) => {
    const photoPath = `/uploads/projects/${file.filename}`;
    const result = insert.run(projectId, photoPath, '', '[]', maxOrder + i + 1);
    return { id: result.lastInsertRowid, path: photoPath, displayOrder: maxOrder + i + 1 };
  });
  const proj = db.prepare('SELECT coverImage FROM projects WHERE id = ?').get(projectId) as any;
  if (!proj.coverImage && photos.length > 0) {
    db.prepare('UPDATE projects SET coverImage = ? WHERE id = ?').run(photos[0].path, projectId);
  }
  res.status(201).json(photos);
});

// PUT /api/projects/:id/photos/:photoId
router.put('/:id/photos/:photoId', (req: Request, res: Response) => {
  const { label, serviceTags } = req.body;
  const sets: string[] = [];
  const vals: any[] = [];
  if (label !== undefined) { sets.push('label = ?'); vals.push(label); }
  if (serviceTags !== undefined) { sets.push('serviceTags = ?'); vals.push(JSON.stringify(serviceTags)); }
  if (!sets.length) { res.status(400).json({ error: 'No fields to update' }); return; }
  vals.push(req.params.photoId, req.params.id);
  const result = db.prepare(`UPDATE project_photos SET ${sets.join(', ')} WHERE id = ? AND projectId = ?`).run(...vals);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// DELETE /api/projects/:id/photos/:photoId
router.delete('/:id/photos/:photoId', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM project_photos WHERE id = ? AND projectId = ?').run(req.params.photoId, req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// PUT /api/projects/:id/photos/reorder
router.put('/:id/photos/reorder', (req: Request, res: Response) => {
  const { order } = req.body;
  if (!Array.isArray(order)) { res.status(400).json({ error: 'order array required' }); return; }
  const update = db.prepare('UPDATE project_photos SET displayOrder = ? WHERE id = ? AND projectId = ?');
  const run = db.transaction(() => { order.forEach((photoId: number, index: number) => { update.run(index, photoId, req.params.id); }); });
  run();
  res.json({ ok: true });
});

export default router;
