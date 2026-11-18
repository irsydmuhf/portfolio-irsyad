-- 010_add_printer_project.sql
-- Hero redesign: the paper coming out of the monitor's printer can show one
-- published project (cover thumbnail + title) picked in admin "Profile & Site".
-- Null = the default "Monthly Report" paper. If the project is deleted the
-- pick clears itself; if it is unpublished or has no cover the site falls
-- back to the default paper at read time.
-- Additive and idempotent.

alter table public.site_settings
  add column if not exists printer_project_id uuid
    references public.projects (id) on delete set null;
