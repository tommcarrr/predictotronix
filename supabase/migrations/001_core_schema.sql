-- Migration: 001_core_schema
-- Core tables: profiles, participants, leagues, seasons, roles, join requests

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles
-- Extends auth.users with app-level user metadata
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email       text not null,
  mobile      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ============================================================
-- participants
-- Independent from auth — supports offline participants
-- ============================================================
create table public.participants (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  user_id      uuid references auth.users(id) on delete set null,
  email        text,
  mobile       text,
  is_offline   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint participants_user_id_unique unique (user_id)
);

alter table public.participants enable row level security;

create index participants_user_id_idx on public.participants(user_id);

-- ============================================================
-- leagues
-- ============================================================
create table public.leagues (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  invite_code   text not null unique default encode(gen_random_bytes(16), 'hex'),
  invite_active boolean not null default true,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.leagues enable row level security;

create index leagues_slug_idx on public.leagues(slug);
create index leagues_invite_code_idx on public.leagues(invite_code);

-- ============================================================
-- seasons
-- ============================================================
create table public.seasons (
  id                       uuid primary key default gen_random_uuid(),
  league_id                uuid not null references public.leagues(id) on delete cascade,
  name                     text not null,
  api_football_league_id   integer,         -- e.g. 39 for Premier League
  api_football_season      integer,         -- e.g. 2025
  season_type              text not null default 'production'
                             check (season_type in ('production', 'test', 'demo')),
  status                   text not null default 'setup'
                             check (status in ('setup', 'active', 'completed', 'archived')),
  created_at               timestamptz not null default now()
);

alter table public.seasons enable row level security;

create index seasons_league_id_idx on public.seasons(league_id);
create index seasons_status_idx on public.seasons(status);

-- ============================================================
-- season_participants
-- Who is enrolled in which season
-- ============================================================
create table public.season_participants (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references public.seasons(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  joined_at      timestamptz not null default now(),
  constraint season_participants_unique unique (season_id, participant_id)
);

alter table public.season_participants enable row level security;

create index season_participants_season_id_idx on public.season_participants(season_id);
create index season_participants_participant_id_idx on public.season_participants(participant_id);

-- ============================================================
-- league_roles
-- Roles scoped to a league (super_admin is system-wide via special league_id = null)
-- ============================================================
create table public.league_roles (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid references public.leagues(id) on delete cascade,  -- NULL = super_admin
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('super_admin', 'league_admin')),
  granted_at  timestamptz not null default now(),
  granted_by  uuid references auth.users(id) on delete set null,
  constraint league_roles_unique unique (league_id, user_id, role)
);

alter table public.league_roles enable row level security;

create index league_roles_user_id_idx on public.league_roles(user_id);
create index league_roles_league_id_idx on public.league_roles(league_id);

-- ============================================================
-- join_requests
-- Pending requests to join a league
-- ============================================================
create table public.join_requests (
  id           uuid primary key default gen_random_uuid(),
  league_id    uuid not null references public.leagues(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  reviewed_by  uuid references auth.users(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  constraint join_requests_unique unique (league_id, user_id)
);

alter table public.join_requests enable row level security;

create index join_requests_league_id_idx on public.join_requests(league_id);
create index join_requests_user_id_idx on public.join_requests(user_id);
create index join_requests_status_idx on public.join_requests(status);

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger participants_updated_at
  before update on public.participants
  for each row execute function public.set_updated_at();

-- ============================================================
-- Trigger: auto-create profile on auth.users insert
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
