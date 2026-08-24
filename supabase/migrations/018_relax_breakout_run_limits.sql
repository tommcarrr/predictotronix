-- Migration: 018_relax_breakout_run_limits
-- Ten levels can legitimately take much longer than 45 minutes, especially when paused.

alter table public.league_breakout_runs
  alter column expires_at set default (now() + interval '6 hours');

update public.league_breakout_runs
set expires_at = started_at + interval '6 hours'
where submitted_at is null
  and expires_at < started_at + interval '6 hours';

create or replace function public.submit_breakout_run(
  p_run_id uuid,
  p_league_id uuid,
  p_hits_by_level integer[],
  p_combo_awards integer,
  p_lives_lost integer,
  p_max_combo integer,
  p_duration_ms integer,
  p_finished boolean
)
returns table (
  rank_position bigint,
  participant_id uuid,
  display_name text,
  score integer,
  achieved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id uuid := public.get_participant_id();
  v_run public.league_breakout_runs%rowtype;
  v_hit_caps constant integer[] := array[72, 52, 44, 70, 86, 82, 88, 156, 144, 190];
  v_level integer;
  v_hits integer;
  v_total_hits integer := 0;
  v_combo_award_cap integer := 0;
  v_completed_levels integer := 0;
  v_progress_ended boolean := false;
  v_score integer := 0;
  v_server_elapsed_ms bigint;
begin
  if v_participant_id is null then
    raise exception 'No participant record found' using errcode = '42501';
  end if;
  if not public.is_league_breakout_member(p_league_id) then
    raise exception 'Not a member of this league' using errcode = '42501';
  end if;
  if p_hits_by_level is null or cardinality(p_hits_by_level) <> 10
    or p_combo_awards is null or p_combo_awards < 0
    or p_lives_lost is null or p_lives_lost < 0 or p_lives_lost > 99
    or p_max_combo is null or p_max_combo < 0
    or p_duration_ms is null or p_duration_ms < 0 or p_duration_ms > 21600000
    or p_finished is null then
    raise exception 'Invalid Breakout run summary' using errcode = '22023';
  end if;

  select * into v_run
  from public.league_breakout_runs
  where id = p_run_id
    and league_id = p_league_id
    and participant_id = v_participant_id
    and submitted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Breakout run is invalid, expired, or already used' using errcode = '22023';
  end if;

  for v_level in 1..10 loop
    v_hits := p_hits_by_level[v_level];
    if v_hits is null or v_hits < 0 or v_hits > v_hit_caps[v_level]
      or (v_progress_ended and v_hits > 0) then
      raise exception 'Impossible Breakout level progress' using errcode = '22023';
    end if;

    v_total_hits := v_total_hits + v_hits;
    v_combo_award_cap := v_combo_award_cap + floor(v_hits / 5.0);
    v_score := v_score + (v_hits * 50 * v_level);
    if not v_progress_ended and v_hits = v_hit_caps[v_level] then
      v_completed_levels := v_completed_levels + 1;
    else
      v_progress_ended := true;
    end if;
  end loop;

  if p_finished <> (v_completed_levels = 10)
    or p_combo_awards > v_combo_award_cap
    or p_max_combo > v_total_hits
    or p_duration_ms < v_total_hits * 25 then
    raise exception 'Impossible Breakout result' using errcode = '22023';
  end if;

  v_server_elapsed_ms := floor(extract(epoch from (now() - v_run.started_at)) * 1000);
  if v_server_elapsed_ms < v_total_hits * 25 then
    raise exception 'Breakout run completed too quickly' using errcode = '22023';
  end if;

  v_score := greatest(0, v_score + p_combo_awards * 250 - p_lives_lost * 1000);
  if p_finished and p_lives_lost = 0 then
    v_score := v_score + 3000;
  end if;
  if v_score > 379750 then
    raise exception 'Breakout score exceeds the verified maximum' using errcode = '22003';
  end if;

  update public.league_breakout_runs
  set submitted_at = now(),
      summary = jsonb_build_object(
        'hitsByLevel', to_jsonb(p_hits_by_level),
        'comboAwards', p_combo_awards,
        'livesLost', p_lives_lost,
        'maxCombo', p_max_combo,
        'durationMs', p_duration_ms,
        'finished', p_finished,
        'score', v_score
      )
  where id = p_run_id;

  insert into public.league_breakout_scores (
    league_id,
    participant_id,
    score,
    duration_ms,
    lives_lost,
    max_combo,
    finished
  ) values (
    p_league_id,
    v_participant_id,
    v_score,
    v_server_elapsed_ms::integer,
    p_lives_lost,
    p_max_combo,
    p_finished
  )
  on conflict on constraint league_breakout_scores_pkey do update
    set score = excluded.score,
        duration_ms = excluded.duration_ms,
        lives_lost = excluded.lives_lost,
        max_combo = excluded.max_combo,
        finished = excluded.finished,
        achieved_at = now()
    where excluded.score > league_breakout_scores.score
      or (
        excluded.score = league_breakout_scores.score
        and excluded.duration_ms < coalesce(league_breakout_scores.duration_ms, 2147483647)
      );

  return query select * from public.get_breakout_leaderboard(p_league_id);
end;
$$;

revoke all on function public.submit_breakout_run(
  uuid, uuid, integer[], integer, integer, integer, integer, boolean
) from public;
grant execute on function public.submit_breakout_run(
  uuid, uuid, integer[], integer, integer, integer, integer, boolean
) to authenticated;
