import express from "express";
import { q } from "../db.js";

const router = express.Router();

router.get("/api/search", async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ results: [] });
  }
  const queryText = String(req.query.q || "").trim();
  if (!queryText) {
    return res.json({ results: [] });
  }
  const sql = `
    select d.title, p.document_id, p.page_number,
           ts_rank(p.tsv, plainto_tsquery('simple',$1)) as rank,
           ts_headline('simple', p.content, plainto_tsquery('simple',$1),
             'StartSel=<mark>,StopSel=</mark>, MaxFragments=2, MinWords=5, MaxWords=20') as snippet
    from pages p
    join documents d on d.id = p.document_id
    where (d.owner_id = $2 or d.is_public = true) and p.tsv @@ plainto_tsquery('simple',$1)
    order by rank desc
    limit 50;
  `;
  const rows = await q(sql, [queryText, userId]);
  res.json({ results: rows });
});

export default router;
