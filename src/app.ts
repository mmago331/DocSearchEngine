import path from "node:path";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import loginRoutes from "./routes/login.js";
import pagesRoutes from "./routes/pages.js";
import apiRoutes from "./routes/api.js";

const app = express();
app.set("trust proxy", 1);

// security (CSP allows same-origin resources + XHR)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: { connectSrc: ["'self'"] }
  }
}));

app.use(morgan("tiny"));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "change_me",
  resave: false,
  saveUninitialized: false
}));

// static
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));

// auth + login/logout
app.use(loginRoutes);

// Gate HTML (except /login and static) to logged-in users
app.use((req, res, next) => {
  const acceptsHtml = (req.headers.accept || "").includes("text/html");
  const isLogin = req.path === "/login" || req.path === "/logout";
  const isStatic = req.path.startsWith("/styles.css");
  const authed = Boolean((req.session as any)?.user);
  if (acceptsHtml && !isStatic && !isLogin && !authed) {
    return res.redirect("/login");
  }
  next();
});

// Application pages (server-rendered)
app.use(pagesRoutes);

// APIs (same-origin). Protect with session.
app.use("/api", apiRoutes);

// Fallback for unknown routes
app.use((_req, res) => res.status(404).send("Not found"));

export default app;
