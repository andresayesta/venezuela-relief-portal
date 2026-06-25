# HANDOFF: Venezuela Earthquake Relief Hub

**Mission:** A bilingual (Spanish/English), mobile-first web app that directs people to verified earthquake-relief resources for Venezuela, and counters the scams and stale information that flood every disaster. Trust is the product. Nothing reaches the public until a human verifies it.

This document is a build spec for Claude Code. Read the whole thing before scaffolding.

---

## 1. Context for the agent

The owner (Andres) is part of the Venezuelan diaspora with family in-country. After the 24 June 2026 twin earthquakes, a small **verified team** (Andres plus a few trusted co-admins and contributors, some with relevant on-the-ground or relief experience) receives relief information via WhatsApp from people connected to organizations on the ground (collection centers, missing-person reports, aid efforts). The team verifies it, then publishes it here and amplifies it to a large social audience.

Two real-world data flows drive the entire design:

1. **Centros de Acopio (collection / drop-off centers).** A team member gets a tip via WhatsApp ("they're collecting water and meds at X"), confirms it, then pushes it in. People near that location come to the hub to find where to drop off or pick up supplies.
2. **Missing-person reports.** A team member sees a report, verifies what they can, pushes it in. Families search the hub.

Everything else (vetted donation channels, emergency numbers, anti-scam guidance) is supporting content the team maintains less frequently.

**Information architecture (important).** The verified intel is not a separate section; it is the live content that fills the site's intent paths. The full content map is three paths (A: I need help, B: I want to help, C: verified info / anti-scam), defined canonically in Section 7. In short:

- **"Necesito ayuda / I need help" (Path A)** contains: missing persons (search + report), Centros de Acopio in **pickup** mode and official shelters, emergency + official channels (incl. the government damage-reporting app), and consular / evacuation help by country.
- **"Quiero ayudar / I want to help" (Path B)** contains: vetted donation channels, send-money-directly-to-family guidance, Centros de Acopio in **drop-off** mode, skills-based volunteering, and in-kind guidance.
- **"Verified info / anti-scam" (Path C)** is a standing reference: the verified-vs-unconfirmed standard, how to spot fake fundraisers, and the official-sources list.

This is why the `direction` field on `collection_centers` is load-bearing: a single stream of "Centro de Acopio" tips from WhatsApp is split across Paths A and B by whether the center gives out (`pickup`) or takes in (`dropoff`). One intake flow for the owner; the right public destination automatically. As the owner receives reports of vetted places to help, each drops into its matching subsection.

**The core principle:** the public side is read-only and shows only published, verified items. All writes happen through a role-gated team area built for speed: editors add entries, admins approve and publish. People often add entries from their phone right after a WhatsApp message, so intake must be fast.

This is a humanitarian tool, not a commercial product. Sensitive personal data is involved (missing persons). Handle it with care. See Section 12.

---

## 2. Tech stack

- **Frontend:** Next.js (App Router, latest stable), React, TypeScript, Tailwind CSS.
- **Backend / DB:** Supabase (Postgres, Auth, Storage, Row-Level Security).
- **Data access:** `@supabase/supabase-js`. Use the anon key client-side. Use the service-role key only in server-side route handlers, never expose it to the browser.
- **Maps (optional, Phase 2):** Leaflet with OpenStreetMap tiles (free, no API key). Centers render as a list first; map markers only when latitude/longitude exist.
- **Deploy:** Vercel.

Keep dependencies minimal. No heavy UI kit; Tailwind plus a few small components is enough.

---

## 3. Supabase schema (run this SQL first)

