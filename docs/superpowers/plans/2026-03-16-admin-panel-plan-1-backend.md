# Admin Panel Plan 1: Backend Foundation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Express.js admin server with SQLite database, JWT auth, and a working login endpoint.

**Architecture:** Express.js + TypeScript backend with better-sqlite3 for persistence, bcrypt for password hashing, and JWT in httpOnly cookies for session management. The server runs independently from the Astro site.

**Tech Stack:** Express.js, TypeScript, better-sqlite3, bcrypt, jsonwebtoken, cookie-parser, cors, tsx (dev runner), tsup (build)

**Spec:** `docs/superpowers/specs/2026-03-16-admin-panel-design.md`

---

## File Structure

```
admin/
├── package.json
├── tsconfig.json
├── .env.example
├── seed.ts                    # CLI: create admin user
├── data/                      # SQLite DB + exports (gitignored)
│   └── .gitkeep
├── server/
│   ├── index.ts               # Express app entry
│   ├── db.ts                  # SQLite setup + migrations
│   ├── auth.ts                # JWT middleware + bcrypt helpers
│   └── routes/
│       ├── auth.ts            # POST /login, POST /logout, GET /me
│       └── users.ts           # GET /, POST /, DELETE /:id, PUT /:id/password
```

---

## Chunk 1: Project Scaffolding

### Task 1: Initialize admin package

