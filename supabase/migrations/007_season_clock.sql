-- Migration: 007_season_clock
-- A test/demo-season clock used by staging admin tools, application lock checks,
-- reminder scheduling, and prediction RLS. Production seasons always use real time.

create table public.season_runtime_settings (
  season_id      uuid primary key references public.seasons(id) on delete cascade,
  simulated_now  timestamptz,
  updated_by     uuid references auth.users(id) on delete set null,
  updated_at     timestamptz not null default now()
);

alter table public.season_runtime_settings enable row level security;

-- No RLS policies are intentional: only trusted service-role code can manage
-- clock overrides. Authenticated users consume the safe function below.
create or replace function public.get_season_time(p_season_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select case
    when s.season_type in ('test', 'demo')
      then coalesce(rs.simulated_now, statement_timestamp())
    else statement_timestamp()
  end
  from public.seasons s
  left join public.season_runtime_settings rs on rs.season_id = s.id
  where s.id = p_season_id;
$$;

revoke all on function public.get_season_time(uuid) from public;
grant execute on function public.get_season_time(uuid) to authenticated, service_role;

drop policy if exists "predictions_insert_own_before_kickoff" on public.predictions;
create policy "predictions_insert_own_before_kickoff"
  on public.predictions for insert
  with check (
    participant_id = public.get_participant_id()
    and (
      select f.kickoff > public.get_season_time(f.season_id)
      from public.fixtures f
      where f.id = fixture_id
    )
  );

drop policy if exists "predictions_update_own_before_kickoff" on public.predictions;
create policy "predictions_update_own_before_kickoff"
  on public.predictions for update
  using (
    participant_id = public.get_participant_id()
    and (
      select f.kickoff > public.get_season_time(f.season_id)
      from public.fixtures f
      where f.id = fixture_id
    )
  )
  with check (
    participant_id = public.get_participant_id()
    and (
      select f.kickoff > public.get_season_time(f.season_id)
      from public.fixtures f
      where f.id = fixture_id
    )
  );

create or replace function public.check_kickoff_lock(p_fixture_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select kickoff <= public.get_season_time(season_id)
  from public.fixtures
  where id = p_fixture_id;
$$;

