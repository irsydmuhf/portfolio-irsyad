"use server";

// Server mutations for the CMS (Phases 5-10). Every action:
//   1. re-checks the session + admin_users membership (requireAdmin),
//   2. re-validates input with the shared Zod schema,
//   3. relies on RLS (is_admin()) as the last boundary,
//   4. revalidates the affected public paths.
// Errors returned to the UI are human-readable; raw DB messages are logged.

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/require";
import { getProjectRecord } from "@/lib/projects/admin";
import {
  firstIssue,
  projectInputSchema,
  validateForPublish,
  type ProjectData,
} from "@/lib/projects/schema";

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const GENERIC = "Something went wrong while saving. Please try again.";

function fail(error: string, detail?: unknown): { ok: false; error: string } {
  if (detail) console.error("[cms]", error, detail);
  return { ok: false, error };
}

function revalidatePublic(slug?: string | null) {
  revalidatePath("/");
  if (slug) revalidatePath(`/projects/${slug}`);
}

// ------------------------------------------------------------------- save
type ChildSnapshot = Record<string, unknown>[];

async function replaceChildren(
  supabase: SupabaseClient,
  table: string,
  projectId: string,
  rows: Record<string, unknown>[]
) {
  const del = await supabase.from(table).delete().eq("project_id", projectId);
  if (del.error) throw del.error;
  if (rows.length === 0) return;
  const ins = await supabase.from(table).insert(rows);
  if (ins.error) throw ins.error;
}

async function writeChildren(
  supabase: SupabaseClient,
  id: string,
  d: ProjectData
) {
  await replaceChildren(
    supabase,
    "project_steps",
    id,
    d.steps.map((s, i) => ({
      project_id: id,
      title: s.title,
      description: s.description || null,
      step_order: i + 1,
    }))
  );
  await replaceChildren(
    supabase,
    "project_insights",
    id,
    d.insights.map((x, i) => ({
      project_id: id,
      title: x.title,
      description: x.description,
      insight_order: i + 1,
    }))
  );
  await replaceChildren(
    supabase,
    "project_links",
    id,
    d.links.map((l, i) => ({
      project_id: id,
      link_type: l.type,
      label: l.label,
      url: l.url,
      link_order: i + 1,
    }))
  );
  const related = [...new Set(d.related)].filter((r) => r !== id);
  await replaceChildren(
    supabase,
    "project_related",
    id,
    related.map((r, i) => ({
      project_id: id,
      related_project_id: r,
      display_order: i,
    }))
  );
  const pm = d.privateMeta;
  const up = await supabase.from("project_private_meta").upsert({
    project_id: id,
    original_work_titles: pm.originalWorkTitles,
    internal_notes: pm.internalNotes || null,
    internal_source_references: pm.internalSourceReferences,
    confidentiality_notes: pm.confidentialityNotes || null,
    content_verified: pm.contentVerified,
    confidentiality_confirmed: pm.confidentialityConfirmed,
  });
  if (up.error) throw up.error;
}

async function snapshot(
  supabase: SupabaseClient,
  id: string
): Promise<Record<string, ChildSnapshot>> {
  const tables = [
    "project_steps",
    "project_insights",
    "project_links",
    "project_related",
    "project_private_meta",
  ];
  const out: Record<string, ChildSnapshot> = {};
  for (const t of tables) {
    const { data, error } = await supabase
      .from(t)
      .select("*")
      .eq("project_id", id);
    if (error) throw error;
    out[t] = (data ?? []) as ChildSnapshot;
  }
  return out;
}

async function restore(
  supabase: SupabaseClient,
  id: string,
  snap: Record<string, ChildSnapshot>
) {
  for (const [table, rows] of Object.entries(snap)) {
    await supabase.from(table).delete().eq("project_id", id);
    if (rows.length) await supabase.from(table).insert(rows);
  }
}

