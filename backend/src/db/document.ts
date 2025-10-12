import { query } from "../lib/pool.js";

export type DbDocument = {
  id: string;
  owner_id: string;
  title: string;
  original_filename: string | null;
  mime_type: string | null;
  is_public: boolean;
  created_at: string;
};

export type DbPage = {
  id: string;
  document_id: string;
  page_number: number;
  content: string;
  created_at: string;
};

export async function createDocument(
  ownerId: string,
  title: string,
  originalFilename: string | null,
  mimeType: string | null
): Promise<DbDocument> {
  const res = await query<DbDocument>(
    `INSERT INTO documents(owner_id, title, original_filename, mime_type)
     VALUES($1,$2,$3,$4) RETURNING *`,
    [ownerId, title, originalFilename, mimeType]
  );
  return res.rows[0];
}

export async function insertPages(documentId: string, contents: string[]) {
  const values: any[] = [];
  const rows: string[] = [];
  let i = 1;
  contents.forEach((content, idx) => {
    values.push(documentId, idx + 1, content);
    rows.push(`($${i++}, $${i++}, $${i++})`);
  });
  if (!rows.length) return;
  await query(
    `INSERT INTO pages(document_id, page_number, content)
     VALUES ${rows.join(",")}`,
    values
  );
}

export async function listMyDocuments(ownerId: string) {
  const res = await query(
    `SELECT d.*, COALESCE(count(p.id),0)::int AS pages_count
     FROM documents d
     LEFT JOIN pages p ON p.document_id = d.id
     WHERE d.owner_id = $1
     GROUP BY d.id
     ORDER BY d.created_at DESC`,
    [ownerId]
  );
  return res.rows;
}

export async function getMyDocument(ownerId: string, docId: string) {
  const doc = await query<DbDocument>(`SELECT * FROM documents WHERE id=$1 AND owner_id=$2`, [docId, ownerId]);
  return doc.rows[0] ?? null;
}

export async function getMyDocumentWithPages(ownerId: string, docId: string) {
  const doc = await getMyDocument(ownerId, docId);
  if (!doc) return null;
  const pages = await query<DbPage>(`SELECT * FROM pages WHERE document_id=$1 ORDER BY page_number ASC`, [docId]);
  return { doc, pages: pages.rows };
}

export async function setVisibility(ownerId: string, docId: string, isPublic: boolean) {
  const res = await query<DbDocument>(
    `UPDATE documents SET is_public=$3 WHERE id=$1 AND owner_id=$2 RETURNING *`,
    [docId, ownerId, isPublic]
  );
  return res.rows[0] ?? null;
}

export async function deleteMyDocument(ownerId: string, docId: string) {
  const res = await query(`DELETE FROM documents WHERE id=$1 AND owner_id=$2`, [docId, ownerId]);
  return res.rowCount ?? 0;
}
