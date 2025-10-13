import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const resAny = res as any;
  resAny.status(501).json({ ok: false, error: "Documents API not yet implemented" });
});

export default router;
