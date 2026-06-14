-- Migration: 006_rpc_functions
-- Database RPC functions for scoring, leaderboards, and locking

-- ============================================================
-- score_predictions(fixture_id)
-- Score all predictions for a fixture after result is confirmed.
-- Idempotent: safe to call multiple times.
-- ============================================================
create or replace function public.score_predictions(p_fixture_id uuid)
returns integer language plpgsql security definer as $$
declare
  v_home_score integer;
  v_away_score integer;
  v_result_confirmed boolean;
  v_scored_count integer := 0;
  v_pred record;
  v_points integer;
  v_reason text;
  v_pred_result text;
  v_actual_result text;
begin
  -- Fetch confirmed result
  select home_score, away_score, result_confirmed
  into v_home_score, v_away_score, v_result_confirmed
  from public.fixtures
  where id = p_fixture_id;

  if not found or not v_result_confirmed then
    raise exception 'Fixture % is not confirmed', p_fixture_id;
  end if;

  -- Compute actual result: 'H', 'D', 'A'
  v_actual_result := case
    when v_home_score > v_away_score then 'H'
    when v_home_score = v_away_score then 'D'
    else 'A'
  end;

  -- Score each prediction
  for v_pred in
    select id, home_score, away_score
    from public.predictions
    where fixture_id = p_fixture_id
  loop
    -- Compute predicted result
    v_pred_result := case
      when v_pred.home_score > v_pred.away_score then 'H'
      when v_pred.home_score = v_pred.away_score then 'D'
      else 'A'
    end;

    -- Determine points
    if v_pred.home_score = v_home_score and v_pred.away_score = v_away_score then
      v_points := 3;
      v_reason := 'exact';
    elsif v_pred_result = v_actual_result then
      v_points := 1;
      v_reason := 'correct_result';
    else
      v_points := 0;
      v_reason := 'incorrect';
    end if;

    -- Update prediction
    update public.predictions
    set points_awarded = v_points,
        points_reason  = v_reason,
        scored_at      = now()
    where id = v_pred.id;

    v_scored_count := v_scored_count + 1;
  end loop;

  return v_scored_count;
end;
$$;

-- ============================================================
-- recalculate_fixture_scores(fixture_id)
-- Re-score all predictions after a result correction.
-- Identical logic to score_predictions — alias for clarity.
-- ============================================================
create or replace function public.recalculate_fixture_scores(p_fixture_id uuid)
returns integer language sql security definer as $$
  select public.score_predictions(p_fixture_id);
$$;

-- ============================================================
-- check_kickoff_lock(fixture_id)
-- Returns true if the fixture kickoff has passed (predictions locked).
-- ============================================================
create or replace function public.check_kickoff_lock(p_fixture_id uuid)
returns boolean language sql stable security definer as $$
  select kickoff <= now()
  from public.fixtures
  where id = p_fixture_id;
$$;

-- ============================================================
-- get_season_leaderboard(season_id)
-- Returns ranked leaderboard for a season.
-- Exposes only points — never raw prediction scores.
-- ============================================================
create or replace function public.get_season_leaderboard(p_season_id uuid)
returns table (
  position       integer,
  participant_id uuid,
  display_name   text,
  total_points   bigint,
  exact_count    bigint,
  predictions_submitted bigint
) language sql stable security definer as $$
  with scored as (
    select
      p.participant_id,
      par.display_name,
      coalesce(sum(p.points_awarded), 0)                              as total_points,
      count(*) filter (where p.points_reason = 'exact')               as exact_count,
      count(*) filter (where p.scored_at is not null)                 as predictions_submitted
    from public.season_participants sp
    join public.participants par on par.id = sp.participant_id
    left join public.predictions p
      on p.participant_id = sp.participant_id
      and p.season_id = p_season_id
    where sp.season_id = p_season_id
    group by p.participant_id, par.display_name
  ),
  ranked as (
    select
      rank() over (
        order by total_points desc, exact_count desc
      )::integer                                                       as position,
      participant_id,
      display_name,
      total_points,
      exact_count,
      predictions_submitted
    from scored
  )
  select * from ranked
  order by position, display_name;
$$;

-- ============================================================
-- get_gameweek_leaderboard(gameweek_id)
-- Returns ranked leaderboard for a single gameweek.
-- ============================================================
create or replace function public.get_gameweek_leaderboard(p_gameweek_id uuid)
returns table (
  position       integer,
  participant_id uuid,
  display_name   text,
  total_points   bigint,
  exact_count    bigint,
  predictions_submitted bigint,
  fixtures_in_gameweek  bigint
) language sql stable security definer as $$
  with gameweek_info as (
    select season_id from public.gameweeks where id = p_gameweek_id
  ),
  fixture_count as (
    select count(*) as cnt
    from public.fixtures
    where gameweek_id = p_gameweek_id
  ),
  scored as (
    select
      sp.participant_id,
      par.display_name,
      coalesce(sum(p.points_awarded), 0)                              as total_points,
      count(*) filter (where p.points_reason = 'exact')               as exact_count,
      count(*) filter (where p.scored_at is not null)                 as predictions_submitted
    from gameweek_info gi
    join public.season_participants sp on sp.season_id = gi.season_id
    join public.participants par on par.id = sp.participant_id
    left join public.predictions p
      on p.participant_id = sp.participant_id
      and p.fixture_id in (
        select id from public.fixtures where gameweek_id = p_gameweek_id
      )
    group by sp.participant_id, par.display_name
  ),
  ranked as (
    select
      rank() over (
        order by total_points desc, exact_count desc
      )::integer                                                       as position,
      participant_id,
      display_name,
      total_points,
      exact_count,
      predictions_submitted,
      (select cnt from fixture_count)                                  as fixtures_in_gameweek
    from scored
  )
  select * from ranked
  order by position, display_name;
$$;
