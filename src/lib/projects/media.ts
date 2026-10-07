// Upload validation shared by client hints and the server action (PRD §13.3-13.5).
// SVG is intentionally absent (script-capable). The extension comes from the
// detected MIME type, never from the user's filename.

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Sniff the real type from magic bytes so a renamed file can't slip through. */
export function sniffMime(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47
  )
    return "image/png";
  if (
    b.length >= 12 &&
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  if (
    b.length >= 12 &&
    String.fromCharCode(...b.slice(4, 8)) === "ftyp" &&
    ["avif", "avis"].includes(String.fromCharCode(...b.slice(8, 12)))
  )
    return "image/avif";
  return null;
}

export type UploadCheck =
  | { ok: true; mime: string; ext: string }
  | { ok: false; error: string };

export function checkUpload(size: number, head: Uint8Array): UploadCheck {
  if (size === 0) return { ok: false, error: "The selected file is empty." };
  if (size > MAX_UPLOAD_BYTES)
    return { ok: false, error: "File is too large. Maximum size is 8 MB." };
  const mime = sniffMime(head);
  if (!mime)
    return {
      ok: false,
      error: "Unsupported file type. Use JPEG, PNG, WebP or AVIF (SVG is not allowed).",
    };
  return { ok: true, mime, ext: ALLOWED_MIME[mime] };
}
