import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(501).json({ ok: false, error: "Documents API not yet implemented" });
});

export default router;
