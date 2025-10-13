import express from "express";
import session from "express-session";
import path from "node:path";

import createApp from "./app";
import ensureAdmin from "./startup/ensureAdmin";
import { errorHandler } from "./lib/errorHandler";

const publicDir = path.join(__dirname, "public");

const app = express();

app.set("trust proxy", 1); // required for secure cookies behind Azure's proxy

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    },
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));

createApp(app);

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const ok =
      typeof email === "string" &&
      typeof password === "string" &&
      email.trim().toLowerCase() === String(process.env.ADMIN_EMAIL || "").trim().toLowerCase() &&
      password === String(process.env.ADMIN_PASSWORD || "");
    if (!ok) return res.status(401).json({ ok: false, error: "invalid_credentials" });
    if (req.session) req.session.user = { email };
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.post("/auth/logout", (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/auth/me", (req, res) => {
  const user = req.session?.user;
  if (user) return res.json({ ok: true, user });
  return res.status(401).json({ ok: false });
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
  const user = req.session?.user;
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
