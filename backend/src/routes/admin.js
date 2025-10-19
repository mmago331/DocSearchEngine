import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { executeQuery } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

function requireAdmin(req, res, next) {
  try {
    const hdr = req.get('Authorization') || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    next();
  } catch (_err) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
}

router.post('/seed', requireAdmin, async (req, res) => {
  const source = (req.query.source || '').toString().toLowerCase();

  try {
    let docs = [];

    if (source === 'sample') {
      const file = path.join(__dirname, '..', '..', 'seed', 'sample.json');
      const raw = fs.readFileSync(file, 'utf8');
      docs = JSON.parse(raw);
    } else {
      return res.status(400).json({ ok: false, error: 'unknown_source' });
    }

    // Insert documents into PostgreSQL
    let inserted = 0;
    for (const doc of docs) {
      try {
        await executeQuery(
          `INSERT INTO documents (id, user_id, filename, original_name, file_path, file_size, file_type, is_public)
           VALUES ($1, 1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (id) DO UPDATE SET
           filename = EXCLUDED.filename,
           original_name = EXCLUDED.original_name,
           file_path = EXCLUDED.file_path,
           file_size = EXCLUDED.file_size,
           file_type = EXCLUDED.file_type,
           is_public = EXCLUDED.is_public`,
          [doc.id, doc.title, doc.title, '/uploads/' + doc.id, doc.body.length, 'text/plain']
        );

        // Insert content into search_index
        await executeQuery(
          `INSERT INTO search_index (document_id, content, page_number)
           VALUES ($1, $2, 1)
           ON CONFLICT (document_id) DO UPDATE SET
           content = EXCLUDED.content`,
          [doc.id, doc.body]
        );

        inserted++;
      } catch (docErr) {
        console.error(`Error inserting document ${doc.id}:`, docErr);
      }
    }

    return res.json({ ok: true, inserted });
  } catch (err) {
    console.error('seed error', err);
    return res
      .status(500)
      .json({
        ok: false,
        error: 'seed_failed',
        detail: String(err && err.message ? err.message : err),
      });
  }
});

export default router;
