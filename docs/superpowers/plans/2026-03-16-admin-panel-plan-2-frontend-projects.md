# Admin Panel Plan 2: Frontend Shell + Project Management

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin React SPA with login, sidebar layout, dashboard, and full project CRUD (list, create, edit, delete, reorder, photo management, service badges).

**Architecture:** Vite + React 19 SPA with React Router for client-side routing. Communicates with Express API from Plan 1. Blueprint design system matching the main site. Proxy to API in dev via Vite config.

**Tech Stack:** React 19, Vite, Tailwind 4, React Router 7, @dnd-kit (drag-and-drop reorder)

**Spec:** `docs/superpowers/specs/2026-03-16-admin-panel-design.md`

**Depends on:** Plan 1 (backend must be running)

---

## File Structure

```
admin/client/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx                    # React entry
│   ├── App.tsx                     # Router + auth context
│   ├── api.ts                      # Fetch wrapper (credentials: include)
│   ├── styles/
│   │   └── admin.css               # Blueprint design tokens + Tailwind
│   ├── hooks/
│   │   └── useAuth.ts              # Auth context + hook
│   ├── components/
│   │   ├── Sidebar.tsx             # Nav sidebar
│   │   ├── TopBar.tsx              # Page title, theme toggle, publish button
│   │   ├── AdminLayout.tsx         # Sidebar + TopBar + content area
│   │   ├── LoginPage.tsx           # Login form
│   │   ├── StatusBadge.tsx         # Reusable status badge
│   │   └── ServiceBadges.tsx       # Service tag checkboxes
│   └── pages/
│       ├── Dashboard.tsx           # Overview cards
│       ├── ProjectsList.tsx        # Projects table with reorder
│       └── ProjectEditor.tsx       # Full project form + photo gallery
```

---

## Chunk 1: Frontend Scaffolding

### Task 1: Vite + React + Tailwind setup

**Files:**
- Create: `admin/client/index.html`
- Create: `admin/client/vite.config.ts`
- Create: `admin/client/src/main.tsx`
- Create: `admin/client/src/styles/admin.css`
- Modify: `admin/package.json` (add client scripts + deps)

- [ ] **Step 1: Add client dependencies to admin/package.json**

Add to dependencies:
```
"react": "^19.1.0",
"react-dom": "^19.1.0",
"react-router-dom": "^7.0.0",
"@dnd-kit/core": "^6.3.0",
"@dnd-kit/sortable": "^10.0.0",
"@dnd-kit/utilities": "^3.2.2"
```

Add to devDependencies:
```
"@types/react": "^19.1.0",
"@types/react-dom": "^19.1.0",
"@vitejs/plugin-react": "^4.3.0",
"vite": "^6.2.0",
"@tailwindcss/vite": "^4.1.0",
"tailwindcss": "^4.1.0"
```

Add scripts:
```
"client:dev": "vite --config client/vite.config.ts",
"client:build": "vite build --config client/vite.config.ts"
```

- [ ] **Step 2: Install new dependencies**

```bash
cd admin && npm install
```

- [ ] **Step 3: Create admin/client/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'client',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 4: Create admin/client/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QR Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 5: Create admin/client/src/styles/admin.css**

```css
@import "tailwindcss";

:root {
  --navy: #012A89;
  --navy-dark: #011B5A;
  --navy-black: #010E2F;
  --glass-blue: #4A90D9;
  --steel: #8A919A;
  --silver: #D1D5DB;
  --grid-line: rgba(74, 144, 217, 0.08);
  --border: rgba(74, 144, 217, 0.15);
  --surface: rgba(1, 14, 47, 0.6);
}

[data-theme="light"] {
  --navy: #012A89;
  --navy-dark: #E8ECF4;
  --navy-black: #F5F7FA;
  --glass-blue: #2A6FC0;
  --steel: #5A6270;
  --silver: #374151;
  --grid-line: rgba(1, 42, 137, 0.06);
  --border: rgba(1, 42, 137, 0.12);
  --surface: rgba(255, 255, 255, 0.8);
}

* { border-radius: 0 !important; }

body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--navy-black);
  color: var(--silver);
}

.font-mono { font-family: 'JetBrains Mono', monospace; }

/* Blueprint grid background */
.blueprint-grid {
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

- [ ] **Step 6: Create admin/client/src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/admin.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Commit**

```bash
git add admin/client/ admin/package.json
git commit -m "scaffold admin frontend with Vite, React, Tailwind"
```

---

### Task 2: API fetch wrapper

**Files:**
- Create: `admin/client/src/api.ts`

- [ ] **Step 1: Create admin/client/src/api.ts**

```typescript
const BASE = '';  // Same origin in dev (Vite proxy), same domain in prod

