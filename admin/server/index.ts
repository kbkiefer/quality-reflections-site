import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import DB to trigger migrations on startup
import './db.js';
import db from './db.js';

import { requireAuth } from './auth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import publishRoutes from './routes/publish.js';
import contentRoutes from './routes/content.js';

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

// Serve logo files from public/logos/
app.use('/logos', express.static(path.join(__dirname, '..', '..', 'public', 'logos')));

// Project reorder must come before the /:id catch-all
app.put('/api/projects/reorder', requireAuth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) { res.status(400).json({ error: 'order array required' }); return; }
  const update = db.prepare('UPDATE projects SET displayOrder = ? WHERE id = ?');
  const run = db.transaction(() => { order.forEach((id: number, index: number) => { update.run(index, id); }); });
  run();
  res.json({ ok: true });
});
app.use('/api/projects', projectRoutes);

// Job reorder must come before the /:id catch-all
app.put('/api/jobs/reorder', requireAuth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) { res.status(400).json({ error: 'order array required' }); return; }
  const update = db.prepare('UPDATE job_listings SET displayOrder = ? WHERE id = ?');
  const run = db.transaction(() => { order.forEach((id: number, index: number) => { update.run(index, id); }); });
  run();
  res.json({ ok: true });
});
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/content', contentRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production, serve the built client SPA
const clientDist = path.join(__dirname, '..', 'dist', 'client');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`QR Admin server running on http://localhost:${PORT}`);
});

export default app;
