import express from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";

import createApp from "./app";
import ensureAdmin from "./startup/ensureAdmin";
import { errorHandler } from "./lib/errorHandler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");

const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));

createApp(app);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  })
);

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const ok =
      typeof email === "string" &&
      typeof password === "string" &&
      email.trim().toLowerCase() === String(process.env.ADMIN_EMAIL || "").trim().toLowerCase() &&
      password === String(process.env.ADMIN_PASSWORD || "");
    if (!ok) return res.status(401).json({ ok: false, error: "invalid_credentials" });
    (req.session as any).user = { email };
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/auth/me", (req, res) => {
  const user = (req.session as any)?.user || null;
  res.json({ ok: true, user });
});

const publicOk = (p: string) =>
  p.startsWith("/auth/") ||
  p.startsWith("/api/") ||
  p.startsWith("/assets/") ||
  p.startsWith("/public/") ||
  p === "/api/health" ||
  p === "/runtime-config.json" ||
  p === "/favicon.ico" ||
  p.startsWith("/robots.txt");

app.use((req, res, next) => {
  const user = (req.session as any)?.user;
  if (!user && req.method === "GET" && !publicOk(req.path) && req.path !== "/login" && req.path !== "/register") {
    return res.redirect("/login");
  }
  return next();
});

app.use(
  express.static(publicDir, {
    maxAge: "1y",
    immutable: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-store");
    },
  })
);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
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

  app.listen(port, () => {
    console.log(`[server] listening on :${port}`);
  });
})();
