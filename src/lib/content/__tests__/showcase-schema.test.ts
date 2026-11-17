import { describe, expect, it } from "vitest";
import { achievementSchema, techItemSchema } from "../schema";
import { TECH_ICONS, TECH_ICON_OPTIONS, techIcon } from "../tech-icons";
import { techStack, achievements } from "@/data/showcase";

describe("techItemSchema", () => {
  it("accepts a name-only tool (letters fall back to initials)", () => {
    const r = techItemSchema.parse({ name: "dbt" });
    expect(r).toMatchObject({ name: "dbt", iconSlug: "", letters: "", color: "", imagePath: "" });
  });
  it("accepts a curated simple-icons slug", () => {
    expect(techItemSchema.safeParse({ name: "Airflow", iconSlug: "apacheairflow" }).success).toBe(true);
  });
  it("rejects a slug outside the curated list", () => {
    expect(techItemSchema.safeParse({ name: "X", iconSlug: "notarealicon" }).success).toBe(false);
  });
  it("rejects prototype keys masquerading as slugs", () => {
    expect(techItemSchema.safeParse({ name: "X", iconSlug: "toString" }).success).toBe(false);
  });
  it("validates hex colors", () => {
    expect(techItemSchema.safeParse({ name: "Power BI", color: "#F2C811" }).success).toBe(true);
    expect(techItemSchema.safeParse({ name: "Power BI", color: "F2C811" }).success).toBe(false);
    expect(techItemSchema.safeParse({ name: "Power BI", color: "#F2C" }).success).toBe(false);
  });
  it("caps letters at 4 characters", () => {
    expect(techItemSchema.safeParse({ name: "X", letters: "ABCDE" }).success).toBe(false);
  });
  it("only allows site paths or http(s) logo URLs", () => {
    expect(techItemSchema.safeParse({ name: "X", imagePath: "/tech/x.png" }).success).toBe(true);
    expect(techItemSchema.safeParse({ name: "X", imagePath: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("achievementSchema", () => {
  it("requires date and title", () => {
    expect(achievementSchema.safeParse({ dateLabel: "Sep 2026", title: "CADS" }).success).toBe(true);
    expect(achievementSchema.safeParse({ dateLabel: "", title: "CADS" }).success).toBe(false);
    expect(achievementSchema.safeParse({ dateLabel: "Sep 2026", title: " " }).success).toBe(false);
  });
});

describe("tech icon registry", () => {
  it("keys match each icon's simple-icons slug", () => {
    for (const [slug, icon] of Object.entries(TECH_ICONS)) expect(icon.slug).toBe(slug);
  });
  it("exposes sorted picker options", () => {
    const titles = TECH_ICON_OPTIONS.map((o) => o.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });
  it("resolves empty and unknown slugs to undefined", () => {
    expect(techIcon("")).toBeUndefined();
    expect(techIcon("python")?.title).toBe("Python");
  });
});

describe("local showcase fallback", () => {
  it("is valid against the CMS schemas", () => {
    for (const t of techStack) expect(techItemSchema.safeParse(t).success).toBe(true);
    for (const a of achievements) expect(achievementSchema.safeParse(a).success).toBe(true);
  });
});
