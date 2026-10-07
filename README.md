# Irsyad Muhamad Firdaus — Data Analytics Portfolio

Next.js 16 portfolio with a Supabase-backed CMS. Visitors see published case studies; the owner manages content at `/admin`.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint`, `npm test` | ESLint, Vitest unit tests |
| `npm run db:apply` | apply `supabase/migrations/*.sql` (needs `SUPABASE_DB_URL`) |
| `npm run db:migrate` | one-off seed of `src/data/projects.json` into Supabase |
| `npm run db:verify`, `auth:verify`, `cms:verify` | live verification against the real project (see docs) |

## Documentation

- [`docs/CMS-OPERATIONS.md`](docs/CMS-OPERATIONS.md) — owner guide: login, edit, media, preview, publish, reorder, backup
- [`docs/TECHNICAL-DOCUMENTATION.md`](docs/TECHNICAL-DOCUMENTATION.md) — architecture, security model, code map
- [`docs/PRD.md`](docs/PRD.md) — product requirements (as-built, with v2 changes)
- [`plans/portfolio-cms-v2.md`](plans/portfolio-cms-v2.md) — implementation plan and phase status

## Security notes

Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL` are needed in production. Never set the service-role key in Vercel.
