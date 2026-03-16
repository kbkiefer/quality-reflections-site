import { Router, Request, Response } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (_req: Request, res: Response) => {
  const jobs = db.prepare(`
    SELECT j.*, COUNT(a.id) as applicationCount
    FROM job_listings j
    LEFT JOIN applications a ON a.jobListingId = j.id
    GROUP BY j.id
    ORDER BY j.department ASC, j.displayOrder ASC
  `).all();
  res.json(jobs);
});

router.get('/:id', (req: Request, res: Response) => {
  const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(req.params.id);
  if (!job) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(job);
});

router.post('/', (req: Request, res: Response) => {
  const { title, department, type, description, requirements, payRange, isActive } = req.body;
  if (!title || !department) { res.status(400).json({ error: 'title and department required' }); return; }
  const maxOrder = (db.prepare('SELECT MAX(displayOrder) as m FROM job_listings WHERE department = ?').get(department) as any)?.m || 0;
  const result = db.prepare(`INSERT INTO job_listings (title, department, type, description, requirements, payRange, isActive, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(title, department, type || 'full-time', description || '', requirements || '', payRange || '', isActive !== undefined ? (isActive ? 1 : 0) : 1, maxOrder + 1);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', (req: Request, res: Response) => {
  const { title, department, type, description, requirements, payRange, isActive } = req.body;
  const sets: string[] = [];
  const vals: any[] = [];
  if (title !== undefined) { sets.push('title = ?'); vals.push(title); }
  if (department !== undefined) { sets.push('department = ?'); vals.push(department); }
  if (type !== undefined) { sets.push('type = ?'); vals.push(type); }
  if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
  if (requirements !== undefined) { sets.push('requirements = ?'); vals.push(requirements); }
  if (payRange !== undefined) { sets.push('payRange = ?'); vals.push(payRange); }
  if (isActive !== undefined) { sets.push('isActive = ?'); vals.push(isActive ? 1 : 0); }
  sets.push("updatedAt = datetime('now')");
  if (sets.length <= 1) { res.status(400).json({ error: 'No fields to update' }); return; }
  vals.push(req.params.id);
  const result = db.prepare(`UPDATE job_listings SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM job_listings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

router.patch('/:id/toggle', (req: Request, res: Response) => {
  const job = db.prepare('SELECT isActive FROM job_listings WHERE id = ?').get(req.params.id) as any;
  if (!job) { res.status(404).json({ error: 'Not found' }); return; }
  const newVal = job.isActive ? 0 : 1;
  db.prepare("UPDATE job_listings SET isActive = ?, updatedAt = datetime('now') WHERE id = ?").run(newVal, req.params.id);
  res.json({ isActive: newVal });
});

export default router;
