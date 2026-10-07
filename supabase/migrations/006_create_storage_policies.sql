-- 006_create_storage_policies.sql
-- Storage bucket + policies (PRD §13): public read, admin-only write.
-- Object paths are generated as projects/<project-id>/<uuid>.<ext> by the app;
-- original filenames are never trusted (§13.5).

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

-- Public read of portfolio assets (only sanitized media is ever uploaded, §13.2).
drop policy if exists "portfolio_media_public_read" on storage.objects;
create policy "portfolio_media_public_read" on storage.objects
  for select
  using (bucket_id = 'portfolio-media');

-- Admin-only writes (§13.2). Enforced again app-side: MIME allowlist,
-- 8 MB limit, SVG disabled (§13.3–13.4).
drop policy if exists "portfolio_media_admin_insert" on storage.objects;
create policy "portfolio_media_admin_insert" on storage.objects
  for insert
  with check (bucket_id = 'portfolio-media' and public.is_admin());

drop policy if exists "portfolio_media_admin_update" on storage.objects;
create policy "portfolio_media_admin_update" on storage.objects
  for update
  using (bucket_id = 'portfolio-media' and public.is_admin())
  with check (bucket_id = 'portfolio-media' and public.is_admin());

drop policy if exists "portfolio_media_admin_delete" on storage.objects;
create policy "portfolio_media_admin_delete" on storage.objects
  for delete
  using (bucket_id = 'portfolio-media' and public.is_admin());
