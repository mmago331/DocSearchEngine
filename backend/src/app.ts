import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import health from "@/routes/health";
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

export default app;
