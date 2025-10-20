import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PATH = path.resolve(process.env.DB_PATH || './backend/data/docse.db');

export function openDb() {
  const dbDir = path.dirname(DEFAULT_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  const db = new Database(DEFAULT_PATH);
  db.pragma('journal_mode = WAL');

  // schema + FTS (idempotent)
  db.exec(`
    CREATE TABLE IF NOT EXISTS docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      tags TEXT,       -- comma-separated tags
      body TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts
      USING fts5(title, summary, tags, body, content='docs', content_rowid='rowid');

    CREATE TRIGGER IF NOT EXISTS docs_ai AFTER INSERT ON docs BEGIN
      INSERT INTO docs_fts(rowid, title, summary, tags, body)
      VALUES (new.rowid, new.title, new.summary, new.tags, new.body);
    END;

    CREATE TRIGGER IF NOT EXISTS docs_ad AFTER DELETE ON docs BEGIN
      INSERT INTO docs_fts(docs_fts, rowid, title, summary, tags, body)
      VALUES ('delete', old.rowid, old.title, old.summary, old.tags, old.body);
    END;

    CREATE TRIGGER IF NOT EXISTS docs_au AFTER UPDATE ON docs BEGIN
      INSERT INTO docs_fts(docs_fts, rowid, title, summary, tags, body)
      VALUES ('delete', old.rowid, old.title, old.summary, old.tags, old.body);
      INSERT INTO docs_fts(rowid, title, summary, tags, body)
      VALUES (new.rowid, new.title, new.summary, new.tags, new.body);
    END;
  `);

  return db;
}