```sql
-- Extensions
create extension if not exists "uuid-ossp";

-- Shared trust tier
create type trust_tier as enum ('verified', 'reported', 'unverified');

-- Team roles
create type user_role as enum ('editor', 'admin');

-- =========================================================
-- PROFILES (team members; one row per Supabase auth user)
-- editor: can create/edit, work lands in pending queue, cannot publish
-- admin:  full control, can publish and manage the team
-- =========================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        user_role not null default 'editor',
  created_at  timestamptz not null default now()
);

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: is the current user on the team at all (editor or admin)?
create or replace function is_team()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid()
  );
$$ language sql security definer stable;

-- =========================================================
-- COLLECTION CENTERS (Centros de Acopio)
-- =========================================================
create table collection_centers (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  state         text not null,        -- Venezuelan state, e.g. 'La Guaira', 'Distrito Capital', 'Falcón', 'Carabobo', 'Aragua', 'Miranda'
  city          text,
  neighborhood  text,
  address       text,
  latitude      numeric,
  longitude     numeric,
  accepted_items text,                -- what they take: 'agua, medicinas, ropa, comida no perecedera'
  urgent_needs  text,                 -- what's most needed right now
  hours         text,                 -- free text, e.g. '8am-6pm'
  contact_name  text,
  contact_phone text,
  direction     text default 'dropoff', -- 'dropoff' (people bring supplies) or 'pickup' (people in need collect)
  trust_tier    trust_tier not null default 'unverified',
  source        text,                 -- provenance, e.g. 'WhatsApp - prima Maria'
  notes         text,                 -- dump field; can paste raw WhatsApp text here
  is_published  boolean not null default false,
  submitted_by  text,                 -- null when team-entered; set for public submissions
  created_by    uuid references profiles(id),  -- team member who added it
  published_by  uuid references profiles(id),  -- admin who published it
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  verified_at   timestamptz
);

-- =========================================================
-- MISSING PERSONS
-- 'closed' covers any resolution including death; closed rows
-- drop from public view so deaths are never displayed publicly.
-- =========================================================
create type missing_status as enum ('missing', 'found_safe', 'closed');

create table missing_persons (
  id                 uuid primary key default uuid_generate_v4(),
  full_name          text not null,
  age                int,
  last_seen_location text,
  last_seen_state    text,
  last_seen_date     date,
  description        text,            -- appearance, clothing, distinguishing features
  photo_url          text,           -- Supabase Storage public URL
  reporter_name      text,
  reporter_contact   text,           -- phone/email of person to contact with info
  relationship       text,           -- reporter's relationship to the person
  status             missing_status not null default 'missing',
  trust_tier         trust_tier not null default 'unverified',
  source             text,
  consent_to_publish boolean not null default false, -- reporter consented to public listing
  is_published       boolean not null default false,
  submitted_by       text,
  created_by         uuid references profiles(id),  -- team member who added it
  published_by       uuid references profiles(id),  -- admin who published it
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- =========================================================
-- DONATION / AID CHANNELS (vetted money + aid orgs)
-- =========================================================
create table donation_channels (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  category        text,              -- 'medical', 'shelter', 'food', 'general', 'family_tracing'
  url             text,
  why_trusted     text,              -- one line on why this is credible
  efficiency_note text,              -- optional, e.g. matched-giving multiplier
  region_focus    text,
  trust_tier      trust_tier not null default 'verified',
  is_published    boolean not null default true,
  sort_order      int default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =========================================================
-- RESOURCE LINKS (standing reference content for Paths A and C)
-- Holds the lighter, link/number-style items so each renders cleanly.
-- =========================================================
create table resource_links (
  id            uuid primary key default uuid_generate_v4(),
  category      text not null,       -- 'emergency', 'official_app', 'hospital', 'consular',
                                      -- 'evacuation', 'family_tracing', 'shelter', 'official_source',
                                      -- 'anti_scam', 'in_kind_guidance', 'skills_volunteering'
  title         text not null,
  description   text,
  url_or_contact text,
  country       text,                -- for consular/evacuation, e.g. 'US', 'Colombia'
  state         text,                -- optional Venezuelan region filter (shelters, hospitals)
  sort_order    int default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_centers_updated  before update on collection_centers
  for each row execute function set_updated_at();
create trigger trg_missing_updated  before update on missing_persons
  for each row execute function set_updated_at();
create trigger trg_channels_updated before update on donation_channels
  for each row execute function set_updated_at();
```

