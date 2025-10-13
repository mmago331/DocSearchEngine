import express from "express";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// static login page
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h", index: "index.html" }));

// fake login endpoint (replace later)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
  // TODO: wire real auth later
  return res.json({ ok: true });
});

// 404 to index (optional: single page fallback)
app.use((_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`DocSearchEngine up on :${port}`));
