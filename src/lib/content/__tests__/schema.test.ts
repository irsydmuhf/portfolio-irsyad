import { describe, expect, it } from "vitest";
import {
  contentIdSchema,
  educationSchema,
  experienceSchema,
  moveDirectionSchema,
  settingsSchema,
  skillCategorySchema,
} from "../schema";

describe("settingsSchema", () => {
  const valid = {
    displayName: "Irsyad Muhamad Firdaus",
    email: "owner@example.com",
  };

  it("accepts minimal settings (name + email only)", () => {
    expect(settingsSchema.safeParse(valid).success).toBe(true);
  });
  it("fills optional fields with defaults", () => {
    const r = settingsSchema.parse(valid);
    expect(r.headline).toBe("");
    expect(r.resumeUrl).toBe("/resume.pdf");
    expect(r.tagline).toBe("");
  });
  it("rejects a missing display name", () => {
    expect(settingsSchema.safeParse({ ...valid, displayName: "  " }).success).toBe(false);
  });
  it("rejects an invalid email", () => {
    expect(settingsSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
  it("rejects javascript: profile URLs", () => {
    const r = settingsSchema.safeParse({
      ...valid,
      linkedinUrl: "javascript:alert(1)",
    });
    expect(r.success).toBe(false);
  });
  it("allows an empty profile URL", () => {
    expect(
      settingsSchema.safeParse({ ...valid, linkedinUrl: "" }).success
    ).toBe(true);
  });
  it("rejects a resume URL that is neither a path nor http(s)", () => {
    expect(
      settingsSchema.safeParse({ ...valid, resumeUrl: "data:text/html,hi" }).success
    ).toBe(false);
  });
  it("accepts a site-relative avatar path", () => {
    expect(
      settingsSchema.safeParse({ ...valid, avatarPath: "/profile/profile.jpg" })
        .success
    ).toBe(true);
  });
});

describe("experienceSchema", () => {
  const valid = {
    period: "Oct 2025 — Present",
    role: "Data Analyst",
    company: "PT. Relasi Digital Marketing",
  };

  it("accepts a minimal experience entry", () => {
    expect(experienceSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a missing company", () => {
    expect(experienceSchema.safeParse({ ...valid, company: "" }).success).toBe(false);
  });
  it("trims fields", () => {
    const r = experienceSchema.parse({ ...valid, role: "  Data Analyst  " });
    expect(r.role).toBe("Data Analyst");
  });
  it("drops empty highlight entries instead of rejecting", () => {
    const r = experienceSchema.parse({
      ...valid,
      highlights: ["SQL", "", "  ", "Python"],
    });
    expect(r.highlights).toEqual(["SQL", "Python"]);
  });
  it("rejects highlights over the length cap", () => {
    const r = experienceSchema.safeParse({
      ...valid,
      highlights: ["x".repeat(81)],
    });
    expect(r.success).toBe(false);
  });
  it("accepts an optional uuid id for edits", () => {
    const r = experienceSchema.safeParse({
      ...valid,
      id: "3f6f4a2e-8f6a-4f2e-9c3a-1f2e3d4c5b6a",
    });
    expect(r.success).toBe(true);
  });
  it("rejects a malformed id", () => {
    expect(experienceSchema.safeParse({ ...valid, id: "nope" }).success).toBe(false);
  });
});

describe("educationSchema", () => {
  it("accepts a minimal education entry (degree only)", () => {
    expect(
      educationSchema.safeParse({ degree: "S.Kom. — Bachelor of Computer Science" })
        .success
    ).toBe(true);
  });
  it("rejects a missing degree", () => {
    expect(educationSchema.safeParse({ degree: " " }).success).toBe(false);
  });
  it("defaults certifications to an empty list", () => {
    expect(educationSchema.parse({ degree: "S.Kom." }).certifications).toEqual([]);
  });
});

describe("skillCategorySchema", () => {
  it("accepts a minimal category (name only)", () => {
    expect(skillCategorySchema.safeParse({ name: "Analytics" }).success).toBe(true);
  });
  it("rejects an empty category name", () => {
    expect(skillCategorySchema.safeParse({ name: "" }).success).toBe(false);
  });
  it("filters empty skill chips", () => {
    const r = skillCategorySchema.parse({
      name: "BI",
      skills: ["Power BI", "", "Looker Studio"],
    });
    expect(r.skills).toEqual(["Power BI", "Looker Studio"]);
  });
  it("rejects more than 40 skills", () => {
    const r = skillCategorySchema.safeParse({
      name: "Big",
      skills: Array.from({ length: 41 }, (_, i) => `s${i}`),
    });
    expect(r.success).toBe(false);
  });
});

describe("id / direction guards", () => {
  it("accepts only uuid ids", () => {
    expect(contentIdSchema.safeParse("3f6f4a2e-8f6a-4f2e-9c3a-1f2e3d4c5b6a").success).toBe(true);
    expect(contentIdSchema.safeParse("../../etc").success).toBe(false);
  });
  it("accepts only up/down", () => {
    expect(moveDirectionSchema.safeParse("up").success).toBe(true);
    expect(moveDirectionSchema.safeParse("sideways").success).toBe(false);
  });
});
