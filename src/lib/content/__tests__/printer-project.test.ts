import { describe, expect, it } from "vitest";
import { settingsSchema } from "../schema";
import { toSettings, type SettingsRow } from "../rows";

const base = { displayName: "Irsyad", email: "a@b.co" };

describe("printerProjectId", () => {
  it("defaults to empty (default paper)", () => {
    expect(settingsSchema.parse(base).printerProjectId).toBe("");
  });

  it("accepts a uuid", () => {
    const id = "6f1b1c0e-8a53-4f0e-9d6a-0c1f5c1d2e3a";
    expect(settingsSchema.parse({ ...base, printerProjectId: id }).printerProjectId).toBe(id);
  });

  it("rejects a non-uuid", () => {
    expect(settingsSchema.safeParse({ ...base, printerProjectId: "not-an-id" }).success).toBe(false);
  });

  it("maps a missing/null column (pre-migration 010) to empty", () => {
    const row = { display_name: "Irsyad", email: "a@b.co" } as SettingsRow;
    expect(toSettings(row).printerProjectId).toBe("");
    expect(toSettings({ ...row, printer_project_id: null }).printerProjectId).toBe("");
  });
});
