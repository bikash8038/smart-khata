-- Create category exclusions table and update policies for categories
create table if not exists public.category_exclusions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

-- Enable RLS on exclusions table
alter table public.category_exclusions enable row level security;

-- Policies for category_exclusions
create policy "users manage own exclusions"
  on public.category_exclusions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, delete on public.category_exclusions to authenticated;

-- Add policy to allow super admins to manage all categories
create policy "super admins manage all categories"
  on public.categories for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'super_admin'
    )
  );
