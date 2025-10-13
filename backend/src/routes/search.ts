import type { Application, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../lib/pool";

const Query = z.object({
  q: z.string().trim().min(2, "query too short"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  documentId: z.string().uuid().optional(),
});

type SearchRow = {
  pageId: string;
  documentId: string;
  documentTitle: string | null;
  pageNumber: number | null;
  rank: number;
  snippet: string | null;
};

export default function mountSearch(router: Application) {
  const routerAny = router as any;
  routerAny.get("/api/search", async (req: Request, res: Response) => {
    const reqAny = req as any;
    const resAny = res as any;
    const parsed = Query.safeParse(reqAny.query);
    if (!parsed.success) {
      return resAny.status(400).json({ ok: false, error: parsed.error.flatten() });
    }
    const { q, limit, offset, documentId } = parsed.data;

    const params: (string | number)[] = [q, limit, offset];
    const whereDoc = documentId ? "AND d.id = $4" : "";
    if (documentId) params.push(documentId);

    const sql = `
      WITH q AS (
        SELECT websearch_to_tsquery('english', $1) AS tsq
      )
      SELECT
        p.id              AS "pageId",
        d.id              AS "documentId",
        d.title           AS "documentTitle",
        p.page_number     AS "pageNumber",
        ts_rank_cd(p.search_tsv, (SELECT tsq FROM q)) AS rank,
        ts_headline(
          'english',
          COALESCE(p.content, ''),
          (SELECT tsq FROM q),
          'ShortWord=3, MaxFragments=3, MaxWords=35, MinWords=15, StartSel=<mark>, StopSel=</mark>'
        ) AS snippet
      FROM pages p
      JOIN documents d ON d.id = p.document_id
      WHERE p.search_tsv @@ (SELECT tsq FROM q)
        ${whereDoc}
      ORDER BY rank DESC, d.id, p.page_number
      LIMIT $2 OFFSET $3
    `;

    try {
      const { rows } = await pool.query<SearchRow>(sql, params);
      return resAny.json({ ok: true, count: rows.length, results: rows });
    } catch (e: any) {
      console.error("[search] failed:", e?.message || e);
      return resAny.status(500).json({ ok: false, error: "search_failed" });
    }
  });
}
