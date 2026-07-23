-- Run this file after 0002_add_super_admin_role.sql has completed successfully.
revoke update on public.profiles from authenticated;
grant update (full_name, active_mode, locale) on public.profiles to authenticated;
grant update (role) on public.profiles to authenticated;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists "admins can read profiles" on public.profiles;
create policy "admins can read profiles"
on public.profiles for select
using (public.current_app_role() in ('admin', 'super_admin'));

drop policy if exists "super admins can update roles" on public.profiles;
create policy "super admins can update roles"
on public.profiles for update
using (public.current_app_role() = 'super_admin')
with check (public.current_app_role() = 'super_admin');

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant select, insert on public.admin_audit_logs to authenticated;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "super admins read audit logs" on public.admin_audit_logs;
create policy "super admins read audit logs"
on public.admin_audit_logs for select
using (public.current_app_role() = 'super_admin');

drop policy if exists "admins write audit logs" on public.admin_audit_logs;
create policy "admins write audit logs"
on public.admin_audit_logs for insert
with check (auth.uid() = actor_id and public.current_app_role() in ('admin', 'super_admin'));
