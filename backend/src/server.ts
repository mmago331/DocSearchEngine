import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "@/app";
import { errorHandler } from "@/lib/errorHandler";
import { env } from "@/lib/env";
import ensureAdmin from "@/startup/ensureAdmin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "public");

app.use(
  express.static(publicDir, {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  })
);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/api")) return next();
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use(errorHandler);

(async () => {
  try {
    await ensureAdmin();
  } catch (e) {
    console.error("[startup] ensureAdmin failed:", e);
  }

  const port = Number(env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`[backend] listening on http://localhost:${port} (${env.NODE_ENV})`);
  });
})();
