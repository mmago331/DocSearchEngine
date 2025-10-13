import { Router } from 'express';

const router = Router();

// GET /api/search?q=...&filter=...
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = String(req.query.filter || 'all').toLowerCase();

  // TODO: replace with real indexing/search later
  const results = q
    ? [
        {
          id: 'demo-1',
          title: `Result for "${q}"`,
          snippet:
            'This is a placeholder. We will swap this for real search results next.',
          score: 0.91,
          filter,
        },
        {
          id: 'demo-2',
          title: `Another hit: ${q.toUpperCase()}`,
          snippet: 'Second mock result row for layout testing.',
          score: 0.77,
          filter,
        },
      ]
    : [];

  res.json({ ok: true, q, filter, count: results.length, results });
});

export default router;
