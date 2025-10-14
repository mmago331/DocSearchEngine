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

function ensureFts() {
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
        id UNINDEXED,
        title,
        body,
        content=''
      );
    `);

    const count = db.prepare('SELECT count(*) AS n FROM docs_fts').get().n;
    if (count === 0) {
      const rows = db.prepare('SELECT id, title, body FROM docs').all();
      const insert = db.prepare(
        'INSERT INTO docs_fts (id, title, body) VALUES (?, ?, ?)'
      );
      const seed = db.transaction((items) => {
        for (const row of items) insert.run(row.id, row.title, row.body);
      });
      seed(rows);
    }

    try {
      db.exec(`
        CREATE TRIGGER docs_ai AFTER INSERT ON docs BEGIN
          INSERT INTO docs_fts(rowid, id, title, body)
          VALUES (new.rowid, new.id, new.title, new.body);
        END;
        CREATE TRIGGER docs_ad AFTER DELETE ON docs BEGIN
          INSERT INTO docs_fts(docs_fts, rowid) VALUES ('delete', old.rowid);
        END;
        CREATE TRIGGER docs_au AFTER UPDATE ON docs BEGIN
          INSERT INTO docs_fts(docs_fts, rowid) VALUES ('delete', old.rowid);
          INSERT INTO docs_fts(rowid, id, title, body)
          VALUES (new.rowid, new.id, new.title, new.body);
        END;
      `);
    } catch (_err) {
      // Triggers likely already exist.
    }
  } catch (err) {
    console.warn('FTS not available, will use LIKE fallback:', err.message || err);
  }
}

export function rebuildFts() {
  try {
    db.exec('DELETE FROM docs_fts;');
    const rows = db.prepare('SELECT id, title, body FROM docs').all();
    const insert = db.prepare(
      'INSERT INTO docs_fts (id, title, body) VALUES (?, ?, ?)'
    );
    const seed = db.transaction((items) => {
      for (const row of items) insert.run(row.id, row.title, row.body);
    });
    seed(rows);
  } catch (err) {
    console.warn('rebuildFts skipped (no FTS table?):', err.message || err);
  }
}

ensureFts();
