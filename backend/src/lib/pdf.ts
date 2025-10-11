// pdfjs v3 legacy entry
// @ts-ignore - types aren't shipped for worker path
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
// @ts-ignore
import worker from "pdfjs-dist/legacy/build/pdf.worker.js?url"; // when bundling; at runtime we don't actually spawn

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = worker ?? "";

export async function extractTextPerPage(pdfBuffer: Buffer): Promise<string[]> {
  const loadingTask = (pdfjsLib as any).getDocument({ data: pdfBuffer, useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
        .join(" ")
        .trim();
      pages.push(text);
    }
  } finally {
    pdf.cleanup?.();
  }
  return pages;
}

export function looksLikePdf(buf: Buffer): boolean {
  if (buf.length < 5) return false;
  return buf.subarray(0, 5).toString() === "%PDF-";
}
