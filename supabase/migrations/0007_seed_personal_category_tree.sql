-- Standard personal finance category tree.
-- Safe to run more than once: existing matching main categories and subcategories are kept.

-- Rename the first version of the built-in headings when it already exists.
-- This preserves its id, so already linked subcategories and transactions remain connected.
with renamed(kind, old_name, new_name, new_name_ne) as (
  values
    ('income'::public.transaction_kind, 'Employment Income', 'Regular Income', 'नियमित आम्दानी'),
    ('income'::public.transaction_kind, 'Business & Freelance', 'Business & Work Income', 'व्यवसाय तथा कामबाट आम्दानी'),
    ('income'::public.transaction_kind, 'Investment Income', 'Investment & Property Income', 'लगानी र सम्पत्तिबाट आम्दानी'),
    ('income'::public.transaction_kind, 'Other Income', 'Other Income Sources', 'अन्य स्रोतहरू'),
    ('expense'::public.transaction_kind, 'Health', 'Health & Wellness', 'स्वास्थ्य तथा तन्दुरुस्ती'),
    ('expense'::public.transaction_kind, 'Financial & Other Expenses', 'Financial & Investment Expenses', 'वित्तीय तथा लगानी खर्च')
)
update public.categories category
set name_en = renamed.new_name, name_ne = renamed.new_name_ne
from renamed
where category.is_main = true
  and category.kind = renamed.kind
  and category.name_en = renamed.old_name
  and not exists (
    select 1 from public.categories existing
    where existing.user_id = category.user_id
      and existing.kind = renamed.kind
      and existing.is_main = true
      and existing.name_en = renamed.new_name
  );

with main_categories(kind, name_en, name_ne) as (
  values
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'घरायसी तथा दैनिक खर्च'),
    ('expense'::public.transaction_kind, 'Transportation', 'यातायात'),
    ('expense'::public.transaction_kind, 'Health & Wellness', 'स्वास्थ्य तथा तन्दुरुस्ती'),
    ('expense'::public.transaction_kind, 'Education', 'शिक्षा'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'व्यक्तिगत खर्च'),
    ('expense'::public.transaction_kind, 'Financial & Investment Expenses', 'वित्तीय तथा लगानी खर्च'),
    ('income'::public.transaction_kind, 'Regular Income', 'नियमित आम्दानी'),
    ('income'::public.transaction_kind, 'Business & Work Income', 'व्यवसाय तथा कामबाट आम्दानी'),
    ('income'::public.transaction_kind, 'Investment & Property Income', 'लगानी र सम्पत्तिबाट आम्दानी'),
    ('income'::public.transaction_kind, 'Other Income Sources', 'अन्य स्रोतहरू')
)
insert into public.categories (user_id, name_ne, name_en, kind, parent_id, is_main)
select profile.id, main.name_ne, main.name_en, main.kind, null, true
from public.profiles profile cross join main_categories main
where not exists (
  select 1 from public.categories category
  where category.user_id = profile.id
    and category.kind = main.kind
    and category.is_main = true
    and category.name_en = main.name_en
);

