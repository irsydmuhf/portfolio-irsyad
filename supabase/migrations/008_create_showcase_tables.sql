-- 008_create_showcase_tables.sql
-- Homepage redesign: the "Tech Stack" logo grid and the "Certifications &
-- Achievements" timeline become CMS-managed (previously src/data/showcase.ts).
-- Same save-and-live + RLS shape as 007. Seeds mirror showcase.ts 1:1.

-- --------------------------------------------------------------- tech stack
create table if not exists public.tech_stack (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 60),
  -- simple-icons slug from the curated list in src/lib/content/tech-icons.ts
  icon_slug     text not null default '',
  -- fallback glyph when no logo exists (e.g. "BI" for Power BI)
  letters       text not null default '' check (char_length(letters) <= 4),
  -- tile color "#rrggbb"; empty = the logo's brand color
  color         text not null default '' check (color = '' or color ~ '^#[0-9A-Fa-f]{6}$'),
  -- uploaded PNG/JPG/WebP logo (public URL); overrides icon/letters
  image_path    text not null default '',
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists tech_stack_order_idx
  on public.tech_stack (display_order);

drop trigger if exists tech_stack_touch_updated_at on public.tech_stack;
create trigger tech_stack_touch_updated_at
  before update on public.tech_stack
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------- achievements
create table if not exists public.achievements (
  id            uuid primary key default gen_random_uuid(),
  date_label    text not null check (char_length(date_label) between 1 and 40),
  title         text not null check (char_length(title) between 1 and 120),
  subtitle      text not null default '',
  issuer        text not null default '',
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists achievements_order_idx
  on public.achievements (display_order);

drop trigger if exists achievements_touch_updated_at on public.achievements;
create trigger achievements_touch_updated_at
  before update on public.achievements
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------------ RLS
alter table public.tech_stack   enable row level security;
alter table public.achievements enable row level security;

drop policy if exists tech_stack_select on public.tech_stack;
create policy tech_stack_select on public.tech_stack
  for select using (true);

drop policy if exists achievements_select on public.achievements;
create policy achievements_select on public.achievements
  for select using (true);

drop policy if exists tech_stack_write on public.tech_stack;
create policy tech_stack_write on public.tech_stack
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists achievements_write on public.achievements;
create policy achievements_write on public.achievements
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------- seeds
insert into public.tech_stack (name, icon_slug, letters, color, display_order)
select * from (values
  ('Python',             'python',           '',    '',        0),
  ('SQL / PostgreSQL',   'postgresql',       '',    '',        1),
  ('Pandas',             'pandas',           '',    '',        2),
  ('Power BI',           '',                 'BI',  '#F2C811', 3),
  ('Looker Studio',      '',                 'LS',  '#4285F4', 4),
  ('Google Sheets',      'googlesheets',     '',    '',        5),
  ('Google Apps Script', 'googleappsscript', '',    '',        6),
  ('AWS Cloud',          '',                 'aws', '#232F3E', 7),
  ('Supabase',           'supabase',         '',    '',        8),
  ('Git',                'git',              '',    '',        9),
  ('GitHub',             'github',           '',    '',        10)
) as v(name, icon_slug, letters, color, display_order)
where not exists (select 1 from public.tech_stack);

insert into public.achievements (date_label, title, subtitle, issuer, display_order)
select * from (values
  ('Dec 2024', 'Cloud Practitioner Essentials', 'AWS Cloud',                'Dicoding Indonesia',            0),
  ('Jan 2026', 'Big Data Analytics',            'Project-Based Internship', 'Rakamin Academy x Kimia Farma', 1),
  ('Sep 2026', 'Associate Data Scientist',      'Certified (CADS)',         'BNSP',                          2)
) as v(date_label, title, subtitle, issuer, display_order)
where not exists (select 1 from public.achievements);
