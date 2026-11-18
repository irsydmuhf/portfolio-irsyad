import { describe, expect, it } from "vitest";
import { settingsSchema } from "../schema";
import { toSettings, type SettingsRow } from "../rows";

const base = { displayName: "Irsyad", email: "a@b.co" };
const parse = (extra: Record<string, unknown>) => settingsSchema.safeParse({ ...base, ...extra });

describe("hero screen + red tag settings", () => {
  it("defaults reproduce the original look", () => {
    const d = settingsSchema.parse(base);
    expect(d.screenLine1).toBe("PORTO");
    expect(d.screenLine2).toBe("FOLIO");
    expect(d.screenQuery).toBe("SELECT insight FROM data");
    expect(d.tagText).toBe("Insights");
    expect(d.tagUrl).toBe("");
  });

  it("limits title lines to 10 characters", () => {
    expect(parse({ screenLine1: "A".repeat(10) }).success).toBe(true);
    expect(parse({ screenLine1: "A".repeat(11) }).success).toBe(false);
  });

  it("allows blanking everything (hides query/tag)", () => {
    const r = parse({ screenQuery: "", tagText: "", tagUrl: "" });
    expect(r.success).toBe(true);
  });

  it.each(["#projects", "/projects/x", "https://example.com/a"])("accepts tag link %s", (tagUrl) => {
    expect(parse({ tagUrl }).success).toBe(true);
  });

  it.each(["javascript:alert(1)", "//evil.com", "data:text/html,x", "projects"])(
    "rejects tag link %s",
    (tagUrl) => {
      expect(parse({ tagUrl }).success).toBe(false);
    }
  );

  it("keeps a deliberate blank but defaults a missing column (pre-migration 011)", () => {
    const row = { display_name: "I", email: "a@b.co" } as SettingsRow;
    const missing = toSettings(row);
    expect(missing.screenLine1).toBe("PORTO");
    expect(missing.tagText).toBe("Insights");

    const blank = toSettings({ ...row, screen_line1: "", tag_text: "" });
    expect(blank.screenLine1).toBe("");
    expect(blank.tagText).toBe("");
  });
});
