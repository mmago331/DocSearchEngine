import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import adminRouter from './routes/admin.js';
import searchRouter from './routes/search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(morgan('combined'));

app.use(express.static(path.resolve(__dirname, '../public')));

app.use('/api/admin', adminRouter);
app.use('/api/search', searchRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

export default app;
