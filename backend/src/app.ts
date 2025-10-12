import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import health from "./routes/health";
import documents from "./routes/documents";
import mountSearch from "./routes/search";

export default function createApp(app?: Application) {
  const configuredApp = app ?? express();

  configuredApp.disable("x-powered-by");
  configuredApp.use(helmet());
  if (process.env.LOG_LEVEL !== "silent") {
    configuredApp.use((req, res, next) => {
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
  if (!app) {
    configuredApp.use(express.json({ limit: "25mb" }));
    configuredApp.use(express.urlencoded({ extended: true }));
  }
  configuredApp.use(cookieParser());

  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  configuredApp.use(
    cors({
      origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return cb(null, true);
        if (!allowed.length) return cb(null, true);
        return cb(null, allowed.includes(origin));
      },
      credentials: true,
    })
  );

  configuredApp.get("/runtime-config.json", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      appName: process.env.APP_NAME || "DocSearchEngine",
    });
  });

  configuredApp.use("/api", health);
  configuredApp.use("/api/documents", documents);
  mountSearch(configuredApp);

  return configuredApp;
}