---

## 4. Row-Level Security (run after schema)

Two roles, enforced at the database level via the `is_admin()` and `is_team()` helpers from Section 3:

- **Public (anon):** can read only published rows.
- **Editor:** can read everything, insert new rows, and edit rows, but the row must stay `is_published = false`. Editors cannot publish.
- **Admin:** full control, including setting `is_published = true` and deleting.

The publish gate is the key rule: an editor's `with check` forbids `is_published = true`, so only an admin can flip a row live. This keeps the verification gate real even as the team grows.

```sql
alter table profiles           enable row level security;
alter table collection_centers enable row level security;
alter table missing_persons    enable row level security;
alter table donation_channels  enable row level security;
alter table resource_links     enable row level security;

-- PROFILES
-- Team members can read the roster (to show "added by ..." names).
create policy "team read profiles"
  on profiles for select
  using (is_team());
-- Users can read their own row even before fully set up.
create policy "self read profile"
  on profiles for select
  using (id = auth.uid());
-- Only admins can create/modify/remove team members and set roles.
create policy "admin manage profiles"
  on profiles for all
  using (is_admin())
  with check (is_admin());

-- COLLECTION CENTERS
create policy "public read published centers"
  on collection_centers for select
  using (is_published = true);
create policy "team read all centers"
  on collection_centers for select
  using (is_team());
create policy "editor insert centers"
  on collection_centers for insert
  with check (is_team() and is_published = false);
create policy "editor update centers unpublished"
  on collection_centers for update
  using (is_team())
  with check (is_admin() or is_published = false);
create policy "admin delete centers"
  on collection_centers for delete
  using (is_admin());

-- MISSING PERSONS (closed rows never shown publicly)
create policy "public read published missing"
  on missing_persons for select
  using (is_published = true and status <> 'closed');
create policy "team read all missing"
  on missing_persons for select
  using (is_team());
create policy "editor insert missing"
  on missing_persons for insert
  with check (is_team() and is_published = false);
create policy "editor update missing unpublished"
  on missing_persons for update
  using (is_team())
  with check (is_admin() or is_published = false);
create policy "admin delete missing"
  on missing_persons for delete
  using (is_admin());

-- DONATION CHANNELS
create policy "public read published channels"
  on donation_channels for select
  using (is_published = true);
create policy "team read all channels"
  on donation_channels for select
  using (is_team());
create policy "editor insert channels"
  on donation_channels for insert
  with check (is_team() and is_published = false);
create policy "editor update channels unpublished"
  on donation_channels for update
  using (is_team())
  with check (is_admin() or is_published = false);
create policy "admin delete channels"
  on donation_channels for delete
  using (is_admin());

-- RESOURCE LINKS
create policy "public read published resources"
  on resource_links for select
  using (is_published = true);
create policy "team read all resources"
  on resource_links for select
  using (is_team());
create policy "editor insert resources"
  on resource_links for insert
  with check (is_team() and is_published = false);
create policy "editor update resources unpublished"
  on resource_links for update
  using (is_team())
  with check (is_admin() or is_published = false);
create policy "admin delete resources"
  on resource_links for delete
  using (is_admin());
```

The update policy reads as: any team member may edit a row (`using`), but the saved result is only allowed if the editor is an admin, or the row remains unpublished (`with check`). So an editor can revise a draft freely but cannot publish it, and cannot edit a row in a way that publishes it; an admin can do both.

**Bootstrapping the first admin.** RLS blocks self-promotion, so seed the first admin manually: create the auth user in the Supabase dashboard, then run once with the service role (SQL editor):

```sql
insert into profiles (id, full_name, role)
values ('<that-users-auth-uid>', 'Andres', 'admin');
```

After that, this admin can invite and promote everyone else through the app.

**Optional, Phase 2: public submissions.** If the team later wants the wider audience to submit tips into the pending queue, add anon insert policies that force unpublished + unverified, so nothing self-publishes and everything still passes an admin. Add basic abuse protection (captcha / rate limit) first:

