# Plan: Portfolio CMS v2 — Supabase Refactor

> **Source PRD:** `PRD_Portfolio_CMS_Refactor_v2.md` (v2.0, 2026-10-07, 76 sections)
> **Baseline:** tag `v1.0-baseline` @ `main` commit `18b81b7` · branch `feat/portfolio-cms`
> **Backup:** `plans/backup/projects-v1-2026-10-07.json` (v1 content, 6 projects)
> **Execution mode:** continuous — every phase ends with `lint` + `build` + smoke check, then a commit. Stop only on blockers.

---

## Architectural decisions (durable across phases)

- **Public routes (unchanged contract):** `/` (tabbed homepage), `/projects/[slug]`, `not-found`. No `/projects` index (PRD §7.1 optional — homepage remains the index). The 6 existing slugs are immutable.
- **Admin routes:** `/admin/login`, `/admin` (dashboard), `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]/edit`, `/admin/projects/[id]/preview`, `/admin/projects/reorder`. All `noindex`. No public "Admin" link anywhere.
- **Defense in depth (PRD §10.3):** middleware session check → layout guard → `require-admin` on every server mutation → RLS as the final boundary. Client state is never a security boundary.
- **Schema (Postgres):** `admin_users`, `projects`, `project_steps`, `project_insights`, `project_media`, `project_links`, `project_related`, `project_private_meta`. `project_slug_redirects` is deferred: published-slug changes are blocked with a warning instead (PRD §36 allows).
- **Additive columns on `projects`:** `focus` and `project_type` (TEXT NULL) are added to the suggested schema so the v1 card/hero metadata (Focus tile, Professional/Certification badge) survives migration — additive, backward compatible, no content loss.
- **Auth:** Supabase Auth email+password; public signup disabled; owner membership = row in `admin_users` inserted manually; every mutation re-checks authorization server-side; service-role key never `NEXT_PUBLIC` and used only if strictly necessary.
- **RLS:** anonymous may read only `status='published'` projects + their child rows; mutations require `admin_users` membership; `project_private_meta` admin-only; drafts invisible to anonymous.
- **Storage:** bucket `portfolio-media` (public read, admin write only); paths `projects/<project-id>/<uuid>.<ext>`; MIME allowlist `jpeg/png/webp/avif`; ≤ 8 MB; SVG disabled; delete cleans up unreferenced objects.
- **Data access:** public pages = Server Components → Supabase server client → published-only queries; private metadata never queried publicly; mutations revalidate public paths.
- **One renderer:** the case-study renderer is a shared component tree used by `/projects/[slug]` **and** admin draft preview. Empty optional sections do not render.
- **Process diagram:** reusable `ProjectProcessFlow` — pure HTML/CSS, ordered by `step_order`, horizontal on desktop / vertical stack on mobile, DOM order = visual order, 2–8 steps.
- **Validation:** Zod schemas shared between client forms and server actions; human-readable errors; publish gate = required fields + `content_verified` + `confidentiality_confirmed` (PRD §34).
- **Forms:** React Hook Form + Zod resolver for the admin project form; repeatable editors use add/remove + up/down buttons (accessible keyboard reorder, PRD §47); drag-and-drop (dnd-kit) only on the project reorder page.
- **Markdown:** narrative fields render via `react-markdown` without raw-HTML passthrough (PRD §43).
- **Tests:** Vitest for unit tests (slug, publish validation, permission helpers, URL validation, ordering, sanitization); script-based live verification against the real Supabase project for the RLS/storage/authz matrix (PRD §62).
- **Legacy JSON:** kept in-repo as read-only backup until Phase 11; legacy dev-only admin + JSON write path are removed in Phase 11 (PRD §54 phase 7).
- **Interim content workflow (Phases 3–10):** public reads come from the DB while the new admin is still building — content changes go through re-running the idempotent migration script (upsert by slug) until Phase 9 delivers draft→preview→publish.
- **Design (PRD §71):** tabs, profile sidebar, theme tokens, experience/education/skills, footer stay as-is. Public template changes are limited to the case-study page per §40.
- **Content rules:** no invented portfolio content; factual claims unchanged without explicit owner approval (PRD §74.20–22).

### Content migration mapping (JSON → Postgres)

