// backend/src/lib/pdf.ts
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

/**
 * Extract plain text from a PDF buffer, 1 string per page.
 * Works in Node; no worker needed.
 */
export async function extractTextPerPage(pdfBuffer: Buffer): Promise<string[]> {
  // In Node we don't need a separate worker file
  (GlobalWorkerOptions as any).workerSrc = undefined;

  const loadingTask = getDocument({ data: pdfBuffer, useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
        .join(" ")
        .trim();
      pages.push(text);
      page.cleanup?.();
    }
  } finally {
    pdf.cleanup?.();
  }
  return pages;
}

/** Quick check for "%PDF-" header. */
export function looksLikePdf(buf: Buffer): boolean {
  if (buf.length < 5) return false;
  return buf.slice(0, 5).toString() === "%PDF-";
}
