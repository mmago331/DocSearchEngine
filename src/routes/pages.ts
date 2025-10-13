import express from "express";

const router = express.Router();

function layout(title: string, body: string) {
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <link rel="stylesheet" href="/styles.css">
</head><body>
  <header class="topbar"><div class="inner">
    <a class="brand" href="/">DocSearchEngine</a>
    <a href="/search">Search</a>
    <a href="/explore">Explore</a>
    <div class="spacer"></div>
    <form method="post" action="/logout"><button class="logout" type="submit">Logout</button></form>
  </div></header>
  <div class="wrap">
    <nav class="nav">
      <a href="/">Main</a>
      <a href="/search">Search</a>
      <a href="/explore">Explore</a>
      <a href="/library">Library</a>
      <a href="/admin">Admin</a>
    </nav>
    <main class="main">${body}</main>
  </div>
</body></html>`;
}

router.get("/", (_req, res) => res.type("html").send(layout("Home", "<h2>Welcome</h2>")));
router.get("/search", (_req, res) => res.type("html").send(layout("Search", `
  <h2>Search</h2>
  <form id="search-form">
    <input class="input" name="q" placeholder="search…" />
    <button class="btn" type="submit">Go</button>
  </form>
  <div id="results" style="margin-top:12px"></div>
  <script>
    const f = document.getElementById('search-form');
    const r = document.getElementById('results');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = new FormData(f).get('q');
      const res = await fetch('/api/search?q=' + encodeURIComponent(q));
      const data = await res.json();
      r.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    });
  </script>
`)));

router.get("/explore", (_req, res) => res.type("html").send(layout("Explore", "<h2>Explore</h2>")));
router.get("/library", (_req, res) => res.type("html").send(layout("Library", "<h2>Library</h2>")));
router.get("/documents/:id", (req, res) => res.type("html").send(layout("Document", `<h2>Document ${req.params.id}</h2>`)));
router.get("/admin", (_req, res) => res.type("html").send(layout("Admin", "<h2>Admin</h2>")));

export default router;