| v1 JSON | v2 target | Rule |
|---|---|---|
| `slug/title/category/summary` | same | preserved verbatim (URL contract) |
| *(no description in v1)* | `description` | = `summary` (honest duplicate so publish validation passes; no invention) |
| `businessProblem` | `business_problem` | direct |
| `businessQuestions[]` | `key_questions[]` | direct |
| `approach[]` | `project_steps` (ordered) | titles become process steps (step 1..n) |
| `solution[]` | `solution_summary` | stored as markdown bullet lines, rendered as list (lossless, no schema change) |
| `impact` | `impact_summary` | direct |
| `role/domain/data/focus/projectType` | `role/domain/data_context/focus/project_type` | direct (+ additive columns) |
| *(no period in v1)* | `project_period` | empty (section omitted) |
| `tools[]` | `tools[]` | direct |
| `technicalDetails.*` | `technical_*[]` | direct (4 groups) |
| `insights[]` | `project_insights` | ordered |
| `github` | `project_links` (type `github`, label "View Source Code") | only when non-null |
| `cover` | — | ignored (no cover assets exist; gradient fallback stays) |
| — | `status='published'`, `featured=true`, `display_order` = v1 array index | preserves live state & order |
| — | `content_verified/confidentiality_confirmed` | `true` for `customer-retention` (reviewed); `false` for the other five — forces owner reconfirmation before their next publish action |

### Existing routes to preserve (recorded per §64 Phase 0)

`/` · `/projects/customer-retention` · `/projects/marketplace-performance` · `/projects/marketplace-pipeline` · `/projects/marketing-performance` · `/projects/return-logistics` · `/projects/credit-risk-prediction` · `/admin*` (legacy, removed Phase 11) · 404 catch-all.

---

## Phase 0: Baseline & backup ✅ DONE

**User stories:** foundation for all stories.

### What was built
Baseline commit pushed to `main` (`18b81b7`: as-built PRD docs, em-dash fix, `.gitignore`), production tag `v1.0-baseline`, working branch `feat/portfolio-cms`, JSON backup, route inventory recorded above.

### Acceptance criteria
- [x] Feature branch created; production tagged
- [x] v1 JSON backed up outside the data path
- [x] Existing routes and slugs recorded

---

## Phase 1: Supabase foundation

**User stories:** #26 (admin inaccessible to everyone else) · security prerequisites for #10–26.

