// DB row shapes (snake_case) → camelCase view-models for the content tables.
// Pure functions shared by the public query layer; no I/O in this module.

import { QR_TARGETS, type QrTarget } from "./schema";
import type {
  AchievementData,
  TechItemData,
  EducationData,
  ExperienceData,
  SettingsData,
  SkillCategoryData,
} from "./schema";

export interface SettingsRow {
  id: string;
  display_name: string;
  role_line: string;
  bio: string;
  email: string;
  linkedin_url: string;
  linkedin_label: string;
  github_url: string;
  github_label: string;
  instagram_url?: string | null;
  qr_target?: string | null;
  printer_project_id?: string | null;
  location: string;
  avatar_path: string;
  availability_text: string;
  headline: string;
  headline_highlight: string;
  tagline: string;
  resume_url: string;
  seo_title: string;
  seo_description: string;
}

export interface ExperienceRow {
  id: string;
  period: string;
  role: string;
  company: string;
  division: string;
  employment_type: string;
  highlights: string[] | null;
}

export interface EducationRow {
  id: string;
  degree: string;
  institution: string;
  detail: string;
  badge: string;
  certifications: string[] | null;
}

export interface SkillCategoryRow {
  id: string;
  name: string;
  skills: string[] | null;
}

/** Unknown/missing values (e.g. before migration 009) fall back to LinkedIn. */
function toQrTarget(v: string | null | undefined): QrTarget {
  return (QR_TARGETS as readonly string[]).includes(v ?? "") ? (v as QrTarget) : "linkedin";
}

export function toSettings(row: SettingsRow): SettingsData {
  return {
    displayName: row.display_name ?? "",
    roleLine: row.role_line ?? "",
    bio: row.bio ?? "",
    email: row.email ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    linkedinLabel: row.linkedin_label ?? "",
    githubUrl: row.github_url ?? "",
    githubLabel: row.github_label ?? "",
    instagramUrl: row.instagram_url ?? "",
    qrTarget: toQrTarget(row.qr_target),
    printerProjectId: row.printer_project_id ?? "",
    location: row.location ?? "",
    avatarPath: row.avatar_path ?? "",
    availabilityText: row.availability_text ?? "",
    headline: row.headline ?? "",
    headlineHighlight: row.headline_highlight ?? "",
    tagline: row.tagline ?? "",
    resumeUrl: row.resume_url ?? "/resume.pdf",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
  };
}

export function toExperience(row: ExperienceRow): ExperienceData {
  return {
    id: row.id,
    period: row.period ?? "",
    role: row.role ?? "",
    company: row.company ?? "",
    division: row.division ?? "",
    employmentType: row.employment_type ?? "",
    highlights: row.highlights ?? [],
  };
}

export function toEducation(row: EducationRow): EducationData {
  return {
    id: row.id,
    degree: row.degree ?? "",
    institution: row.institution ?? "",
    detail: row.detail ?? "",
    badge: row.badge ?? "",
    certifications: row.certifications ?? [],
  };
}

export function toSkillCategory(row: SkillCategoryRow): SkillCategoryData {
  return {
    id: row.id,
    name: row.name ?? "",
    skills: row.skills ?? [],
  };
}

export interface TechItemRow {
  id: string;
  name: string;
  icon_slug: string;
  letters: string;
  color: string;
  image_path: string;
}

export interface AchievementRow {
  id: string;
  date_label: string;
  title: string;
  subtitle: string;
  issuer: string;
}

export function toTechItem(row: TechItemRow): TechItemData {
  return {
    id: row.id,
    name: row.name ?? "",
    iconSlug: row.icon_slug ?? "",
    letters: row.letters ?? "",
    color: row.color ?? "",
    imagePath: row.image_path ?? "",
  };
}

export function toAchievement(row: AchievementRow): AchievementData {
  return {
    id: row.id,
    dateLabel: row.date_label ?? "",
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    issuer: row.issuer ?? "",
  };
}
