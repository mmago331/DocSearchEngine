import { Router } from "express";
import { pool } from "@/db/pool";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "docsearchengine-backend",
    timestamp: new Date().toISOString()
  });
});

router.get("/db", async (_req, res) => {
  try {
    const ver = await pool.query<{ version: string }>("SELECT version()");
    res.json({ db: "ok", version: ver.rows[0].version });
  } catch (e: any) {
    res.status(500).json({ db: "error", message: e?.message ?? "DB error" });
  }
});

export default router;
