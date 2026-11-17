-- 009_add_instagram_and_qr_target.sql
-- ID card redesign: the card carries a real, scannable QR code. The owner picks
-- which profile it opens (LinkedIn by default) in admin "Profile & Site".
-- Instagram becomes a first-class contact link (Let's Connect + footer).
-- Additive and idempotent; existing rows get the defaults.

alter table public.site_settings
  add column if not exists instagram_url text not null default '',
  add column if not exists qr_target     text not null default 'linkedin';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_settings_qr_target_check'
  ) then
    alter table public.site_settings
      add constraint site_settings_qr_target_check
      check (qr_target in ('linkedin', 'instagram', 'github', 'none'));
  end if;
end
$$;
