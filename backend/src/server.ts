import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import express from "express";
import createApp from "./app.js"; // <-- NOTE: .js extension
import ensureAdmin from "./startup/ensureAdmin.js";
import { errorHandler } from "./lib/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();

const publicDir = path.join(__dirname, "public");

// Serve hashed assets long-cache; but never cache index.html (SPA shell)
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

// SPA fallback for non-API routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/documents") || req.path.startsWith("/api")) {
    return next();
  }
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 8080;

(async () => {
  try {
    await ensureAdmin();
  } catch (e) {
    console.error("[startup] ensureAdmin failed:", e);
  }

  http.createServer(app).listen(port, () => {
    console.log(`[backend] listening on :${port}`);
  });
})();
