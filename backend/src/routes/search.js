import { Router } from 'express';

import { db } from '../../db.js';

const router = Router();

router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) {
      return res.json({ ok: true, q: '', count: 0, results: [] });
    }

    const like = `%${q.replace(/[%_]/g, ' ')}%`;
    const stmt = db.prepare(
      `SELECT id, title, SUBSTR(body, 1, 280) AS snippet
       FROM docs
       WHERE title LIKE ? OR body LIKE ?
       ORDER BY rowid DESC
       LIMIT 20`
    );
    const rows = stmt.all(like, like);

    const results = rows.map((row) => ({
      id: row.id,
      title: row.title,
      snippet: row.snippet,
      score: 100,
    }));

    return res.json({ ok: true, q, count: results.length, results });
  } catch (err) {
    console.error('search error', err);
    return res.status(500).json({ ok: false, error: 'search_failed' });
  }
});

export default router;
