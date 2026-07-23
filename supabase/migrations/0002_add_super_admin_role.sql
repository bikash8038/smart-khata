-- Run this file first, after 0001_smart_khata_core.sql.
alter type public.app_role add value if not exists 'super_admin';
