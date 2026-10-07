-- 003_create_project_children.sql
-- Child tables: steps (PRD §11.2), insights (§11.3), media (§11.4),
-- links (§11.5), related projects (§11.6).

create table if not exists public.project_steps (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  description text,
  step_order  integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists project_steps_project_order_idx
  on public.project_steps (project_id, step_order);

drop trigger if exists project_steps_touch_updated_at on public.project_steps;
create trigger project_steps_touch_updated_at
  before update on public.project_steps
  for each row execute function public.touch_updated_at();

create table if not exists public.project_insights (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null,
  description text not null,
  insight_order integer not null
);

create index if not exists project_insights_project_order_idx
  on public.project_insights (project_id, insight_order);

create table if not exists public.project_media (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  source_type  text not null check (source_type in ('upload', 'external')),
  storage_path text,
  external_url text,
  alt_text     text not null,
  caption      text,
  layout       text not null default 'full' check (layout in ('full', 'half', 'gallery')),
  media_order  integer not null default 0,
  created_at   timestamptz not null default now(),
  -- PRD §11.4 validation: exactly one source, matching the source_type.
  constraint project_media_source_check check (
    (source_type = 'upload'  and storage_path is not null and external_url is null)
    or
    (source_type = 'external' and external_url is not null and storage_path is null)
  )
);

create index if not exists project_media_project_order_idx
  on public.project_media (project_id, media_order);

create table if not exists public.project_links (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  link_type  text not null check (link_type in ('github', 'dashboard', 'demo', 'documentation', 'article', 'other')),
  label      text not null,
  url        text not null,
  link_order integer not null default 0
);

create index if not exists project_links_project_order_idx
  on public.project_links (project_id, link_order);

create table if not exists public.project_related (
  project_id         uuid not null references public.projects (id) on delete cascade,
  related_project_id uuid not null references public.projects (id) on delete cascade,
  display_order      integer not null default 0,
  primary key (project_id, related_project_id),
  constraint project_related_no_self check (project_id <> related_project_id)
);

create index if not exists project_related_related_idx
  on public.project_related (related_project_id);
