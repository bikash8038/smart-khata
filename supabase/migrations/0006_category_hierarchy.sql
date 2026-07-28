-- Main category / subcategory support. Existing categories remain usable as subcategories.
alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists is_main boolean not null default false;

create index if not exists categories_user_kind_parent_idx on public.categories (user_id, kind, parent_id);

with main_categories(kind, name_en, name_ne) as (
  values
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'घरायसी तथा दैनिक खर्च'),
    ('expense'::public.transaction_kind, 'Transportation', 'यातायात'),
    ('expense'::public.transaction_kind, 'Health', 'स्वास्थ्य'),
    ('expense'::public.transaction_kind, 'Education', 'शिक्षा'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'व्यक्तिगत खर्च'),
    ('expense'::public.transaction_kind, 'Financial & Other Expenses', 'वित्तीय तथा अन्य खर्च'),
    ('income'::public.transaction_kind, 'Employment Income', 'रोजगारी आम्दानी'),
    ('income'::public.transaction_kind, 'Business & Freelance', 'व्यवसाय तथा फ्रीलान्स'),
    ('income'::public.transaction_kind, 'Investment Income', 'लगानी आम्दानी'),
    ('income'::public.transaction_kind, 'Other Income', 'अन्य आम्दानी')
)
insert into public.categories (user_id, name_ne, name_en, kind, is_main)
select p.id, m.name_ne, m.name_en, m.kind, true
from public.profiles p cross join main_categories m
where not exists (
  select 1 from public.categories c
  where c.user_id = p.id and c.kind = m.kind and c.name_en = m.name_en and c.is_main = true
);

update public.categories child
set parent_id = parent.id
from public.categories parent
where child.user_id = parent.user_id and child.is_main = false and child.parent_id is null
  and parent.is_main = true and parent.kind = child.kind
  and parent.name_en = case
    when child.kind = 'income' and lower(coalesce(child.name_en, child.name_ne)) in ('salary', 'wages', 'bonus') then 'Employment Income'
    when child.kind = 'income' and lower(coalesce(child.name_en, child.name_ne)) in ('business income', 'business', 'freelance', 'part-time income', 'sales income') then 'Business & Freelance'
    when child.kind = 'income' and lower(coalesce(child.name_en, child.name_ne)) in ('interest income', 'interest', 'dividend', 'sanchaya kosh') then 'Investment Income'
    when child.kind = 'income' then 'Other Income'
    when lower(coalesce(child.name_en, child.name_ne)) in ('groceries', 'vegetables & fruits', 'meat, fish & eggs', 'dairy products', 'food & snacks', 'food', 'drinks', 'cleaning supplies') then 'Household & Daily Expenses'
    when lower(coalesce(child.name_en, child.name_ne)) in ('fuel', 'petrol', 'diesel', 'public transport', 'taxi', 'ride sharing', 'vehicle maintenance', 'parking', 'bus fee') then 'Transportation'
    when lower(coalesce(child.name_en, child.name_ne)) in ('medicine', 'doctor fee', 'hospital', 'health insurance', 'gym', 'fitness') then 'Health'
    when lower(coalesce(child.name_en, child.name_ne)) in ('school fee', 'college fee', 'books & stationery', 'tuition', 'training', 'online courses', 'children''s education') then 'Education'
    when lower(coalesce(child.name_en, child.name_ne)) in ('clothes & shoes', 'personal care', 'mobile', 'electronics', 'entertainment', 'travel', 'gifts', 'donations') then 'Personal Expenses'
    else 'Financial & Other Expenses'
  end;
