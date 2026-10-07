// Public read access for the portfolio (Phase 3, plans/portfolio-cms-v2.md).
// Server-only: anon credentials + published-only queries, RLS as the boundary.
// Rows are adapted back to the legacy v1 `Project` shape so existing UI
// components stay byte-identical until the Phase 7 template refactor.

import "server-only";

import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "@/data/projects";

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
/** All published projects in display order (v1 JSON order). Request-deduped. */
export const getPublishedProjects = cache(async (): Promise<Project[]> => {
  const { data, error } = await supabase()
    .from("projects")
    .select(SELECT)
    .eq("status", "published")
    .order("display_order", { ascending: true });

  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  return ((data ?? []) as unknown as DbProjectRow[]).map(toV1Project);
});

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
