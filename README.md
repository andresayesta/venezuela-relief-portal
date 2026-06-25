# Venezuela Earthquake Relief Hub

Bilingual (ES/EN), mobile-first web app surfacing **human-verified** relief
information after the June 24, 2026 earthquakes. Trust is the product —
nothing reaches the public until an admin verifies it.

Full spec lives in [`docs/HANDOFF.md`](docs/HANDOFF.md).

## Stack

- Next.js 16 (App Router, Turbopack, React 19.2)
- Supabase (Postgres, Auth, Storage, RLS)
- Tailwind CSS v4
- TypeScript
- Deploy: Vercel

## First-time setup

1. **Supabase project**
   - Create a project at https://supabase.com
   - In SQL Editor, run in order: `supabase/01_schema.sql`, then `supabase/02_rls.sql`
   - Authentication → Providers → Email: enable, turn **off** "Enable new user signups"
   - Storage → New bucket: `missing-photos`, public read
   - Authentication → Users: add your account, copy its UUID
   - Edit `supabase/03_seed_first_admin.sql`, paste your UUID, run it

2. **Environment**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the three values from Supabase → Settings → API.

3. **Install + run**

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000

## Roles

- **Editor**: creates and edits; work lands in the pending queue. Cannot publish.
- **Admin**: publishes, manages the team.

The publish gate is enforced at the database level via RLS, not just UI.

## Project structure

```
src/
  app/
    page.tsx                  Home — A/B/C path split
    centros/                  Public collection-centers page
    necesito-ayuda/           Path A index
    verificado/               Path C — verified info / anti-scam
    admin/
      page.tsx                Dashboard + pending queue
      login/                  Sign-in
      centros/                Centros admin: list, new, edit
      admin-actions.ts        Server actions
  lib/
    i18n.ts                   Static bilingual dictionary
    admin-auth.ts             requireTeam() / requireAdmin()
    supabase/                 browser, server, admin clients + types
  components/                 LocaleToggle, TrustBadge
  proxy.ts                    Renamed from middleware in Next 16;
                              refreshes Supabase session each request
supabase/                     SQL: schema, RLS, first-admin seed
```
