import { getDocument, type PDFDocumentProxy } from "pdfjs-dist";

export async function openPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  return await getDocument({ data }).promise;
}
