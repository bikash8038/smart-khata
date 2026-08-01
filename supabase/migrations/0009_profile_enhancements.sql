-- Migration 0009_profile_enhancements.sql
-- Run this migration in your Supabase SQL Editor to support profile settings and email sync.

-- 1. Ensure email column exists (in case 0008_profile_email_and_sync was not applied)
alter table public.profiles add column if not exists email text;

-- 2. Add username column if not exists
alter table public.profiles add column if not exists username text;
alter table public.profiles drop constraint if exists profiles_username_key;
alter table public.profiles add constraint profiles_username_key unique (username);

-- 3. Add other profile details columns
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists scheduled_deletion_date timestamptz;
alter table public.profiles add column if not exists status text not null default 'Active';

-- 4. Sync email values from auth.users to public.profiles where empty (safe)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

-- 5. Update public.handle_new_user() trigger function to populate email and other defaults
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, active_mode, locale, is_verified, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'user',
    'personal',
    'ne',
    false,
    'Active'
  );
  return new;
end;
$$;

-- 6. Grant appropriate table permissions to anon, authenticated, and service_role
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on table public.profiles to postgres, anon, authenticated, service_role;
