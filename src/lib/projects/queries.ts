// Public read access for the portfolio (Phase 3, plans/portfolio-cms-v2.md).
// Server-only: anon credentials + published-only queries, RLS as the boundary.
// Rows are adapted back to the legacy v1 `Project` shape so existing UI
// components stay byte-identical until the Phase 7 template refactor.

import "server-only";

import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "@/data/projects";
import { storageUrl, type CaseStudyProject } from "./case-study";

// ---------------------------------------------------------------- row types
interface DbStep {
  title: string;
  description: string | null;
  step_order: number;
}

interface DbInsight {
  title: string;
  description: string;
  insight_order: number;
}

interface DbLink {
  link_type: string;
  url: string;
  link_order: number;
}

interface DbProjectRow {
  slug: string;
  title: string;
  category: string;
  summary: string;
  role: string | null;
  domain: string | null;
  data_context: string | null;
  focus: string | null;
  project_type: string | null;
  business_problem: string;
  key_questions: string[] | null;
  solution_summary: string | null;
  impact_summary: string | null;
  tools: string[] | null;
  technical_analytics: string[] | null;
  technical_processing: string[] | null;
  technical_automation: string[] | null;
  technical_visualization: string[] | null;
  cover_storage_path: string | null;
  project_steps: DbStep[] | null;
  project_insights: DbInsight[] | null;
  project_links: DbLink[] | null;
}

const SELECT = [
  "slug",
  "title",
  "category",
  "summary",
  "role",
  "domain",
  "data_context",
  "focus",
  "project_type",
  "business_problem",
  "key_questions",
  "solution_summary",
  "impact_summary",
  "tools",
  "technical_analytics",
  "technical_processing",
  "technical_automation",
  "technical_visualization",
  "cover_storage_path",
  "project_steps(title, description, step_order)",
  "project_insights(title, description, insight_order)",
  "project_links(link_type, url, link_order)",
].join(", ");

// ------------------------------------------------------------------ client
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

// ----------------------------------------------------------------- adapter
function toV1Project(row: DbProjectRow): Project {
  const steps = [...(row.project_steps ?? [])].sort((a, b) => a.step_order - b.step_order);
  const insights = [...(row.project_insights ?? [])]
    .sort((a, b) => a.insight_order - b.insight_order)
    .map((i) => ({ title: i.title, description: i.description }));
  const links = [...(row.project_links ?? [])].sort((a, b) => a.link_order - b.link_order);
  const github = links.find((l) => l.link_type === "github")?.url ?? null;

  // solution_summary is stored as markdown bullet lines; v1 renders chips.
  const solution = (row.solution_summary ?? "")
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);

  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    tools: row.tools ?? [],
    cover: row.cover_storage_path ?? "",
    github,
    role: row.role ?? "",
    domain: row.domain ?? "",
    focus: row.focus ?? "",
    projectType: row.project_type ?? "",
    data: row.data_context ?? "",
    businessProblem: row.business_problem,
    businessQuestions: row.key_questions ?? [],
    approach: steps.map((s) => s.title),
    solution,
    insights,
    impact: row.impact_summary ?? "",
    technicalDetails: {
      dataProcessing: row.technical_processing ?? [],
      automation: row.technical_automation ?? [],
      analytics: row.technical_analytics ?? [],
      visualization: row.technical_visualization ?? [],
    },
  };
}

// ---------------------------------------------------------------- queries
async function queryPublished(featuredOnly: boolean): Promise<Project[]> {
  let q = supabase()
    .from("projects")
    .select(SELECT)
    .eq("status", "published");
  if (featuredOnly) q = q.eq("featured", true);
  const { data, error } = await q.order("display_order", { ascending: true });

  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  return ((data ?? []) as unknown as DbProjectRow[]).map(toV1Project);
}

/** Every published project (used for static params). Request-deduped. */
export const getPublishedProjects = cache(() => queryPublished(false));

/** Homepage "Selected Work": published AND featured, by display_order. */
export const getFeaturedProjects = cache(() => queryPublished(true));

