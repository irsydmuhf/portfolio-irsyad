import { describe, expect, it } from "vitest";
import { MAX_PDF_BYTES, checkPdfUpload, isPdf } from "../pdf";

const bytes = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

describe("isPdf", () => {
  it("accepts the %PDF- signature", () => {
    expect(isPdf(bytes("%PDF-1.7\n"))).toBe(true);
  });
  it("rejects other content, including a renamed image", () => {
    expect(isPdf(bytes("GIF89a"))).toBe(false);
    expect(isPdf(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe(false);
  });
  it("rejects a truncated signature", () => {
    expect(isPdf(bytes("%PDF"))).toBe(false);
    expect(isPdf(new Uint8Array())).toBe(false);
  });
});

describe("checkPdfUpload", () => {
  const head = bytes("%PDF-1.4");
  it("accepts a normal PDF", () => {
    expect(checkPdfUpload(120_000, head)).toEqual({ ok: true });
  });
  it("rejects empty files", () => {
    expect(checkPdfUpload(0, head).ok).toBe(false);
  });
  it("rejects files over 8 MB", () => {
    expect(checkPdfUpload(MAX_PDF_BYTES + 1, head).ok).toBe(false);
    expect(checkPdfUpload(MAX_PDF_BYTES, head).ok).toBe(true);
  });
  it("rejects non-PDF content", () => {
    const r = checkPdfUpload(1000, bytes("<html>"));
    expect(r.ok).toBe(false);
  });
});
