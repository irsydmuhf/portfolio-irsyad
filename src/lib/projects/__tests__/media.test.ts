import { describe, expect, it } from "vitest";
import { checkUpload, MAX_UPLOAD_BYTES, sniffMime } from "../media";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>");

describe("media validation", () => {
  it("detects real image types", () => {
    expect(sniffMime(png)).toBe("image/png");
    expect(sniffMime(jpg)).toBe("image/jpeg");
  });
  it("rejects SVG and unknown bytes", () => {
    expect(sniffMime(svg)).toBeNull();
    expect(checkUpload(100, svg).ok).toBe(false);
  });
  it("rejects oversized and empty files", () => {
    expect(checkUpload(MAX_UPLOAD_BYTES + 1, png).ok).toBe(false);
    expect(checkUpload(0, png).ok).toBe(false);
  });
  it("accepts a valid image with extension from the MIME type", () => {
    const r = checkUpload(1000, png);
    expect(r).toEqual({ ok: true, mime: "image/png", ext: "png" });
  });
});