```sql
-- Enable ONLY when public intake is wanted. Add basic abuse protection (captcha / rate limit) first.
create policy "public submit centers"
  on collection_centers for insert
  to anon
  with check (is_published = false and trust_tier = 'unverified' and submitted_by is not null);

create policy "public submit missing"
  on missing_persons for insert
  to anon
  with check (is_published = false and trust_tier = 'unverified' and submitted_by is not null);
```

---

## 5. Storage

Create a public Storage bucket named `missing-photos` for missing-person images. Upload happens from the admin form. Store the resulting public URL in `missing_persons.photo_url`. Restrict uploads to authenticated users via a bucket policy; public read is fine.

**Note on shelters.** Official shelters (Path A) are stored in `resource_links` with `category = 'shelter'` and a `state` value, which keeps them simple to maintain. If shelters later need richer fields (capacity, accepts pets, hours), promote them to `collection_centers` with a `direction = 'pickup'` and a type tag instead. For v1, keep them in `resource_links`.

---

## 6. Auth and team access

- Supabase Auth, email + password (or magic link).
- **Disable public sign-ups** in the Supabase dashboard. Accounts are invite-only.
- **Two roles** (`profiles.role`): `editor` and `admin`. The first admin is seeded manually (see end of Section 4); after that, admins invite and promote everyone else in-app.
- **Inviting a member:** an admin enters a name, email, and role in `/admin/equipo`. The app creates the Supabase auth user (server-side route handler using the service-role key) and inserts the matching `profiles` row. The invitee gets a magic-link / set-password email. No one self-registers.
- **Route gating:** all `/admin` routes require a session AND a matching `profiles` row. Editors see the full admin UI except the Publish controls and the team-management page; those are admin-only and also enforced by RLS, so a hidden button is never the only safeguard.
- Everything outside `/admin` is public, no auth.

A note on trust as the team grows: keep the admin circle small (you plus your cousin, perhaps one more). Editors can be more peripheral because their work always passes an admin's eyes before going public. If someone should stop contributing, an admin removes their `profiles` row; RLS instantly revokes all write access.

---

## 7. Public pages

All public pages: mobile-first, fast on poor connections, a visible "Última actualización / Last updated" timestamp, and a Spanish/English toggle persisted in localStorage (default Spanish).

The public site is organized as three paths. The lists below are the canonical content map. Every subsection must exist even before it is full; incoming verified intel drops into the matching subsection.

### Path A — "Necesito ayuda / I need help / I have family there"
- **Find a missing person.** The `/desaparecidos` listing (search by name, filter by state), plus direct links to ICRC Restoring Family Links / Trace the Face and any official Venezuelan registry and consular channels. This is the number-one week-one need for the diaspora.
- **Emergency and official channels.** Civil protection numbers, the government damage-reporting app the acting president told people to use, hospital and emergency lines.
- **Shelters and aid points.** Locations of official shelters and pickup-mode collection points (some schools are being used for this), broken out by area/state.
- **Consular and evacuation help.** For diaspora trying to reach, support, or get family out, organized by where the person is (US, Colombia, etc.).

### Path B — "Quiero ayudar / I want to help"
- **Vetted money channels.** A short, ranked list, each with what they do, why they are trusted, and where possible their efficiency (for example, the medical org where every dollar reportedly unlocks far more in matched supplies). Short and ranked beats long and scattered; concentrated giving has more impact.
- **Send money directly to family.** The remittance rails that actually work right now and the banking-friction caveat, so people are not blindsided.
- **Drop-off points.** Drop-off-mode collection centers (where to bring water, meds, supplies), filtered by state.
- **Skills-based volunteering.** Telehealth roster for clinicians, translation for incoming rescue teams, crisis mapping (Humanitarian OpenStreetMap), social-media triage. This is where the medical network and bilingual audience plug in.
- **In-kind guidance.** Mostly a "please don't ship random boxes, here's what's actually requested and where" note, because unsolicited goods clog disaster logistics.

