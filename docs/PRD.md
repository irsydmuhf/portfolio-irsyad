# Product Requirements Document (As-Built)
## Data Analytics Portfolio — Irsyad Muhamad Firdaus

| | |
|---|---|
| **Document type** | As-built PRD — describes the delivered v1.0 state |
| **Date** | 2026-10-06 |
| **Product** | Personal Data Analytics Portfolio website |
| **Platform** | Web, responsive (mobile / tablet / desktop) |
| **Primary language** | English |
| **Primary audience** | Recruiters, hiring managers, data/analytics leads, potential clients |
| **Status** | Live in production |
| **Source requirements** | Original PRD v1.0 (44 sections) — used as the baseline for the traceability matrix below |
| **Companion document** | [`TECHNICAL-DOCUMENTATION.md`](./TECHNICAL-DOCUMENTATION.md) — routes, components, data model, operations |

This document states what the product was required to do and what is actually implemented today, including deviations from the original requirements.

---

## Problem Statement

Data-analyst candidates are usually evaluated through a résumé that lists tools and job titles, which does not show how they think. Recruiters and hiring managers cannot quickly tell whether a candidate has solved real business problems with data, or only completed courses.

From the candidate's perspective: there is no single place that presents professional analytics work — the business problem, the approach, the insight, and the impact — in a form a recruiter can absorb in under a minute, while respecting confidentiality obligations toward former and current employers.

## Solution

A project-first personal portfolio website where the work leads and the profile supports it:

- A single-page homepage with a profile sidebar and tabbed content: **Portfolio** (selected projects), **Experience**, and **Education & Skills**.
- Six case studies, each on its own shareable URL, following a consistent narrative template: business problem → key questions → approach → solution → insights → impact → technical details → related projects.
- Public proof of authorship for the flagship case study through a linked, sanitized GitHub repository built on synthetic data.
- Content stored as structured data (JSON) with a development-only admin panel for CRUD, published through Git → Vercel auto-deploy. No database, no CMS, no backend.
- Strict confidentiality: published material contains percentages and aggregates only — no PII, no brand/company identifiers in case-study content, no raw datasets.

## User Stories

1. As a **recruiter**, I want to understand who Irsyad is, his role, and his strongest projects within 30–60 seconds of opening the homepage, so that I can decide whether to keep reading.
2. As a **recruiter**, I want to open any project's full case study with one click from the project list, so that I can evaluate depth without navigating a complex site.
3. As a **recruiter**, I want to filter projects by category and sort them, so that I can find work relevant to the role I am hiring for.
4. As a **recruiter**, I want to see the tools, domain, role, and data type of each project at a glance, so that I can match the candidate to my stack.
5. As a **hiring manager**, I want each case study to follow a problem → approach → insight → impact narrative, so that I can evaluate analytical thinking, not just tool usage.
6. As a **hiring manager**, I want business insights written as findings (not raw statistics) with honest impact wording, so that I can trust the claims made.
7. As a **recruiter**, I want a source-code link when a public repository exists, so that I can inspect code quality — and no defensive explanations when it does not.
8. As a **visitor**, I want to download the résumé directly from any page, so that I can archive the candidate.
9. As a **visitor**, I want contact links (email, LinkedIn, GitHub) in a predictable place, so that I can reach out immediately.
10. As a **mobile visitor**, I want the full site — tabs, project list, case studies — to work on a small screen, so that I can review the portfolio anywhere.
11. As a **visitor who mistypes a URL**, I want a clear 404 page with a way back, so that I am not stuck.
12. As the **site owner**, I want to create, edit, and delete case studies through a form without touching UI components, so that content updates stay cheap.
13. As the **site owner**, I want duplicate slugs to be rejected with an error rather than silently overwriting an existing project, so that content is never lost.
14. As the **site owner**, I want the admin panel to be completely unavailable in production (pages and server actions both guarded), so that no anonymous visitor can mutate content.
15. As the **site owner**, I want every content change to ship by `git push` with automatic deployment, so that publishing requires no manual server work.
16. As the **site owner**, I want enforced sanitization rules (no PII, no brand identifiers, no raw data) applied before publishing, so that confidentiality obligations are met.
17. As a **maintainer or AI agent**, I want the data model, invariants, and content workflow documented, so that any edit keeps the site valid and consistent.

## Implementation Decisions

**Information architecture**

- Single-page homepage with client-side tab navigation (Portfolio / Experience / Education & Skills); case studies live at individual `/projects/<slug>` routes. The original multi-page IA (`/about`, `/experience`, `/resume`) was not built; contact and résumé live in the footer and profile sidebar.
- Tab selection is in-memory component state — it is not URL-addressable; a fresh visit always lands on the Portfolio tab.

**Content model**

- One typed `Project` schema with 19 fields; content lives in a single JSON file imported through a TypeScript module, so content and UI stay separated without a CMS or MDX pipeline.
- Experience and skills are separate typed data modules; education is currently rendered as static content in the UI component.
- Invariants: unique slug per project, non-empty title; list-type fields are arrays of strings; insights are `{title, description}` pairs.

