-- Run this ONCE, manually, to seed yourself as the first admin.
-- Steps:
--   1. In Supabase Dashboard → Authentication → Users → Add user, create your auth account.
--   2. Copy that user's UUID.
--   3. Paste it below in place of <YOUR-AUTH-UID> and run this in SQL Editor.
-- After this, you can invite and promote everyone else through the app's /admin/equipo.

insert into profiles (id, full_name, role)
values ('<YOUR-AUTH-UID>', 'Andres', 'admin')
on conflict (id) do update set role = 'admin', full_name = excluded.full_name;
