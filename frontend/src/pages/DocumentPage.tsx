import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/ui/primitives";
import { openPdf } from "@/lib/pdfClient";
import type { PDFDocumentProxy } from "pdfjs-dist";

type DocMeta = { id: string; title: string; pages?: number; owner?: string; uploadedAt?: string };

export default function DocumentPage() {
  const { id = "" } = useParams();
  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let aborted = false;
    setPageNum(1);
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const metaRes = await fetch(`/api/documents/${encodeURIComponent(id)}`);
        if (!metaRes.ok) throw new Error("Failed to load metadata");
        const m: DocMeta = await metaRes.json();
        if (aborted) return;
        setMeta(m);

        const fileRes = await fetch(`/api/documents/${encodeURIComponent(id)}/file`);
        if (!fileRes.ok) throw new Error("Failed to load file");
        const blob = await fileRes.blob();
        if (aborted) return;
        const arr = await blob.arrayBuffer();

        const pdf = await openPdf(arr);
        if (aborted) return;
        pdfRef.current = pdf;
        setTotal(pdf.numPages);
        await renderPage(pdf, 1, canvasRef.current);
      } catch (e: any) {
        if (!aborted) setError(e?.message || "Failed to load document");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!pdfRef.current || !canvasRef.current) return;
      await renderPage(pdfRef.current, pageNum, canvasRef.current);
    })();
  }, [pageNum]);

  const prev = () => setPageNum((p) => Math.max(1, p - 1));
  const next = () => setPageNum((p) => Math.min(total, p + 1));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{meta?.title ?? "Document"}</h1>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={prev}
            disabled={pageNum <= 1}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            {pageNum} / {total || "…"}
          </span>
          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={next}
            disabled={pageNum >= total || total === 0}
          >
            Next
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Card className="flex min-h-[480px] items-center justify-center p-3">
        {loading ? (
          <span className="text-sm text-gray-500">Loading…</span>
        ) : (
          <canvas ref={canvasRef} className="max-w-full rounded-md shadow" />
        )}
      </Card>

      <section className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
        <div>
          <span className="font-medium">Owner:</span> {meta?.owner ?? "—"}
        </div>
        <div>
          <span className="font-medium">Uploaded:</span>{" "}
          {meta?.uploadedAt ? new Date(meta.uploadedAt).toLocaleString() : "—"}
        </div>
        <div>
          <span className="font-medium">Pages:</span> {total || meta?.pages || "—"}
        </div>
      </section>
    </div>
  );
}

async function renderPage(
  pdf: PDFDocumentProxy,
  pageNum: number,
  canvas: HTMLCanvasElement | null
) {
  if (!canvas) return;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.4 });
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
}
