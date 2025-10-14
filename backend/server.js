import app from './src/app.js';
import { seedFromJson, searchFts } from './services/searchRepo.js';

// protect admin with a simple token (set on Azure)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

app.post('/api/admin/seed', (req, res) => {
  try {
    const auth = req.get('authorization') || '';
    if (!ADMIN_TOKEN || auth !== `Bearer ${ADMIN_TOKEN}`) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }
    const src = req.query.source || 'sample';
    const file = src === 'sample'
      ? './backend/data/docs.json'
      : String(src); // allow custom path later
    const result = seedFromJson(file);
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'SEED_FAILED' });
  }
});

// replace your current search handler's logic with FTS call
app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '');
    const filter = String(req.query.filter || 'All');
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));

    const data = searchFts({ q, filter, limit, offset });
    res.json({ ok: true, ...data });
  } catch (err) {
    console.error('search error:', err);
    res.status(500).json({ ok: false, error: 'SEARCH_FAILED' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`DocSearchEngine listening on ${port}`));