export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiUpload<T = any>(
  path: string,
  formData: FormData
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/api.ts
git commit -m "add API fetch wrapper with credentials"
```

---

### Task 3: Auth context + hook

**Files:**
- Create: `admin/client/src/hooks/useAuth.ts`

- [ ] **Step 1: Create admin/client/src/hooks/useAuth.ts**

```typescript
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createElement } from 'react';
import { api } from '../api';

interface User {
  id: number;
  username: string;
  displayName: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await api<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return createElement(AuthContext.Provider, { value: { user, loading, login, logout } }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/hooks/useAuth.ts
git commit -m "add auth context and useAuth hook"
```

---

### Task 4: Login page

**Files:**
- Create: `admin/client/src/components/LoginPage.tsx`

- [ ] **Step 1: Create admin/client/src/components/LoginPage.tsx**

```tsx
import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center blueprint-grid" style={{ background: 'var(--navy-black)' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h1 className="font-mono text-lg mb-6 tracking-wider" style={{ color: 'var(--glass-blue)' }}>
          QR ADMIN
        </h1>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <label className="block mb-4">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Username</span>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="block w-full mt-1 px-3 py-2 text-sm"
            style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}
            required
          />
        </label>

        <label className="block mb-6">
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block w-full mt-1 px-3 py-2 text-sm"
            style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 font-mono text-sm uppercase tracking-wider text-white"
          style={{ background: 'var(--glass-blue)' }}
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/components/LoginPage.tsx
git commit -m "add login page component"
```

---

### Task 5: Sidebar navigation

**Files:**
- Create: `admin/client/src/components/Sidebar.tsx`

- [ ] **Step 1: Create admin/client/src/components/Sidebar.tsx**

```tsx
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '\u229E' },
  { to: '/projects', label: 'Projects', icon: '\u25A6' },
  { to: '/jobs', label: 'Jobs', icon: '\u229F' },
  { to: '/applications', label: 'Applications', icon: '\u25E7' },
  { to: '/settings', label: 'Settings', icon: '\u2699' },
];

export default function Sidebar() {
  return (
    <aside
      className="w-56 min-h-screen flex flex-col blueprint-grid"
      style={{ background: 'var(--navy-dark)', borderRight: '1px solid var(--border)' }}
    >
      <div className="p-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-mono text-sm tracking-widest" style={{ color: 'var(--glass-blue)' }}>
          QR ADMIN
        </span>
      </div>

      <nav className="flex-1 px-2">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 mb-1 font-mono text-xs uppercase tracking-wider transition-colors ${
                isActive ? 'text-white' : ''
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? 'white' : 'var(--steel)',
              background: isActive ? 'var(--glass-blue)' : 'transparent',
            })}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/components/Sidebar.tsx
git commit -m "add sidebar navigation component"
```

---

### Task 6: Top bar

**Files:**
- Create: `admin/client/src/components/TopBar.tsx`

- [ ] **Step 1: Create admin/client/src/components/TopBar.tsx**

```tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';

