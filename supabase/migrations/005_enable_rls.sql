-- 005_enable_rls.sql
-- Row Level Security for every table (PRD §12).
--   public:   read ONLY published projects + their children
--   admin:    full CRUD via public.is_admin() membership check
--   private:  project_private_meta is admin-only in all cases
--   drafts:   invisible to anonymous (§12.4)

alter table public.admin_users          enable row level security;
alter table public.projects             enable row level security;
alter table public.project_steps        enable row level security;
alter table public.project_insights     enable row level security;
alter table public.project_media        enable row level security;
alter table public.project_links        enable row level security;
alter table public.project_related      enable row level security;
alter table public.project_private_meta enable row level security;

-- ---------------------------------------------------------------- admin_users
drop policy if exists admin_users_select on public.admin_users;
create policy admin_users_select on public.admin_users
  for select
  using (user_id = auth.uid() or public.is_admin());
-- No insert/update/delete policies: membership rows are managed manually
-- (dashboard/SQL as postgres), never from the client.

-- ---------------------------------------------------------------- projects
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select
  using (status = 'published' or public.is_admin());

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert
  with check (public.is_admin());

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
  for delete
  using (public.is_admin());

-- ------------------------------------------------------- children: read rule
-- Same shape for every child table: published parent (or admin).
drop policy if exists steps_select on public.project_steps;
create policy steps_select on public.project_steps
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.status = 'published' or public.is_admin())
    )
  );

drop policy if exists insights_select on public.project_insights;
create policy insights_select on public.project_insights
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.status = 'published' or public.is_admin())
    )
  );

drop policy if exists media_select on public.project_media;
create policy media_select on public.project_media
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.status = 'published' or public.is_admin())
    )
  );

drop policy if exists links_select on public.project_links;
create policy links_select on public.project_links
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.status = 'published' or public.is_admin())
    )
  );

drop policy if exists related_select on public.project_related;
create policy related_select on public.project_related
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.status = 'published' or public.is_admin())
    )
  );

-- ----------------------------------------------------- children: admin writes
drop policy if exists steps_write on public.project_steps;
create policy steps_write on public.project_steps
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists insights_write on public.project_insights;
create policy insights_write on public.project_insights
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists media_write on public.project_media;
create policy media_write on public.project_media
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists links_write on public.project_links;
create policy links_write on public.project_links
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists related_write on public.project_related;
create policy related_write on public.project_related
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------- project_private_meta
-- Admin-only, no public read path at all (§12.3).
drop policy if exists private_meta_all on public.project_private_meta;
create policy private_meta_all on public.project_private_meta
  for all
  using (public.is_admin())
  with check (public.is_admin());
