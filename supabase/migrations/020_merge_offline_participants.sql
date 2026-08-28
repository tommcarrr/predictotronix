-- Migration: 020_merge_offline_participants
-- Atomically folds an offline participant into an existing registered participant.

create table public.participant_merges (
  id                    uuid primary key default gen_random_uuid(),
  source_participant_id uuid not null,
  target_participant_id uuid not null,
  target_user_id        uuid not null,
  merged_by             uuid not null,
  source_snapshot       jsonb not null,
  conflict_snapshot     jsonb not null,
  merge_summary         jsonb not null,
  merged_at             timestamptz not null default now(),
  check (source_participant_id <> target_participant_id)
);

alter table public.participant_merges enable row level security;
revoke all on public.participant_merges from anon, authenticated;

create index participant_merges_source_idx
  on public.participant_merges(source_participant_id);
create index participant_merges_target_idx
  on public.participant_merges(target_participant_id, merged_at desc);

create or replace function public.merge_offline_participant(
  p_source_participant_id uuid,
  p_target_participant_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source public.participants%rowtype;
  v_target public.participants%rowtype;
  v_is_super_admin boolean;
  v_affected_league_ids uuid[];
  v_unauthorized_league_ids uuid[];
  v_unknown_references text[];
  v_season_enrolments integer;
  v_duplicate_enrolments integer;
  v_predictions integer;
  v_prediction_conflicts integer;
  v_prediction_audits integer;
  v_notification_logs integer;
  v_breakout_scores integer;
  v_breakout_score_conflicts integer;
  v_breakout_runs integer;
  v_had_preferences boolean;
  v_kept_target_preferences boolean;
  v_conflict_snapshot jsonb;
  v_summary jsonb;
begin
  if p_source_participant_id is null
    or p_target_participant_id is null
    or p_actor_user_id is null then
    raise exception 'Source, target, and actor are required' using errcode = '22023';
  end if;

  if p_source_participant_id = p_target_participant_id then
    raise exception 'Source and target participants must be different' using errcode = '22023';
  end if;

  -- Lock in a stable order so concurrent merge attempts cannot race or deadlock.
  perform 1
  from public.participants
  where id in (p_source_participant_id, p_target_participant_id)
  order by id
  for update;

  select * into v_source
  from public.participants
  where id = p_source_participant_id;

  select * into v_target
  from public.participants
  where id = p_target_participant_id;

  if v_source.id is null then
    raise exception 'Offline participant was not found' using errcode = 'P0002';
  end if;
  if v_target.id is null then
    raise exception 'Registered participant was not found' using errcode = 'P0002';
  end if;
  if not v_source.is_offline or v_source.user_id is not null then
    raise exception 'The source must be an unclaimed offline participant' using errcode = '22023';
  end if;
  if v_target.is_offline or v_target.user_id is null then
    raise exception 'The target must be a registered participant' using errcode = '22023';
  end if;

  -- Fail closed if a later migration adds participant-owned data without teaching
  -- this function how to migrate it. This prevents ON DELETE CASCADE data loss.
  select array_agg(format('%I.%I', table_name, column_name) order by table_name, column_name)
  into v_unknown_references
  from (
    select
      child.relname as table_name,
      child_attribute.attname as column_name
    from pg_constraint constraint_row
    join pg_class parent on parent.oid = constraint_row.confrelid
    join pg_namespace parent_namespace on parent_namespace.oid = parent.relnamespace
    join pg_class child on child.oid = constraint_row.conrelid
    join pg_namespace child_namespace on child_namespace.oid = child.relnamespace
    join unnest(constraint_row.conkey) with ordinality child_key(attnum, position) on true
    join unnest(constraint_row.confkey) with ordinality parent_key(attnum, position)
      on parent_key.position = child_key.position
    join pg_attribute child_attribute
      on child_attribute.attrelid = child.oid and child_attribute.attnum = child_key.attnum
    join pg_attribute parent_attribute
      on parent_attribute.attrelid = parent.oid and parent_attribute.attnum = parent_key.attnum
    where constraint_row.contype = 'f'
      and parent_namespace.nspname = 'public'
      and parent.relname = 'participants'
      and parent_attribute.attname = 'id'
      and child_namespace.nspname = 'public'
  ) participant_references
  where (table_name, column_name) not in (
    ('season_participants', 'participant_id'),
    ('predictions', 'participant_id'),
    ('notification_preferences', 'participant_id'),
    ('notification_log', 'participant_id'),
    ('league_breakout_scores', 'participant_id'),
    ('league_breakout_runs', 'participant_id')
  );

  if coalesce(cardinality(v_unknown_references), 0) > 0 then
    raise exception 'Merge blocked: unhandled participant references: %',
      array_to_string(v_unknown_references, ', ')
      using errcode = '55000';
  end if;

  select exists (
    select 1
    from public.league_roles
    where user_id = p_actor_user_id
      and role = 'super_admin'
      and league_id is null
  ) into v_is_super_admin;

  select coalesce(array_agg(distinct league_id), array[]::uuid[])
  into v_affected_league_ids
  from (
    select seasons.league_id
    from public.season_participants
    join public.seasons on seasons.id = season_participants.season_id
    where season_participants.participant_id = p_source_participant_id
    union
    select seasons.league_id
    from public.predictions
    join public.seasons on seasons.id = predictions.season_id
    where predictions.participant_id = p_source_participant_id
    union
    select league_id from public.league_breakout_scores
    where participant_id = p_source_participant_id
    union
    select league_id from public.league_breakout_runs
    where participant_id = p_source_participant_id
  ) affected_leagues;

  if not v_is_super_admin then
    if cardinality(v_affected_league_ids) = 0 then
      raise exception 'Only a super admin can merge an offline participant with no league data'
        using errcode = '42501';
    end if;

    select array_agg(league_id)
    into v_unauthorized_league_ids
    from unnest(v_affected_league_ids) affected(league_id)
    where not exists (
      select 1
      from public.league_roles
      where user_id = p_actor_user_id
        and role = 'league_admin'
        and league_roles.league_id = affected.league_id
    );

    if coalesce(cardinality(v_unauthorized_league_ids), 0) > 0 then
      raise exception 'Merge would affect leagues the acting admin does not manage'
        using errcode = '42501';
    end if;
  end if;

  select count(*)::integer into v_season_enrolments
  from public.season_participants where participant_id = p_source_participant_id;
  select count(*)::integer into v_duplicate_enrolments
  from public.season_participants source_enrolment
  where source_enrolment.participant_id = p_source_participant_id
    and exists (
      select 1 from public.season_participants target_enrolment
      where target_enrolment.season_id = source_enrolment.season_id
        and target_enrolment.participant_id = p_target_participant_id
    );
  select count(*)::integer into v_predictions
  from public.predictions where participant_id = p_source_participant_id;
  select count(*)::integer into v_prediction_conflicts
  from public.predictions source_prediction
  where source_prediction.participant_id = p_source_participant_id
    and exists (
      select 1 from public.predictions target_prediction
      where target_prediction.fixture_id = source_prediction.fixture_id
        and target_prediction.participant_id = p_target_participant_id
    );
  select count(*)::integer into v_prediction_audits
  from public.prediction_audit
  where prediction_id in (
    select id from public.predictions where participant_id = p_source_participant_id
  );
  select count(*)::integer into v_notification_logs
  from public.notification_log where participant_id = p_source_participant_id;
  select count(*)::integer into v_breakout_scores
  from public.league_breakout_scores where participant_id = p_source_participant_id;
  select count(*)::integer into v_breakout_score_conflicts
  from public.league_breakout_scores source_score
  where source_score.participant_id = p_source_participant_id
    and exists (
      select 1 from public.league_breakout_scores target_score
      where target_score.league_id = source_score.league_id
        and target_score.participant_id = p_target_participant_id
    );
  select count(*)::integer into v_breakout_runs
  from public.league_breakout_runs where participant_id = p_source_participant_id;
  select exists (
    select 1 from public.notification_preferences
    where participant_id = p_source_participant_id
  ) into v_had_preferences;
  select exists (
    select 1 from public.notification_preferences
    where participant_id = p_target_participant_id
  ) into v_kept_target_preferences;

  -- Constraints mean duplicate current-state rows cannot both survive. Capture
  -- every row that conflict resolution may supersede so the operation remains
  -- fully auditable even though only one current value can remain.
  select jsonb_build_object(
    'predictionConflicts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'source', to_jsonb(source_prediction),
        'target', to_jsonb(target_prediction)
      ) order by source_prediction.fixture_id)
      from public.predictions source_prediction
      join public.predictions target_prediction
        on target_prediction.fixture_id = source_prediction.fixture_id
       and target_prediction.participant_id = p_target_participant_id
      where source_prediction.participant_id = p_source_participant_id
    ), '[]'::jsonb),
    'notificationPreferences', coalesce((
      select to_jsonb(source_preferences)
      from public.notification_preferences source_preferences
      where source_preferences.participant_id = p_source_participant_id
        and v_kept_target_preferences
    ), 'null'::jsonb),
    'breakoutScoreConflicts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'source', to_jsonb(source_score),
        'target', to_jsonb(target_score)
      ) order by source_score.league_id)
      from public.league_breakout_scores source_score
      join public.league_breakout_scores target_score
        on target_score.league_id = source_score.league_id
       and target_score.participant_id = p_target_participant_id
      where source_score.participant_id = p_source_participant_id
    ), '[]'::jsonb)
  ) into v_conflict_snapshot;

  -- Duplicate prediction values cannot both remain current. Keep the registered
  -- participant's current prediction, but attach every source audit row to it.
  update public.prediction_audit audit_row
  set prediction_id = target_prediction.id
  from public.predictions source_prediction
  join public.predictions target_prediction
    on target_prediction.fixture_id = source_prediction.fixture_id
   and target_prediction.participant_id = p_target_participant_id
  where source_prediction.participant_id = p_source_participant_id
    and audit_row.prediction_id = source_prediction.id;

  delete from public.predictions source_prediction
  using public.predictions target_prediction
  where source_prediction.participant_id = p_source_participant_id
    and target_prediction.participant_id = p_target_participant_id
    and target_prediction.fixture_id = source_prediction.fixture_id;

  update public.predictions
  set participant_id = p_target_participant_id
  where participant_id = p_source_participant_id;

  delete from public.season_participants source_enrolment
  using public.season_participants target_enrolment
  where source_enrolment.participant_id = p_source_participant_id
    and target_enrolment.participant_id = p_target_participant_id
    and target_enrolment.season_id = source_enrolment.season_id;

  update public.season_participants
  set participant_id = p_target_participant_id
  where participant_id = p_source_participant_id;

  update public.notification_log
  set participant_id = p_target_participant_id
  where participant_id = p_source_participant_id;

  -- Registered-user preferences win. Offline defaults (normally email disabled)
  -- must not unexpectedly overwrite choices made by the signed-up user.
  if v_had_preferences and v_kept_target_preferences then
    delete from public.notification_preferences
    where participant_id = p_source_participant_id;
  elsif v_had_preferences then
    update public.notification_preferences
    set participant_id = p_target_participant_id
    where participant_id = p_source_participant_id;
  end if;

  -- Upsert the offline score into the registered participant, retaining whichever
  -- result ranks better under the leaderboard's score/finish/duration ordering.
  insert into public.league_breakout_scores (
    league_id, participant_id, score, duration_ms, lives_lost, max_combo,
    finished, achieved_at, updated_at
  )
  select
    league_id, p_target_participant_id, score, duration_ms, lives_lost, max_combo,
    finished, achieved_at, updated_at
  from public.league_breakout_scores
  where participant_id = p_source_participant_id
  on conflict (league_id, participant_id) do update
  set score = excluded.score,
      duration_ms = excluded.duration_ms,
      lives_lost = excluded.lives_lost,
      max_combo = excluded.max_combo,
      finished = excluded.finished,
      achieved_at = excluded.achieved_at,
      updated_at = excluded.updated_at
  where excluded.score > league_breakout_scores.score
     or (
       excluded.score = league_breakout_scores.score
       and case excluded.finished when true then 2 when false then 1 else 0 end
         > case league_breakout_scores.finished when true then 2 when false then 1 else 0 end
     )
     or (
       excluded.score = league_breakout_scores.score
       and case excluded.finished when true then 2 when false then 1 else 0 end
         = case league_breakout_scores.finished when true then 2 when false then 1 else 0 end
       and coalesce(excluded.duration_ms, 2147483647)
         < coalesce(league_breakout_scores.duration_ms, 2147483647)
     );

  delete from public.league_breakout_scores
  where participant_id = p_source_participant_id;

  update public.league_breakout_runs
  set participant_id = p_target_participant_id
  where participant_id = p_source_participant_id;

  -- Keep the registered identity, filling only contact gaps from the offline
  -- record that the admin has explicitly matched to it.
  update public.participants
  set email = coalesce(email, v_source.email),
      mobile = coalesce(mobile, v_source.mobile)
  where id = p_target_participant_id;

  v_summary := jsonb_build_object(
    'affectedLeagueIds', to_jsonb(v_affected_league_ids),
    'seasonEnrolments', v_season_enrolments,
    'duplicateSeasonEnrolments', v_duplicate_enrolments,
    'predictions', v_predictions,
    'predictionConflictsKeptTarget', v_prediction_conflicts,
    'predictionAuditRows', v_prediction_audits,
    'notificationLogs', v_notification_logs,
    'sourceHadNotificationPreferences', v_had_preferences,
    'keptTargetNotificationPreferences', v_kept_target_preferences,
    'breakoutScores', v_breakout_scores,
    'breakoutScoreConflictsKeptBest', v_breakout_score_conflicts,
    'breakoutRuns', v_breakout_runs
  );

  insert into public.participant_merges (
    source_participant_id,
    target_participant_id,
    target_user_id,
    merged_by,
    source_snapshot,
    conflict_snapshot,
    merge_summary
  ) values (
    v_source.id,
    v_target.id,
    v_target.user_id,
    p_actor_user_id,
    to_jsonb(v_source),
    v_conflict_snapshot,
    v_summary
  );

  delete from public.participants where id = p_source_participant_id;

  return v_summary;
end;
$$;

revoke all on function public.merge_offline_participant(uuid, uuid, uuid) from public;
revoke all on function public.merge_offline_participant(uuid, uuid, uuid) from anon, authenticated;
grant execute on function public.merge_offline_participant(uuid, uuid, uuid) to service_role;