**Interface**

- Case-study template renders a fixed section order (hero with six metadata tiles → business problem + key questions → approach flow → solution flow → numbered insight cards → impact → four technical-detail cards → related projects).
- GitHub button renders only when a repository URL exists.
- Project cards use typographic gradient thumbnails (no imagery yet); category filter, sorting, and pagination (4 per page) on the homepage grid.
- Design system: Tailwind CSS v4 theme tokens — charcoal primary, muted-blue accent. Legacy class aliases (`navy-*`, `orange-*`) map onto these tokens; changing theme variables changes the palette without touching class names.
- Inter font via `next/font`; subtle hover states; smooth scrolling; no heavy animation, glassmorphism, or neon.

**Architecture & operations**

- Next.js (App Router) + TypeScript + React; static data bundled at build time; case-study route resolves the slug server-side and returns 404 for unknown slugs.
- No database and no API routes: the JSON file is the single source of truth; writes happen only through development-mode server actions that pretty-print the file.
- Admin panel is double-guarded (`NODE_ENV === 'development'` checks in both the page layer and the server actions) and renders an informational disabled screen in production.
- Publishing workflow: edit content → commit → push → Vercel Git integration auto-deploys the production branch.
- SEO: root-level title, description, and Open Graph text; per-project metadata is a known gap.
- Version control: public GitHub repository; the flagship case study links to a separate public analysis repository that ships synthetic data, scripts, and a sample workbook only.

**Confidentiality**

- Published case studies contain qualitative statements, percentages, and aggregates only. Forbidden: PII, credentials, tokens, spreadsheet/URL identifiers, absolute sensitive financials, brand/company identifiers in case-study content, raw datasets. Employment history itself is intentionally public (normal professional identity).

## Out of Scope

- Blog, CMS, contact-form backend, user login/authentication, comments, search.
- Dark/light theme switcher, localization (site is English-only), complex animations.
- Product/web analytics event tracking (original §39 — not implemented).
- Per-project SEO metadata, Open Graph images (identified gap, not yet built).
- Project cover images/charts (fields exist; assets and rendering are pending).
- Custom domain purchase (`.my.id` candidates checked; purchase pending).
- Interactive visualizations, Power BI embeds, technical deep-dive articles (original future roadmap §43).

## Requirements Traceability Matrix

Status legend: **Implemented** · **Partial** · **Deviation** (built differently, deliberately) · **Not implemented**.

| Original § | Requirement (condensed) | Status | Notes |
|---|---|---|---|
| §1 | Projects-first portfolio showing real-world analytics | Implemented | Portfolio is the default tab; profile sits in a persistent sidebar |
| §2 | Business understanding, technical capability, professional experience | Implemented | Case-study template covers all three dimensions |
| §3 | Value understandable in 30–60 s | Partial | Designed for it; not validated with actual recruiters |
| §5 | Recommended hero statement | Deviation | Header uses a compact hero with tagline "Turning complex datasets into confident business decisions." |
| §6–§7 | Multi-page IA + top navbar | Deviation | Tabbed single page; no navbar — footer + sidebar carry the links |
| §8 | Homepage section order | Deviation | Re-expressed as tabs: Portfolio → Experience → Education & Skills; About folded into sidebar bio; contact in footer |
| §9 | Hero with badge/availability | Partial | "Available for Work" badge and "Based in Indonesia" present; no hero CTA buttons (Resume link is in footer) |
| §10 | Selected Projects with subheading | Implemented | Extended with category filter, sorting, pagination |
| §11 | Five flagship projects | Implemented | Six projects (five professional + one certification project) |
| §12 | Project card component | Implemented | Fully clickable title, tools chips, GitHub link when present |
| §13 | Real project thumbnails, no stock photos | Deviation | Typographic gradient thumbnails; cover images pending |
| §14 | Case-study section template | Partial | Built: hero, problem, approach, solution, insights, impact, technical details, related. Missing: dedicated Data section, Challenges/Lessons |
| §15 | Project hero + metadata + GitHub | Implemented | Six metadata tiles; GitHub CTA when URL exists |
| §16 | Business problem + key questions | Implemented | |
| §17 | Data flow section | Partial | Data source shown as a hero metadata tile only |
| §18–§19 | Approach / solution flows | Implemented | Horizontal step flows with arrows (no diagram images) |
| §20 | Business findings as insights | Implemented | Numbered insight cards; supporting charts pending |
| §21 | Honest business impact wording | Implemented | No fabricated numbers; aggregates/percentages only |
| §22 | Technical details section | Implemented | Four static cards (not collapsible) |
| §23 | GitHub integration with three states | Implemented | Button only when URL present; no defensive copy |
| §24 | Confidentiality / sanitization rules | Implemented | Applied to all published content; proof repo uses synthetic data |
| §25 | Experience timeline | Implemented | Shows real employer name (deliberate: consistent with résumé/LinkedIn) |
| §26 | Skills by category, no progress bars | Implemented | 4 categories, 17 skills |
| §27 | Education & certification, understated | Implemented | S.Kom, GPA, CADS badge — rendered inside Education tab |
| §28 | Short About | Partial | Single bio paragraph in sidebar; no standalone section |
| §29 | Contact without form | Implemented | Footer + sidebar: Email, LinkedIn, GitHub, Résumé |
| §30 | Clean analytical visual direction | Deviation | Palette is charcoal + muted blue rather than navy + orange (class names retained as aliases) |
| §31 | Responsive breakpoints | Implemented | Sidebar stacks on mobile; single-column card list |
| §32 | Card hover / smooth scroll | Partial | Hover effects and smooth scrolling present; no lightbox |
| §33 | Tech stack (Next, TS, Tailwind, shadcn, Lucide, Vercel, GitHub) | Implemented | Content as typed objects (JSON), not MDX |
| §34 | No CMS; content separate from UI | Implemented | Extended with a dev-only admin panel (outside original MVP scope, which excluded admin) |
| §36 | Per-project SEO metadata + OG image | Partial | Root metadata only; no per-project metadata, no OG image |
| §37 | Lighthouse >90, LCP <2.5 s | Partial | Next.js defaults applied (code splitting, `next/image`, font optimization); not formally audited |
| §38 | Accessibility baseline | Partial | Semantic HTML, alt text, visible hover/focus states, text-first insights; no formal audit |
| §39 | Analytics events | Not implemented | |
| §40 | MVP scope | Implemented | Plus dev-only admin (deliberate extension) |
| §43 | Future versions (embeds, deep dives, notes) | Not implemented | Roadmap unchanged |

