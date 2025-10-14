import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DB =
  process.env.DB_PATH || path.join(process.cwd(), 'data', 'docse.db');

// Ensure directory exists
fs.mkdirSync(path.dirname(DEFAULT_DB), { recursive: true });

let db = null;

export function getDb() {
  if (!db) {
    db = new Database(DEFAULT_DB);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initSchema() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      content TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
  `);
  return db;
}

export const dbPath = DEFAULT_DB;
