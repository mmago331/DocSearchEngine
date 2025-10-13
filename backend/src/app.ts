import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "node:path";
import health from "./routes/health";
import login from "./routes/login";
import documents from "./routes/documents";
import mountSearch from "./routes/search";
import { env } from "./lib/env";
import { errorHandler } from "./lib/errorHandler";

const app = express();

// behind Azure proxies; needed for secure cookies later if you enable them
app.set("trust proxy", 1);
app.disable("x-powered-by");

// security
app.use(helmet());

// sessions
app.use(cookieParser());
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // If you terminate TLS at a proxy and serve HTTPS:
    // cookie: { secure: env.NODE_ENV === "production", sameSite: "lax" }
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));

// APIs that are always open (health)
app.use("/api/health", health);
app.use("/api/documents", documents);
mountSearch(app);

// login routes (HTML)
app.use(login);

// --- static SPA (only after auth) ---
const publicDir = path.join(process.cwd(), "dist", "public");
app.use(express.static(publicDir, { index: false }));

// For HTML requests, gate everything except /login and static assets
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqAny = req as any;
  const resAny = res as any;
  const isApi = String(reqAny.path || "").startsWith("/api/");
  const isLogin = reqAny.path === "/login" || reqAny.path === "/logout";
  const acceptsHtml = String(reqAny.headers?.accept || "").includes("text/html");
  const authed = Boolean(reqAny.session?.user);

  if (!isApi && acceptsHtml && !isLogin && !authed) {
    return resAny.redirect("/login");
  }
  return (next as unknown as () => void)();
});

// SPA fallback: only when authed
app.get("*", (req: Request, res: Response, next: NextFunction) => {
  const reqAny = req as any;
  const resAny = res as any;
  if (String(reqAny.path || "").startsWith("/api/")) return (next as unknown as () => void)();
  const authed = Boolean(reqAny.session?.user);
  if (!authed) return resAny.redirect("/login");
  resAny.sendFile(path.join(publicDir, "index.html"));
});

// errors
app.use(errorHandler);

export default app;