## Acceptance Criteria Status (original §42)

| # | Criterion | Status |
|---|---|---|
| 1 | Homepage opens without errors | ✅ |
| 2 | Visitor immediately sees identity, role, selected projects | ✅ |
| 3 | At least 5 project cards | ✅ (6) |
| 4 | Every card opens a case study | ✅ |
| 5 | Case studies contain Business Problem, Approach, Insights, Implementation | ✅ |
| 6 | Responsive | ✅ |
| 7 | Résumé downloadable | ⚠️ File present and linked — still the placeholder, final résumé pending |
| 8 | LinkedIn and GitHub links work | ✅ |
| 9 | No confidential company data | ✅ (sanitization rules applied) |
| 10 | Images optimized | ⚠️ Only profile photo exists (via `next/image`); covers pending |
| 11 | Mobile navigation works | ✅ (tab navigation, no separate mobile menu needed) |
| 12 | Project pages have SEO metadata | ⚠️ Root-level only; per-project metadata pending |
| 13 | Lighthouse performance in good range | ⚠️ Not formally audited |
| 14 | Content in professional English | ✅ |

## Further Notes

- **Pending content review:** only the flagship case study (`customer-retention`) has been fully reviewed against its analysis source; the other five carry structured but provisional content and should be factually verified before wide promotion.
- **Pending assets:** project cover images (referenced by the `cover` field), OG image, final résumé PDF.
- **Known functional gaps:** per-project SEO metadata, analytics events, `/projects` index route (requests to it return 404 by design), tabs not URL-addressable.
- **Data-integrity note:** three broken em-dash characters in `projects.json` (double-encoded UTF-8) were corrected on 2026-10-06.
- **Related repositories:** site source — `github.com/irsydmuhf/portfolio-irsyad`; flagship proof repo — `github.com/irsydmuhf/customer-retention-analysis`.
- Detailed technical reference: [`TECHNICAL-DOCUMENTATION.md`](./TECHNICAL-DOCUMENTATION.md).

---

## v2 Update — Supabase CMS (2026-10-07)

The v1 limitation "content edited via a development-only JSON admin" is superseded.

- **Content store:** Supabase Postgres + Storage replace `src/data/projects.json` (kept read-only as a backup). The six existing slugs are unchanged.
- **Admin:** `/admin` (email + password, owner-only via `admin_users` + RLS) with project list, create/edit form, repeatable editors (key questions, process steps, insights, links, related projects), private provenance panel, media/cover upload, draft preview, publish/unpublish with a validation gate, featured flag and drag-and-drop ordering.
- **Public template:** one shared renderer (`CaseStudyView`) for public pages and previews, with an automatic responsive process diagram; empty sections are omitted.
- **SEO:** per-project title, description, canonical URL and Open Graph tags; admin and previews are `noindex`.
- **Removed:** the development-only JSON editor and all JSON write paths.
- **Not included:** multi-user roles, slug-redirect table, analytics, search, comments, lightbox.

See `docs/TECHNICAL-DOCUMENTATION.md` and `docs/CMS-OPERATIONS.md`.
