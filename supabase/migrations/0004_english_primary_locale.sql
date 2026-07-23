-- English is the default product language. Nepali remains available as a user-selected language.
alter table public.profiles alter column locale set default 'en';
update public.profiles set locale = 'en' where locale = 'ne';
