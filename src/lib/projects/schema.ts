// Shared validation (client forms + server actions) — plans/portfolio-cms-v2.md
// "Validation". The same schema runs in both places; the server never trusts
// the client copy.

import { z } from "zod";

export const LINK_TYPES = [
  "github",
  "dashboard",
  "demo",
  "documentation",
  "article",
  "other",
] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lowercase, hyphen-separated, ASCII-only slug from free text. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

/** Only http(s) URLs are accepted (blocks javascript:/data: links). */
export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const text = (max: number) =>
  z.string().trim().max(max, `Maximum ${max} characters.`);
const list = z.array(z.string().trim().min(1).max(300)).max(50);

export const stepSchema = z.object({
  title: z.string().trim().min(1, "Each step needs a title.").max(120),
  description: text(600).default(""),
});

export const insightSchema = z.object({
  title: z.string().trim().min(1, "Each insight needs a title.").max(160),
  description: z
    .string()
    .trim()
    .min(1, "Each insight needs a description.")
    .max(1200),
});

export const linkSchema = z.object({
  type: z.enum(LINK_TYPES),
  label: z.string().trim().min(1, "Each link needs a label.").max(80),
  url: z
    .string()
    .trim()
    .refine(isValidUrl, "Enter a valid URL starting with https://"),
});

export const privateMetaSchema = z.object({
  originalWorkTitles: list.default([]),
  internalNotes: text(4000).default(""),
  internalSourceReferences: list.default([]),
  confidentialityNotes: text(4000).default(""),
  contentVerified: z.boolean().default(false),
  confidentialityConfirmed: z.boolean().default(false),
});

/** Draft-level schema: title + slug are the only hard minimum (PRD §58). */
export const projectInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters.")
    .max(120)
    .regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens only."),
  category: text(80).default(""),
  summary: text(400).default(""),
  description: text(8000).default(""),
  businessProblem: text(4000).default(""),
  keyQuestions: list.default([]),
  role: text(200).default(""),
  domain: text(200).default(""),
  dataContext: text(400).default(""),
  projectPeriod: text(120).default(""),
  focus: text(200).default(""),
  projectType: text(80).default(""),
  approachSummary: text(4000).default(""),
  solutionSummary: text(4000).default(""),
  impactSummary: text(4000).default(""),
  tools: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
  technicalAnalytics: list.default([]),
  technicalProcessing: list.default([]),
  technicalAutomation: list.default([]),
  technicalVisualization: list.default([]),
  featured: z.boolean().default(false),
  steps: z.array(stepSchema).max(8, "Use at most 8 process steps.").default([]),
  insights: z.array(insightSchema).max(12).default([]),
  links: z.array(linkSchema).max(12).default([]),
  related: z.array(z.string().uuid()).max(6).default([]),
  privateMeta: privateMetaSchema.default({
    originalWorkTitles: [],
    internalNotes: "",
    internalSourceReferences: [],
    confidentialityNotes: "",
    contentVerified: false,
    confidentialityConfirmed: false,
  }),
});

export type ProjectInput = z.input<typeof projectInputSchema>;
export type ProjectData = z.output<typeof projectInputSchema>;

/** First human-readable message of a Zod error, with the field path. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue.path.filter((p) => typeof p === "string").join(" › ");
  return path ? `${path}: ${issue.message}` : issue.message;
}

// ------------------------------------------------------------ publish gate
export interface PublishReport {
  errors: string[];
  warnings: string[];
}

export interface PublishCandidate {
  title: string;
  category: string;
  summary: string;
  description: string;
  businessProblem: string;
  steps: unknown[];
  tools: string[];
  insights: unknown[];
  links: unknown[];
  impactSummary: string;
  hasCover: boolean;
  mediaCount: number;
  contentVerified: boolean;
  confidentialityConfirmed: boolean;
}

/**
 * Blocking errors follow PRD §34; message names the missing field.
 * Warnings are soft (no cover/insights/impact/links/media).
 */
export function validateForPublish(p: PublishCandidate): PublishReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const need = (ok: boolean, field: string) => {
    if (!ok)
      errors.push(
        `This project cannot be published because ${field} is empty.`
      );
  };

  need(p.title.trim().length >= 3, "Title");
  need(p.category.trim().length > 0, "Category");
  need(p.summary.trim().length > 0, "Summary");
  need(p.description.trim().length > 0, "Description");
  need(p.businessProblem.trim().length > 0, "Business Problem");
  if (p.steps.length < 2)
    errors.push(
      "This project cannot be published because it needs at least 2 process steps."
    );
  need(p.tools.length > 0, "Tools");
  if (!p.contentVerified)
    errors.push("Confirm that the content has been verified before publishing.");
  if (!p.confidentialityConfirmed)
    errors.push(
      "Confirm that the content contains no confidential information before publishing."
    );

  if (!p.hasCover)
    warnings.push("No cover image — the gradient fallback will be used.");
  if (p.insights.length === 0) warnings.push("No insights added.");
  if (!p.impactSummary.trim()) warnings.push("No business impact written.");
  if (p.links.length === 0) warnings.push("No public links added.");
  if (p.mediaCount === 0) warnings.push("No images or visuals added.");
  if (p.summary.length > 240)
    warnings.push("Summary is longer than the recommended 240 characters.");

  return { errors, warnings };
}
