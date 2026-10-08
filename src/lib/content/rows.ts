// DB row shapes (snake_case) → camelCase view-models for the content tables.
// Pure functions shared by the public query layer; no I/O in this module.

import type {
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
