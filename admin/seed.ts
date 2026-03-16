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
