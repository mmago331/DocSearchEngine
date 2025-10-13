import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(morgan('combined'));

// --- minimal search route (stub) ---
app.post('/api/search', async (req, res) => {
  const { q = '', filter = 'All' } = req.body || {};
  // TODO: later call the real Phobos search here

  // simple stubbed results to prove the UI pipeline
  const now = new Date().toISOString();
  const items = [
    { id: 'doc-001', title: 'Employee Handbook', snippet: 'Benefits, PTO, holidays, and policies.', score: 0.92, updatedAt: now },
    { id: 'doc-002', title: 'Loan Processing SOP', snippet: 'Step-by-step LOS workflow used by the team.', score: 0.87, updatedAt: now },
    { id: 'doc-003', title: 'Encompass Tips & Tricks', snippet: 'Keyboard shortcuts and admin hints.', score: 0.81, updatedAt: now },
  ].filter(x => q ? (x.title.toLowerCase().includes(q.toLowerCase()) || x.snippet.toLowerCase().includes(q.toLowerCase())) : true);

  res.json({ ok: true, count: items.length, filter, q, items });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`DocSearchEngine listening on ${port}`));
