-- 007_create_content_tables.sql
-- Owner scope extension (plan Phase 13): CRUD for all site content, not just
-- projects. Save-and-live semantics — everything here is public the moment it
-- is saved (no draft status); RLS still separates public reads from admin
-- writes. Seed rows mirror the previously hardcoded values 1:1
-- (ProfileCard, HomeClient, experience.ts, Skills.tsx, skills.ts, layout.tsx).

-- ---------------------------------------------------------------- singleton
create table if not exists public.site_settings (
  id text primary key check (id = 'main'),

  -- profile sidebar
  display_name     text not null default '',
  role_line        text not null default '',
  bio              text not null default '',
  email            text not null default '',
  linkedin_url     text not null default '',
  linkedin_label   text not null default '',
  github_url       text not null default '',
  github_label     text not null default '',
  location         text not null default '',
  avatar_path      text not null default '',

  -- homepage header
  availability_text   text not null default '',
  headline            text not null default '',
  headline_highlight  text not null default '',
  tagline             text not null default '',

  -- footer
  resume_url       text not null default '/resume.pdf',

  -- SEO (root layout metadata)
  seo_title        text not null default '',
  seo_description  text not null default '',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- experiences
create table if not exists public.experiences (
  id              uuid primary key default gen_random_uuid(),
  period          text not null check (char_length(period) between 1 and 60),
  role            text not null check (char_length(role) between 1 and 120),
  company         text not null check (char_length(company) between 1 and 120),
  division        text not null default '',
  employment_type text not null default '',
  highlights      text[] not null default '{}',
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists experiences_order_idx
  on public.experiences (display_order);

drop trigger if exists experiences_touch_updated_at on public.experiences;
create trigger experiences_touch_updated_at
  before update on public.experiences
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- educations
create table if not exists public.educations (
  id              uuid primary key default gen_random_uuid(),
  degree          text not null check (char_length(degree) between 1 and 160),
  institution     text not null default '',
  detail          text not null default '',   -- e.g. "GPA 3.80 / 4.00"
  badge           text not null default '',   -- e.g. "CADS"
  certifications  text[] not null default '{}',
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists educations_order_idx
  on public.educations (display_order);

drop trigger if exists educations_touch_updated_at on public.educations;
create trigger educations_touch_updated_at
  before update on public.educations
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------ skill categories
create table if not exists public.skill_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 80),
  skills        text[] not null default '{}',
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists skill_categories_order_idx
  on public.skill_categories (display_order);

drop trigger if exists skill_categories_touch_updated_at on public.skill_categories;
create trigger skill_categories_touch_updated_at
  before update on public.skill_categories
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------------ RLS
alter table public.site_settings    enable row level security;
alter table public.experiences      enable row level security;
alter table public.educations       enable row level security;
alter table public.skill_categories enable row level security;

-- Public reads: all of this content is public by design (save-and-live).
drop policy if exists site_settings_select on public.site_settings;
create policy site_settings_select on public.site_settings
  for select using (true);

drop policy if exists experiences_select on public.experiences;
create policy experiences_select on public.experiences
  for select using (true);

drop policy if exists educations_select on public.educations;
create policy educations_select on public.educations
  for select using (true);

drop policy if exists skill_categories_select on public.skill_categories;
create policy skill_categories_select on public.skill_categories
  for select using (true);

-- Admin writes only (is_admin() membership, same shape as 005).
drop policy if exists site_settings_write on public.site_settings;
create policy site_settings_write on public.site_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists experiences_write on public.experiences;
create policy experiences_write on public.experiences
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists educations_write on public.educations;
create policy educations_write on public.educations
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists skill_categories_write on public.skill_categories;
create policy skill_categories_write on public.skill_categories
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------- seeds
-- Singleton: seed only when the row does not exist; later admin edits survive
-- re-runs of the migration.
insert into public.site_settings (
  id, display_name, role_line, bio, email,
  linkedin_url, linkedin_label, github_url, github_label,
  location, avatar_path,
  availability_text, headline, headline_highlight, tagline,
  resume_url, seo_title, seo_description
)
values (
  'main',
  'Irsyad Muhamad Firdaus',
  'Data Analyst | Python, SQL, Analytics',
  'I''m a data analyst with experience in turning complex datasets into actionable business insights. Skilled in Python, SQL, and data visualization, I transform raw data into clear stories that drive smarter decisions. Currently focused on e-commerce, marketplace, and customer analytics to help businesses optimize performance and profitability.',
  'irsyad.muhf@gmail.com',
  'https://linkedin.com/in/irsyadmuhf',
  'linkedin.com/in/irsyadmuhf',
  'https://github.com/irsydmuhf',
  'github.com/irsydmuhf',
  'Indonesia',
  '/profile/profile.jpg',
  'Available for Work',
  'Welcome to My',
  'Data Analytics Portfolio',
  'Turning complex datasets into confident business decisions.',
  '/resume.pdf',
  'Irsyad Muhamad Firdaus — Data Analytics Portfolio',
  'Data Analyst turning marketplace, customer, and operational data into actionable business insights. E-commerce analytics, customer retention, reporting automation, and marketplace data pipelines.'
)
on conflict (id) do nothing;

-- Lists: seed only while empty (baseline parity); admin edits/deletes survive
-- re-runs.
insert into public.experiences (
  period, role, company, division, employment_type, highlights, display_order
)
select * from (values
  ('Oct 2025 — Present', 'Data Analyst', 'PT. Relasi Digital Marketing', 'Data & IT', 'Full-time',
   array['Marketplace analytics', 'Customer analytics', 'Reporting automation', 'Data pipeline', 'Operational analytics'], 1),
  ('Aug 2025 — Oct 2025', 'Data Analyst Intern', 'PT. Relasi Digital Marketing', 'Data & IT', 'Internship',
   array['Data analysis', 'Report generation', 'Dashboard development'], 2)
) as v(period, role, company, division, employment_type, highlights, display_order)
where not exists (select 1 from public.experiences);

insert into public.educations (
  degree, institution, detail, badge, certifications, display_order
)
select * from (values
  ('S.Kom. — Bachelor of Computer Science', 'Universitas Muhammadiyah Magelang',
   'GPA 3.80 / 4.00', 'CADS',
   array['Certified Associate Data Scientist'], 1)
) as v(degree, institution, detail, badge, certifications, display_order)
where not exists (select 1 from public.educations);

insert into public.skill_categories (name, skills, display_order)
select * from (values
  ('Analytics', array['SQL', 'Customer Analytics', 'Cohort Analysis', 'Business Metrics', 'EDA'], 1),
  ('Data & Automation', array['Python', 'Pandas', 'Google Apps Script', 'API Integration', 'ETL'], 2),
  ('BI & Reporting', array['Power BI', 'Looker Studio', 'Google Sheets'], 3),
  ('Data Systems', array['Data Cleaning', 'Data Validation', 'Data Modeling', 'Workflow Automation'], 4)
) as v(name, skills, display_order)
where not exists (select 1 from public.skill_categories);
