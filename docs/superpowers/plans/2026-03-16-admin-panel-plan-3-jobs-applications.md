# Admin Panel Plan 3: Job Listings + Application Tracking

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add job listing management (CRUD with active toggle, department grouping, reorder) and application tracking (list, filter by status/position, status updates, internal notes, resume download) to the admin panel.

**Architecture:** Extends the Express API from Plan 1 with jobs and applications routes. Extends the React SPA from Plan 2 with new pages. Applications submission endpoint is public (no auth) for use by the main site's apply forms.

**Tech Stack:** Same as Plans 1-2. Multer for resume uploads.

**Spec:** `docs/superpowers/specs/2026-03-16-admin-panel-design.md`

**Depends on:** Plan 1 (backend), Plan 2 (frontend shell)

---

## File Structure

```
admin/
├── server/routes/
│   ├── jobs.ts                   # CRUD for job listings
│   └── applications.ts          # Applications + resume upload
├── client/src/pages/
│   ├── JobsList.tsx              # Job listings table with toggle
│   ├── JobEditor.tsx             # Job create/edit form
│   ├── ApplicationsList.tsx     # Filterable applications table
│   └── ApplicationDetail.tsx    # Single application view
```

---

## Chunk 1: Job Listings Backend + Frontend

### Task 1: Job listing routes

**Files:**
- Create: `admin/server/routes/jobs.ts`
- Modify: `admin/server/index.ts` (register routes)

- [ ] **Step 1: Create admin/server/routes/jobs.ts**

```typescript
import { Router, Request, Response } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/jobs
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

// GET /api/jobs/:id
router.get('/:id', (req: Request, res: Response) => {
  const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(req.params.id);
  if (!job) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(job);
});

// POST /api/jobs
router.post('/', (req: Request, res: Response) => {
  const { title, department, type, description, requirements, payRange, isActive } = req.body;
  if (!title || !department) {
    res.status(400).json({ error: 'title and department required' });
    return;
  }

  const maxOrder = (db.prepare(
    'SELECT MAX(displayOrder) as m FROM job_listings WHERE department = ?'
  ).get(department) as any)?.m || 0;

  const result = db.prepare(`
    INSERT INTO job_listings (title, department, type, description, requirements, payRange, isActive, displayOrder)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, department, type || 'full-time',
    description || '', requirements || '', payRange || '',
    isActive !== undefined ? (isActive ? 1 : 0) : 1,
    maxOrder + 1
  );

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/jobs/:id
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

// DELETE /api/jobs/:id
router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM job_listings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// PATCH /api/jobs/:id/toggle
router.patch('/:id/toggle', (req: Request, res: Response) => {
  const job = db.prepare('SELECT isActive FROM job_listings WHERE id = ?').get(req.params.id) as any;
  if (!job) { res.status(404).json({ error: 'Not found' }); return; }
  const newVal = job.isActive ? 0 : 1;
  db.prepare("UPDATE job_listings SET isActive = ?, updatedAt = datetime('now') WHERE id = ?").run(newVal, req.params.id);
  res.json({ isActive: newVal });
});

export default router;
```

- [ ] **Step 2: Add job reorder + register routes in server/index.ts**

Add to `admin/server/index.ts`:

```typescript
import jobRoutes from './routes/jobs.js';

