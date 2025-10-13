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

// fake login endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
  return res.json({ ok: true });
});

// static files
app.use(express.static(path.join(__dirname, "public"), { index: "index.html", maxAge: "1h" }));

// fallback
app.use((_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`DocSearchEngine listening on :${port}`));
