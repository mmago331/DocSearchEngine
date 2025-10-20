import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import session from 'express-session';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import adminRouter from './routes/admin.js';
import searchRouter from './routes/search.js';
import authRouter from './routes/auth.js';
import documentsRouter from './routes/documents.js';
import { createConnection, initializeDatabase } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust first proxy (needed for secure cookies behind load balancers/proxies)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Initialize database
initializeDatabase().catch((error) => {
  console.error('Database initialization failed:', error);
  console.log('Server will continue running in mock mode');
});

// Create uploads directory
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.static(path.resolve(__dirname, '../public')));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api', searchRouter);

app.get('/health', (_req, res) => {
  const pool = createConnection();
  res.json({
    ok: true,
    status: 'running',
    timestamp: new Date().toISOString(),
    database: pool ? 'connected' : 'mock_mode'
  });
});

// Global error handler to ensure JSON responses for unexpected errors
// (including multipart upload issues from Multer)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled application error:', err);

  if (res.headersSent) {
    return next(err);
  }

  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'File too large. Maximum size is 10MB.';
  }

  res.status(status).json({ error: message });
});

export default app;
