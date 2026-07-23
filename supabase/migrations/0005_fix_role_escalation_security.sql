-- Revoke direct role update privilege from authenticated users to prevent self-escalation
revoke update (role) on public.profiles from authenticated;

-- Create a secure definer function to update user roles
create or replace function public.update_user_role(
  target_user_id uuid,
  new_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if the actor is a super_admin
  if public.current_app_role() != 'super_admin' then
    raise exception 'Unauthorized: Only super admins can change user roles.';
  end if;
  
  update public.profiles
  set role = new_role
  where id = target_user_id;
end;
$$;

-- Grant execution permission on the function to authenticated users
grant execute on function public.update_user_role(uuid, public.app_role) to authenticated;
