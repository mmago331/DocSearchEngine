import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { q } from "../db.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.get("/upload", (req, res) => {
  if (!(req.session as any).userId) {
    return res.redirect("/login");
  }
  res.render("upload", { title: "Upload" });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.redirect("/login");
  }
  const uploaded = (req as any).file as { originalname?: string; filename?: string } | undefined;
  const title = req.body?.title || uploaded?.originalname || "Untitled";
  const filename = uploaded?.filename;
  if (!filename) {
    return res.redirect("/upload?error=1");
  }
  const inserted = await q<{ id: string }>(
    "insert into documents(owner_id,title,filename) values($1,$2,$3) returning id",
    [userId, title, filename]
  );
  const documentId = inserted[0].id;
  const pdfPath = path.join(process.cwd(), "uploads", filename);
  const data = new Uint8Array(await fs.readFile(pdfPath));
  const pdf = await getDocument({ data }).promise;
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const content = textContent.items.map((item: any) => item.str).join(" ");
    await q(
      "insert into pages(document_id,page_number,content) values($1,$2,$3)",
      [documentId, i, content]
    );
  }
  res.redirect("/documents");
});

export default router;
