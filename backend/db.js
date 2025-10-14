import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDataDir = path.join(__dirname, 'data');
fs.mkdirSync(defaultDataDir, { recursive: true });

export const dbPath = process.env.DB_PATH || path.join(defaultDataDir, 'docse.db');

export const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS docs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);
`);
