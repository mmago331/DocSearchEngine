import path from "node:path";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import pg from "pg";
import connectPg from "connect-pg-simple";
import authRoutes from "./routes/auth.js";
import pageRoutes from "./routes/pages.js";
import documentRoutes from "./routes/documents.js";
import searchRoutes from "./routes/search.js";

const PgStore = connectPg(session);
const app = express();

app.set("views", path.join(process.cwd(), "src", "views"));
app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const originalRender = res.render.bind(res);
  res.render = ((view: string, options?: any, callback?: any) => {
    const opts = typeof options === "function" ? {} : options ?? {};
    const cb = typeof options === "function" ? options : callback;
    const locals = { ...res.locals, ...opts } as Record<string, any>;
    let layoutName: string | false | undefined = locals.layout;
    let layoutData: Record<string, any> = {};
    if (layoutName !== false && typeof layoutName !== "string") {
      layoutName = undefined;
    }
    const layoutFn = (name: string, data: Record<string, any> = {}) => {
      layoutName = name;
      layoutData = data;
      return "";
    };
    const viewOptions = { ...locals, layout: layoutFn };
    const handleView = (err: Error | null, html?: string) => {
      if (err) {
        if (cb) return cb(err);
        return next(err);
      }
      if (layoutName === false) {
        if (cb) return cb(null, html);
        res.send(html ?? "");
        return;
      }
      const layoutView = layoutName ?? "_layout";
      const layoutOptions = { ...locals, ...layoutData, body: html };
      delete (layoutOptions as any).layout;
      const handleLayout = (layoutErr: Error | null, layoutHtml?: string) => {
        if (layoutErr) {
          if (cb) return cb(layoutErr);
          return next(layoutErr);
        }
        if (cb) return cb(null, layoutHtml);
        res.send(layoutHtml ?? "");
      };
      originalRender(layoutView, layoutOptions, handleLayout);
    };
    originalRender(view, viewOptions, handleView);
    return res;
  }) as typeof res.render;
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: { connectSrc: ["'self'"] }
    }
  })
);
app.use(morgan("tiny"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    store: new PgStore({ pool: new pg.Pool({ connectionString: process.env.DATABASE_URL }) }),
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: "lax" }
  })
);

app.use(express.static(path.join(process.cwd(), "public")));

app.use(authRoutes);
app.use(documentRoutes);
app.use(searchRoutes);

app.use((req, res, next) => {
  const acceptsHtml = (req.headers.accept || "").includes("text/html");
  const isAuthPage = req.path === "/login" || req.path === "/register";
  const authed = Boolean((req.session as any).userId);
  if (acceptsHtml && !isAuthPage && !authed) {
    return res.redirect("/login");
  }
  next();
});

app.use(pageRoutes);

export default app;
