# CMS Operations Guide

How to run the portfolio CMS day to day. Content lives in Supabase (Postgres + Storage); the Next.js site reads it and the admin panel at `/admin` edits it.

## Environment

Set in `.env.local` (development) and in Vercel → Settings → Environment Variables (production):

| Variable | Purpose | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key, always subject to RLS | public |
| `NEXT_PUBLIC_SITE_URL` | canonical site URL (metadata, Open Graph) | public |
| `SUPABASE_SERVICE_ROLE_KEY` | only for local verification scripts | **never** in Vercel, never `NEXT_PUBLIC_` |
| `SUPABASE_DB_URL` | session-pooler URL for `npm run db:apply` | local only |

The app itself never uses the service-role key. Do not add it to the Vercel project.

## Logging in

1. Open `/admin` (there is no public link to it). You are redirected to `/admin/login`.
2. Sign in with the owner email + password. Only users with a row in `admin_users` get in; any other signed-in user is shown "Admin access required".
3. Sessions refresh automatically. An expired session sends you back to the login page with a message.
4. **Sign out** is at the bottom of the sidebar.

The owner row is added manually (Supabase SQL editor): `insert into admin_users (user_id) select id from auth.users where email = '<owner email>';`

**Signup must stay disabled** in Supabase → Authentication → Sign In / Providers → Email → *Allow new users to sign up = off*. Even if it were on, a new user has no `admin_users` row and is denied by `requireAdmin()` and by RLS.

## Creating and editing a project

`/admin/projects` → **+ New project**.

- **Title** is required; the **slug** is generated from it (lowercase, hyphens) and can be edited until the project is first published. A duplicate slug is rejected.
- **Save Draft** only needs a title and slug. Drafts are never visible to the public.
- Repeatable blocks (key questions, process steps, insights, links) support add, remove and move up/down. Step order drives the public process diagram (2–8 steps).
- Narrative fields accept Markdown. Raw HTML is not rendered.
- The yellow **INTERNAL / NOT PUBLIC** section is stored in a separate admin-only table.
- The page warns before you leave with unsaved changes.

## Media and cover

On a saved project's edit page (below the form):

- Upload JPEG, PNG, WebP or AVIF, up to 8 MB. SVG is rejected. **Alt text is required.**
- Files are stored as `projects/<project-id>/<random-id>.<ext>`; the original filename is ignored.
- External images must be `https://` URLs. Broken images fall back to a placeholder.
- Deleting an image removes its database row and its storage object. Only the project's own folder is touched.
- No cover? The page keeps its typographic hero.

## Preview, publish, unpublish

- **Preview** (`/admin/projects/<id>/preview`) renders the exact public template with a `DRAFT PREVIEW` banner and `noindex`.
- **Publish** needs: title, category, summary, description, business problem, at least 2 steps, at least 1 tool, and both checklist confirmations (content verified, nothing confidential). A blocked publish names the missing item. Warnings (no cover, insights, impact, links, images) do not block.
- Publishing, unpublishing and editing a published project update the public site immediately.
- **Unpublish** returns the public URL as 404; the draft stays editable and previewable.
- A published project's slug is locked. Unpublish first if it must change (the old URL will 404).

## Featured and ordering

- **Featured** controls the homepage "Selected Work" list. Non-featured published projects stay reachable by URL.
- `/admin/projects/reorder`: drag the handle, or use the up/down buttons (keyboard accessible), then **Save order**. The homepage orders by this.
- Up to 8 projects show on one page; pagination only appears above that.

## Deleting

**Delete** in the projects list asks for confirmation, removes the project, its child rows and its storage folder. This cannot be undone.

## Backup and recovery

- The original v1 content is in `plans/backup/projects-v1-2026-10-07.json` and `src/data/projects.json` (read-only, no longer written by the app).
- Enable Supabase backups (Dashboard → Database → Backups). For a manual copy, use `pg_dump` with the session-pooler URL, and download the `portfolio-media` bucket.
- Re-seeding from JSON: `npm run db:migrate` (idempotent, upserts by slug). This **overwrites** DB edits for those slugs, so use it only for disaster recovery.

## Verification scripts

Run against the live Supabase project; they create and remove their own probe users and project.

```bash
npm run build && npx next start -p 3100   # terminal 1
npm run auth:verify                        # login / logout / authorization
npm run cms:verify                         # CRUD, publish gate, media, reorder, RLS
npm run db:verify                          # anonymous RLS + storage matrix
npm test                                   # unit tests
```

## Migrations

SQL lives in `supabase/migrations/` and is idempotent. Apply with `npm run db:apply` (needs `SUPABASE_DB_URL`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Admin access required" after login | the user has no `admin_users` row |
| Save says "Something went wrong" | check server logs (`[cms]` prefix); details are never shown in the UI |
| Upload fails on large files | limit is 8 MB; the server action body limit is 9 MB (`next.config.ts`) |
| Public page not updating | publish/unpublish/edit revalidate immediately; otherwise pages refresh every 5 minutes |
| `fetch failed` during build on some networks | `NODE_OPTIONS=--dns-result-order=ipv4first npm run build` |
