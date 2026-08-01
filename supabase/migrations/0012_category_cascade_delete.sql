-- Alter foreign key constraint for parent_id in categories table to ON DELETE CASCADE
do $$
declare
    fk_name text;
begin
    select tc.constraint_name
    into fk_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
    where tc.table_name = 'categories' 
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'parent_id';

    if fk_name is not null then
        execute 'alter table public.categories drop constraint ' || fk_name;
    end if;
end $$;

alter table public.categories
  add constraint categories_parent_id_fkey
  foreign key (parent_id) references public.categories(id)
  on delete cascade;
