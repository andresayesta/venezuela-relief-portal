-- Venezuela Relief Hub — schema
-- Paste this into Supabase → SQL Editor → New query, run once.
-- After this finishes, run 02_rls.sql.

create extension if not exists "uuid-ossp";

-- Shared trust tier
do $$ begin
  create type trust_tier as enum ('verified', 'reported', 'unverified');
exception when duplicate_object then null; end $$;

-- Team roles
do $$ begin
  create type user_role as enum ('editor', 'admin');
exception when duplicate_object then null; end $$;

-- =========================================================
-- PROFILES (team members; one row per Supabase auth user)
-- editor: can create/edit; work lands in pending queue
-- admin:  full control, can publish and manage the team
-- =========================================================
create table if not exists profiles (
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

-- Helper: is the current user on the team at all?
create or replace function is_team()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid()
  );
$$ language sql security definer stable;

-- =========================================================
-- COLLECTION CENTERS (Centros de Acopio)
-- =========================================================
create table if not exists collection_centers (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  state         text not null,
  city          text,
  neighborhood  text,
  address       text,
  latitude      numeric,
  longitude     numeric,
  accepted_items text,
  urgent_needs  text,
  hours         text,
  contact_name  text,
  contact_phone text,
  direction     text default 'dropoff', -- 'dropoff' or 'pickup'
  trust_tier    trust_tier not null default 'unverified',
  source        text,
  notes         text,
  is_published  boolean not null default false,
  submitted_by  text,
  created_by    uuid references profiles(id),
  published_by  uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  verified_at   timestamptz
);

-- =========================================================
-- MISSING PERSONS
-- 'closed' covers any resolution including death;
-- closed rows drop from public view.
-- =========================================================
do $$ begin
  create type missing_status as enum ('missing', 'found_safe', 'closed');
exception when duplicate_object then null; end $$;

create table if not exists missing_persons (
  id                 uuid primary key default uuid_generate_v4(),
  full_name          text not null,
  age                int,
  last_seen_location text,
  last_seen_state    text,
  last_seen_date     date,
  description        text,
  photo_url          text,
  reporter_name      text,
  reporter_contact   text,
  relationship       text,
  status             missing_status not null default 'missing',
  trust_tier         trust_tier not null default 'unverified',
  source             text,
  consent_to_publish boolean not null default false,
  is_published       boolean not null default false,
  submitted_by       text,
  created_by         uuid references profiles(id),
  published_by       uuid references profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- =========================================================
-- DONATION / AID CHANNELS
-- =========================================================
create table if not exists donation_channels (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  category        text,
  url             text,
  why_trusted     text,
  efficiency_note text,
  region_focus    text,
  trust_tier      trust_tier not null default 'verified',
  is_published    boolean not null default true,
  sort_order      int default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =========================================================
-- RESOURCE LINKS (emergency numbers, consular, anti-scam, shelters, etc.)
-- =========================================================
create table if not exists resource_links (
  id            uuid primary key default uuid_generate_v4(),
  category      text not null,
  title         text not null,
  description   text,
  url_or_contact text,
  country       text,
  state         text,
  sort_order    int default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Updated-at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_centers_updated  on collection_centers;
drop trigger if exists trg_missing_updated  on missing_persons;
drop trigger if exists trg_channels_updated on donation_channels;

create trigger trg_centers_updated  before update on collection_centers
  for each row execute function set_updated_at();
create trigger trg_missing_updated  before update on missing_persons
  for each row execute function set_updated_at();
create trigger trg_channels_updated before update on donation_channels
  for each row execute function set_updated_at();
