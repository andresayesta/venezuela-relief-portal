# Supabase setup

Run these files **in order** in the Supabase dashboard → SQL Editor → New query.

1. **`01_schema.sql`** — tables, types, triggers.
2. **`02_rls.sql`** — Row-Level Security policies. Locks down everything; safe to re-run.
3. **`03_seed_first_admin.sql`** — bootstrap the first admin. Edit it first to paste your auth user's UUID. Only needed once.

## One-time dashboard config

After running the SQL:

- **Authentication → Providers → Email**: enable; **turn off "Enable new user signups"** (invite-only).
- **Storage → New bucket**: name it `missing-photos`, mark **public**. Policies (set them in the bucket's policies tab):
  - SELECT (read): allow `public`.
  - INSERT (upload): allow `authenticated`.
- **Settings → API**: copy the project URL, `anon` key, and `service_role` key into `.env.local` (see `.env.local.example`).

## Sanity checks after setup

```sql
-- Should return your row with role='admin'
select id, full_name, role from profiles where id = auth.uid();

-- Should return 0 rows (RLS hides unpublished from anon)
-- Run this from a fresh tab with the anon key, NOT logged in
select count(*) from collection_centers where is_published = false;
```
