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
const publicDir = path.join(process.cwd(), "dist", "public");
app.use(express.static(publicDir));
// SPA fallback (except /api)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

// errors
app.use(errorHandler);

export default app;
