import { Router } from 'express';

import { db } from '../../db.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);

  if (!q) {
    return res.json({ ok: true, hits: [] });
  }

  try {
    let hits;

    try {
      hits = db
        .prepare(
          `
        SELECT d.id,
               d.title,
               snippet(docs_fts, 1, '<b>', '</b>', '…', 10) AS snippet,
               bm25(docs_fts) AS score
          FROM docs_fts
          JOIN docs d ON d.rowid = docs_fts.rowid
         WHERE docs_fts MATCH ?
         ORDER BY score ASC
         LIMIT ?
        `
        )
        .all(q, limit);
    } catch (_err) {
      const likeQuery = `%${q.replace(/[%_]/g, ' ')}%`;
      hits = db
        .prepare(
          `
        SELECT id,
               title,
               substr(body, 1, 200) AS snippet,
               1.0 AS score
          FROM docs
         WHERE title LIKE ? OR body LIKE ?
         LIMIT ?
        `
        )
        .all(likeQuery, likeQuery, limit);
    }

    return res.json({
      ok: true,
      hits: hits.map((hit) => ({ ...hit, score: Number(hit.score) })),
    });
  } catch (err) {
    console.error('search error', err);
    return res.status(500).json({
      ok: false,
      error: 'search_failed',
      detail: String(err.message || err),
    });
  }
});

export default router;
