import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, initSchema } from './db.js';

const app = express();
app.use(express.json());

// Static frontend (keep whatever you already have)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

// Init DB and log path
const db = initSchema();
console.log(
  '[DocSearchEngine] DB_PATH =',
  process.env.DB_PATH || path.join(process.cwd(), 'data', 'docse.db'),
);

// --- Admin seed (sample) ---
app.post('/api/admin/seed', (req, res) => {
  try {
    const auth = req.header('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    // Minimal sample docs that include “income” and “closing”
    const sample = [
      {
        title: 'Income Verification',
        doc_type: 'Guideline',
        content:
          'Borrower income verification requirements and documents.',
      },
      {
        title: 'Closing Disclosure',
        doc_type: 'Form',
        content:
          'Final closing disclosure form and instructions for closing.',
      },
      {
        title: 'Loan Estimate',
        doc_type: 'Form',
        content:
          'Estimate of loan costs, fees, and income considerations.',
      },
    ];

    const insert = db.prepare(`
      INSERT INTO documents (title, doc_type, content)
      VALUES (@title, @doc_type, @content)
    `);

    const txn = db.transaction((rows) => {
      for (const r of rows) insert.run(r);
    });

    txn(sample);
    return res.json({ ok: true, inserted: sample.length });
  } catch (e) {
    console.error('seed_failed', e);
    return res.status(500).json({ ok: false, error: 'seed_failed' });
  }
});

// --- Admin count (quick sanity check) ---
app.get('/api/admin/count', (_req, res) => {
  try {
    const row = db.prepare(`SELECT COUNT(*) as n FROM documents`).get();
    res.json({ ok: true, count: row.n });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'count_failed' });
  }
});

// --- Search ---
app.get('/api/search', (req, res) => {
  try {
    const q = String(req.query.q ?? '').trim();
    const filter = String(req.query.filter ?? 'All').trim();

    if (!q) return res.json({ ok: true, results: [] });

    // IGNORE filter when it's “All” or empty
    const useFilter = filter && filter.toLowerCase() !== 'all';

    let rows = [];
    if (useFilter) {
      rows = db
        .prepare(`
        SELECT id, title, doc_type,
               substr(content, 1, 240) AS snippet,
               -- naive score: occurrences count (case-insensitive)
               (length(lower(content)) - length(replace(lower(content), lower(?), ''))) / max(length(?), 1) AS score
        FROM documents
        WHERE doc_type = ?
          AND lower(content) LIKE '%' || lower(?) || '%'
        ORDER BY score DESC, id DESC
        LIMIT 25
      `)
        .all(q, q, filter, q);
    } else {
      rows = db
        .prepare(`
        SELECT id, title, doc_type,
               substr(content, 1, 240) AS snippet,
               (length(lower(content)) - length(replace(lower(content), lower(?), ''))) / max(length(?), 1) AS score
        FROM documents
        WHERE lower(content) LIKE '%' || lower(?) || '%'
        ORDER BY score DESC, id DESC
        LIMIT 25
      `)
        .all(q, q, q);
    }

    return res.json({ ok: true, results: rows });
  } catch (e) {
    console.error('search_failed', e);
    return res.status(500).json({ ok: false, error: 'search_failed' });
  }
});

// Health & UI (keep your existing routes if already present)
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/ui', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/ui.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`DocSearchEngine listening on :${port}`));
