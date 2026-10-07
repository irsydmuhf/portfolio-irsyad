// scripts/migrate-projects-to-supabase.mjs
// Phase 2 (plans/portfolio-cms-v2.md): v1 JSON -> Supabase Postgres.
// PRD §54: read, transform, insert, log errors per project, avoid duplicates
// on re-run, never delete projects. Mapping follows the plan's migration table.
//
// Usage:
//   node scripts/migrate-projects-to-supabase.mjs             # migrate + parity
//   node scripts/migrate-projects-to-supabase.mjs --dry-run   # transform only, no writes
//   node scripts/migrate-projects-to-supabase.mjs --parity    # read-only verification
//
// Credentials (first found wins), read from .env.local:
//   SUPABASE_SERVICE_ROLE_KEY                          (preferred: ops script only)
//   SUPABASE_OWNER_EMAIL + SUPABASE_OWNER_PASSWORD     (owner session, exercises admin RLS)
//
// NOTE — re-running overwrites DB content for the six v1 slugs with the JSON
// content (interim workflow: edit JSON -> re-run). Cover images and published_at
// are preserved on update. Drafts for NEW slugs are untouched.
//
// Pages created by the owner through the new admin (Phases 5+) live only in the
// DB and are not affected — only slugs present in src/data/projects.json.

import { readFileSync, existsSync } from "node:fs";
import dns from "node:dns";
import { createClient } from "@supabase/supabase-js";

dns.setDefaultResultOrder("ipv4first");

function loadLocalEnv() {
  const p = new URL("../.env.local", import.meta.url);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
loadLocalEnv();

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = process.env.SUPABASE_OWNER_EMAIL;
const OWNER_PASSWORD = process.env.SUPABASE_OWNER_PASSWORD;

const DRY = process.argv.includes("--dry-run");
const PARITY_ONLY = process.argv.includes("--parity");

const log = (...a) => console.log(...a);
const die = (msg) => {
  console.error(msg);
  process.exit(1);
};

if (!URL_BASE || !ANON) die("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.example).");

const jsonPath = new URL("../src/data/projects.json", import.meta.url);
const v1 = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!Array.isArray(v1) || v1.length === 0) die("src/data/projects.json has no projects.");

const PUBLISHED_AT = new Date().toISOString();
const REVIEWED_SLUG = "customer-retention"; // only project with owner-reviewed content

// ------------------------------------------------------------ transformation
const bullets = (arr) => (Array.isArray(arr) && arr.length ? arr.map((s) => `- ${s}`).join("\n") : null);

function transform(src, index) {
  const steps = (src.approach || []).map((t, i) => ({
    title: typeof t === "string" ? t : t.title,
    description: typeof t === "string" ? null : t.description ?? null,
    step_order: i + 1,
  }));
  const insights = (src.insights || []).map((ins, i) => ({
    title: ins.title,
    description: ins.description,
    insight_order: i + 1,
  }));
  const links = src.github
    ? [{ link_type: "github", label: "View Source Code", url: src.github, link_order: 1 }]
    : [];
  const related = v1
    .filter((p) => p.slug !== src.slug)
    .slice(0, 2) // v1 RelatedProjects: first two non-self projects, JSON order
    .map((p, k) => ({ slug: p.slug, display_order: k }));

  return {
    row: {
      slug: src.slug,
      title: src.title,
      category: src.category,
      summary: src.summary,
      description: src.summary, // v1 has no long description; honest duplicate (plan)
      business_problem: src.businessProblem || "",
      key_questions: src.businessQuestions || [],
      role: src.role,
      domain: src.domain,
      data_context: src.data,
      project_period: null, // v1 has no period -> section omitted
      focus: src.focus,
      project_type: src.projectType,
      approach_summary: null, // approach lives in steps
      solution_summary: bullets(src.solution),
      impact_summary: src.impact || null,
      tools: src.tools || [],
      technical_analytics: src.technicalDetails?.analytics || [],
      technical_processing: src.technicalDetails?.dataProcessing || [],
      technical_automation: src.technicalDetails?.automation || [],
      technical_visualization: src.technicalDetails?.visualization || [],
      status: "published",
      featured: true,
      display_order: index,
      cover_storage_path: null,
      cover_alt: null,
      cover_caption: null,
      published_at: PUBLISHED_AT,
    },
    steps,
    insights,
    links,
    related,
    private_meta: {
      original_work_titles: [],
      internal_notes: null,
      internal_source_references: [],
      confidentiality_notes: null,
      content_verified: src.slug === REVIEWED_SLUG,
      confidentiality_confirmed: src.slug === REVIEWED_SLUG,
    },
  };
}

const transformed = v1.map((src, i) => transform(src, i));

