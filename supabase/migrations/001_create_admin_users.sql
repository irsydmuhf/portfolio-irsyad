-- 001_create_admin_users.sql
-- Owner membership table (PRD §10.2). The owner row is inserted manually;
-- there is NO self-signup path into this table.

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Security-definer helper so policies on other tables can check membership
-- without recursing into admin_users' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;