export async function saveProject(
  input: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  const { supabase } = await requireAdmin();

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const d = parsed.data;

  // Slug uniqueness (human-readable before the DB constraint fires).
  let dup = supabase.from("projects").select("id").eq("slug", d.slug);
  if (d.id) dup = dup.neq("id", d.id);
  const { data: clash, error: dupErr } = await dup.maybeSingle();
  if (dupErr) return fail(GENERIC, dupErr);
  if (clash) return fail("A project with this slug already exists.");

  const row = {
    slug: d.slug,
    title: d.title,
    category: d.category,
    summary: d.summary,
    description: d.description,
    business_problem: d.businessProblem,
    key_questions: d.keyQuestions,
    role: d.role || null,
    domain: d.domain || null,
    data_context: d.dataContext || null,
    project_period: d.projectPeriod || null,
    focus: d.focus || null,
    project_type: d.projectType || null,
    approach_summary: d.approachSummary || null,
    solution_summary: d.solutionSummary || null,
    impact_summary: d.impactSummary || null,
    tools: d.tools,
    technical_analytics: d.technicalAnalytics,
    technical_processing: d.technicalProcessing,
    technical_automation: d.technicalAutomation,
    technical_visualization: d.technicalVisualization,
    featured: d.featured,
  };

  let id = d.id;
  let previousSlug: string | null = null;
  let wasPublished = false;

  if (id) {
    const { data: cur, error: curErr } = await supabase
      .from("projects")
      .select("slug, status")
      .eq("id", id)
      .maybeSingle();
    if (curErr) return fail(GENERIC, curErr);
    if (!cur) return fail("This project no longer exists.");
    previousSlug = cur.slug;
    wasPublished = cur.status === "published";
    if (wasPublished && cur.slug !== d.slug) {
      return fail(
        "This project is published — changing its slug would break its public URL. Unpublish it first."
      );
    }

    let snap: Record<string, ChildSnapshot>;
    try {
      snap = await snapshot(supabase, id);
    } catch (e) {
      return fail(GENERIC, e);
    }

    const upd = await supabase.from("projects").update(row).eq("id", id);
    if (upd.error) {
      return fail(
        upd.error.code === "23505" ? "A project with this slug already exists." : GENERIC,
        upd.error
      );
    }
    try {
      await writeChildren(supabase, id, d);
    } catch (e) {
      await restore(supabase, id, snap).catch(() => undefined);
      return fail(GENERIC, e);
    }
  } else {
    const { data: last } = await supabase
      .from("projects")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ins = await supabase
      .from("projects")
      .insert({ ...row, status: "draft", display_order: (last?.display_order ?? -1) + 1 })
      .select("id")
      .single();
    if (ins.error || !ins.data) {
      return fail(
        ins.error?.code === "23505" ? "A project with this slug already exists." : GENERIC,
        ins.error
      );
    }
    id = ins.data.id as string;
    try {
      await writeChildren(supabase, id, d);
    } catch (e) {
      await supabase.from("projects").delete().eq("id", id);
      return fail(GENERIC, e);
    }
  }

  if (wasPublished) {
    revalidatePublic(d.slug);
    if (previousSlug && previousSlug !== d.slug) revalidatePublic(previousSlug);
  }
  revalidatePath("/admin", "layout");
  return { ok: true, id, slug: d.slug };
}

// ----------------------------------------------------------- status changes
export async function publishProject(
  id: string
): Promise<ActionResult<{ warnings: string[] }>> {
  const { supabase } = await requireAdmin();
  const rec = await getProjectRecord(supabase, id);
  if (!rec) return fail("This project no longer exists.");

  const report = validateForPublish({
    title: rec.title,
    category: rec.category,
    summary: rec.summary,
    description: rec.description,
    businessProblem: rec.businessProblem,
    steps: rec.steps,
    tools: rec.tools,
    insights: rec.insights,
    links: rec.links,
    impactSummary: rec.impactSummary,
    hasCover: Boolean(rec.coverStoragePath),
    mediaCount: rec.media.length,
    contentVerified: rec.privateMeta.contentVerified,
    confidentialityConfirmed: rec.privateMeta.confidentialityConfirmed,
  });
  if (report.errors.length) return fail(report.errors.join(" "));

  const { error } = await supabase
    .from("projects")
    .update({
      status: "published",
      published_at: rec.publishedAt ?? new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return fail(GENERIC, error);

  revalidatePublic(rec.slug);
  revalidatePath("/admin", "layout");
  return { ok: true, warnings: report.warnings };
}

export async function unpublishProject(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("projects")
    .update({ status: "draft" })
    .eq("id", id)
    .select("slug")
    .maybeSingle();
  if (error) return fail(GENERIC, error);
  if (!data) return fail("This project no longer exists.");
  revalidatePublic(data.slug);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setFeatured(
  id: string,
  featured: boolean
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("projects")
    .update({ featured })
    .eq("id", id)
    .select("slug, status")
    .maybeSingle();
  if (error) return fail(GENERIC, error);
  if (!data) return fail("This project no longer exists.");
  if (data.status === "published") revalidatePublic(data.slug);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: proj, error: getErr } = await supabase
    .from("projects")
    .select("slug, status")
    .eq("id", id)
    .maybeSingle();
  if (getErr) return fail(GENERIC, getErr);
  if (!proj) return fail("This project no longer exists.");

  // Remove only this project's own storage folder (never unrelated assets).
  const folder = `projects/${id}`;
  const { data: files } = await supabase.storage
    .from("portfolio-media")
    .list(folder, { limit: 1000 });
  if (files && files.length) {
    await supabase.storage
      .from("portfolio-media")
      .remove(files.map((f) => `${folder}/${f.name}`));
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return fail(GENERIC, error);

  revalidatePublic(proj.slug);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ----------------------------------------------------------------- reorder
export async function reorderProjects(
  orderedIds: string[]
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (
    !Array.isArray(orderedIds) ||
    orderedIds.length === 0 ||
    orderedIds.some((i) => typeof i !== "string")
  ) {
    return fail("Invalid order.");
  }
  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from("projects").update({ display_order: i }).eq("id", id)
    )
  );
  const bad = results.find((r) => r.error);
  if (bad) return fail(GENERIC, bad.error);
  revalidatePublic();
  revalidatePath("/admin", "layout");
  return { ok: true };
}