/** One published project by slug; drafts/unknown slugs resolve to null (404). */
export const getPublishedProjectBySlug = cache(
  async (slug: string): Promise<Project | null> => {
    const { data, error } = await supabase()
      .from("projects")
      .select(SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw new Error(`Failed to load project ${slug}: ${error.message}`);
    return data ? toV1Project(data as unknown as DbProjectRow) : null;
  }
);

// ------------------------------------------------------- case-study (v2)
export const CASE_SELECT = [
  "id",
  "slug",
  "title",
  "category",
  "summary",
  "description",
  "business_problem",
  "key_questions",
  "role",
  "domain",
  "data_context",
  "project_period",
  "focus",
  "project_type",
  "tools",
  "approach_summary",
  "solution_summary",
  "impact_summary",
  "technical_analytics",
  "technical_processing",
  "technical_automation",
  "technical_visualization",
  "cover_storage_path",
  "cover_alt",
  "cover_caption",
  "project_steps(title, description, step_order)",
  "project_insights(title, description, insight_order)",
  "project_links(link_type, label, url, link_order)",
  "project_media(source_type, storage_path, external_url, alt_text, caption, layout, media_order)",
].join(", ");

/** Related projects for a case study: explicit picks (published only) else two other published. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadRelated(db: SupabaseClient, row: any) {
  const { data: rel } = await db
    .from("project_related")
    .select("related_project_id, display_order")
    .eq("project_id", row.id)
    .order("display_order");
  const ids = (rel ?? []).map((r) => r.related_project_id as string);

  if (ids.length) {
    const { data: rp } = await db
      .from("projects")
      .select("id, slug, title, category")
      .in("id", ids)
      .eq("status", "published");
    const byId = new Map((rp ?? []).map((p) => [p.id as string, p]));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ slug: p.slug, title: p.title, category: p.category }));
  }
  const { data: others } = await db
    .from("projects")
    .select("slug, title, category")
    .eq("status", "published")
    .neq("id", row.id)
    .order("display_order")
    .limit(2);
  return (others ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
  }));
}

/** Case-study view-model for ANY status; caller supplies the (RLS-bound) client. */
export async function loadCaseStudy(
  db: SupabaseClient,
  filter: { slug?: string; id?: string; publishedOnly: boolean }
): Promise<CaseStudyProject | null> {
  let q = db.from("projects").select(CASE_SELECT);
  if (filter.slug) q = q.eq("slug", filter.slug);
  if (filter.id) q = q.eq("id", filter.id);
  if (filter.publishedOnly) q = q.eq("status", "published");
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(`Failed to load project: ${error.message}`);
  if (!data) return null;
  return rowToCaseStudy(data, await loadRelated(db, data));
}

/** One published project (null => 404). Anonymous client, request-deduped. */
export const getPublishedCaseStudy = cache(
  async (slug: string): Promise<CaseStudyProject | null> =>
    loadCaseStudy(supabase(), { slug, publishedOnly: true })
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToCaseStudy(row: any, related: CaseStudyProject["related"]): CaseStudyProject {
  const byOrder = <T,>(arr: T[] | null, key: string): T[] =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [...(arr ?? [])].sort((a: any, b: any) => a[key] - b[key]);

  return {
    slug: row.slug,
    title: row.title,
    category: row.category ?? "",
    summary: row.summary ?? "",
    description: row.description ?? "",
    businessProblem: row.business_problem ?? "",
    keyQuestions: row.key_questions ?? [],
    role: row.role ?? "",
    domain: row.domain ?? "",
    dataContext: row.data_context ?? "",
    projectPeriod: row.project_period ?? "",
    focus: row.focus ?? "",
    projectType: row.project_type ?? "",
    tools: row.tools ?? [],
    approachSummary: row.approach_summary ?? "",
    solutionSummary: row.solution_summary ?? "",
    impactSummary: row.impact_summary ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    steps: byOrder<any>(row.project_steps, "step_order").map((s) => ({
      title: s.title,
      description: s.description ?? "",
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    insights: byOrder<any>(row.project_insights, "insight_order").map((i) => ({
      title: i.title,
      description: i.description,
    })),
    technical: {
      processing: row.technical_processing ?? [],
      automation: row.technical_automation ?? [],
      analytics: row.technical_analytics ?? [],
      visualization: row.technical_visualization ?? [],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    links: byOrder<any>(row.project_links, "link_order").map((l) => ({
      type: l.link_type,
      label: l.label,
      url: l.url,
    })),
    coverUrl: row.cover_storage_path ? storageUrl(row.cover_storage_path) : null,
    coverAlt: row.cover_alt ?? "",
    coverCaption: row.cover_caption ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    media: byOrder<any>(row.project_media, "media_order").map((m) => ({
      url: m.source_type === "upload" ? storageUrl(m.storage_path) : m.external_url,
      alt: m.alt_text,
      caption: m.caption ?? "",
      layout: m.layout,
    })),
    related,
  };
}
