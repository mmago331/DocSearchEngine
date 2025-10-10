import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

// NOTE: If bundler complains, fallback to:
// GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export async function openPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  return await getDocument({ data }).promise;
}