// ------------------------------------------------------------------ dry run
if (DRY) {
  log("dry-run — transform summary:");
  for (const t of transformed) {
    log(
      `  ${String(t.row.display_order).padStart(2)}  ${t.row.slug}` +
        `  steps=${t.steps.length} insights=${t.insights.length}` +
        ` links=${t.links.length} related=${t.related.length}` +
        ` verified=${t.private_meta.content_verified}`
    );
  }
  log(`OK — ${transformed.length} project(s) transformed, no writes performed.`);
  process.exit(0);
}

// ---------------------------------------------------------------- client(s)
const authClient = createClient(URL_BASE, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function writeClient() {
  if (SERVICE) {
    log("auth mode: service-role");
    return createClient(URL_BASE, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  if (OWNER_EMAIL && OWNER_PASSWORD) {
    log("auth mode: owner session");
    const { error } = await authClient.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    });
    if (error) die(`Owner login failed: ${error.message}`);
    return authClient;
  }
  die(
    "No write credentials. Set in .env.local:\n" +
      "  SUPABASE_SERVICE_ROLE_KEY   (Settings -> API -> service_role), or\n" +
      "  SUPABASE_OWNER_EMAIL + SUPABASE_OWNER_PASSWORD"
  );
}

// ------------------------------------------------------------------ migrate
const errors = [];

async function migrate(client) {
  // Pass 1: upsert projects + scalar children.
  for (const t of transformed) {
    try {
      const { data: existing, error: e1 } = await client
        .from("projects")
        .select("id")
        .eq("slug", t.row.slug)
        .maybeSingle();
      if (e1) throw e1;

      let id;
      if (existing) {
        // Preserve DB-managed fields across re-runs.
        const { published_at, cover_storage_path, cover_alt, cover_caption, ...upd } = t.row;
        const { error: e2 } = await client.from("projects").update(upd).eq("id", existing.id);
        if (e2) throw e2;
        id = existing.id;
        for (const child of [
          "project_steps",
          "project_insights",
          "project_links",
          "project_related",
          "project_private_meta",
        ]) {
          const { error } = await client.from(child).delete().eq("project_id", id);
          if (error) throw error;
        }
        log(`~ ${t.row.slug} (updated id=${id})`);
      } else {
        const { data: created, error: e3 } = await client
          .from("projects")
          .insert(t.row)
          .select("id")
          .single();
        if (e3) throw e3;
        id = created.id;
        log(`+ ${t.row.slug} (inserted id=${id})`);
      }

      if (t.steps.length) {
        const { error } = await client.from("project_steps").insert(t.steps.map((s) => ({ ...s, project_id: id })));
        if (error) throw error;
      }
      if (t.insights.length) {
        const { error } = await client
          .from("project_insights")
          .insert(t.insights.map((s) => ({ ...s, project_id: id })));
        if (error) throw error;
      }
      if (t.links.length) {
        const { error } = await client.from("project_links").insert(t.links.map((s) => ({ ...s, project_id: id })));
        if (error) throw error;
      }
      const { error: e4 } = await client.from("project_private_meta").insert({ ...t.private_meta, project_id: id });
      if (e4) throw e4;
    } catch (err) {
      errors.push(`${t.row.slug}: ${err.message}`);
      log(`! ${t.row.slug}: ${err.message}`);
    }
  }

  // Pass 2: related links (need every project id first).
  const { data: idRows, error: e5 } = await client.from("projects").select("id, slug");
  if (e5) throw e5;
  const bySlug = new Map(idRows.map((r) => [r.slug, r.id]));
  for (const t of transformed) {
    const id = bySlug.get(t.row.slug);
    const rows = t.related
      .filter((r) => bySlug.has(r.slug))
      .map((r) => ({ project_id: id, related_project_id: bySlug.get(r.slug), display_order: r.display_order }));
    if (!rows.length) continue;
    const { error } = await client.from("project_related").insert(rows);
    if (error) {
      errors.push(`${t.row.slug} related: ${error.message}`);
      log(`! ${t.row.slug} related: ${error.message}`);
    }
  }
}

// ------------------------------------------------------------------ parity
let mismatches = 0;
function diff(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    mismatches += 1;
    log(`  MISMATCH ${label}\n    db:      ${a}\n    expected:${e}`);
  }
}

