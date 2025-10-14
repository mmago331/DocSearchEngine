import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { db, rebuildFts } from '../../db.js';

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

router.post('/seed', requireAdmin, (req, res) => {
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

    const insert = db.prepare(
      'INSERT OR REPLACE INTO docs (id, title, body) VALUES (@id, @title, @body)'
    );

    const tx = db.transaction((items) => {
      for (const d of items) insert.run(d);
    });
    tx(docs);

    return res.json({ ok: true, inserted: docs.length });
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

router.post('/reindex', requireAdmin, (_req, res) => {
  try {
    rebuildFts();
    return res.json({ ok: true });
  } catch (err) {
    console.error('reindex error', err);
    return res.status(500).json({
      ok: false,
      error: 'reindex_failed',
      detail: String(err.message || err),
    });
  }
});

export default router;
