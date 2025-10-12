import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import health from "./routes/health";
import documents from "./routes/documents";
import mountSearch from "./routes/search";

export default function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  if (process.env.LOG_LEVEL !== "silent") {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(
          `[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
        );
      });
      next();
    });
  }
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return cb(null, true);
        if (!allowed.length) return cb(null, true);
        return cb(null, allowed.includes(origin));
      },
      credentials: true,
    })
  );

  app.get("/runtime-config.json", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      appName: process.env.APP_NAME || "DocSearchEngine",
    });
  });

  app.use("/api", health);
  app.use("/api/documents", documents);
  mountSearch(app);

  return app;
}
