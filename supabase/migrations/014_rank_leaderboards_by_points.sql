-- Rank equal points together and order tied participants alphabetically.

create or replace function public.get_season_leaderboard(p_season_id uuid)
returns table (
  "position"     integer,
  participant_id uuid,
  display_name   text,
  total_points   bigint,
  exact_count    bigint,
  predictions_submitted bigint
) language sql stable security definer as $$
  with scored as (
    select
      sp.participant_id,
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
    group by sp.participant_id, par.display_name
  ),
  ranked as (
    select
      rank() over (order by total_points desc)::integer               as "position",
      participant_id,
      display_name,
      total_points,
      exact_count,
      predictions_submitted
    from scored
  )
  select * from ranked
  order by "position", display_name;
$$;

create or replace function public.get_gameweek_leaderboard(p_gameweek_id uuid)
returns table (
  "position"     integer,
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
      rank() over (order by total_points desc)::integer               as "position",
      participant_id,
      display_name,
      total_points,
      exact_count,
      predictions_submitted,
      (select cnt from fixture_count)                                  as fixtures_in_gameweek
    from scored
  )
  select * from ranked
  order by "position", display_name;
$$;
