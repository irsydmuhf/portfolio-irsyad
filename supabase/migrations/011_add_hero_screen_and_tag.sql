-- 011_add_hero_screen_and_tag.sql
-- Hero "small details" editable from admin "Profile & Site":
--   * monitor screen: two title lines + the terminal-style query line
--   * red tag on the monitor's edge: text (empty hides it) + optional link
-- Defaults reproduce the current hard-coded look, so existing rows are unchanged.
-- Additive and idempotent.

alter table public.site_settings
  add column if not exists screen_line1 text not null default 'PORTO',
  add column if not exists screen_line2 text not null default 'FOLIO',
  add column if not exists screen_query text not null default 'SELECT insight FROM data',
  add column if not exists tag_text     text not null default 'Insights',
  add column if not exists tag_url      text not null default '';
