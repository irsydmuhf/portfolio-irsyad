import { describe, expect, it } from "vitest";
import {
  isValidUrl,
  projectInputSchema,
  slugify,
  validateForPublish,
  type PublishCandidate,
} from "../schema";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Customer Retention: RFM & Cohorts!")).toBe(
      "customer-retention-rfm-cohorts"
    );
  });
  it("strips accents and edge hyphens", () => {
    expect(slugify("  Café Analítica -- ")).toBe("cafe-analitica");
  });
});

describe("isValidUrl", () => {
  it("accepts http(s) only", () => {
    expect(isValidUrl("https://github.com/x")).toBe(true);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,hi")).toBe(false);
    expect(isValidUrl("not a url")).toBe(false);
  });
});

describe("projectInputSchema", () => {
  it("accepts a minimal draft (title + slug)", () => {
    const r = projectInputSchema.safeParse({
      title: "My Project",
      slug: "my-project",
    });
    expect(r.success).toBe(true);
  });
  it("rejects a bad slug", () => {
    expect(
      projectInputSchema.safeParse({ title: "My Project", slug: "My Project" })
        .success
    ).toBe(false);
  });
  it("rejects invalid link URLs", () => {
    const r = projectInputSchema.safeParse({
      title: "My Project",
      slug: "my-project",
      links: [{ type: "github", label: "Code", url: "javascript:x" }],
    });
    expect(r.success).toBe(false);
  });
});

const ok: PublishCandidate = {
  title: "My Project",
  category: "Analytics",
  summary: "s",
  description: "d",
  businessProblem: "b",
  steps: [1, 2],
  tools: ["SQL"],
  insights: [],
  links: [],
  impactSummary: "",
  hasCover: false,
  mediaCount: 0,
  contentVerified: true,
  confidentialityConfirmed: true,
};

describe("validateForPublish", () => {
  it("passes with required fields and only warns on optional ones", () => {
    const r = validateForPublish(ok);
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("names the missing field", () => {
    const r = validateForPublish({ ...ok, businessProblem: " " });
    expect(r.errors).toContain(
      "This project cannot be published because Business Problem is empty."
    );
  });
  it("requires both confirmations and 2+ steps", () => {
    const r = validateForPublish({
      ...ok,
      steps: [1],
      contentVerified: false,
      confidentialityConfirmed: false,
    });
    expect(r.errors).toHaveLength(3);
  });
});