### Path C — Verified information and anti-scam
- A clear "verified vs unconfirmed" standard so people know what they are looking at.
- How to spot fake fundraisers, which explode after every disaster.
- The official-sources list, so people can check claims themselves.

### Pages that deliver the paths
- **`/` Home.** Three entries: the two intent paths (A and B) as primary buttons, with Path C (verified info / anti-scam) reachable from both and from a persistent header link. Show the last-updated stamp and total counts (e.g. "47 centros verificados").
- **`/centros` Collection centers.** Reachable from both A (pickup) and B (drop-off). The `direction` filter is what makes it serve both. Also filter by state. Cards show name, state/city, accepted items, urgent needs, hours, contact, trust badge. Optional map toggle (Phase 2). Search box.
- **`/desaparecidos` Missing persons (Path A).** Searchable by name, filterable by state. Cards show photo (if present), name, age, last seen location/date, description, and the contact to report information. Found-safe entries show an "ENCONTRADO / FOUND" badge briefly before being closed.
- **`/donar` Ways to help (Path B).** Vetted donation channels grouped by category with the one-line "why trusted," the direct-to-family remittance section, in-kind guidance, and skills volunteering.
- **`/recursos` Resources (Path A + C).** Emergency numbers, the damage-reporting app, consular help by country, family-tracing links, official shelters, official-sources list, and the anti-scam section.
- **`/enviar` Submit a tip (Phase 2, optional).** Public form feeding the unverified queue. Ships only if public intake is enabled.

Every page needs a clear trust-tier legend: **Verificado** (direct ties or established in-country org), **Reportado** (credible, secondhand), and unverified items are simply never shown.

---

## 8. Admin pages (the team workspace)

Optimize relentlessly for **speed of entry from a phone.** Contributors paste from WhatsApp, often one-handed, minutes after getting a tip. The UI adapts to role: editors see everything except Publish controls and team management.

- **`/admin/login`** Supabase auth.
- **`/admin` Dashboard.** Two big buttons up top: "+ Centro" and "+ Desaparecido." Below them, the **pending queue** of anything `is_published = false`, newest first, each row showing who added it ("Añadido por Maria") and its trust tier. Admins get one-tap Publish on each; editors see the items but no Publish button (they can open and edit). This queue is the shared to-do list: editors fill it, admins clear it.
- **`/admin/centros/new` Quick-add center.** Only `name`, `state`, and `accepted_items` required. A single large `notes` field for pasting raw WhatsApp text verbatim. Trust-tier selector. On save, the app stamps `created_by` with the current user. Editors get "Save as draft"; admins also get "Save & publish" (stamps `published_by` and `verified_at`). Everything else optional.
- **`/admin/centros` Manage.** Table with inline edit and a filter for unpublished. Publish/unpublish and delete are admin-only (and enforced by RLS). Shows `created_by` / `published_by` columns.
- **`/admin/desaparecidos/new` Quick-add missing person.** Name required; photo upload; reporter contact; `consent_to_publish` checkbox that must be true before publishing. Status selector (missing / found_safe / closed). Same create/publish role split and attribution.
- **`/admin/desaparecidos` Manage.** Same pattern. Changing status to `closed` removes it from public immediately (admin action).
- **`/admin/canales` and `/admin/recursos`** CRUD for donation channels and resource links, same role split.
- **`/admin/equipo` Team (admin-only).** List members with their roles. Invite a new member (name, email, role), change a role (editor to admin or back), and remove a member. Backed by a server-side route handler using the service-role key to create the auth user, then inserting the `profiles` row. Hidden from editors and protected by RLS.

Every create stamps `created_by`; every publish stamps `published_by` and `verified_at`. That gives a clear chain of who added and who approved each live item, which is what lets you widen the contributor circle without losing accountability.

---

## 9. Bilingual approach (keep it pragmatic)

Do not force Andres to enter every record twice; that kills intake speed.

