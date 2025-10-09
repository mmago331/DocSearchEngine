import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "@/middleware/auth";
import { extractTextPerPage, looksLikePdf } from "@/lib/pdf";
import {
  createDocument,
  insertPages,
  listMyDocuments,
  getMyDocumentWithPages,
  setVisibility,
  deleteMyDocument
} from "@/db/document";

const router = Router();

// memory storage so we can parse the buffer immediately
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const title = typeof req.body?.title === "string" ? req.body.title : "";
    if (!file) return res.status(400).json({ error: "Missing file" });
    if (file.mimetype !== "application/pdf" && !looksLikePdf(file.buffer)) {
      return res.status(400).json({ error: "Only PDF files are accepted" });
    }

    const pages = await extractTextPerPage(file.buffer);
    const doc = await createDocument(req.user!.id, title || file.originalname || "", file.originalname, file.mimetype);
    await insertPages(doc.id, pages);

    res.status(201).json({
      document: {
        id: doc.id,
        title: doc.title,
        original_filename: doc.original_filename,
        is_public: doc.is_public,
        created_at: doc.created_at,
        pages_count: pages.length
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: "Upload failed", details: e?.message });
  }
});

router.get("/", requireAuth, async (req, res) => {
  const rows = await listMyDocuments(req.user!.id);
  res.json({ documents: rows });
});

router.get("/:id", requireAuth, async (req, res) => {
  const result = await getMyDocumentWithPages(req.user!.id, req.params.id);
  if (!result) return res.status(404).json({ error: "Document not found" });
  res.json(result);
});

router.patch("/:id/visibility", requireAuth, async (req, res) => {
  const schema = z.object({ is_public: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });

  const updated = await setVisibility(req.user!.id, req.params.id, parsed.data.is_public);
  if (!updated) return res.status(404).json({ error: "Document not found" });
  res.json({ document: updated });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const count = await deleteMyDocument(req.user!.id, req.params.id);
  if (!count) return res.status(404).json({ error: "Document not found" });
  res.status(204).send();
});

export default router;