### What to build
Versioned SQL migrations (applied to the real project) creating all 8 tables with constraints, RLS policies (public read published-only, admin-only mutation, private-meta admin-only, drafts admin-only), the `portfolio-media` storage bucket with write policies, and env wiring (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`). A repeatable verification script proves the RLS matrix against the live project.

### Acceptance criteria
- [x] All migrations applied and version-controlled under `supabase/migrations/` — applied via SQL Editor on project `aulkpnycibddhexayteg` (2026-10-07)
- [x] RLS enabled on every table (no table without a policy)
- [x] Verification script passes: anon reads published ✓ · anon reads draft ✗ · anon insert ✗ · private meta never readable by anon ✓ · signup disabled ✓ — 7/7 PASS (`npm run db:verify`); UPDATE/DELETE + owner-matrix checks re-run after Phase 2 lands data
- [x] Storage: anon upload ✗ verified · admin upload + MIME/size rules exercised in Phase 8
- [x] App builds with env vars present; no service-role key in client bundle

---

## Phase 2: JSON → Supabase migration script

**User stories:** migration integrity (PRD §54) · #11 (edit without changing source code, later phases build on this data).

### What to build
Idempotent migration script (re-runnable, upsert by slug) implementing the mapping table above: transforms v1 JSON → `projects` + children rows, preserves slugs/order/published state, logs per-project errors, never deletes. A parity-check script compares migrated rows against the JSON field-by-field.

### Acceptance criteria
- [x] Running the script twice produces no duplicates — second run shows `~` updates with identical UUIDs, parity still 0
- [x] All 6 projects present with identical slug, title, summary, insights, tools, technical groups — parity field-by-field
- [x] Steps derived from `approach[]` keep original order — sorted `step_order` comparison passes
- [x] GitHub link exists only for `customer-retention` — dry-run `links=1` only on that project
- [x] Parity report shows 0 mismatches — `SUCCESS — migration + parity clean` (twice), anon visibility 6/6, RLS matrix re-verified 11/11

---

## Phase 3: Public read migration (tracer bullet: DB → server components → live pages)

**User stories:** #1–9 (public) — served from the database now.

### What to build
Homepage project grid and `/projects/[slug]` read published projects from Supabase (server-side, published-only, `display_order`), keeping current components and URLs untouched. Mutations (later phases) will revalidate `/` and `/projects/[slug]`. JSON stays in the repo as backup; interim content edits flow through re-running the migration script.

### Acceptance criteria
- [ ] `/` lists all 6 projects, same cards as v1 (focus/type columns preserved)
- [ ] Every existing slug renders its full case study, unchanged URLs
- [ ] Draft rows (once any exist) are invisible to anonymous requests
- [ ] Parity spot-check: v1 page vs DB-backed page — title, summary, insights, links, related identical
- [ ] `lint` + `build` green

---

## Phase 4: Admin authentication & shell

**User stories:** #26 (admin inaccessible to others) · login/logout lifecycle.

### What to build
`/admin/login` (Supabase email+password → redirect `/admin`), logout, middleware session refresh + route protection (unauthenticated `/admin*` → login; expired session → login with readable message), `require-admin` helper for server actions, admin layout with sidebar + `noindex`, dashboard with stats (total/published/draft/featured) reading the DB.

### Acceptance criteria
- [ ] Anonymous `/admin` → redirected to login, never sees data
- [ ] Owner login lands on dashboard; logout works; expired session handled safely
- [ ] Signup is impossible (email provider signup disabled + membership required)
- [ ] Non-admin authenticated user is denied by `require-admin` **and** by RLS
- [ ] Admin pages carry `noindex, nofollow`

---

## Phase 5: Projects list + basic create/edit

**User stories:** #10, #11, #12, #22 (delete later in this phase's list view), #14 partial (status field).

### What to build
`/admin/projects` table (title, category, status, featured, updated, actions) with status filters. Create + edit form for the **basic** fields: title, auto-slug (lowercase/hyphen/unique, human-readable duplicate error), category (combobox + custom), summary (≤240 recommendation), description (markdown), business problem, role/domain/data context/period, tools tag input, status/featured. React Hook Form + Zod client-side; identical Zod schema re-run inside server actions; `Save Draft` persists partial content (title+slug minimum).

### Acceptance criteria
- [ ] Owner creates a draft → appears in list as Draft, **not** on the public site
- [ ] Edit form pre-fills all persisted values; repeatable tools preserved
- [ ] Duplicate slug rejected with "A project with this slug already exists."
- [ ] Server mutations re-check admin membership (tested with a non-admin session)
- [ ] Save states on buttons ("Saving…"), duplicate submits prevented

---

## Phase 6: Repeatable content editors

**User stories:** #17, #18 (data side), #21, #23 · insights management · related projects.

### What to build
Editors inside the project form for: key questions, process **steps** (title + description, add/remove/up/down), insights (title + description), links (type/label/url, validated), related projects (multi-select excluding self), and the `INTERNAL / NOT PUBLIC` private-provenance panel (original work titles, internal notes, source references, content-verified + confidentiality-confirmed checkboxes). All persisted in one transactional save path.

### Acceptance criteria
- [ ] Each repeatable block adds/removes/reorders and survives reload
- [ ] Step order persisted and drives `step_order`
- [ ] Private fields save to `project_private_meta` only, never appear in public queries
- [ ] Link validation: label required, valid URL, HTTPS recommended
- [ ] Non-admin cannot read private meta (verified against live DB)

---

## Phase 7: Public template v2 + automatic process diagram

**User stories:** #3, #4, #5 (visual steps), #9 · PRD §40 template.

### What to build
Refactor the case-study renderer to the §40 order: Hero (category/title/summary + Role/Domain/Data Context/Period/Tools tiles + cover slot) → Overview (description) → Business Problem → Key Questions → **What I Did (`ProjectProcessFlow`)** → Approach → Solution → Visuals placeholder → Insights → Impact → Technical Details → Public Links → Related (published only, no self). Empty optional sections omitted. The same renderer powers admin preview (Phase 9).

### Acceptance criteria
- [ ] Process steps render automatically as responsive flow (desktop horizontal, mobile vertical, arrows correct at both ends)
- [ ] Diagram is plain HTML/CSS; screen-reader order matches visual order
- [ ] Migrated `solution_summary` renders as a list; empty sections (e.g. period) do not render
- [ ] Related shows only published, excludes self
- [ ] All 6 project pages + 375/768/1024/1440 widths verified

---

## Phase 8: Media upload & cover

**User stories:** #19, #20, #7 (images support the story) · cover fallback.

### What to build
Upload pipeline: file validation (MIME allowlist, ≤8 MB, no SVG) → Supabase Storage at `projects/<project-id>/<uuid>.<ext>` → `project_media` row (alt required, caption, layout full/half/gallery, order). External-URL media mode (HTTPS-only validation, graceful broken-image fallback). Cover upload with typographic-gradient fallback. Media list editor with preview/replace/delete (storage cleanup). Public gallery rendering with lazy-load below the fold.

### Acceptance criteria
- [ ] Owner uploads an image → appears on the (draft) project page with alt + caption
- [ ] Oversized/invalid file → readable error, draft still saved
- [ ] Delete removes DB row **and** orphaned storage object; unrelated assets untouched
- [ ] Anonymous upload/delete rejected by storage policies
- [ ] No cover → gradient fallback (current design) still renders

---

## Phase 9: Preview & publish workflow

**User stories:** #13, #14, #24, #25 · PRD §34/§53.

### What to build
`/admin/projects/[id]/preview` — owner-only, same renderer as the public page, `DRAFT PREVIEW` banner, `noindex`. Publish panel: validation (title, unique slug, category, summary, description, business problem, ≥1 step, ≥1 tool, both checkboxes) with blocking errors ("This project cannot be published because Business Problem is empty."), soft warnings (no cover/insights/impact/links/media), the §53 confidentiality checklist, Publish/Unpublish actions (timestamps, human-readable errors), unpublish → public URL 404s.

### Acceptance criteria
- [ ] Draft → preview (full template) → publish → live publicly, without touching code
- [ ] Publish blocked when any required item missing; message names the missing field
- [ ] Checklist + both confirmations mandatory before first publish
- [ ] Unpublish → `/projects/[slug]` returns 404 for anonymous; admin preview still works
- [ ] Published homepage/list updates reflect immediately (revalidation)

---

## Phase 10: Reorder & featured ordering

**User stories:** #15, #16 · PRD §38.

### What to build
`/admin/projects/reorder` — drag-and-drop (dnd-kit) with keyboard-accessible fallback, persisting `display_order`. Featured toggle in list/editor. Homepage "Selected Work" query: `status='published' AND featured=true ORDER BY display_order ASC`; existing category filter/sort retained; pagination reconsidered for small counts (keep grid unpaginated while total ≤ 8).

### Acceptance criteria
- [ ] Reorder persists and changes public listing order
- [ ] Non-featured published projects do not appear in Selected Work but remain reachable by slug
- [ ] Keyboard-only reorder works (arrow buttons / sortable keyboard coordinates)
- [ ] Homepage shows filtered/sorted results correctly

---

## Phase 11: Security hardening & legacy removal

**User stories:** #26 · security acceptance (PRD §52/§62).

### What to build
Remove the v1 dev-only admin and all JSON write paths (§54 phase 7) — JSON remains as read-only backup. Run the full authorization test matrix (anonymous/non-admin/owner × read/mutation/private-meta/drafts), storage policy tests, service-role exposure audit, human-readable error pass (§45), unsaved-changes warning (§46), published-slug-change block with warning (§36).

### Acceptance criteria
- [ ] Old `/admin/new`, `/admin/edit/*` routes are gone (404), JSON writes impossible from the app
- [ ] Full §62 authorization + storage matrix passes against the live project
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` reachable from client bundles
- [ ] Error/loading states follow §45/§46 wording; no raw DB traces exposed

---

## Phase 12: SEO, documentation & release

**User stories:** better project SEO (§3.2) · owner ops docs · release criteria (§73).

### What to build
Per-project `generateMetadata` (title pattern `<Project> | Irsyad Muhamad Firdaus`, description = summary, canonical, Open Graph). Docs per §68: update `docs/PRD.md`, `docs/TECHNICAL-DOCUMENTATION.md`, `README.md`; create `docs/CMS-OPERATIONS.md` (login, add/edit, media, preview, publish/unpublish, reorder, delete, env requirements, backup/recovery, migration notes). Set env vars in Vercel, merge `feat/portfolio-cms` → `main`, deploy, run the §74 checklist (25–40) against production.

### Acceptance criteria
- [ ] Project pages serve unique title/description/canonical/OG; admin + previews are `noindex`
- [ ] All four docs updated/created and accurate to v2
- [ ] Production smoke test: anonymous admin denied · owner login works · draft invisible · publish/unpublish/404 · existing slugs alive · process diagram responsive
- [ ] Migration summary + remaining gaps delivered to the owner
- [ ] Definition of Done (§73) checked line by line

---

## Out of scope (per PRD)

Multi-user CMS, blog, comments, search, slug-redirect table (warn-only in v2), analytics events, lightbox, archived status, export-as-JSON tool (noted as future), any content invention or unapproved factual changes.