with default_subcategories(kind, main_name_en, name_en, name_ne) as (
  values
    -- Household & Daily Expenses
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Groceries', 'राशन / किराना'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Vegetables & Fruits', 'तरकारी र फलफूल'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Meat, Fish & Eggs', 'मासु, माछा, अण्डा'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Dairy Products', 'दूध तथा दुग्धजन्य पदार्थ'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Food & Snacks', 'खाना तथा खाजा'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Water Bill', 'पानी'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Electricity Bill', 'बिजुली'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Cooking Gas', 'ग्यास'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Internet / Wi-Fi', 'इन्टरनेट / Wi-Fi'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Mobile Recharge', 'मोबाइल रिचार्ज'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'House Rent', 'घरभाडा'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Home Repair / Maintenance', 'घर मर्मत'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Cleaning Supplies', 'सरसफाइ सामग्री'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Furniture & Household Goods', 'फर्निचर तथा घरेलु सामान'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Domestic Help / Helper', 'घरेलु सहयोगी / कामदार'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Puja & Religious Expenses', 'पूजापाठ तथा धार्मिक खर्च'),
    ('expense'::public.transaction_kind, 'Household & Daily Expenses', 'Pet Care', 'घरपालुवा जनावर खर्च'),
    -- Transportation
    ('expense'::public.transaction_kind, 'Transportation', 'Fuel (Petrol / Diesel)', 'पेट्रोल / डिजेल'),
    ('expense'::public.transaction_kind, 'Transportation', 'Public Transport', 'सार्वजनिक यातायात'),
    ('expense'::public.transaction_kind, 'Transportation', 'Taxi / Ride Sharing', 'ट्याक्सी / राइड शेयर'),
    ('expense'::public.transaction_kind, 'Transportation', 'Vehicle Maintenance', 'सवारी मर्मत'),
    ('expense'::public.transaction_kind, 'Transportation', 'Parking Fees', 'पार्किङ'),
    ('expense'::public.transaction_kind, 'Transportation', 'Vehicle Insurance', 'सवारी बीमा'),
    ('expense'::public.transaction_kind, 'Transportation', 'Vehicle Tax & Bluebook Renewal', 'ट्याक्स / ब्लुबुक नवीकरण'),
    -- Health & Wellness
    ('expense'::public.transaction_kind, 'Health & Wellness', 'Medicine', 'औषधि'),
    ('expense'::public.transaction_kind, 'Health & Wellness', 'Doctor Fee', 'डाक्टर शुल्क'),
    ('expense'::public.transaction_kind, 'Health & Wellness', 'Hospital Charges', 'अस्पताल'),
    ('expense'::public.transaction_kind, 'Health & Wellness', 'Health Insurance', 'स्वास्थ्य बीमा'),
    ('expense'::public.transaction_kind, 'Health & Wellness', 'Gym & Fitness', 'जिम / व्यायाम'),
    -- Education
    ('expense'::public.transaction_kind, 'Education', 'School / College Fee', 'विद्यालय / कलेज शुल्क'),
    ('expense'::public.transaction_kind, 'Education', 'Books & Stationery', 'किताब तथा स्टेशनरी'),
    ('expense'::public.transaction_kind, 'Education', 'Tuition / Training', 'ट्युशन / तालिम'),
    ('expense'::public.transaction_kind, 'Education', 'Online Courses', 'अनलाइन कोर्स'),
    ('expense'::public.transaction_kind, 'Education', 'Children''s Expenses', 'बालबालिका खर्च'),
    -- Personal Expenses
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Clothes & Shoes', 'कपडा तथा जुत्ता'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Personal Care & Grooming', 'सौन्दर्य / व्यक्तिगत हेरचाह'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Mobile & Electronics', 'मोबाइल / इलेक्ट्रोनिक्स'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Entertainment', 'मनोरञ्जन'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Travel & Vacation', 'यात्रा / घुमफिर'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Gifts', 'उपहार'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Donations & Charity', 'दान / सहयोग'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Subscriptions', 'सदस्यता'),
    ('expense'::public.transaction_kind, 'Personal Expenses', 'Socializing & Outing', 'साथीभाइ / सामाजिक भेटघाट'),
    -- Financial & Investment Expenses
    ('expense'::public.transaction_kind, 'Financial & Investment Expenses', 'Bank Charges', 'बैंक शुल्क'),
    ('expense'::public.transaction_kind, 'Financial & Investment Expenses', 'Loan / EMI', 'ऋण / EMI'),
    ('expense'::public.transaction_kind, 'Financial & Investment Expenses', 'Savings & Investments', 'बचत / लगानी'),
    ('expense'::public.transaction_kind, 'Financial & Investment Expenses', 'Tax Payments', 'कर (ट्याक्स)'),
    ('expense'::public.transaction_kind, 'Financial & Investment Expenses', 'Other Personal Expenses', 'अन्य व्यक्तिगत खर्च'),
    -- Regular Income
    ('income'::public.transaction_kind, 'Regular Income', 'Salary / Wages', 'तलब'),
    ('income'::public.transaction_kind, 'Regular Income', 'Pension', 'पेन्सन'),
    ('income'::public.transaction_kind, 'Regular Income', 'Allowance', 'भत्ता'),
    -- Business & Work Income
    ('income'::public.transaction_kind, 'Business & Work Income', 'Business Income', 'व्यवसाय आम्दानी'),
    ('income'::public.transaction_kind, 'Business & Work Income', 'Freelance / Part-time Income', 'फ्रीलान्स / पार्ट-टाइम'),
    ('income'::public.transaction_kind, 'Business & Work Income', 'Sales Income', 'बिक्री आम्दानी'),
    ('income'::public.transaction_kind, 'Business & Work Income', 'Service Fee / Commission', 'सेवा शुल्क / कमिसन'),
    -- Investment & Property Income
    ('income'::public.transaction_kind, 'Investment & Property Income', 'Rental Income', 'भाडा आम्दानी'),
    ('income'::public.transaction_kind, 'Investment & Property Income', 'Interest Income', 'ब्याज'),
    ('income'::public.transaction_kind, 'Investment & Property Income', 'Dividend Income', 'लाभांश'),
    ('income'::public.transaction_kind, 'Investment & Property Income', 'Stock / Capital Gains', 'सेयर / शेयर बिक्री'),
    -- Other Income Sources
    ('income'::public.transaction_kind, 'Other Income Sources', 'Gift Received', 'उपहार / नगद प्राप्त'),
    ('income'::public.transaction_kind, 'Other Income Sources', 'Remittance', 'रेमिट्यान्स'),
    ('income'::public.transaction_kind, 'Other Income Sources', 'Bonus & Rewards', 'बोनस'),
    ('income'::public.transaction_kind, 'Other Income Sources', 'Other Income', 'अन्य आम्दानी')
)
insert into public.categories (user_id, name_ne, name_en, kind, parent_id, is_main)
select main.user_id, sub.name_ne, sub.name_en, sub.kind, main.id, false
from default_subcategories sub
join public.categories main
  on main.kind = sub.kind
 and main.is_main = true
 and main.name_en = sub.main_name_en
where not exists (
  select 1 from public.categories existing
  where existing.user_id = main.user_id
    and existing.parent_id = main.id
    and existing.is_main = false
    and existing.name_en = sub.name_en
);
