import type { NextFunction, Request, Response } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not Found" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.status || 500;
  const message = err?.message || "Internal Server Error";
  const details = process.env.NODE_ENV !== "production" ? err?.stack : undefined;
  res.status(status).json({ error: message, details });
}
