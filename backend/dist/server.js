import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import session from "express-session";
import { ensureDbReady } from "./db/pg.js";
import { initializeDatabase } from "./db/schema.js";
import adminRouter from "./routes/admin.js";
import searchRouter from "./routes/search.js";
import authRouter from "./routes/auth.js";
import documentsRouter from "./routes/documents.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}
const uploadsDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN ?? process.env.FRONTEND_URL ?? true,
    credentials: true,
}));
app.use(morgan("combined"));
app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    },
}));
app.use(express.static(path.resolve(__dirname, "../public")));
app.use("/api/auth", authRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/admin", adminRouter);
app.use("/api", searchRouter);
app.get("/api/health", async (_req, res) => {
    try {
        await ensureDbReady();
        res.json({ ok: true });
    }
    catch (error) {
        console.error("Health check failed", error);
        res.status(503).json({ ok: false, error: "db_unavailable" });
    }
});
app.use((err, req, res, next) => {
    console.error("Unhandled application error:", err);
    if (res.headersSent) {
        return next(err);
    }
    let status = err.status || 500;
    let message = err.message || "Internal server error";
    if (err.code === "LIMIT_FILE_SIZE") {
        status = 413;
        message = "File too large. Maximum size is 10MB.";
    }
    res.status(status).json({ error: message });
});
const port = Number(process.env.PORT ?? 8080);
(async () => {
    try {
        await ensureDbReady();
        await initializeDatabase();
        app.listen(port, () => console.log(`api on :${port}`));
    }
    catch (e) {
        console.error("Failed to connect to PG via PG_URL", e);
        process.exit(1);
    }
})();
export default app;
