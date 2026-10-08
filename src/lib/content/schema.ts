// Shared validation for site-content CRUD (plans/portfolio-cms-v2.md Phase 14).
// Save-and-live semantics: these are short factual entries, so validation is
// light — required identity fields, sane max lengths, http(s)-only URLs.
// The same schema runs in client forms and server actions; the server never
// trusts the client copy.

import { z } from "zod";
import { isValidUrl } from "@/lib/projects/schema";

const text = (max: number) =>
  z.string().trim().max(max, `Maximum ${max} characters.`);

const required = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `Maximum ${max} characters.`);

/** http(s) URL or empty string (javascript:/data: are rejected). */
const urlOrEmpty = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || isValidUrl(v), "Enter a valid URL starting with https://");

/** Site-relative path ("/…") or absolute http(s) URL, or empty. */
const pathOrUrlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || v.startsWith("/") || isValidUrl(v),
    "Use a path starting with / or a URL starting with https://"
  );

/** Array of chips/lines: empty entries are dropped, not rejected. */
const stringList = (maxItems: number, maxLen: number) =>
  z
    .array(z.string().trim().max(maxLen, `Maximum ${maxLen} characters.`))
    .max(maxItems, `Use at most ${maxItems} items.`)
    .transform((arr) => arr.filter((s) => s.length > 0));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ----------------------------------------------------------------- settings
export const settingsSchema = z.object({
  // profile sidebar
  displayName: required(120, "Name"),
  roleLine: text(160).default(""),
  bio: text(1200).default(""),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => EMAIL_RE.test(v), "Enter a valid email address."),
  linkedinUrl: urlOrEmpty.default(""),
  linkedinLabel: text(200).default(""),
  githubUrl: urlOrEmpty.default(""),
  githubLabel: text(200).default(""),
  location: text(120).default(""),
  avatarPath: pathOrUrlOrEmpty.default(""),
  // homepage header
  availabilityText: text(80).default(""),
  headline: text(120).default(""),
  headlineHighlight: text(120).default(""),
  tagline: text(200).default(""),
  // footer
  resumeUrl: pathOrUrlOrEmpty.default("/resume.pdf"),
  // SEO (root layout metadata)
  seoTitle: text(160).default(""),
  seoDescription: text(320).default(""),
});

export type SettingsData = z.output<typeof settingsSchema>;

// -------------------------------------------------------------- experiences
export const experienceSchema = z.object({
  id: z.string().uuid().optional(),
  period: required(60, "Period"),
  role: required(120, "Role"),
  company: required(120, "Company"),
  division: text(120).default(""),
  employmentType: text(60).default(""),
  highlights: stringList(20, 80).default([]),
});

export type ExperienceData = z.output<typeof experienceSchema>;

// --------------------------------------------------------------- educations
export const educationSchema = z.object({
  id: z.string().uuid().optional(),
  degree: required(160, "Degree"),
  institution: text(160).default(""),
  detail: text(120).default(""),
  badge: text(40).default(""),
  certifications: stringList(10, 120).default([]),
});

export type EducationData = z.output<typeof educationSchema>;

// ---------------------------------------------------------- skill categories
export const skillCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: required(80, "Category name"),
  skills: stringList(40, 60).default([]),
});

export type SkillCategoryData = z.output<typeof skillCategorySchema>;

// ------------------------------------------------------------------ helpers
export type MoveDirection = "up" | "down";

export const moveDirectionSchema = z.enum(["up", "down"]);

export const contentIdSchema = z.string().uuid();
