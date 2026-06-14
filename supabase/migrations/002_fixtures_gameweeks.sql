-- Migration: 002_fixtures_gameweeks
-- Gameweeks and fixtures tables

-- ============================================================
-- gameweeks
-- ============================================================
create table public.gameweeks (
  id                   uuid primary key default gen_random_uuid(),
  season_id            uuid not null references public.seasons(id) on delete cascade,
  gameweek_number      integer not null,
  label                text,                                  -- e.g. "Gameweek 1"
  api_football_round   text,                                  -- API-Football round string
  status               text not null default 'upcoming'
                         check (status in ('upcoming', 'in_progress', 'completed')),
  first_kickoff        timestamptz,                           -- cached for reminder scheduling
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint gameweeks_unique unique (season_id, gameweek_number)
);

alter table public.gameweeks enable row level security;

create index gameweeks_season_id_idx on public.gameweeks(season_id);
create index gameweeks_status_idx on public.gameweeks(status);
create index gameweeks_first_kickoff_idx on public.gameweeks(first_kickoff);

create trigger gameweeks_updated_at
  before update on public.gameweeks
  for each row execute function public.set_updated_at();

-- ============================================================
-- fixtures
-- ============================================================
create table public.fixtures (
  id                      uuid primary key default gen_random_uuid(),
  season_id               uuid not null references public.seasons(id) on delete cascade,
  gameweek_id             uuid references public.gameweeks(id) on delete set null,
  api_football_fixture_id integer unique,
  home_team_name          text not null,
  away_team_name          text not null,
  home_team_api_id        integer,
  away_team_api_id        integer,
  kickoff                 timestamptz not null,
  status                  text not null default 'scheduled'
                            check (status in (
                              'scheduled', 'live', 'finished',
                              'postponed', 'cancelled', 'abandoned'
                            )),
  home_score              integer,
  away_score              integer,
  result_confirmed        boolean not null default false,
  api_football_status     text,                               -- raw API status code
  api_football_data       jsonb,                              -- full API response for audit
  last_synced_at          timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.fixtures enable row level security;

create index fixtures_season_id_idx on public.fixtures(season_id);
create index fixtures_gameweek_id_idx on public.fixtures(gameweek_id);
create index fixtures_kickoff_idx on public.fixtures(kickoff);
create index fixtures_status_idx on public.fixtures(status);
create index fixtures_result_confirmed_idx on public.fixtures(result_confirmed);
create index fixtures_api_id_idx on public.fixtures(api_football_fixture_id);

create trigger fixtures_updated_at
  before update on public.fixtures
  for each row execute function public.set_updated_at();

-- ============================================================
-- Function: recompute gameweek first_kickoff after fixture change
-- ============================================================
create or replace function public.refresh_gameweek_first_kickoff()
returns trigger language plpgsql as $$
begin
  -- Update first_kickoff for the affected gameweek(s)
  if new.gameweek_id is not null then
    update public.gameweeks
    set first_kickoff = (
      select min(kickoff)
      from public.fixtures
      where gameweek_id = new.gameweek_id
        and status not in ('postponed', 'cancelled', 'abandoned')
    )
    where id = new.gameweek_id;
  end if;

  -- If gameweek changed, also update the old gameweek
  if TG_OP = 'UPDATE' and old.gameweek_id is not null and old.gameweek_id <> new.gameweek_id then
    update public.gameweeks
    set first_kickoff = (
      select min(kickoff)
      from public.fixtures
      where gameweek_id = old.gameweek_id
        and status not in ('postponed', 'cancelled', 'abandoned')
    )
    where id = old.gameweek_id;
  end if;

  return new;
end;
$$;

create trigger fixtures_refresh_gameweek_kickoff
  after insert or update of kickoff, gameweek_id, status on public.fixtures
  for each row execute function public.refresh_gameweek_first_kickoff();
