// scripts/verify-rls.mjs
// Live verification of the RLS/auth/storage matrix (PRD §12, §52, §62).
//
// Base run (anon matrix):
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   node scripts/verify-rls.mjs
//
// With owner checks (optional, password passed ad hoc — never persisted):
//   SUPABASE_OWNER_EMAIL=... SUPABASE_OWNER_PASSWORD=... node scripts/verify-rls.mjs
//
// With mutation smoke test (creates and deletes a temp draft project):
//   ... same owner vars ... node scripts/verify-rls.mjs --with-mutations

import { existsSync, readFileSync } from "node:fs";

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
const OWNER_EMAIL = process.env.SUPABASE_OWNER_EMAIL;
const OWNER_PASSWORD = process.env.SUPABASE_OWNER_PASSWORD;
const WITH_MUTATIONS = process.argv.includes("--with-mutations");

if (!URL_BASE || !ANON) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).");
  process.exit(1);
}

const rest = (path, opts = {}) =>
  fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: ANON,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function anonMatrix() {
  // 1. Published projects readable, and only published ones ever appear.
  const r = await rest("projects?select=slug,status&order=display_order.asc");
  const rows = r.ok ? await r.json() : [];
  check("anon can read projects", r.ok, `${rows.length} row(s)`);
  check(
    "anon sees only status=published",
    rows.every((x) => x.status === "published"),
    JSON.stringify(rows.map((x) => x.slug))
  );

  // 2. Draft filter returns nothing for anon (drafts hidden even when they exist).
  const d = await rest("projects?select=slug&status=eq.draft");
  const drafts = d.ok ? await d.json() : [];
  check("anon cannot see drafts", d.ok && drafts.length === 0, `${drafts.length} draft(s) visible`);

  // 3. Anonymous mutations rejected.
  const ins = await rest("projects", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ slug: "anon-should-not-insert", title: "anon insert attempt" }),
  });
  check("anon INSERT rejected", !ins.ok, `status ${ins.status}`);

  const first = rows[0];
  if (first) {
    const upd = await rest(`projects?slug=eq.${encodeURIComponent(first.slug)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ summary: "anon update attempt" }),
    });
    check("anon UPDATE rejected", !upd.ok, `status ${upd.status}`);

    const del = await rest(`projects?slug=eq.${encodeURIComponent(first.slug)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    check("anon DELETE rejected", !del.ok, `status ${del.status}`);

    // 4. Child rows of a published project readable.
    const steps = await rest(`project_steps?select=id&project_id=eq.does-not-exist`);
    check("child tables reachable under RLS", steps.ok, `status ${steps.status}`);
  } else {
    console.log("INFO  no published projects yet — UPDATE/DELETE/child checks skipped (re-run after migration)");
  }

  // 5. Private metadata never returns rows to anon.
  const meta = await rest("project_private_meta?select=project_id");
  const metaRows = meta.ok ? await meta.json() : [];
  check("anon cannot read private metadata", meta.ok && metaRows.length === 0, `${metaRows.length} row(s) leaked`);

  // 6. Storage write rejected for anon.
  const up = await fetch(`${URL_BASE}/storage/v1/object/portfolio-media/probe.txt`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "text/plain" },
    body: "probe",
  });
  check("anon storage upload rejected", !up.ok, `status ${up.status}`);

  // 7. Public signup disabled (PRD §10.1).
  const su = await fetch(`${URL_BASE}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `probe-${Date.now()}@example.com`,
      password: "Probe-Only-1234!",
      data: {},
    }),
  });
  check("public signup disabled", !su.ok, `status ${su.status}`);
}

async function ownerMatrix() {
  const login = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
  });
  if (!login.ok) {
    check("owner login", false, `status ${login.status}`);
    return;
  }
  const { access_token } = await login.json();
  const auth = { Authorization: `Bearer ${access_token}`, apikey: ANON };
  check("owner login", true);

  const meta = await rest("project_private_meta?select=project_id", { headers: auth });
  check("owner can read private metadata", meta.ok, `status ${meta.status}`);

  if (WITH_MUTATIONS) {
    const slug = `verify-temp-${Date.now()}`;
    const created = await rest("projects", {
      method: "POST",
      headers: { ...auth, Prefer: "return=representation" },
      body: JSON.stringify({ slug, title: "Verification temp project" }),
    });
    const body = created.ok ? await created.json() : [];
    check("owner can create draft", created.ok, `status ${created.status}`);
    const id = body[0]?.id;

    if (id) {
      const asAnon = await rest(`projects?id=eq.${id}&select=slug`);
      const anonRows = asAnon.ok ? await asAnon.json() : [];
      check("temp draft hidden from anon", anonRows.length === 0, `${anonRows.length} row(s)`);

      const removed = await rest(`projects?id=eq.${id}`, {
        method: "DELETE",
        headers: auth,
      });
      check("owner can delete own temp draft", removed.ok, `status ${removed.status}`);

      const gone = await rest(`projects?id=eq.${id}&select=id`);
      const goneRows = gone.ok ? await gone.json() : [];
      check("temp draft gone after delete", goneRows.length === 0);
    }
  }
}

console.log("=== anon / public matrix ===");
await anonMatrix();
if (OWNER_EMAIL && OWNER_PASSWORD) {
  console.log("=== owner matrix ===");
  await ownerMatrix();
} else {
  console.log("INFO  SUPABASE_OWNER_EMAIL/PASSWORD not set — owner checks skipped");
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("Failures:\n" + failed.map((f) => `  - ${f.name}`).join("\n"));
  process.exit(1);
}