- **UI chrome** (nav, labels, buttons, headings, trust badges, legends) is fully bilingual via a static translations file (`/lib/i18n.ts` with `es` and `en` objects). Default Spanish.
- **User-entered content** (center names, needs, descriptions) is entered once in whatever language the source used, almost always Spanish. Display it as-is regardless of toggle.
- Do not auto-translate content in v1.

---

## 10. Design direction

Clean, high-contrast, trustworthy, and calm. This is read under stress on small screens, so legibility and speed beat decoration.

- Light background, near-black text, generous spacing, large tap targets.
- One accent color for primary actions and the verified badge. Brand colors are available if Andres wants continuity with his name: Black `#111111`, Blue `#254499`, Gold `#F8CB78`. Use the blue as the single accent; keep gold for the verified badge only. Avoid a heavy commercial look; this should feel civic and neutral.
- Trust badges: Verificado in a solid confident color, Reportado in a muted/outline style so the difference is obvious at a glance.
- No tracking, no ads, no popups.

---

## 11. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side route handlers only; never sent to the browser
```

---

## 12. Sensitive-data and safety notes (do not skip)

- **Missing-person data is PII.** Only publish rows where `consent_to_publish = true`. Provide a fast way to unpublish or close a record on request.
- **Deaths are never displayed.** Any resolution including death uses status `closed`, which the RLS policy hides from public view. There is no "deceased" public state by design.
- **Verification gate is absolute.** Only an admin can publish. Editors can draft but never set a row live, enforced by RLS, not just the UI. Public (anonymous) submissions, if ever enabled, can only land as unverified + unpublished and still require an admin to publish.
- **Accountability.** Every published row records `created_by` and `published_by`, so there is always a traceable chain of who added and who approved each public item.
- **Anti-abuse before public intake.** Do not enable anonymous submission policies until basic captcha or rate limiting is in place.
- **Service-role key stays server-side.** Any operation needing it goes through a Next.js route handler.

---

## 13. Build order (ship the owner's core flow first)

1. Supabase project, run schema SQL (Section 3), run RLS SQL (Section 4), create `missing-photos` bucket, disable public signup, create the first admin auth user and seed their `profiles` row as `admin`.
2. Next.js scaffold, Tailwind, Supabase clients (browser + server), i18n stub, `/admin` route gating that checks both session and `profiles` role.
3. **Admin: quick-add + manage Collection Centers**, with the create/publish role split and `created_by` / `published_by` stamping. This is the priority and the daily flow.
4. **Pending queue on `/admin`** showing "added by" and trust tier, with admin one-tap publish.
5. **Public `/centros`** with state + direction filters, search, trust badges, last-updated stamp.
6. **Missing persons**, admin then public, including photo upload and consent gating.
7. **Team management `/admin/equipo`** (invite, role change, remove), admin-only.
8. **`/donar` and `/recursos`** pages + their admin CRUD; home page path split; bilingual polish; deploy to Vercel.
9. Phase 2 (only if wanted): Leaflet map on `/centros`, public `/enviar` intake with abuse protection.

### Acceptance criteria
- An **editor** can add a center from a phone in under 30 seconds; it lands in the pending queue and is **not** publicly visible.
- An **admin** can publish a queued item in one tap and it appears on `/centros` immediately, stamped with who added and who published it.
- An editor **cannot** publish anything: no Publish control in the UI, and a direct API attempt to set `is_published = true` is rejected by RLS.
- A signed-out visitor can never see any unpublished or closed row (verify by querying with the anon key).
- Removing a member's `profiles` row instantly revokes their write access.
- Changing a missing person to `closed` removes them from the public page at once.
- The Spanish/English toggle switches all UI chrome and persists across reloads.
- Lighthouse mobile performance is solid on a throttled connection.

---

## 14. Out of scope for v1
Accounts for end users, notifications/SMS, the map, public (anonymous) submissions, auto-translation, analytics. Note them as future work; do not build them yet. Team roles (editor/admin) ARE in scope for v1.