async function parity() {
  const anon = createClient(URL_BASE, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const priv = SERVICE
    ? createClient(URL_BASE, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
    : authClient;

  const { data: allPublic, error: e0 } = await anon.from("projects").select("id, slug");
  if (e0) throw e0;
  log(`\nparity — anon sees ${allPublic.length} published project(s)`);

  for (const [i, t] of transformed.entries()) {
    const before = mismatches;
    const { data, error } = await anon
      .from("projects")
      .select("*, project_steps(*), project_insights(*), project_links(*)")
      .eq("slug", t.row.slug)
      .maybeSingle();
    if (error || !data) {
      mismatches += 1;
      log(`  MISMATCH ${t.row.slug}: not visible to anon${error ? ` (${error.message})` : ""}`);
      continue;
    }

    const r = t.row;
    diff(`${t.row.slug}.title`, data.title, r.title);
    diff(`${t.row.slug}.category`, data.category, r.category);
    diff(`${t.row.slug}.summary`, data.summary, r.summary);
    diff(`${t.row.slug}.description`, data.description, r.summary);
    diff(`${t.row.slug}.business_problem`, data.business_problem, r.business_problem);
    diff(`${t.row.slug}.key_questions`, data.key_questions, r.key_questions);
    diff(`${t.row.slug}.role`, data.role, r.role);
    diff(`${t.row.slug}.domain`, data.domain, r.domain);
    diff(`${t.row.slug}.data_context`, data.data_context, r.data_context);
    diff(`${t.row.slug}.focus`, data.focus, r.focus);
    diff(`${t.row.slug}.project_type`, data.project_type, r.project_type);
    diff(`${t.row.slug}.solution_summary`, data.solution_summary, r.solution_summary);
    diff(`${t.row.slug}.impact_summary`, data.impact_summary, r.impact_summary);
    diff(`${t.row.slug}.tools`, data.tools, r.tools);
    diff(`${t.row.slug}.technical_analytics`, data.technical_analytics, r.technical_analytics);
    diff(`${t.row.slug}.technical_processing`, data.technical_processing, r.technical_processing);
    diff(`${t.row.slug}.technical_automation`, data.technical_automation, r.technical_automation);
    diff(`${t.row.slug}.technical_visualization`, data.technical_visualization, r.technical_visualization);
    diff(`${t.row.slug}.status`, data.status, "published");
    diff(`${t.row.slug}.featured`, data.featured, true);
    diff(`${t.row.slug}.display_order`, data.display_order, i);

    const steps = [...(data.project_steps || [])].sort((a, b) => a.step_order - b.step_order);
    diff(`${t.row.slug}.steps`, steps.map((s) => s.title), t.steps.map((s) => s.title));

    const insights = [...(data.project_insights || [])].sort((a, b) => a.insight_order - b.insight_order);
    diff(`${t.row.slug}.insights`, insights.map((s) => [s.title, s.description]), t.insights.map((s) => [s.title, s.description]));

    const links = [...(data.project_links || [])].sort((a, b) => a.link_order - b.link_order);
    diff(`${t.row.slug}.links`, links.map((l) => [l.link_type, l.url]), t.links.map((l) => [l.link_type, l.url]));

    // Private meta — admin-only read.
    const { data: meta, error: eMeta } = await priv
      .from("project_private_meta")
      .select("content_verified, confidentiality_confirmed")
      .eq("project_id", data.id)
      .maybeSingle();
    if (eMeta || !meta) {
      mismatches += 1;
      log(`  MISMATCH ${t.row.slug}.private_meta: ${eMeta?.message || "missing"}`);
    } else {
      diff(`${t.row.slug}.private_meta`, [meta.content_verified, meta.confidentiality_confirmed], [
        t.private_meta.content_verified,
        t.private_meta.confidentiality_confirmed,
      ]);
    }

    log(`${mismatches === before ? "OK " : "!! "} ${t.row.slug}`);
  }

  // Related slugs per project (anon read of project_related + slug join).
  const { data: relatedRows, error: eR } = await anon
    .from("project_related")
    .select("project_id, related_project_id, display_order");
  if (eR) throw eR;
  const idToSlug = new Map(allPublic.map((p) => [p.id, p.slug]));
  for (const t of transformed) {
    const ownId = allPublic.find((p) => p.slug === t.row.slug)?.id;
    const actual = relatedRows
      .filter((rr) => rr.project_id === ownId)
      .sort((a, b) => a.display_order - b.display_order)
      .map((rr) => idToSlug.get(rr.related_project_id));
    diff(`${t.row.slug}.related`, actual, t.related.map((x) => x.slug));
  }

  log(`\nparity — ${mismatches} mismatch(es)`);
}

// -------------------------------------------------------------------- main
try {
  if (!PARITY_ONLY) {
    const client = await writeClient();
    await migrate(client);
    if (errors.length) log(`\nmigration finished with ${errors.length} error(s)`);
  }
  await parity();
} catch (err) {
  die(`FATAL: ${err.message}`);
}

const failed = errors.length + mismatches;
log(failed === 0 ? "\nSUCCESS — migration + parity clean." : `\nFAILED — ${failed} problem(s).`);
process.exit(failed === 0 ? 0 : 1);
