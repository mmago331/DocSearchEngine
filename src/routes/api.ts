import express from "express";

const api = express.Router();

api.use((req, res, next) => {
  if ((req.session as any)?.user) return next();
  return res.status(401).json({ error: "unauthorized" });
});

api.get("/search", (req, res) => {
  const q = String(req.query.q || "");
  // TODO: plug in your actual search implementation
  res.json({ ok: true, query: q, results: [] });
});

export default api;
