// scripts/verify-content-seed.mjs
// Phase 13 parity gate: the seeded rows in site_settings / experiences /
// educations / skill_categories must be byte-equal to the content that used to
// be hardcoded in the components (ProfileCard, HomeClient, experience.ts,
// Skills.tsx, skills.ts, layout.tsx).
//
// TEMPORARY by design: once Phase 16 moves the public site onto these tables
// and deletes the hardcoded sources, this script is retired and its role is
// taken over by verify-cms-flow.mjs (DB <-> live HTML reflection).
//
// Usage: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//        node scripts/verify-content-seed.mjs

import { readFileSync, existsSync } from "node:fs";
import dns from "node:dns";

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
if (!URL_BASE || !ANON) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const rest = (path) =>
  fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: { apikey: ANON, "Content-Type": "application/json" },
  });

// Source files (relative to repo root) with the previously hardcoded content.
const src = {
  profileCard: readFileSync("src/components/ProfileCard.tsx", "utf8"),
  homeClient: readFileSync("src/components/HomeClient.tsx", "utf8"),
  experience: readFileSync("src/data/experience.ts", "utf8"),
  skillsPage: readFileSync("src/components/Skills.tsx", "utf8"),
  skills: readFileSync("src/data/skills.ts", "utf8"),
  layout: readFileSync("src/app/layout.tsx", "utf8"),
};

// JSX text is wrapped over multiple lines; collapse whitespace and unescape
// the entities used in the sources before comparing.
const normalize = (s) =>
  s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

function expectInSource(label, needle, haystacks) {
  const n = normalize(needle);
  const ok = haystacks.some((h) => normalize(h).includes(n));
  check(`${label} present in source`, ok, ok ? "" : needle.slice(0, 60));
}

// ----------------------------------------------------------------- settings
const settings = (await rest("site_settings?select=*")).ok
  ? await (await rest("site_settings?select=*")).json()
  : [];
const s = settings.find((r) => r.id === "main");
check("site_settings row exists", Boolean(s));

if (s) {
  const profile = [src.profileCard];
  const home = [src.homeClient];
  const layout = [src.layout];

  expectInSource("display_name", s.display_name, profile);
  expectInSource("role_line", s.role_line, profile);
  expectInSource("bio", s.bio, profile);
  expectInSource("email", s.email, [...profile, ...home]);
  expectInSource("linkedin_url", s.linkedin_url, [...profile, ...home]);
  expectInSource("linkedin_label", s.linkedin_label, profile);
  expectInSource("github_url", s.github_url, [...profile, ...home]);
  expectInSource("github_label", s.github_label, profile);
  expectInSource("location", s.location, profile);
  expectInSource("avatar_path", s.avatar_path, profile);
  expectInSource("availability_text", s.availability_text, home);
  expectInSource("headline", s.headline, home);
  expectInSource("headline_highlight", s.headline_highlight, home);
  expectInSource("tagline", s.tagline, home);
  expectInSource("resume_url", s.resume_url, home);
  expectInSource("seo_title", s.seo_title, layout);
  expectInSource("seo_description", s.seo_description, layout);
}

// -------------------------------------------------------------- experiences
const expRows = (await rest("experiences?select=*&order=display_order.asc")).ok
  ? await (await rest("experiences?select=*&order=display_order.asc")).json()
  : [];
const expCount = (src.experience.match(/period:\s*"/g) ?? []).length;
check("experiences count matches source", expRows.length === expCount, `${expRows.length} vs ${expCount}`);
for (const row of expRows) {
  for (const field of ["period", "role", "company", "division", "employment_type"]) {
    expectInSource(`experience.${field} "${row[field]}"`, row[field], [src.experience]);
  }
  for (const h of row.highlights ?? []) {
    expectInSource(`experience.highlight "${h}"`, h, [src.experience]);
  }
}

// --------------------------------------------------------------- educations
const eduRows = (await rest("educations?select=*&order=display_order.asc")).ok
  ? await (await rest("educations?select=*&order=display_order.asc")).json()
  : [];
check("educations seeded", eduRows.length > 0, `${eduRows.length} row(s)`);
for (const row of eduRows) {
  for (const field of ["degree", "institution", "detail", "badge"]) {
    if (row[field]) expectInSource(`education.${field} "${row[field]}"`, row[field], [src.skillsPage]);
  }
  for (const c of row.certifications ?? []) {
    expectInSource(`education.certification "${c}"`, c, [src.skillsPage]);
  }
}

// ---------------------------------------------------------- skill categories
const skillRows = (await rest("skill_categories?select=*&order=display_order.asc")).ok
  ? await (await rest("skill_categories?select=*&order=display_order.asc")).json()
  : [];
const skillCount = (src.skills.match(/name:\s*"/g) ?? []).length;
check(
  "skill categories count matches source",
  skillRows.length === skillCount,
  `${skillRows.length} vs ${skillCount}`
);
for (const row of skillRows) {
  expectInSource(`skill.category "${row.name}"`, row.name, [src.skills]);
  for (const skill of row.skills ?? []) {
    expectInSource(`skill "${skill}"`, skill, [src.skills]);
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("Failures:\n" + failed.map((f) => `  - ${f.name}`).join("\n"));
  process.exit(1);
}
