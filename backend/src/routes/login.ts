import express, { type Request, type Response } from "express";
import { env } from "../lib/env";

const router = express.Router();

function renderForm(error = false) {
  const errorBanner = error
    ? `<div style="margin-bottom:12px;padding:8px 12px;border-radius:8px;background:#fee2e2;color:#991b1b;font:14px/1.4 system-ui">Invalid username or password.</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Login</title>
  <style>
    body{margin:0;background:#f7f7f8;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
    .wrap{display:grid;place-items:center;min-height:100vh;padding:24px}
    .card{width:100%;max-width:420px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    label{display:block;margin:10px 0 6px 0;font-weight:600}
    input{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;outline:none}
    button{display:block;width:100%;margin-top:12px;padding:10px;border:none;border-radius:10px;background:#4f46e5;color:#fff;font-weight:600;cursor:pointer}
    button:hover{background:#4338ca}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="card">
      <h1 style="margin:0 0 8px 0;font-size:20px">Sign in</h1>
      <p style="margin:0 0 12px 0;color:#6b7280">Admin access</p>
      ${errorBanner}
      <form method="post" action="/login">
        <label for="username">Username</label>
        <input id="username" name="username" type="text" autocomplete="username" required />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  </main>
</body>
</html>`;
}

router.get("/login", (req: Request, res: Response) => {
  const { ADMIN_USER, ADMIN_PASS } = env;
  const reqAny = req as any;
  const resAny = res as any;

  // Support Basic auth like Proxy (optional)
  const auth = String(reqAny.headers?.authorization || "");
  if (auth.startsWith("Basic ")) {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      reqAny.session.user = user;
      return resAny.redirect("/");
    }
  }

  const wantsHtml = typeof reqAny.accepts === "function"
    ? Boolean(reqAny.accepts("html"))
    : String(reqAny.headers?.accept || "").includes("text/html");
  if (!wantsHtml) {
    resAny.set("WWW-Authenticate", 'Basic realm="admin"');
    return resAny.status(401).send("Authentication required");
  }

  const error = String(reqAny.query?.error || "") === "1";
  resAny.status(200).type("html").send(renderForm(error));
});

router.post("/login", express.urlencoded({ extended: false }), (req: Request, res: Response) => {
  const { ADMIN_USER, ADMIN_PASS } = env;
  const reqAny = req as any;
  const resAny = res as any;
  const { username, password } = reqAny.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    reqAny.session.user = username;
    return resAny.redirect("/");
  }
  resAny.redirect("/login?error=1");
});

router.post("/logout", (req: Request, res: Response) => {
  const reqAny = req as any;
  const resAny = res as any;
  if (!reqAny.session) return resAny.redirect("/login");
  reqAny.session.destroy(() => resAny.redirect("/login"));
});

export default router;
