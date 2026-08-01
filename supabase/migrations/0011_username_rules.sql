-- Migration 0011_username_rules.sql
-- Updates the user sync trigger to default the username to the email prefix, sanitized to lowercase a-z, 0-9, dot and underscore, and handles unique conflicts.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public, auth
as $$
declare
  v_username text;
  v_base_username text;
  v_exists boolean;
  v_counter integer := 1;
begin
  -- 1. Get base username from signup metadata or fall back to email prefix
  v_base_username := coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1));
  
  -- 2. Sanitize to only lowercase english letters, digits, dots, and underscores
  v_base_username := lower(regexp_replace(v_base_username, '[^a-zA-Z0-9._]', '', 'g'));
  
  if v_base_username = '' then
    v_base_username := 'user';
  end if;

  -- 3. Loop until we find a unique username
  v_username := v_base_username;
  loop
    select exists(select 1 from public.profiles where username = v_username) into v_exists;
    if not v_exists then
      exit;
    end if;
    v_username := v_base_username || v_counter;
    v_counter := v_counter + 1;
  end loop;

  -- 4. Insert profile
  insert into public.profiles (
    id, 
    full_name, 
    email, 
    username, 
    role, 
    active_mode, 
    locale, 
    is_verified, 
    status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    v_username,
    'user',
    'personal',
    coalesce(new.raw_user_meta_data ->> 'locale', 'ne'),
    false,
    'Active'
  );
  
  return new;
end;
$$;