**Files:**
- Create: `admin/package.json`
- Create: `admin/tsconfig.json`
- Create: `admin/.env.example`
- Create: `admin/data/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Create admin/package.json**

```json
{
  "name": "qr-admin",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch server/index.ts",
    "build": "tsup server/index.ts --format esm --dts",
    "seed": "tsx seed.ts"
  },
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create admin/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": ".",
    "resolveJsonModule": true,
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["server/**/*.ts", "seed.ts"],
  "exclude": ["node_modules", "dist", "data"]
}
```

- [ ] **Step 3: Create admin/.env.example**

```
PORT=3001
JWT_SECRET=change-me-to-a-random-string
CORS_ORIGIN=http://localhost:4321
```

- [ ] **Step 4: Create admin/data/.gitkeep**

Empty file.

- [ ] **Step 5: Update .gitignore**

Add to the project root `.gitignore`:

```
# Admin
admin/node_modules/
admin/dist/
admin/data/*.db
admin/uploads/
admin/.env
```

- [ ] **Step 6: Install dependencies**

```bash
cd admin && npm install
```

- [ ] **Step 7: Commit**

```bash
git add admin/package.json admin/tsconfig.json admin/.env.example admin/data/.gitkeep .gitignore
git commit -m "scaffold admin package with dependencies"
```

---

### Task 2: SQLite database setup + migrations

**Files:**
- Create: `admin/server/db.ts`

- [ ] **Step 1: Create admin/server/db.ts**

```typescript
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'qr-admin.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    displayName TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT '',
    description TEXT DEFAULT '',
    location TEXT DEFAULT '',
    year TEXT DEFAULT '',
    sqft TEXT DEFAULT '',
    duration TEXT DEFAULT '',
    value TEXT DEFAULT '',
    services TEXT DEFAULT '[]',
    coverImage TEXT DEFAULT '',
    gridCoord TEXT DEFAULT '',
    displayOrder INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    label TEXT DEFAULT '',
    serviceTags TEXT DEFAULT '[]',
    displayOrder INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS job_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'full-time',
    description TEXT DEFAULT '',
    requirements TEXT DEFAULT '',
    payRange TEXT DEFAULT '',
    isActive INTEGER DEFAULT 1,
    displayOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobListingId INTEGER REFERENCES job_listings(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    resumePath TEXT DEFAULT '',
    formData TEXT DEFAULT '{}',
    status TEXT DEFAULT 'new',
    notes TEXT DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
```

- [ ] **Step 2: Verify DB creation by running a quick test**

```bash
cd admin && npx tsx -e "import db from './server/db.ts'; console.log(db.prepare('SELECT name FROM sqlite_master WHERE type=\\'table\\'').all());"
```

Expected: Array with users, projects, project_photos, job_listings, applications tables.

- [ ] **Step 3: Commit**

```bash
git add admin/server/db.ts
git commit -m "add SQLite database setup with all table migrations"
```

---

### Task 3: Auth helpers (JWT + bcrypt)

**Files:**
- Create: `admin/server/auth.ts`

- [ ] **Step 1: Create admin/server/auth.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';
const COOKIE_NAME = 'qr_token';

export interface AuthPayload {
  userId: number;
  username: string;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function createToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function setTokenCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function clearTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/server/auth.ts
git commit -m "add JWT and bcrypt auth helpers with middleware"
```

---

### Task 4: Auth routes (login, logout, me)

**Files:**
- Create: `admin/server/routes/auth.ts`

- [ ] **Step 1: Create admin/server/routes/auth.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add admin/server/routes/auth.ts
git commit -m "add auth routes: login, logout, me"
```

---

### Task 5: User management routes

**Files:**
- Create: `admin/server/routes/users.ts`

- [ ] **Step 1: Create admin/server/routes/users.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add admin/server/routes/users.ts
git commit -m "add user management routes (list, create, delete, reset password)"
```

---

### Task 6: Express server entry point

**Files:**
- Create: `admin/server/index.ts`

- [ ] **Step 1: Create admin/server/index.ts**

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import DB to trigger migrations on startup
import './db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4321';

// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`QR Admin server running on http://localhost:${PORT}`);
});

export default app;
```

- [ ] **Step 2: Create admin/.env for local development**

```
PORT=3001
JWT_SECRET=dev-secret-quality-reflections
CORS_ORIGIN=http://localhost:4321
```

- [ ] **Step 3: Start server to verify**

```bash
cd admin && npm run dev
```

Expected: "QR Admin server running on http://localhost:3001"

- [ ] **Step 4: Commit**

```bash
git add admin/server/index.ts
git commit -m "add Express server entry point with middleware and routing"
```

---

### Task 7: Seed script

**Files:**
- Create: `admin/seed.ts`

- [ ] **Step 1: Create admin/seed.ts**

```typescript
import db from './server/db.js';
import { hashPassword } from './server/auth.js';

const username = process.argv[2] || 'kevin@shalaworks.com';
const password = process.argv[3] || '12345';
const displayName = process.argv[4] || 'Kevin';

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  console.log(`User "${username}" already exists, skipping.`);
  process.exit(0);
}

const passwordHash = hashPassword(password);
const result = db.prepare(
  'INSERT INTO users (username, passwordHash, displayName) VALUES (?, ?, ?)'
).run(username, passwordHash, displayName);

console.log(`Created admin user "${username}" (id: ${result.lastInsertRowid})`);
```

- [ ] **Step 2: Run seed**

```bash
cd admin && npm run seed
```

Expected: `Created admin user "kevin@shalaworks.com" (id: 1)`

- [ ] **Step 3: Test login via curl**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"kevin@shalaworks.com","password":"12345"}' \
  -c - -v 2>&1 | grep -E "qr_token|displayName"
```

Expected: Response with `{"id":1,"username":"kevin@shalaworks.com","displayName":"Kevin"}` and a `Set-Cookie: qr_token=...` header.

- [ ] **Step 4: Test /api/auth/me with the cookie**

```bash
curl http://localhost:3001/api/auth/me \
  -b "qr_token=<paste token from previous step>" \
  -v 2>&1 | grep -E "username|displayName"
```

Expected: `{"id":1,"username":"kevin@shalaworks.com","displayName":"Kevin"}`

- [ ] **Step 5: Commit**

```bash
git add admin/seed.ts
git commit -m "add seed script for creating admin users"
```

---

End of Plan 1.
