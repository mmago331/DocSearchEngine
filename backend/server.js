import app from './src/app.js';
import { ensureSchema, insertDocs, searchDocs } from './db.js';

// protect admin with a simple token (set on Azure)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// ensure DB schema on boot
ensureSchema().catch(err => {
  console.error('[boot] ensureSchema failed:', err);
});

app.post('/api/admin/seed', async (req, res) => {
  try {
    const auth = req.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const source = String(req.query.source || '');
    let items = [];

    if (source === 'sample') {
      items = [
        {
          title: 'Income calculation basics',
          content:
            'This document reviews borrower income calculation, stability tests, and treatment of variable income.',
        },
        {
          title: 'Closing workflow overview',
          content:
            'End-to-end closing steps including conditions, doc prep, signing and funding checklist.',
        },
        {
          title: 'Appraisal reconsideration policy',
          content:
            'How to request and process appraisal reconsiderations and additional comps.',
        },
      ];
    } else {
      return res.status(400).json({ ok: false, error: 'unknown_source' });
    }

    const inserted = await insertDocs(items);
    res.json({ ok: true, inserted });
  } catch (e) {
    console.error('[seed] error:', e);
    res.status(500).json({ ok: false, error: 'seed_failed' });
  }
});

// replace your current search handler's logic with FTS call
app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '');
    if (!q.trim()) {
      return res.json({ ok: true, q, results: [] });
    }

    const results = await searchDocs(q, 20);
    res.json({ ok: true, q, count: results.length, results });
  } catch (err) {
    console.error('[search] error:', err);
    res.status(500).json({ ok: false, error: 'search_failed' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`DocSearchEngine listening on ${port}`));