// Before other route registrations:
app.put('/api/jobs/reorder', requireAuth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) { res.status(400).json({ error: 'order array required' }); return; }
  const update = db.prepare('UPDATE job_listings SET displayOrder = ? WHERE id = ?');
  const run = db.transaction(() => {
    order.forEach((id: number, index: number) => { update.run(index, id); });
  });
  run();
  res.json({ ok: true });
});
app.use('/api/jobs', jobRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add admin/server/routes/jobs.ts admin/server/index.ts
git commit -m "add job listing CRUD routes with toggle and reorder"
```

---

### Task 2: Jobs list page

**Files:**
- Create: `admin/client/src/pages/JobsList.tsx`

- [ ] **Step 1: Create admin/client/src/pages/JobsList.tsx**

```tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface Job {
  id: number;
  title: string;
  department: string;
  type: string;
  isActive: number;
  applicationCount: number;
  displayOrder: number;
}

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api<Job[]>('/api/jobs')
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(id: number) {
    const result = await api<{ isActive: number }>(`/api/jobs/${id}/toggle`, { method: 'PATCH' });
    setJobs(prev => prev.map(j => j.id === id ? { ...j, isActive: result.isActive } : j));
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await api(`/api/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  const fieldJobs = jobs.filter(j => j.department === 'field');
  const officeJobs = jobs.filter(j => j.department === 'office');

  function renderGroup(label: string, items: Job[]) {
    return (
      <div className="mb-8">
        <h3 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--glass-blue)' }}>
          {label} ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--steel)' }}>No positions in this department.</p>
        ) : (
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Title', 'Type', 'Active', 'Applications', ''].map(h => (
                  <th key={h} className="text-left p-3 font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(job => (
                <tr
                  key={job.id}
                  className="cursor-pointer hover:opacity-80"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <td className="p-3 font-mono text-sm" style={{ color: 'var(--silver)' }}>{job.title}</td>
                  <td className="p-3 text-sm" style={{ color: 'var(--steel)' }}>{job.type}</td>
                  <td className="p-3">
                    <button
                      onClick={e => { e.stopPropagation(); handleToggle(job.id); }}
                      className="font-mono text-xs px-3 py-1"
                      style={{
                        border: `1px solid ${job.isActive ? '#22c55e' : '#6b7280'}`,
                        color: job.isActive ? '#22c55e' : '#6b7280',
                      }}
                    >
                      {job.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 font-mono text-sm" style={{ color: 'var(--glass-blue)' }}>
                    {job.applicationCount}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(job.id, job.title); }}
                      className="font-mono text-xs px-2 py-1"
                      style={{ color: '#ef4444', border: '1px solid #ef4444' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (loading) return <p style={{ color: 'var(--steel)' }}>Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
          Job Listings
        </h2>
        <Link
          to="/jobs/new"
          className="font-mono text-xs px-4 py-2 text-white uppercase tracking-wider"
          style={{ background: 'var(--glass-blue)' }}
        >
          + Add Position
        </Link>
      </div>

      {renderGroup('Field Positions', fieldJobs)}
      {renderGroup('Office Positions', officeJobs)}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/pages/JobsList.tsx
git commit -m "add jobs list page grouped by department"
```

---

### Task 3: Job editor page

**Files:**
- Create: `admin/client/src/pages/JobEditor.tsx`

- [ ] **Step 1: Create admin/client/src/pages/JobEditor.tsx**

```tsx
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface JobData {
  title: string;
  department: string;
  type: string;
  description: string;
  requirements: string;
  payRange: string;
  isActive: boolean;
}

const EMPTY: JobData = {
  title: '', department: 'field', type: 'full-time',
  description: '', requirements: '', payRange: '', isActive: true,
};

export default function JobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [data, setData] = useState<JobData>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api(`/api/jobs/${id}`).then((job: any) => {
        setData({
          title: job.title,
          department: job.department,
          type: job.type,
          description: job.description,
          requirements: job.requirements,
          payRange: job.payRange,
          isActive: !!job.isActive,
        });
      });
    }
  }, [id, isNew]);

  function update(field: keyof JobData, value: any) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await api('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
      } else {
        await api(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      }
      navigate('/jobs');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${data.title}"?`)) return;
    await api(`/api/jobs/${id}`, { method: 'DELETE' });
    navigate('/jobs');
  }

  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
          {isNew ? 'New Position' : `Edit: ${data.title}`}
        </h2>
        <div className="flex gap-2">
          {!isNew && (
            <button type="button" onClick={handleDelete} className="font-mono text-xs px-4 py-2" style={{ color: '#ef4444', border: '1px solid #ef4444' }}>
              Delete
            </button>
          )}
          <button type="submit" disabled={saving} className="font-mono text-xs px-4 py-2 text-white uppercase" style={{ background: 'var(--glass-blue)' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Title</span>
          <input
            type="text" value={data.title} onChange={e => update('title', e.target.value)} required
            className="block w-full mt-1 px-3 py-2 text-sm"
            style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}
          />
        </label>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Department</span>
            <select
              value={data.department} onChange={e => update('department', e.target.value)}
              className="block w-full mt-1 px-3 py-2 text-sm"
              style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}
            >
              <option value="field">Field</option>
              <option value="office">Office</option>
            </select>
          </label>

          <label className="block">
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Type</span>
            <select
              value={data.type} onChange={e => update('type', e.target.value)}
              className="block w-full mt-1 px-3 py-2 text-sm"
              style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}
            >
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contract</option>
            </select>
          </label>
        </div>

        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Pay Range</span>
          <input
            type="text" value={data.payRange} onChange={e => update('payRange', e.target.value)}
            placeholder="e.g., $18-25/hr"
            className="block w-full mt-1 px-3 py-2 text-sm"
            style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}
          />
        </label>

        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Description</span>
          <textarea
            value={data.description} onChange={e => update('description', e.target.value)} rows={6}
            className="block w-full mt-1 px-3 py-2 text-sm"
            style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)', resize: 'vertical' }}
          />
        </label>

        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Requirements</span>
          <textarea
            value={data.requirements} onChange={e => update('requirements', e.target.value)} rows={4}
            className="block w-full mt-1 px-3 py-2 text-sm"
            style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)', resize: 'vertical' }}
          />
        </label>

        <label className="flex items-center gap-3 mb-2">
          <input
            type="checkbox" checked={data.isActive} onChange={e => update('isActive', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Active (visible on website)</span>
        </label>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/pages/JobEditor.tsx
git commit -m "add job editor page with department and type selectors"
```

---

## Chunk 2: Applications Backend + Frontend

### Task 4: Application routes

**Files:**
- Create: `admin/server/routes/applications.ts`
- Modify: `admin/server/index.ts` (register routes)

- [ ] **Step 1: Create admin/server/routes/applications.ts**

```typescript
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

const router = Router();

// POST /api/applications — PUBLIC (no auth), for main site forms
router.post('/', upload.single('resume'), (req: Request, res: Response) => {
  const { jobListingId, name, email, phone, formData } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'name and email required' });
    return;
  }

  const resumePath = req.file ? `/uploads/resumes/${req.file.filename}` : '';

  const result = db.prepare(`
    INSERT INTO applications (jobListingId, name, email, phone, resumePath, formData, status)
    VALUES (?, ?, ?, ?, ?, ?, 'new')
  `).run(
    jobListingId || null, name, email, phone || '',
    resumePath, formData || '{}'
  );

  res.status(201).json({ id: result.lastInsertRowid, message: 'Application submitted' });
});

