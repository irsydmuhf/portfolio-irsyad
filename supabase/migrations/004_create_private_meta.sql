-- 004_create_private_meta.sql
-- Private provenance (PRD §11.7) — admin-only, never returned by public queries.

create table if not exists public.project_private_meta (
  project_id                  uuid primary key references public.projects (id) on delete cascade,

  original_work_titles        text[] not null default '{}',
  internal_notes              text,
  internal_source_references  text[] not null default '{}',
  confidentiality_notes       text,

  content_verified            boolean not null default false,
  confidentiality_confirmed   boolean not null default false,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

drop trigger if exists project_private_meta_touch_updated_at on public.project_private_meta;
create trigger project_private_meta_touch_updated_at
  before update on public.project_private_meta
  for each row execute function public.touch_updated_at();
