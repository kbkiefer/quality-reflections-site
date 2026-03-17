import db from './db.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = path.join(__dirname, '..', 'data', 'exports');
const ASTRO_DATA_DIR = path.join(__dirname, '..', '..', 'src', 'data');
const ADMIN_UPLOADS = path.join(__dirname, '..', 'uploads');
const PUBLIC_UPLOADS = path.join(__dirname, '..', '..', 'public', 'uploads');

function copyUploads() {
  if (!fs.existsSync(ADMIN_UPLOADS)) return;
  fs.cpSync(ADMIN_UPLOADS, PUBLIC_UPLOADS, { recursive: true });
}

export function exportData(): string {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  fs.mkdirSync(ASTRO_DATA_DIR, { recursive: true });

  const projects = db.prepare(
    "SELECT * FROM projects WHERE status = 'published' ORDER BY displayOrder ASC"
  ).all() as any[];

  const projectsWithPhotos = projects.map(p => {
    const photos = db.prepare(
      'SELECT * FROM project_photos WHERE projectId = ? ORDER BY displayOrder ASC'
    ).all(p.id) as any[];
    return {
      ...p,
      services: JSON.parse(p.services || '[]'),
      photos: photos.map(ph => ({
        ...ph,
        serviceTags: JSON.parse(ph.serviceTags || '[]'),
      })),
    };
  });

  const jobs = db.prepare(
    'SELECT * FROM job_listings WHERE isActive = 1 ORDER BY department ASC, displayOrder ASC'
  ).all() as any[];

  // Read all site content sections
  const siteContentRows = db.prepare('SELECT key, value FROM site_content').all() as any[];
  const siteContent: Record<string, any> = {};
  siteContentRows.forEach(row => {
    siteContent[row.key] = JSON.parse(row.value);
  });

  const content = {
    ...siteContent,
    projects: projectsWithPhotos,
    jobs,
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(content, null, 2);
  fs.writeFileSync(path.join(EXPORTS_DIR, 'content.json'), json);
  fs.writeFileSync(path.join(ASTRO_DATA_DIR, 'content.json'), json);

  // Copy uploaded images to Astro public dir so they're available in static build
  copyUploads();

  return content.exportedAt;
}
