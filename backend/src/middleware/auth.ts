import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "@/lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
