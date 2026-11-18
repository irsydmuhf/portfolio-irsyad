// Public read access for the content tables (plans/portofolio-cms-v2.md
// Phase 14). Server-only: anon credentials + RLS select-allowed reads.
// Request-deduped via React cache(); invalidated by revalidatePath in the
// content server actions (save-and-live).

import "server-only";

import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  toAchievement,
  toTechItem,
  type AchievementRow,
  type TechItemRow,
  toEducation,
  toExperience,
  toSettings,
  toSkillCategory,
  type EducationRow,
  type ExperienceRow,
  type SettingsRow,
  type SkillCategoryRow,
} from "./rows";
import { storageUrl } from "@/lib/projects/case-study";
import type {
  AchievementData,
  TechItemData,
  EducationData,
  ExperienceData,
  PrinterProject,
  SettingsData,
  SkillCategoryData,
} from "./schema";

let client: SupabaseClient | undefined;

function supabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example"
      );
    }
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** The singleton profile/header/SEO row (seeded by migration 007). */
export const getSiteSettings = cache(async (): Promise<SettingsData> => {
  const { data, error } = await supabase()
    .from("site_settings")
    .select("*")
    .eq("id", "main")
    .maybeSingle();
  if (error) throw new Error(`Failed to load site settings: ${error.message}`);
  if (!data) {
    throw new Error(
      "site_settings row missing — run `npm run db:apply` to seed it."
    );
  }
  return toSettings(data as SettingsRow);
});

/**
 * The project shown on the hero printer paper. Decorative, so it never throws:
 * unset, unpublished, deleted, cover-less or any error all resolve to null and
 * the hero shows the default paper.
 */
export const getPrinterProject = cache(
  async (id: string): Promise<PrinterProject | null> => {
    if (!id) return null;
    const { data, error } = await supabase()
      .from("projects")
      .select("slug, title, category, cover_storage_path")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (error) {
      console.warn("[home] printer project unavailable:", error.message);
      return null;
    }
    const cover = (data?.cover_storage_path as string | null) ?? "";
    if (!data || !cover) return null;
    return {
      slug: data.slug as string,
      title: data.title as string,
      category: (data.category as string | null) ?? "",
      // Uploaded covers are bucket paths; legacy ones may already be URLs/paths.
      coverUrl: /^(https?:)?\/\//.test(cover) || cover.startsWith("/") ? cover : storageUrl(cover),
    };
  }
);

export const getExperiences = cache(async (): Promise<ExperienceData[]> => {
  const { data, error } = await supabase()
    .from("experiences")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`Failed to load experiences: ${error.message}`);
  return ((data ?? []) as ExperienceRow[]).map(toExperience);
});

export const getEducations = cache(async (): Promise<EducationData[]> => {
  const { data, error } = await supabase()
    .from("educations")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`Failed to load educations: ${error.message}`);
  return ((data ?? []) as EducationRow[]).map(toEducation);
});

export const getSkillCategories = cache(
  async (): Promise<SkillCategoryData[]> => {
    const { data, error } = await supabase()
      .from("skill_categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw new Error(`Failed to load skills: ${error.message}`);
    return ((data ?? []) as SkillCategoryRow[]).map(toSkillCategory);
  }
);

export const getTechStack = cache(async (): Promise<TechItemData[]> => {
  const { data, error } = await supabase()
    .from("tech_stack")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`Failed to load tech stack: ${error.message}`);
  return ((data ?? []) as TechItemRow[]).map(toTechItem);
});

export const getAchievements = cache(async (): Promise<AchievementData[]> => {
  const { data, error } = await supabase()
    .from("achievements")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`Failed to load achievements: ${error.message}`);
  return ((data ?? []) as AchievementRow[]).map(toAchievement);
});
