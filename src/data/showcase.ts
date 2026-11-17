// Local seed for the homepage "Tech Stack" and "Certifications & Achievements"
// blocks. The live site reads these from Supabase (migration 008, editable in
// /admin/tech-stack and /admin/achievements); this copy is only the dev
// fallback used when Supabase is unreachable. Keep it in sync with the 008 seed.

import type { AchievementData, TechItemData } from "@/lib/content/schema";

const tech = (
  name: string,
  iconSlug: string,
  letters = "",
  color = ""
): TechItemData => ({ name, iconSlug, letters, color, imagePath: "" });

export const techStack: TechItemData[] = [
  tech("Python", "python"),
  tech("SQL / PostgreSQL", "postgresql"),
  tech("Pandas", "pandas"),
  tech("Power BI", "", "BI", "#F2C811"),
  tech("Looker Studio", "", "LS", "#4285F4"),
  tech("Google Sheets", "googlesheets"),
  tech("Google Apps Script", "googleappsscript"),
  tech("AWS Cloud", "", "aws", "#232F3E"),
  tech("Supabase", "supabase"),
  tech("Git", "git"),
  tech("GitHub", "github"),
];

export const achievements: AchievementData[] = [
  {
    dateLabel: "Dec 2024",
    title: "Cloud Practitioner Essentials",
    subtitle: "AWS Cloud",
    issuer: "Dicoding Indonesia",
  },
  {
    dateLabel: "Jan 2026",
    title: "Big Data Analytics",
    subtitle: "Project-Based Internship",
    issuer: "Rakamin Academy x Kimia Farma",
  },
  {
    dateLabel: "Sep 2026",
    title: "Associate Data Scientist",
    subtitle: "Certified (CADS)",
    issuer: "BNSP",
  },
];
