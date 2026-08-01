-- Migration 0010_super_admin_management.sql
-- Run this migration in your Supabase SQL Editor to allow Super Admins to update user credentials.

create or replace function public.admin_update_user(
  target_user_id uuid,
  new_username text,
  new_password text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  caller_role public.app_role;
begin
  -- 1. Check if the logged-in user is a super_admin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is null or caller_role != 'super_admin' then
    raise exception 'Permission denied: Only super admins can update user credentials.';
  end if;

  -- 2. Update username in public.profiles table
  if new_username is not null and new_username != '' then
    update public.profiles
    set username = new_username
    where id = target_user_id;
  end if;

  -- 3. Update encrypted password in auth.users table
  if new_password is not null and new_password != '' then
    update auth.users
    set encrypted_password = crypt(new_password, gen_salt('bf'))
    where id = target_user_id;
  end if;
end;
$$;

-- 4. Grant execution permissions on admin_update_user function
grant usage on schema public to anon, authenticated, service_role;
grant execute on function public.admin_update_user(uuid, text, text) to anon, authenticated, service_role;
