import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import health from "@/routes/health";
import { errorHandler } from "@/lib/errorHandler";
import { env } from "@/lib/env";

const app = express();
app.use(helmet());
const allowedOrigins = ["http://localhost:5173"];
if (env.FRONTEND_ORIGIN) allowedOrigins.push(env.FRONTEND_ORIGIN);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use("/api", health);
// TODO: app.use("/api/auth", authRoutes);
// TODO: app.use("/api/documents", documentsRoutes);
// TODO: app.use("/api/search", searchRoutes);

// Serve React build (single-page app)
const publicDir = path.join(__dirname, "public");

// Cache hashed assets for a year, but do NOT cache index.html
app.use(
  express.static(publicDir, {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res, filePath) => {
      // never cache the SPA shell
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  })
);

// SPA fallback (except /api)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(publicDir, "index.html"));
});

// errors
app.use(errorHandler);

export default app;
