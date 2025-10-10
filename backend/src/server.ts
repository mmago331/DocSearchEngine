import http from "http";
import path from "path";
import express from "express";
import createApp from "./app";

const app = createApp();

app.get("/health", (_req, res) => res.type("text/plain").send("ok"));

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir, { maxAge: "1h", index: "index.html" }));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path.startsWith("/documents")) return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

const port = Number(process.env.PORT) || 4000;
http.createServer(app).listen(port, () => {
  console.log(`[backend] listening on :${port}`);
});