// All routes below require auth
router.use(requireAuth);

// GET /api/applications
router.get('/', (req: Request, res: Response) => {
  const { status, jobListingId } = req.query;
  let sql = `
    SELECT a.*, j.title as jobTitle
    FROM applications a
    LEFT JOIN job_listings j ON j.id = a.jobListingId
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (jobListingId) { sql += ' AND a.jobListingId = ?'; params.push(jobListingId); }

  sql += ' ORDER BY a.createdAt DESC';

  const apps = db.prepare(sql).all(...params);
  res.json(apps);
});

// GET /api/applications/:id
router.get('/:id', (req: Request, res: Response) => {
  const app = db.prepare(`
    SELECT a.*, j.title as jobTitle
    FROM applications a
    LEFT JOIN job_listings j ON j.id = a.jobListingId
    WHERE a.id = ?
  `).get(req.params.id);
  if (!app) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(app);
});

// PATCH /api/applications/:id/status
router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const valid = ['new', 'reviewed', 'contacted', 'rejected'];
  if (!valid.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    return;
  }
  const result = db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// PATCH /api/applications/:id/notes
router.patch('/:id/notes', (req: Request, res: Response) => {
  const { notes } = req.body;
  const result = db.prepare('UPDATE applications SET notes = ? WHERE id = ?').run(notes || '', req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// GET /api/applications/:id/resume
router.get('/:id/resume', (req: Request, res: Response) => {
  const app = db.prepare('SELECT resumePath FROM applications WHERE id = ?').get(req.params.id) as any;
  if (!app?.resumePath) { res.status(404).json({ error: 'No resume found' }); return; }
  const filePath = path.join(__dirname, '..', '..', app.resumePath.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Resume file missing' }); return; }
  res.download(filePath);
});

export default router;
```

- [ ] **Step 2: Register application routes in server/index.ts**

Add to `admin/server/index.ts`:

```typescript
import applicationRoutes from './routes/applications.js';

// Register (applications POST is public, other routes use auth internally)
app.use('/api/applications', applicationRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add admin/server/routes/applications.ts admin/server/index.ts
git commit -m "add application routes with public submission and resume upload"
```

---

### Task 5: Applications list page

**Files:**
- Create: `admin/client/src/pages/ApplicationsList.tsx`

- [ ] **Step 1: Create admin/client/src/pages/ApplicationsList.tsx**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

interface Application {
  id: number;
  name: string;
  email: string;
  jobTitle: string | null;
  status: string;
  createdAt: string;
}

export default function ApplicationsList() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api<Application[]>(`/api/applications${params}`)
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <p style={{ color: 'var(--steel)' }}>Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
          Applications ({apps.length})
        </h2>

        <div className="flex gap-2">
          {['', 'new', 'reviewed', 'contacted', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="font-mono text-xs px-3 py-1 uppercase"
              style={{
                border: `1px solid ${statusFilter === s ? 'var(--glass-blue)' : 'var(--border)'}`,
                color: statusFilter === s ? 'white' : 'var(--steel)',
                background: statusFilter === s ? 'var(--glass-blue)' : 'transparent',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Name', 'Position', 'Date', 'Status'].map(h => (
              <th key={h} className="text-left p-3 font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apps.map(app => (
            <tr
              key={app.id}
              className="cursor-pointer hover:opacity-80"
              style={{ borderBottom: '1px solid var(--border)' }}
              onClick={() => navigate(`/applications/${app.id}`)}
            >
              <td className="p-3">
                <div className="font-mono text-sm" style={{ color: 'var(--silver)' }}>{app.name}</div>
                <div className="text-xs" style={{ color: 'var(--steel)' }}>{app.email}</div>
              </td>
              <td className="p-3 text-sm" style={{ color: 'var(--steel)' }}>{app.jobTitle || 'General'}</td>
              <td className="p-3 font-mono text-xs" style={{ color: 'var(--steel)' }}>
                {new Date(app.createdAt).toLocaleDateString()}
              </td>
              <td className="p-3"><StatusBadge status={app.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {apps.length === 0 && (
        <p className="text-center py-12" style={{ color: 'var(--steel)' }}>
          No applications {statusFilter ? `with status "${statusFilter}"` : 'yet'}.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/pages/ApplicationsList.tsx
git commit -m "add applications list page with status filter"
```

---

### Task 6: Application detail page

**Files:**
- Create: `admin/client/src/pages/ApplicationDetail.tsx`

- [ ] **Step 1: Create admin/client/src/pages/ApplicationDetail.tsx**

```tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

interface ApplicationData {
  id: number;
  name: string;
  email: string;
  phone: string;
  jobTitle: string | null;
  resumePath: string;
  formData: string;
  status: string;
  notes: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['new', 'reviewed', 'contacted', 'rejected'];

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState<ApplicationData | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    api<ApplicationData>(`/api/applications/${id}`).then(data => {
      setApp(data);
      setNotes(data.notes || '');
    });
  }, [id]);

  async function updateStatus(status: string) {
    await api(`/api/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setApp(prev => prev ? { ...prev, status } : prev);
  }

  async function saveNotes() {
    setSavingNotes(true);
    await api(`/api/applications/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
  }

  if (!app) return <p style={{ color: 'var(--steel)' }}>Loading...</p>;

  let formFields: Record<string, any> = {};
  try { formFields = JSON.parse(app.formData); } catch {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/applications" className="font-mono text-xs uppercase" style={{ color: 'var(--glass-blue)' }}>
            &larr; Back to Applications
          </Link>
          <h2 className="font-mono text-lg mt-2" style={{ color: 'var(--silver)' }}>{app.name}</h2>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-mono text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--glass-blue)' }}>
            Contact Info
          </h3>
          <div className="space-y-3">
            <p><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Email: </span><span style={{ color: 'var(--silver)' }}>{app.email}</span></p>
            <p><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Phone: </span><span style={{ color: 'var(--silver)' }}>{app.phone || '---'}</span></p>
            <p><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Position: </span><span style={{ color: 'var(--silver)' }}>{app.jobTitle || 'General'}</span></p>
            <p><span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>Applied: </span><span style={{ color: 'var(--silver)' }}>{new Date(app.createdAt).toLocaleString()}</span></p>
          </div>

          {app.resumePath && (
            <a
              href={`/api/applications/${id}/resume`}
              className="inline-block mt-4 font-mono text-xs px-4 py-2 uppercase tracking-wider"
              style={{ border: '1px solid var(--glass-blue)', color: 'var(--glass-blue)' }}
            >
              Download Resume
            </a>
          )}
        </div>

        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-mono text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--glass-blue)' }}>
            Status
          </h3>
          <div className="flex gap-2 mb-6">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className="font-mono text-xs px-3 py-1 uppercase"
                style={{
                  border: `1px solid ${app.status === s ? 'var(--glass-blue)' : 'var(--border)'}`,
                  color: app.status === s ? 'white' : 'var(--steel)',
                  background: app.status === s ? 'var(--glass-blue)' : 'transparent',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <h3 className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--glass-blue)' }}>
            Internal Notes
          </h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={5}
            className="block w-full px-3 py-2 text-sm mb-2"
            style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)', resize: 'vertical' }}
          />
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            className="font-mono text-xs px-4 py-1 text-white"
            style={{ background: 'var(--glass-blue)' }}
          >
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {Object.keys(formFields).length > 0 && (
        <div className="mt-6 p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-mono text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--glass-blue)' }}>
            Form Responses
          </h3>
          <div className="space-y-2">
            {Object.entries(formFields).map(([key, val]) => (
              <div key={key}>
                <span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>{key}: </span>
                <span className="text-sm" style={{ color: 'var(--silver)' }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/pages/ApplicationDetail.tsx
git commit -m "add application detail page with status management and notes"
```

---

### Task 7: Register new pages in App router

**Files:**
- Modify: `admin/client/src/App.tsx`

- [ ] **Step 1: Update admin/client/src/App.tsx**

Add imports:
```tsx
import JobsList from './pages/JobsList';
import JobEditor from './pages/JobEditor';
import ApplicationsList from './pages/ApplicationsList';
import ApplicationDetail from './pages/ApplicationDetail';
```

Add routes inside the `<Route element={...}>` wrapper, after the projects routes:
```tsx
<Route path="jobs" element={<JobsList />} />
<Route path="jobs/new" element={<JobEditor />} />
<Route path="jobs/:id" element={<JobEditor />} />
<Route path="applications" element={<ApplicationsList />} />
<Route path="applications/:id" element={<ApplicationDetail />} />
```

- [ ] **Step 2: Verify all pages work**

1. Start backend and frontend
2. Navigate to Jobs -> Add Position -> Fill form -> Save
3. Toggle active status from list
4. Navigate to Applications (should be empty)
5. Submit a test application via curl:
```bash
curl -X POST http://localhost:3001/api/applications \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"555-0000","jobListingId":1}'
```
6. Verify application shows in admin

- [ ] **Step 3: Commit**

```bash
git add admin/client/src/App.tsx
git commit -m "register jobs and applications routes in app router"
```

---

End of Plan 3.
