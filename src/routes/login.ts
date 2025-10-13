import express from "express";

const router = express.Router();

router.get("/login", (req, res) => {
  const error = String(req.query?.error || "") === "1";
  res.type("html").send(`<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Login</title>
  <link rel="stylesheet" href="/styles.css">
</head><body>
  <main class="login-wrap">
    <div class="card">
      <h1 class="h1">Sign in</h1>
      <p class="text-muted">Admin access</p>
      ${error ? `<div class="err">Invalid username or password.</div>` : ""}
      <form method="post" action="/login">
        <label class="label" for="username">Username</label>
        <input class="input" id="username" name="username" type="text" required/>
        <label class="label" for="password">Password</label>
        <input class="input" id="password" name="password" type="password" required/>
        <button class="btn" type="submit">Login</button>
      </form>
    </div>
  </main>
</body></html>`);
});

router.post("/login", express.urlencoded({ extended: false }), (req, res) => {
  const { ADMIN_USER, ADMIN_PASS } = process.env;
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    (req.session as any).user = username;
    return res.redirect("/");
  }
  return res.redirect("/login?error=1");
});

router.post("/logout", (req, res) => {
  req.session?.destroy(() => res.redirect("/login"));
});

export default router;
