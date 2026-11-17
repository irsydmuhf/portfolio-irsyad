// Upload validation for the downloadable resume (PDF only). Like the image
// check in lib/projects/media.ts, the type is decided from the file's real
// bytes, never from its name or the browser-supplied MIME type.

export const MAX_PDF_BYTES = 8 * 1024 * 1024;

/** Every PDF starts with the "%PDF-" signature. */
export function isPdf(head: Uint8Array): boolean {
  const sig = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  return head.length >= sig.length && sig.every((b, i) => head[i] === b);
}

export type PdfCheck = { ok: true } | { ok: false; error: string };

export function checkPdfUpload(size: number, head: Uint8Array): PdfCheck {
  if (size === 0) return { ok: false, error: "The selected file is empty." };
  if (size > MAX_PDF_BYTES) return { ok: false, error: "File is too large. Maximum size is 8 MB." };
  if (!isPdf(head)) return { ok: false, error: "Unsupported file type. Upload a PDF." };
  return { ok: true };
}