export default function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string>('idle');

  async function handlePublish() {
    if (!confirm('Publish all changes to the live site?')) return;
    setPublishing(true);
    setPublishStatus('building');
    try {
      await api('/api/publish', { method: 'POST' });
      setPublishStatus('live');
      setTimeout(() => setPublishStatus('idle'), 3000);
    } catch {
      setPublishStatus('error');
      setTimeout(() => setPublishStatus('idle'), 3000);
    } finally {
      setPublishing(false);
    }
  }

  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    if (current === 'light') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', 'light');
    }
  }

  return (
    <header
      className="h-14 flex items-center justify-between px-6"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <h1 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="font-mono text-xs px-2 py-1"
          style={{ color: 'var(--steel)', border: '1px solid var(--border)' }}
        >
          Theme
        </button>

        <button
          onClick={handlePublish}
          disabled={publishing}
          className="font-mono text-xs px-4 py-1 text-white uppercase tracking-wider"
          style={{
            background: publishStatus === 'live' ? '#22c55e'
              : publishStatus === 'error' ? '#ef4444'
              : 'var(--glass-blue)',
          }}
        >
          {publishStatus === 'building' ? 'Building...'
            : publishStatus === 'live' ? 'Published!'
            : publishStatus === 'error' ? 'Failed'
            : 'Publish'}
        </button>

        <span className="font-mono text-xs" style={{ color: 'var(--steel)' }}>
          {user?.displayName}
        </span>

        <button
          onClick={logout}
          className="font-mono text-xs"
          style={{ color: 'var(--steel)' }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/components/TopBar.tsx
git commit -m "add top bar with publish button and theme toggle"
```

---

### Task 7: Admin layout wrapper

**Files:**
- Create: `admin/client/src/components/AdminLayout.tsx`

- [ ] **Step 1: Create admin/client/src/components/AdminLayout.tsx**

```tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/jobs': 'Job Listings',
  '/applications': 'Applications',
  '/settings': 'Settings',
};

export default function AdminLayout() {
  const location = useLocation();
  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const title = PAGE_TITLES[basePath] || 'Admin';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title={title} />
        <main className="flex-1 p-6 blueprint-grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/components/AdminLayout.tsx
git commit -m "add admin layout with sidebar and top bar"
```

---

### Task 8: App router

**Files:**
- Create: `admin/client/src/App.tsx`

- [ ] **Step 1: Create admin/client/src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AdminLayout from './components/AdminLayout';
import LoginPage from './components/LoginPage';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectEditor from './pages/ProjectEditor';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--steel)' }}>Loading...</div>;
  if (!user) return <LoginPage />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/new" element={<ProjectEditor />} />
            <Route path="projects/:id" element={<ProjectEditor />} />
            {/* Jobs and applications added in Plan 3 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/App.tsx
git commit -m "add app router with auth guard and route structure"
```

---

### Task 9: Dashboard page

**Files:**
- Create: `admin/client/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create admin/client/src/pages/Dashboard.tsx**

```tsx
import { useState, useEffect } from 'react';
import { api } from '../api';

interface Stats {
  totalProjects: number;
  activeJobs: number;
  newApplications: number;
  lastPublish: string | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      api('/api/projects').catch(() => []),
      api('/api/jobs').catch(() => []),
      api('/api/applications?status=new').catch(() => []),
      api('/api/publish/status').catch(() => ({ lastPublish: null })),
    ]).then(([projects, jobs, apps, pub]) => {
      setStats({
        totalProjects: Array.isArray(projects) ? projects.length : 0,
        activeJobs: Array.isArray(jobs) ? jobs.filter((j: any) => j.isActive).length : 0,
        newApplications: Array.isArray(apps) ? apps.length : 0,
        lastPublish: pub?.lastPublish || null,
      });
    });
  }, []);

  const cards = [
    { label: 'Total Projects', value: stats?.totalProjects ?? '--' },
    { label: 'Active Positions', value: stats?.activeJobs ?? '--' },
    { label: 'New Applications', value: stats?.newApplications ?? '--' },
    { label: 'Last Published', value: stats?.lastPublish ? new Date(stats.lastPublish).toLocaleDateString() : 'Never' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--steel)' }}>
            {card.label}
          </p>
          <p className="text-2xl font-mono" style={{ color: 'var(--glass-blue)' }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify frontend runs**

```bash
cd admin && npm run client:dev
```

Expected: Vite dev server at localhost:5174 showing login page.

- [ ] **Step 3: Commit**

```bash
git add admin/client/src/pages/Dashboard.tsx
git commit -m "add dashboard page with stats cards"
```

---

## Chunk 2: Project Management Backend

### Task 10: Project CRUD routes

**Files:**
- Create: `admin/server/routes/projects.ts`

- [ ] **Step 1: Create admin/server/routes/projects.ts**

```typescript
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'projects');

// Ensure uploads dir exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|avif)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

const router = Router();
router.use(requireAuth);

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET /api/projects
router.get('/', (_req: Request, res: Response) => {
  const projects = db.prepare(
    'SELECT * FROM projects ORDER BY displayOrder ASC, createdAt DESC'
  ).all();
  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', (req: Request, res: Response) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) { res.status(404).json({ error: 'Not found' }); return; }
  const photos = db.prepare(
    'SELECT * FROM project_photos WHERE projectId = ? ORDER BY displayOrder ASC'
  ).all(req.params.id);
  res.json({ ...project as any, photos });
});

// POST /api/projects
router.post('/', (req: Request, res: Response) => {
  const { title, category, description, location, year, sqft, duration, value, services, gridCoord, status } = req.body;
  if (!title) { res.status(400).json({ error: 'Title required' }); return; }

  const slug = slugify(title);
  const maxOrder = (db.prepare('SELECT MAX(displayOrder) as m FROM projects').get() as any)?.m || 0;

  const result = db.prepare(`
    INSERT INTO projects (slug, title, category, description, location, year, sqft, duration, value, services, gridCoord, displayOrder, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    slug, title, category || '', description || '', location || '',
    year || '', sqft || '', duration || '', value || '',
    JSON.stringify(services || []), gridCoord || '', maxOrder + 1, status || 'draft'
  );

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
  // Photos cascade deleted via FK
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// POST /api/projects/:id/photos -- upload photos
router.post('/:id/photos', upload.array('photos', 20), (req: Request, res: Response) => {
  const projectId = req.params.id;
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const files = req.files as Express.Multer.File[];
  if (!files?.length) { res.status(400).json({ error: 'No files uploaded' }); return; }

  const maxOrder = (db.prepare('SELECT MAX(displayOrder) as m FROM project_photos WHERE projectId = ?').get(projectId) as any)?.m || 0;

  const insert = db.prepare(
    'INSERT INTO project_photos (projectId, path, label, serviceTags, displayOrder) VALUES (?, ?, ?, ?, ?)'
  );

  const photos = files.map((file, i) => {
    const photoPath = `/uploads/projects/${file.filename}`;
    const result = insert.run(projectId, photoPath, '', '[]', maxOrder + i + 1);
    return { id: result.lastInsertRowid, path: photoPath, displayOrder: maxOrder + i + 1 };
  });

  // Set first uploaded as cover if project has no cover
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
  const { order } = req.body; // Array of photo IDs in desired order
  if (!Array.isArray(order)) { res.status(400).json({ error: 'order array required' }); return; }

  const update = db.prepare('UPDATE project_photos SET displayOrder = ? WHERE id = ? AND projectId = ?');
  const run = db.transaction(() => {
    order.forEach((photoId: number, index: number) => {
      update.run(index, photoId, req.params.id);
    });
  });
  run();
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 2: Add project reorder route (before /:id) and register in server/index.ts**

Add to `admin/server/index.ts` after existing route imports:

```typescript
import projectRoutes from './routes/projects.js';
```

And in the routes section:

```typescript
// Project reorder must come before the /:id catch-all in the projects router
app.put('/api/projects/reorder', requireAuth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) { res.status(400).json({ error: 'order array required' }); return; }
  const update = db.prepare('UPDATE projects SET displayOrder = ? WHERE id = ?');
  const run = db.transaction(() => {
    order.forEach((id: number, index: number) => {
      update.run(index, id);
    });
  });
  run();
  res.json({ ok: true });
});
app.use('/api/projects', projectRoutes);
```

Also import at top:
```typescript
import { requireAuth } from './auth.js';
import db from './db.js';
```

- [ ] **Step 3: Commit**

```bash
git add admin/server/routes/projects.ts admin/server/index.ts
git commit -m "add project CRUD routes with photo uploads and reorder"
```

---

## Chunk 3: Project Management Frontend

### Task 11: Reusable UI components

**Files:**
- Create: `admin/client/src/components/StatusBadge.tsx`
- Create: `admin/client/src/components/ServiceBadges.tsx`

- [ ] **Step 1: Create admin/client/src/components/StatusBadge.tsx**

```tsx
const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b',
  published: '#22c55e',
  active: '#22c55e',
  inactive: '#6b7280',
  new: '#3b82f6',
  reviewed: '#8b5cf6',
  contacted: '#22c55e',
  rejected: '#ef4444',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'var(--steel)';
  return (
    <span
      className="inline-block px-2 py-0.5 font-mono text-xs uppercase tracking-wider"
      style={{ border: `1px solid ${color}`, color }}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 2: Create admin/client/src/components/ServiceBadges.tsx**

```tsx
const SERVICES = [
  { key: 'curtain-wall', label: 'Curtain Wall' },
  { key: 'storefront', label: 'Storefront' },
  { key: 'window', label: 'Windows' },
  { key: 'entrance', label: 'Entrances' },
  { key: 'railing', label: 'Railings' },
  { key: 'skylight', label: 'Skylights' },
];

interface Props {
  selected: string[];
  onChange: (services: string[]) => void;
  readOnly?: boolean;
}

export default function ServiceBadges({ selected, onChange, readOnly }: Props) {
  function toggle(key: string) {
    if (readOnly) return;
    onChange(
      selected.includes(key)
        ? selected.filter(s => s !== key)
        : [...selected, key]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SERVICES.map(s => {
        const active = selected.includes(s.key);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => toggle(s.key)}
            disabled={readOnly}
            className="px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors"
            style={{
              border: `1px solid ${active ? 'var(--glass-blue)' : 'var(--border)'}`,
              background: active ? 'var(--glass-blue)' : 'transparent',
              color: active ? 'white' : 'var(--steel)',
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/client/src/components/StatusBadge.tsx admin/client/src/components/ServiceBadges.tsx
git commit -m "add StatusBadge and ServiceBadges reusable components"
```

---

### Task 12: Projects list page

**Files:**
- Create: `admin/client/src/pages/ProjectsList.tsx`

- [ ] **Step 1: Create admin/client/src/pages/ProjectsList.tsx**

```tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

interface Project {
  id: number;
  title: string;
  category: string;
  status: string;
  coverImage: string;
  displayOrder: number;
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api<Project[]>('/api/projects')
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  if (loading) return <p style={{ color: 'var(--steel)' }}>Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
          {projects.length} Projects
        </h2>
        <Link
          to="/projects/new"
          className="font-mono text-xs px-4 py-2 text-white uppercase tracking-wider"
          style={{ background: 'var(--glass-blue)' }}
        >
          + Add Project
        </Link>
      </div>

      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['', 'Title', 'Category', 'Status', 'Order', ''].map(h => (
              <th key={h} className="text-left p-3 font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr
              key={project.id}
              className="cursor-pointer hover:opacity-80"
              style={{ borderBottom: '1px solid var(--border)' }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <td className="p-3 w-16">
                {project.coverImage ? (
                  <img src={project.coverImage} alt="" className="w-12 h-9 object-cover" />
                ) : (
                  <div className="w-12 h-9" style={{ background: 'var(--border)' }} />
                )}
              </td>
              <td className="p-3 font-mono text-sm" style={{ color: 'var(--silver)' }}>{project.title}</td>
              <td className="p-3 text-sm" style={{ color: 'var(--steel)' }}>{project.category}</td>
              <td className="p-3"><StatusBadge status={project.status} /></td>
              <td className="p-3 font-mono text-xs" style={{ color: 'var(--steel)' }}>{project.displayOrder}</td>
              <td className="p-3 text-right">
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(project.id, project.title); }}
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

      {projects.length === 0 && (
        <p className="text-center py-12" style={{ color: 'var(--steel)' }}>
          No projects yet. Click "Add Project" to create one.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/client/src/pages/ProjectsList.tsx
git commit -m "add projects list page with table and delete"
```

---

### Task 13: Project editor page

**Files:**
- Create: `admin/client/src/pages/ProjectEditor.tsx`

- [ ] **Step 1: Create admin/client/src/pages/ProjectEditor.tsx**

```tsx
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, apiUpload } from '../api';
import ServiceBadges from '../components/ServiceBadges';

interface Photo {
  id: number;
  path: string;
  label: string;
  serviceTags: string[];
  displayOrder: number;
}

interface ProjectData {
  id?: number;
  title: string;
  category: string;
  description: string;
  location: string;
  year: string;
  sqft: string;
  duration: string;
  value: string;
  services: string[];
  coverImage: string;
  gridCoord: string;
  status: string;
  photos?: Photo[];
}

const EMPTY: ProjectData = {
  title: '', category: '', description: '', location: '',
  year: '', sqft: '', duration: '', value: '',
  services: [], coverImage: '', gridCoord: '', status: 'draft',
};

export default function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [data, setData] = useState<ProjectData>(EMPTY);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api(`/api/projects/${id}`).then((proj: any) => {
        setData({
          ...proj,
          services: typeof proj.services === 'string' ? JSON.parse(proj.services) : proj.services || [],
        });
        setPhotos((proj.photos || []).map((p: any) => ({
          ...p,
          serviceTags: typeof p.serviceTags === 'string' ? JSON.parse(p.serviceTags) : p.serviceTags || [],
        })));
      });
    }
  }, [id, isNew]);

  function update(field: keyof ProjectData, value: any) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const result = await api<{ id: number }>('/api/projects', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        navigate(`/projects/${result.id}`);
      } else {
        await api(`/api/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || isNew) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('photos', f));
    try {
      const newPhotos = await apiUpload<Photo[]>(`/api/projects/${id}/photos`, formData);
      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDeletePhoto(photoId: number) {
    if (!confirm('Delete this photo?')) return;
    await api(`/api/projects/${id}/photos/${photoId}`, { method: 'DELETE' });
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }

  async function handleDelete() {
    if (!confirm(`Delete "${data.title}"? This cannot be undone.`)) return;
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    navigate('/projects');
  }

  function Field({ label, field, type = 'text', rows }: { label: string; field: keyof ProjectData; type?: string; rows?: number }) {
    const Tag = rows ? 'textarea' : 'input';
    return (
      <label className="block mb-4">
        <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>{label}</span>
        <Tag
          type={type}
          value={(data[field] as string) || ''}
          onChange={(e: any) => update(field, e.target.value)}
          rows={rows}
          className="block w-full mt-1 px-3 py-2 text-sm"
          style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)', resize: rows ? 'vertical' : undefined }}
        />
      </label>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
          {isNew ? 'New Project' : `Edit: ${data.title}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Field label="Title" field="title" />
          <Field label="Category" field="category" />
          <Field label="Description" field="description" rows={4} />
          <Field label="Grid Coordinate" field="gridCoord" />

          <div className="mb-4">
            <span className="font-mono text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--steel)' }}>Status</span>
            <select
              value={data.status}
              onChange={e => update('status', e.target.value)}
              className="px-3 py-2 text-sm"
              style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Field label="Location" field="location" />
          <Field label="Year" field="year" />
          <Field label="Square Footage" field="sqft" />
          <Field label="Duration" field="duration" />
          <Field label="Value" field="value" />
        </div>
      </div>

      <div className="mt-6 p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="font-mono text-xs uppercase tracking-wider block mb-3" style={{ color: 'var(--steel)' }}>
          Services
        </span>
        <ServiceBadges selected={data.services} onChange={s => update('services', s)} />
      </div>

      {!isNew && (
        <div className="mt-6 p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>
              Photos ({photos.length})
            </span>
            <label className="font-mono text-xs px-4 py-2 text-white uppercase cursor-pointer" style={{ background: 'var(--glass-blue)' }}>
              {uploading ? 'Uploading...' : '+ Upload'}
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div key={photo.id} style={{ border: '1px solid var(--border)' }}>
                <img src={photo.path} alt={photo.label} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <input
                    type="text"
                    value={photo.label}
                    onChange={e => {
                      const newLabel = e.target.value;
                      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, label: newLabel } : p));
                      api(`/api/projects/${id}/photos/${photo.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ label: newLabel }),
                      });
                    }}
                    placeholder="Label"
                    className="w-full text-xs px-2 py-1 mb-1"
                    style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="text-xs"
                    style={{ color: '#ef4444' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {photos.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--steel)' }}>
              No photos yet. Upload some above.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Verify the full flow works**

1. Start backend: `cd admin && npm run dev`
2. Start frontend: `cd admin && npm run client:dev`
3. Open `http://localhost:5174`
4. Login with kevin@shalaworks.com / 12345
5. Navigate to Projects -> Add Project -> Fill form -> Save
6. Verify project appears in list
7. Click to edit, upload a photo, save

- [ ] **Step 3: Commit**

```bash
git add admin/client/src/pages/ProjectEditor.tsx
git commit -m "add project editor with full form, photo upload, and service badges"
```

---

End of Plan 2.
