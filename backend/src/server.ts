import path from "node:path";
import http from "node:http";
import express from "express";
import createApp from "./app";
import ensureAdmin from "./startup/ensureAdmin";
import { errorHandler } from "./lib/errorHandler";

const app = createApp();
const publicDir = path.join(__dirname, "public");

// Serve assets long-cache, but never cache the SPA shell
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

// SPA fallback
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
