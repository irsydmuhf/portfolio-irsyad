// Admin-side data access (Phases 5-10). Every function takes the session-bound
// Supabase client returned by requireAdmin(); RLS (is_admin()) is the final
// boundary, so a non-admin session gets empty results / write errors here.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectData } from "./schema";

export interface ProjectListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "draft" | "published";
  featured: boolean;
  display_order: number;
  updated_at: string;
  published_at: string | null;
}

export interface MediaItem {
  id: string;
  source_type: "upload" | "external";
  storage_path: string | null;
  external_url: string | null;
  alt_text: string;
  caption: string | null;
  layout: "full" | "half" | "gallery";
  media_order: number;
}

export interface ProjectRecord extends ProjectData {
  id: string;
  status: "draft" | "published";
  updatedAt: string;
  publishedAt: string | null;
  coverStoragePath: string | null;
  coverAlt: string;
  coverCaption: string;
  media: MediaItem[];
}

export async function listProjects(
  supabase: SupabaseClient
): Promise<ProjectListItem[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, slug, title, category, status, featured, display_order, updated_at, published_at"
    )
    .order("display_order", { ascending: true });
  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return (data ?? []) as ProjectListItem[];
}

/** Full editable record (public fields + children + private meta + media). */
export async function getProjectRecord(
  supabase: SupabaseClient,
  id: string
): Promise<ProjectRecord | null> {
  const { data: p, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load project: ${error.message}`);
  if (!p) return null;

  const [steps, insights, links, related, meta, media] = await Promise.all([
    supabase.from("project_steps").select("*").eq("project_id", id).order("step_order"),
    supabase.from("project_insights").select("*").eq("project_id", id).order("insight_order"),
    supabase.from("project_links").select("*").eq("project_id", id).order("link_order"),
    supabase.from("project_related").select("*").eq("project_id", id).order("display_order"),
    supabase.from("project_private_meta").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("project_media").select("*").eq("project_id", id).order("media_order"),
  ]);
  for (const r of [steps, insights, links, related, meta, media]) {
    if (r.error) throw new Error(`Could not load project: ${r.error.message}`);
  }

  const m = meta.data;
  return {
    id: p.id,
    status: p.status,
    updatedAt: p.updated_at,
    publishedAt: p.published_at,
    coverStoragePath: p.cover_storage_path,
    coverAlt: p.cover_alt ?? "",
    coverCaption: p.cover_caption ?? "",
    title: p.title,
    slug: p.slug,
    category: p.category ?? "",
    summary: p.summary ?? "",
    description: p.description ?? "",
    businessProblem: p.business_problem ?? "",
    keyQuestions: p.key_questions ?? [],
    role: p.role ?? "",
    domain: p.domain ?? "",
    dataContext: p.data_context ?? "",
    projectPeriod: p.project_period ?? "",
    focus: p.focus ?? "",
    projectType: p.project_type ?? "",
    approachSummary: p.approach_summary ?? "",
    solutionSummary: p.solution_summary ?? "",
    impactSummary: p.impact_summary ?? "",
    tools: p.tools ?? [],
    technicalAnalytics: p.technical_analytics ?? [],
    technicalProcessing: p.technical_processing ?? [],
    technicalAutomation: p.technical_automation ?? [],
    technicalVisualization: p.technical_visualization ?? [],
    featured: p.featured,
    steps: (steps.data ?? []).map((s) => ({
      title: s.title,
      description: s.description ?? "",
    })),
    insights: (insights.data ?? []).map((i) => ({
      title: i.title,
      description: i.description,
    })),
    links: (links.data ?? []).map((l) => ({
      type: l.link_type,
      label: l.label,
      url: l.url,
    })),
    related: (related.data ?? []).map((r) => r.related_project_id),
    privateMeta: {
      originalWorkTitles: m?.original_work_titles ?? [],
      internalNotes: m?.internal_notes ?? "",
      internalSourceReferences: m?.internal_source_references ?? [],
      confidentialityNotes: m?.confidentiality_notes ?? "",
      contentVerified: m?.content_verified ?? false,
      confidentialityConfirmed: m?.confidentiality_confirmed ?? false,
    },
    media: (media.data ?? []) as MediaItem[],
  };
}
