"use server";

// Server mutations for site content (Phase 14): settings, experiences,
// educations, skill categories. Same four-step contract as project-actions:
//   1. re-check the session + admin_users membership (requireAdmin),
//   2. re-validate input with the shared Zod schema,
//   3. rely on RLS (is_admin()) as the last boundary,
//   4. revalidate the affected public paths (save-and-live: no draft stage).

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/require";
import { firstIssue } from "@/lib/projects/schema";
import {
  contentIdSchema,
  educationSchema,
  experienceSchema,
  moveDirectionSchema,
  settingsSchema,
  skillCategorySchema,
} from "@/lib/content/schema";

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const GENERIC = "Something went wrong while saving. Please try again.";

function fail(error: string, detail?: unknown): { ok: false; error: string } {
  if (detail) console.error("[content]", error, detail);
  return { ok: false, error };
}

/**
 * Content feeds the homepage and the root-layout metadata. The layout type
 * invalidates the root layout + every page beneath it, so one call covers the
 * badge/headline, sidebar, tabs, footer and SEO title/description at once.
 */
function revalidateContent() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

// --------------------------------------------------------- shared internals
type ListTable = "experiences" | "educations" | "skill_categories";

async function nextOrder(
  supabase: SupabaseClient,
  table: ListTable
): Promise<number> {
  const { data } = await supabase
    .from(table)
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_order ?? -1) + 1;
}

async function upsertListItem(
  supabase: SupabaseClient,
  table: ListTable,
  id: string | undefined,
  row: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  if (id) {
    const { data, error } = await supabase
      .from(table)
      .update(row)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return fail(GENERIC, error);
    if (!data) return fail("This entry no longer exists.");
    return { ok: true, id };
  }
  const { data, error } = await supabase
    .from(table)
    .insert({ ...row, display_order: await nextOrder(supabase, table) })
    .select("id")
    .single();
  if (error || !data) return fail(GENERIC, error);
  return { ok: true, id: data.id as string };
}

async function removeListItem(
  supabase: SupabaseClient,
  table: ListTable,
  id: string
): Promise<ActionResult> {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return fail(GENERIC, error);
  if (!data) return fail("This entry no longer exists.");
  return { ok: true };
}

/**
 * Move one entry up/down and normalize display_order to 0..n-1 for the whole
 * list (same approach as reorderProjects: small lists, one pass).
 */
async function moveListItem(
  supabase: SupabaseClient,
  table: ListTable,
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const { data: rows, error } = await supabase
    .from(table)
    .select("id")
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) return fail(GENERIC, error);

  const list = (rows ?? []) as { id: string }[];
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return fail("This entry no longer exists.");

  const target = idx + (direction === "up" ? -1 : 1);
  if (target < 0 || target >= list.length) {
    return fail(
      direction === "up"
        ? "This entry is already first."
        : "This entry is already last."
    );
  }
  [list[idx], list[target]] = [list[target], list[idx]];

  const results = await Promise.all(
    list.map((r, i) => supabase.from(table).update({ display_order: i }).eq("id", r.id))
  );
  const bad = results.find((r) => r.error);
  if (bad) return fail(GENERIC, bad.error);
  return { ok: true };
}

// ----------------------------------------------------------------- settings
export async function saveSettings(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const d = parsed.data;

  const { error } = await supabase.from("site_settings").upsert({
    id: "main",
    display_name: d.displayName,
    role_line: d.roleLine,
    bio: d.bio,
    email: d.email,
    linkedin_url: d.linkedinUrl,
    linkedin_label: d.linkedinLabel,
    github_url: d.githubUrl,
    github_label: d.githubLabel,
    location: d.location,
    avatar_path: d.avatarPath,
    availability_text: d.availabilityText,
    headline: d.headline,
    headline_highlight: d.headlineHighlight,
    tagline: d.tagline,
    resume_url: d.resumeUrl,
    seo_title: d.seoTitle,
    seo_description: d.seoDescription,
  });
  if (error) return fail(GENERIC, error);

  revalidateContent();
  return { ok: true };
}

// -------------------------------------------------------------- experiences
export async function saveExperience(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const d = parsed.data;

  const result = await upsertListItem(supabase, "experiences", d.id, {
    period: d.period,
    role: d.role,
    company: d.company,
    division: d.division,
    employment_type: d.employmentType,
    highlights: d.highlights,
  });
  if (result.ok) revalidateContent();
  return result;
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = contentIdSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid entry.");
  const result = await removeListItem(supabase, "experiences", parsed.data);
  if (result.ok) revalidateContent();
  return result;
}

export async function moveExperience(
  id: string,
  direction: unknown
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const idParsed = contentIdSchema.safeParse(id);
  const dirParsed = moveDirectionSchema.safeParse(direction);
  if (!idParsed.success) return fail("Invalid entry.");
  if (!dirParsed.success) return fail("Invalid direction.");
  const result = await moveListItem(supabase, "experiences", idParsed.data, dirParsed.data);
  if (result.ok) revalidateContent();
  return result;
}

// --------------------------------------------------------------- educations
export async function saveEducation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const d = parsed.data;

  const result = await upsertListItem(supabase, "educations", d.id, {
    degree: d.degree,
    institution: d.institution,
    detail: d.detail,
    badge: d.badge,
    certifications: d.certifications,
  });
  if (result.ok) revalidateContent();
  return result;
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = contentIdSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid entry.");
  const result = await removeListItem(supabase, "educations", parsed.data);
  if (result.ok) revalidateContent();
  return result;
}

export async function moveEducation(
  id: string,
  direction: unknown
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const idParsed = contentIdSchema.safeParse(id);
  const dirParsed = moveDirectionSchema.safeParse(direction);
  if (!idParsed.success) return fail("Invalid entry.");
  if (!dirParsed.success) return fail("Invalid direction.");
  const result = await moveListItem(supabase, "educations", idParsed.data, dirParsed.data);
  if (result.ok) revalidateContent();
  return result;
}

// ---------------------------------------------------------- skill categories
export async function saveSkillCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = skillCategorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const d = parsed.data;

  const result = await upsertListItem(supabase, "skill_categories", d.id, {
    name: d.name,
    skills: d.skills,
  });
  if (result.ok) revalidateContent();
  return result;
}

export async function deleteSkillCategory(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = contentIdSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid entry.");
  const result = await removeListItem(supabase, "skill_categories", parsed.data);
  if (result.ok) revalidateContent();
  return result;
}

export async function moveSkillCategory(
  id: string,
  direction: unknown
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const idParsed = contentIdSchema.safeParse(id);
  const dirParsed = moveDirectionSchema.safeParse(direction);
  if (!idParsed.success) return fail("Invalid entry.");
  if (!dirParsed.success) return fail("Invalid direction.");
  const result = await moveListItem(supabase, "skill_categories", idParsed.data, dirParsed.data);
  if (result.ok) revalidateContent();
  return result;
}
