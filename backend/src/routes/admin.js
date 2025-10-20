import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pool, isMockMode } from '../db/pg.js';
import { hashPassword } from '../middleware/auth.js';
import {
  createMockUser,
  deleteMockUser,
  listMockUsers,
  resetMockDocumentsFromSample,
  updateMockUser,
} from '../mock/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) {
    return next();
  }

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

function mapUserRow(row) {
  const documentCount = Number(row.document_count);
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: row.is_admin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documentCount: Number.isNaN(documentCount) ? 0 : documentCount
  };
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  return false;
}

router.get('/users', requireAdmin, async (_req, res) => {
  try {
    if (isMockMode) {
      const users = listMockUsers().map(mapUserRow);
      return res.json({ ok: true, users });
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.name, u.is_admin, u.created_at, u.updated_at,
              COUNT(d.id) AS document_count
         FROM users u
         LEFT JOIN documents d ON d.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC`
    );

    return res.json({ ok: true, users: rows.map(mapUserRow) });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return res.status(500).json({ ok: false, error: 'failed_to_fetch_users' });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  const { email, name, password, isAdmin } = req.body ?? {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedPassword = typeof password === 'string' ? password : '';

  if (!normalizedEmail || !normalizedName || !normalizedPassword) {
    return res
      .status(400)
      .json({ ok: false, error: 'missing_fields', detail: 'email, name, and password are required' });
  }

  if (normalizedPassword.length < 8) {
    return res.status(400).json({ ok: false, error: 'password_too_short' });
  }

  try {
    if (isMockMode) {
      try {
        const parsedAdmin = parseBoolean(isAdmin);
        const user = createMockUser({
          email: normalizedEmail,
          name: normalizedName,
          password: normalizedPassword,
          isAdmin: parsedAdmin,
        });

        return res.status(201).json({ ok: true, user: mapUserRow(user) });
      } catch (error) {
        if (error?.message === 'email_in_use') {
          return res.status(400).json({ ok: false, error: 'email_in_use' });
        }

        console.error('Failed to create user (mock):', error);
        return res.status(500).json({ ok: false, error: 'failed_to_create_user' });
      }
    }

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, error: 'email_in_use' });
    }

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, is_admin)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, is_admin, created_at, updated_at`,
      [normalizedEmail, hashPassword(normalizedPassword), normalizedName, parseBoolean(isAdmin)]
    );

    return res.status(201).json({ ok: true, user: mapUserRow(rows[0]) });
  } catch (error) {
    console.error('Failed to create user:', error);
    if (error?.code === '23505') {
      return res.status(400).json({ ok: false, error: 'email_in_use' });
    }
    return res.status(500).json({ ok: false, error: 'failed_to_create_user' });
  }
});

router.patch('/users/:id', requireAdmin, async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ ok: false, error: 'invalid_user_id' });
  }

  const { email, name, password, isAdmin } = req.body ?? {};
  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (req.session?.userId && Number(req.session.userId) === userId && isAdmin !== undefined) {
    const desiredAdmin = parseBoolean(isAdmin);
    if (!desiredAdmin) {
      return res.status(400).json({ ok: false, error: 'cannot_remove_own_admin' });
    }
  }

  if (email) {
    const trimmedEmail = email.toString().trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({ ok: false, error: 'invalid_email' });
    }
    updates.push(`email = $${paramIndex++}`);
    params.push(trimmedEmail);
  }

  if (name) {
    const trimmedName = name.toString().trim();
    if (!trimmedName) {
      return res.status(400).json({ ok: false, error: 'invalid_name' });
    }
    updates.push(`name = $${paramIndex++}`);
    params.push(trimmedName);
  }

  if (isAdmin !== undefined) {
    updates.push(`is_admin = $${paramIndex++}`);
    params.push(parseBoolean(isAdmin));
  }

  if (password) {
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ ok: false, error: 'invalid_password' });
    }
    updates.push(`password_hash = $${paramIndex++}`);
    params.push(hashPassword(password));
  }

  if (updates.length === 0) {
    return res.status(400).json({ ok: false, error: 'no_updates_provided' });
  }

  params.push(userId);

  try {
    if (isMockMode) {
      try {
        const updated = updateMockUser(userId, {
          email,
          name,
          password,
          isAdmin: isAdmin !== undefined ? parseBoolean(isAdmin) : undefined,
        });

        if (!updated) {
          return res.status(404).json({ ok: false, error: 'user_not_found' });
        }

        return res.json({ ok: true, user: mapUserRow(updated) });
      } catch (error) {
        if (error?.message === 'email_in_use') {
          return res.status(400).json({ ok: false, error: 'email_in_use' });
        }

        console.error('Failed to update user (mock):', error);
        return res.status(500).json({ ok: false, error: 'failed_to_update_user' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE users
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING id, email, name, is_admin, created_at, updated_at`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'user_not_found' });
    }

    return res.json({ ok: true, user: mapUserRow(rows[0]) });
  } catch (error) {
    console.error('Failed to update user:', error);
    if (error?.code === '23505') {
      return res.status(400).json({ ok: false, error: 'email_in_use' });
    }
    return res.status(500).json({ ok: false, error: 'failed_to_update_user' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ ok: false, error: 'invalid_user_id' });
  }

  if (req.session?.userId && Number(req.session.userId) === userId) {
    return res.status(400).json({ ok: false, error: 'cannot_delete_self' });
  }

  try {
    if (isMockMode) {
      if (!deleteMockUser(userId)) {
        return res.status(404).json({ ok: false, error: 'user_not_found' });
      }

      return res.json({ ok: true });
    }

    const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'user_not_found' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return res.status(500).json({ ok: false, error: 'failed_to_delete_user' });
  }
});

router.post('/seed', requireAdmin, async (req, res) => {
  const source = (req.query.source || '').toString().toLowerCase();

  try {
    let docs = [];

    if (source === 'sample') {
      if (isMockMode) {
        const inserted = resetMockDocumentsFromSample();
        return res.json({ ok: true, inserted });
      }

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
        await pool.query(
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
        await pool.query(
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
