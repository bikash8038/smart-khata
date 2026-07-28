-- Main category / subcategory support.
-- Existing categories remain usable as subcategories, so existing transactions keep their data.

alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists is_main boolean not null default false;

create index if not exists categories_user_kind_parent_idx
  on public.categories (user_id, kind, parent_id);

-- Give every existing user the standard main categories.
with main_categories(kind, name) as (
  values
    ('expense'::public.transaction_kind, 'Household & Daily Expenses'),
    ('expense'::public.transaction_kind, 'Transportation'),
    ('expense'::public.transaction_kind, 'Health'),
    ('expense'::public.transaction_kind, 'Education'),
    ('expense'::public.transaction_kind, 'Personal Expenses'),
    ('expense'::public.transaction_kind, 'Financial & Other Expenses'),
    ('income'::public.transaction_kind, 'Employment Income'),
    ('income'::public.transaction_kind, 'Business & Freelance'),
    ('income'::public.transaction_kind, 'Investment Income'),
    ('income'::public.transaction_kind, 'Other Income')
)
insert into public.categories (user_id, name_ne, name_en, kind, is_main)
select p.id, m.name, m.name, m.kind, true
from public.profiles p
cross join main_categories m
where not exists (
  select 1 from public.categories c
  where c.user_id = p.id and c.kind = m.kind and c.name_en = m.name and c.is_main = true
);

-- Convert every old (root) category into a subcategory. Known names are grouped
-- into a useful main category; the remaining ones are retained under Other.
update public.categories child
set parent_id = parent.id
from public.categories parent
where child.user_id = parent.user_id
  and child.is_main = false
  and child.parent_id is null
  and parent.is_main = true
  and parent.kind = child.kind
  and parent.name_en = case
    when child.kind = 'income' and lower(child.name_ne) in ('salary', 'wages', 'bonus') then 'Employment Income'
    when child.kind = 'income' and lower(child.name_ne) in ('business income', 'business', 'freelance', 'part-time income', 'sales income') then 'Business & Freelance'
    when child.kind = 'income' and lower(child.name_ne) in ('interest income', 'interest', 'dividend', 'sanchaya kosh') then 'Investment Income'
    when child.kind = 'income' then 'Other Income'
    when lower(child.name_ne) in ('groceries', 'vegetables & fruits', 'meat, fish & eggs', 'dairy products', 'food & snacks', 'food', 'drinks', 'cleaning supplies') then 'Household & Daily Expenses'
    when lower(child.name_ne) in ('fuel', 'petrol', 'diesel', 'public transport', 'taxi', 'ride sharing', 'vehicle maintenance', 'parking', 'bus fee') then 'Transportation'
    when lower(child.name_ne) in ('medicine', 'doctor fee', 'hospital', 'health insurance', 'gym', 'fitness') then 'Health'
    when lower(child.name_ne) in ('school fee', 'college fee', 'books & stationery', 'tuition', 'training', 'online courses', 'children''s education') then 'Education'
    when lower(child.name_ne) in ('clothes & shoes', 'personal care', 'mobile', 'electronics', 'entertainment', 'travel', 'gifts', 'donations') then 'Personal Expenses'
    else 'Financial & Other Expenses'
  end;
