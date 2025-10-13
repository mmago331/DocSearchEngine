import express from "express";
import { q } from "../db.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.render("home", { title: "Search" });
});

router.get("/documents", async (req, res) => {
  const userId = (req.session as any).userId;
  const docs = await q(
    "select id,title,is_public,created_at from documents where owner_id=$1 order by created_at desc",
    [userId]
  );
  res.render("library", { title: "Library", docs });
});

router.get("/explore", async (_req, res) => {
  const docs = await q(
    "select id,title,created_at from documents where is_public=true order by created_at desc limit 50"
  );
  res.render("explore", { title: "Explore", docs });
});

router.get("/admin", (_req, res) => {
  res.render("admin", { title: "Admin" });
});

export default router;
