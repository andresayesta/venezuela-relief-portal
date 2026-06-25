-- Venezuela Relief Hub — Row Level Security
-- Paste into Supabase → SQL Editor AFTER 01_schema.sql.
--
-- Rules:
--   Public (anon): read only published rows.
--   Editor: read all, insert/update rows — but cannot publish.
--   Admin: full control.
-- The publish gate is enforced by `with check (is_admin() or is_published = false)`
-- on the update policy.

alter table profiles           enable row level security;
alter table collection_centers enable row level security;
alter table missing_persons    enable row level security;
alter table donation_channels  enable row level security;
alter table resource_links     enable row level security;

-- ============== PROFILES ==============
drop policy if exists "team read profiles"   on profiles;
drop policy if exists "self read profile"    on profiles;
drop policy if exists "admin manage profiles" on profiles;

create policy "team read profiles"
  on profiles for select
  using (is_team());

create policy "self read profile"
  on profiles for select
  using (id = auth.uid());

create policy "admin manage profiles"
  on profiles for all
  using (is_admin())
  with check (is_admin());

-- ============== COLLECTION CENTERS ==============
drop policy if exists "public read published centers"   on collection_centers;
drop policy if exists "team read all centers"           on collection_centers;
drop policy if exists "editor insert centers"           on collection_centers;
drop policy if exists "editor update centers unpublished" on collection_centers;
drop policy if exists "admin delete centers"            on collection_centers;

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

-- ============== MISSING PERSONS (closed rows never public) ==============
drop policy if exists "public read published missing"     on missing_persons;
drop policy if exists "team read all missing"             on missing_persons;
drop policy if exists "editor insert missing"             on missing_persons;
drop policy if exists "editor update missing unpublished" on missing_persons;
drop policy if exists "admin delete missing"              on missing_persons;

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

-- ============== DONATION CHANNELS ==============
drop policy if exists "public read published channels"     on donation_channels;
drop policy if exists "team read all channels"             on donation_channels;
drop policy if exists "editor insert channels"             on donation_channels;
drop policy if exists "editor update channels unpublished" on donation_channels;
drop policy if exists "admin delete channels"              on donation_channels;

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

-- ============== RESOURCE LINKS ==============
drop policy if exists "public read published resources"     on resource_links;
drop policy if exists "team read all resources"             on resource_links;
drop policy if exists "editor insert resources"             on resource_links;
drop policy if exists "editor update resources unpublished" on resource_links;
drop policy if exists "admin delete resources"              on resource_links;

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
