import { Pool } from 'pg';

const PG_URL = process.env.PG_URL; // e.g. postgresql://user:pass@docsearchengine-pg.privatelink.postgres.database.azure.com:5432/docsearch?sslmode=require
if (!PG_URL) {
  console.warn('[db] PG_URL not set — start will succeed but queries will fail.');
}

const pool = new Pool({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false }, // Azure PG requires TLS; privatelink uses private CA
});

// Create schema if missing (idempotent)
export async function ensureSchema() {
  if (!PG_URL) {
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;'); // allowed on Flexible Server
    await client.query(`
      CREATE TABLE IF NOT EXISTS docs (
        id BIGSERIAL PRIMARY KEY,
        title   TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    // full-text column and indexes
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM   pg_attribute a
          JOIN   pg_class c ON a.attrelid = c.oid
          WHERE  c.relname = 'docs' AND a.attname = 'tsv'
        ) THEN
          ALTER TABLE docs ADD COLUMN tsv tsvector GENERATED ALWAYS AS (
            to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
          ) STORED;
        END IF;
      END$$;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS docs_tsv_gin ON docs USING GIN(tsv);
    `);
    // Optional trigram index for LIKE/ILIKE fallbacks
    await client.query(`
      CREATE INDEX IF NOT EXISTS docs_trgm_gin ON docs USING GIN ((title || ' ' || content) gin_trgm_ops);
    `);
    console.log('[db] schema ready');
  } finally {
    client.release();
  }
}

export async function searchDocs(q, limit = 20) {
  if (!PG_URL) return [];
  if (!q || !q.trim()) return [];
  const sql = `
    WITH qry AS (SELECT plainto_tsquery('english', $1) AS query)
    SELECT
      d.id,
      d.title,
      LEFT(d.content, 280) AS preview,
      ts_rank(d.tsv, qry.query) AS score
    FROM docs d, qry
    WHERE d.tsv @@ qry.query
    ORDER BY score DESC, d.id DESC
    LIMIT $2;
  `;
  const { rows } = await pool.query(sql, [q, limit]);
  // normalize score to 0–100-ish for UI
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    snippet: r.preview,
    score: Math.round(Number(r.score) * 100),
  }));
}

export async function insertDocs(items) {
  if (!PG_URL) return 0;
  if (!Array.isArray(items)) return 0;
  const sql = 'INSERT INTO docs (title, content) VALUES ($1, $2);';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const it of items) {
      await client.query(sql, [it.title ?? '', it.content ?? '']);
    }
    await client.query('COMMIT');
    return items.length;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
