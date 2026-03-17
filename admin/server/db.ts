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

  CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '{}',
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
