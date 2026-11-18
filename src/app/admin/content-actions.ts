"use server";

// Server mutations for site content (Phase 14): settings, experiences,
// educations, skill categories, tech stack and achievements (migration 008). Same four-step contract as project-actions:
//   1. re-check the session + admin_users membership (requireAdmin),
//   2. re-validate input with the shared Zod schema,
//   3. rely on RLS (is_admin()) as the last boundary,
//   4. revalidate the affected public paths (save-and-live: no draft stage).

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/require";
import { checkUpload } from "@/lib/projects/media";
import { checkPdfUpload } from "@/lib/content/pdf";
import { firstIssue } from "@/lib/projects/schema";
import {
  achievementSchema,
  contentIdSchema,
  techItemSchema,
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
type ListTable =
  | "experiences"
  | "educations"
  | "skill_categories"
  | "tech_stack"
  | "achievements";

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
    instagram_url: d.instagramUrl,
    qr_target: d.qrTarget,
    printer_project_id: d.printerProjectId || null,
    screen_line1: d.screenLine1,
    screen_line2: d.screenLine2,
    screen_query: d.screenQuery,
    tag_text: d.tagText,
    tag_url: d.tagUrl,
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

// ------------------------------------------------------------ image uploads
const BUCKET = "portfolio-media";

/**
 * Validate (size + magic bytes, no SVG) and store one image under the bucket's
 * `site/` folder (storage policies are bucket-wide admin-write). Returns the
 * public URL.
 */
async function uploadSiteImage(
  supabase: SupabaseClient,
  formData: FormData,
  prefix: "avatar" | "tech"
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose an image to upload.");
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  const check = checkUpload(buf.byteLength, buf.slice(0, 16));
  if (!check.ok) return fail(check.error);

  const path = `site/${prefix}-${randomUUID()}.${check.ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: check.mime, upsert: false });
  if (upErr) {
    console.error("[content] image upload failed", upErr);
    return fail("Upload failed. Check your connection and try again.");
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: publicUrl };
}

/** Logo image for a tech-stack tile; the URL is saved with the entry. */
export async function uploadTechLogo(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const { supabase } = await requireAdmin();
  return uploadSiteImage(supabase, formData, "tech");
}

/**
 * Single-image avatar upload to the `site/` folder of the media bucket
 * (storage policies are bucket-wide admin-write, so no migration needed).
 * Stores the public URL in site_settings.avatar_path; the previous uploaded
 * avatar (if it lived in this bucket) is removed.
 */
export async function uploadAvatar(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const { supabase } = await requireAdmin();

  const up = await uploadSiteImage(supabase, formData, "avatar");
  if (!up.ok) return up;
  const publicUrl = up.url;

  // Drop the previous uploaded avatar (only objects in this bucket's site/ folder).
  const { data: cur } = await supabase
    .from("site_settings")
    .select("avatar_path")
    .eq("id", "main")
    .maybeSingle();
  const marker = `/storage/v1/object/public/${BUCKET}/site/`;
  const oldPath = cur?.avatar_path ?? "";
  const oldIdx = oldPath.indexOf(marker);
  if (oldIdx >= 0 && oldPath !== publicUrl) {
    const stale = oldPath.slice(oldIdx + marker.length);
    if (stale && !stale.includes("/")) {
      await supabase.storage.from(BUCKET).remove([`site/${stale}`]);
    }
  }

  const { error } = await supabase
    .from("site_settings")
    .update({ avatar_path: publicUrl })
    .eq("id", "main");
  if (error) return fail(GENERIC, error);

  revalidateContent();
  return { ok: true, url: publicUrl };
}

/**
 * Resume PDF upload: stored as site/resume-<uuid>.pdf and saved to
 * site_settings.resume_url (live immediately). The previously uploaded resume
 * is removed; a resume set by URL/path (e.g. /resume.pdf) is never touched.
 */
export async function uploadResume(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const { supabase } = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose a PDF to upload.");
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  const check = checkPdfUpload(buf.byteLength, buf.slice(0, 8));
  if (!check.ok) return fail(check.error);

  const path = `site/resume-${randomUUID()}.pdf`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: "application/pdf", upsert: false });
  if (upErr) {
    console.error("[content] resume upload failed", upErr);
    return fail("Upload failed. Check your connection and try again.");
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: cur } = await supabase
    .from("site_settings")
    .select("resume_url")
    .eq("id", "main")
    .maybeSingle();

  const { error } = await supabase
    .from("site_settings")
    .update({ resume_url: publicUrl })
    .eq("id", "main");
  if (error) {
    // Don't leave an orphan behind if the settings row couldn't be updated.
    await supabase.storage.from(BUCKET).remove([path]);
    return fail(GENERIC, error);
  }

  // Remove the previous uploaded resume (only resume-*.pdf directly in site/).
  const marker = `/storage/v1/object/public/${BUCKET}/site/`;
  const old = cur?.resume_url ?? "";
  const idx = old.indexOf(marker);
  if (idx >= 0 && old !== publicUrl) {
    const stale = old.slice(idx + marker.length);
    if (/^resume-[0-9a-f-]+\.pdf$/.test(stale)) {
      await supabase.storage.from(BUCKET).remove([`site/${stale}`]);
    }
  }

  revalidateContent();
  return { ok: true, url: publicUrl };
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

// --------------------------------------------------------------- tech stack
export async function saveTechItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = techItemSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const d = parsed.data;

  const result = await upsertListItem(supabase, "tech_stack", d.id, {
    name: d.name,
    icon_slug: d.iconSlug,
    letters: d.letters,
    color: d.color,
    image_path: d.imagePath,
  });
  if (result.ok) revalidateContent();
  return result;
}

export async function deleteTechItem(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = contentIdSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid entry.");
  const result = await removeListItem(supabase, "tech_stack", parsed.data);
  if (result.ok) revalidateContent();
  return result;
}

export async function moveTechItem(id: string, direction: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const idParsed = contentIdSchema.safeParse(id);
  const dirParsed = moveDirectionSchema.safeParse(direction);
  if (!idParsed.success) return fail("Invalid entry.");
  if (!dirParsed.success) return fail("Invalid direction.");
  const result = await moveListItem(supabase, "tech_stack", idParsed.data, dirParsed.data);
  if (result.ok) revalidateContent();
  return result;
}

// ------------------------------------------------------------- achievements
export async function saveAchievement(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = achievementSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const d = parsed.data;

  const result = await upsertListItem(supabase, "achievements", d.id, {
    date_label: d.dateLabel,
    title: d.title,
    subtitle: d.subtitle,
    issuer: d.issuer,
  });
  if (result.ok) revalidateContent();
  return result;
}

export async function deleteAchievement(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = contentIdSchema.safeParse(id);
  if (!parsed.success) return fail("Invalid entry.");
  const result = await removeListItem(supabase, "achievements", parsed.data);
  if (result.ok) revalidateContent();
  return result;
}

export async function moveAchievement(id: string, direction: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const idParsed = contentIdSchema.safeParse(id);
  const dirParsed = moveDirectionSchema.safeParse(direction);
  if (!idParsed.success) return fail("Invalid entry.");
  if (!dirParsed.success) return fail("Invalid direction.");
  const result = await moveListItem(supabase, "achievements", idParsed.data, dirParsed.data);
  if (result.ok) revalidateContent();
  return result;
}
