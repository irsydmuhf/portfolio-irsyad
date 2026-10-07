-- 002_create_projects.sql
-- Public-safe primary project record (PRD §11.1).
-- Additive columns beyond the PRD's suggested schema:
--   focus, project_type  -> preserve v1 card/hero metadata (plan: content mapping).
-- NOT NULL fields carry defaults so a minimal draft (title + slug, PRD §58) can be
-- saved; publish-level completeness is enforced app-side by Zod (PRD §34).

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.projects (
  id                  uuid primary key default gen_random_uuid(),

  slug                text unique not null check (char_length(slug) between 3 and 120),
  title               text not null check (char_length(title) between 3 and 120),
  category            text not null default '',
  summary             text not null default '',

  description         text not null default '',
  business_problem    text not null default '',

  key_questions       text[] not null default '{}',

  role                text,
  domain              text,
  data_context        text,
  project_period      text,
  focus               text,
  project_type        text,

  approach_summary    text,
  solution_summary    text,
  impact_summary      text,

  tools               text[] not null default '{}',

  technical_analytics     text[] not null default '{}',
  technical_processing    text[] not null default '{}',
  technical_automation    text[] not null default '{}',
  technical_visualization text[] not null default '{}',

  status              text not null default 'draft' check (status in ('draft', 'published')),
  featured            boolean not null default false,
  display_order       integer not null default 0,

  cover_storage_path  text,
  cover_alt           text,
  cover_caption       text,

  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists projects_status_featured_order_idx
  on public.projects (status, featured, display_order);

create index if not exists projects_updated_at_idx
  on public.projects (updated_at desc);

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();
