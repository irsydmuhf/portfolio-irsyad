# Technical Documentation (v2 — Supabase CMS)

## Stack

Next.js 16 (App Router, Turbopack, `proxy.ts`) · React 19 · Tailwind CSS 4 · Supabase (Auth, Postgres + RLS, Storage) · Zod · react-markdown · dnd-kit · Vitest.

> Next.js 16 renamed `middleware.ts` to `proxy.ts`. Read `node_modules/next/dist/docs/` before changing framework-level code.

## Routes

| Route | Kind | Notes |
|---|---|---|
| `/` | ISR (5 min) + on-demand | published **and** featured projects, by `display_order` |
| `/projects/[slug]` | ISR + on-demand | published only; unpublished/unknown → 404; per-project metadata |
| `/admin/login` | dynamic | email + password |
| `/admin` | dynamic | dashboard stats |
| `/admin/projects` | dynamic | list, status filter, featured toggle, delete |
| `/admin/projects/new`, `/[id]/edit` | dynamic | project form + media editor |
| `/admin/projects/[id]/preview` | dynamic | same renderer as public, `noindex` |
| `/admin/projects/reorder` | dynamic | drag-and-drop + buttons |

## Defense in depth

1. `src/proxy.ts` — refreshes the session and optimistically redirects visitors without a session cookie.
2. `src/app/admin/(panel)/layout.tsx` — `requireAdmin()` guard.
3. Every server action calls `requireAdmin()` first (`project-actions.ts`, `media-actions.ts`).
4. Postgres RLS (`is_admin()`), including storage policies — the final boundary.

`requireAdmin()` (`src/lib/admin/require.ts`) verifies the session with `auth.getUser()` and then a row in `admin_users`.

## Data model

`projects` + children `project_steps`, `project_insights`, `project_media`, `project_links`, `project_related`, plus admin-only `project_private_meta` and `admin_users`. See `supabase/migrations/001–006`.

- Anonymous reads are limited to `status = 'published'` rows and their children.
- `project_private_meta` has no public read path.
- Bucket `portfolio-media`: public read, admin-only write/delete.

## Code map

| Path | Role |
|---|---|
| `src/lib/projects/schema.ts` | Zod schemas, slug/URL helpers, publish gate (shared by client and server) |
| `src/lib/projects/media.ts` | upload validation (MIME sniffing, 8 MB, no SVG) |
| `src/lib/projects/queries.ts` | public read queries (anon client, published only) and the case-study view-model |
| `src/lib/projects/admin.ts` | admin reads through the session-bound client |
| `src/app/admin/project-actions.ts` | save / publish / unpublish / feature / delete / reorder |
| `src/app/admin/media-actions.ts` | media + cover upload, update, reorder, delete |
| `src/components/case-study/*` | `CaseStudyView` (the single renderer), `ProjectProcessFlow`, `Markdown`, `SafeImage` |

## Save path

`saveProject` validates with Zod, checks slug uniqueness, updates `projects`, then replaces child rows. PostgREST has no multi-statement transaction, so the action snapshots the child rows first and restores them if any later step fails (a failed create deletes the new row). Private meta is upserted into its own table.

## Case-study renderer

`CaseStudyView` renders Hero → Overview → Business Problem (+ Key Questions) → What I Did (process flow) → Approach → Solution → Visuals → Insights → Impact → Technical Details → Related. Empty optional sections are omitted. The process flow is an ordered list in plain HTML/CSS: vertical on mobile, a grid of up to 4 columns on desktop, arrows only between steps.

## Caching

Public pages use `revalidate = 300`. Mutations call `revalidatePath` for `/` and the affected `/projects/<slug>`, so publish, unpublish and edits appear immediately.

## Testing

- `npm test` — Vitest unit tests (slug, URL, publish gate, upload validation).
- `scripts/verify-cms-flow.mjs` — drives the real server actions over HTTP (Next-Action protocol, request bodies encoded by React's `encodeReply`) against the live Supabase project: authorization matrix, CRUD, publish gate, media, storage policies, reorder, delete cleanup.
- `scripts/verify-auth-flow.mjs`, `scripts/verify-rls.mjs` — auth lifecycle and anonymous RLS / storage matrix.

## Known limits

- Multi-row saves are compensating, not transactional (see Save path).
- `project_slug_redirects` is not implemented; a published slug cannot be changed.
- No analytics, search, comments, lightbox, or multi-user roles.
