// Homepage data loader: settings + experience + education + skills + featured
// projects in one round-trip (plans/portfolio-cms-v2.md Phase 16).
//
// Dev-only safety net: when Supabase is unreachable (paused project, offline,
// missing env) `next dev` renders the bundled local seed content instead of
// crashing, so the UI can still be worked on. Production keeps failing loudly.

import "server-only";

import { getFeaturedProjects } from "@/lib/projects/queries";
import { projects as localProjects, type Project } from "@/data/projects";
import { experience as localExperience } from "@/data/experience";
import { skillCategories as localSkills } from "@/data/skills";
import {
  achievements as localAchievements,
  techStack as localTechStack,
} from "@/data/showcase";
import {
  getAchievements,
  getEducations,
  getExperiences,
  getPrinterProject,
  getSiteSettings,
  getSkillCategories,
  getTechStack,
} from "./queries";
import type {
  AchievementData,
  TechItemData,
  EducationData,
  ExperienceData,
  PrinterProject,
  SettingsData,
  SkillCategoryData,
} from "./schema";

export interface HomeContent {
  settings: SettingsData;
  printerProject: PrinterProject | null;
  experiences: ExperienceData[];
  educations: EducationData[];
  skillCategories: SkillCategoryData[];
  techStack: TechItemData[];
  achievements: AchievementData[];
  projects: Project[];
  source: "db" | "local";
}

// After a failed attempt, skip Supabase for a minute so dev reloads stay fast
// (an unreachable host can take ~8 s per request to fail).
let skipDbUntil = 0;

export async function getHomeContent(): Promise<HomeContent> {
  if (process.env.NODE_ENV !== "production" && Date.now() < skipDbUntil) {
    return localHomeContent();
  }
  try {
    const [
      settings,
      experiences,
      educations,
      skillCategories,
      techStack,
      achievements,
      projects,
    ] = await Promise.all([
      getSiteSettings(),
      getExperiences(),
      getEducations(),
      getSkillCategories(),
      getTechStack(),
      getAchievements(),
      getFeaturedProjects(),
    ]);
    const printerProject = await getPrinterProject(settings.printerProjectId);
    return {
      settings,
      printerProject,
      experiences,
      educations,
      skillCategories,
      techStack,
      achievements,
      projects,
      source: "db",
    };
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    skipDbUntil = Date.now() + 60_000;
    console.warn(
      "[home] Supabase unavailable — rendering local fallback content (dev only):",
      err instanceof Error ? err.message : err
    );
    return localHomeContent();
  }
}

/**
 * SEO fields for the root layout metadata. Never throws: any failure (or the
 * dev skip window) returns null so callers use their built-in defaults.
 */
export async function getSeoSettings(): Promise<Pick<SettingsData, "seoTitle" | "seoDescription"> | null> {
  if (process.env.NODE_ENV !== "production" && Date.now() < skipDbUntil) return null;
  try {
    const s = await getSiteSettings();
    return { seoTitle: s.seoTitle, seoDescription: s.seoDescription };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") skipDbUntil = Date.now() + 60_000;
    console.warn("[seo] site settings unavailable, using defaults:", err instanceof Error ? err.message : err);
    return null;
  }
}

function localHomeContent(): HomeContent {
  return {
    settings: {
      displayName: "Irsyad Muhamad Firdaus",
      roleLine: "Data Analyst & Engineer",
      bio:
        "I'm a data analyst with experience in turning complex datasets into actionable business insights. Skilled in Python, SQL, and data visualization, I transform raw data into clear stories that drive smarter decisions.\n\nCurrently focused on e-commerce, marketplace, and customer analytics to help businesses optimize performance and profitability.",
      email: "irsyad.muhf@gmail.com",
      linkedinUrl: "https://linkedin.com/in/irsyadmuhf",
      linkedinLabel: "linkedin.com/in/irsyadmuhf",
      githubUrl: "https://github.com/irsydmuhf",
      githubLabel: "github.com/irsydmuhf",
      instagramUrl: "",
      qrTarget: "linkedin",
      printerProjectId: "",
      location: "Indonesia",
      avatarPath: "/profile/profile.jpg",
      availabilityText: "Available for Work",
      headline: "Welcome to My",
      headlineHighlight: "Data Analytics Portfolio",
      tagline: "Turning complex datasets into confident business decisions.",
      resumeUrl: "/resume.pdf",
      seoTitle: "",
      seoDescription: "",
    },
    printerProject: null,
    experiences: localExperience.map((e) => ({
      period: e.period,
      role: e.role,
      company: e.company,
      division: e.division,
      employmentType: e.type,
      highlights: e.highlights,
    })),
    educations: [
      {
        degree: "S.Kom. — Bachelor of Computer Science",
        institution: "Universitas Muhammadiyah Magelang",
        detail: "GPA 3.80 / 4.00",
        badge: "CADS",
        certifications: ["Certified Associate Data Scientist"],
      },
    ],
    skillCategories: localSkills.map((c) => ({ name: c.name, skills: c.skills })),
    techStack: localTechStack,
    achievements: localAchievements,
    projects: localProjects,
    source: "local",
  };
}
