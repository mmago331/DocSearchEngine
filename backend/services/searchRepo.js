import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { openDb } from '../db/sqlite.js';

const db = openDb();

const upsert = db.prepare(`
  INSERT INTO docs (id, title, summary, tags, body)
  VALUES (@id, @title, @summary, @tags, @body)
  ON CONFLICT(id) DO UPDATE SET
    title=excluded.title, summary=excluded.summary,
    tags=excluded.tags, body=excluded.body
`);

export function seedFromJson(jsonPath) {
  const file = path.resolve(jsonPath);
  const raw = fs.readFileSync(file, 'utf8');
  const arr = JSON.parse(raw);

  const txn = db.transaction(items => {
    for (const d of items) {
      const tagsCsv = (d.tags || []).map(String).join(',');
      upsert.run({
        id: d.id || randomUUID(),
        title: d.title || '',
        summary: d.summary || '',
        tags: tagsCsv,
        body: d.body || `${d.title ?? ''}\n${d.summary ?? ''}`
      });
    }
  });

  txn(arr);
  return { inserted: arr.length };
}

export function searchFts({ q = '', filter = 'All', limit = 10, offset = 0 }) {
  const hasQuery = String(q || '').trim().length > 0;

  const baseSql = hasQuery
    ? `
      SELECT d.id, d.title, d.summary, d.tags,
             bm25(docs_fts) AS rank
      FROM docs_fts
      JOIN docs d ON d.rowid = docs_fts.rowid
      WHERE docs_fts MATCH ?
      ORDER BY rank ASC
      LIMIT ? OFFSET ?;
    `
    : `
      SELECT d.id, d.title, d.summary, d.tags,
             10.0 AS rank
      FROM docs d
      ORDER BY d.title ASC
      LIMIT ? OFFSET ?;
    `;

  const stmt = db.prepare(baseSql);
  const rows = hasQuery
    ? stmt.all(q, limit, offset)
    : stmt.all(limit, offset);

  // optional tag filter (exact match on a tag)
  const rows2 = (filter && filter !== 'All')
    ? rows.filter(r => (',' + (r.tags || '') + ',').toLowerCase().includes(',' + filter.toLowerCase() + ','))
    : rows;

  // map rank to 0..99 (lower rank is better)
  const items = rows2.map(r => {
    const score = Math.max(0, Math.min(99, Math.round(100 / (1 + r.rank))));
    return {
      id: r.id,
      title: r.title,
      summary: r.summary,
      tags: (r.tags || '').split(',').filter(Boolean),
      score
    };
  });

  return { total: items.length, count: items.length, items };
}
