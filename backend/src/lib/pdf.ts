/* Extract plain text per page using pdfjs-dist (Node). */
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const worker = require("pdfjs-dist/legacy/build/pdf.worker.js");
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = worker;

export async function extractTextPerPage(pdfBuffer: Buffer): Promise<string[]> {
  const loadingTask = (pdfjsLib as any).getDocument({ data: pdfBuffer, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
        .join(" ");
      pages.push(text.trim());
      page.cleanup?.();
    }
  } finally {
    pdf.cleanup?.();
  }
  return pages;
}

export function looksLikePdf(buf: Buffer): boolean {
  if (buf.length < 5) return false;
  return buf.slice(0, 5).toString() === "%PDF-";
}
