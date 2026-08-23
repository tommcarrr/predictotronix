-- Migration: 015_league_breakout_scores
-- Persistent, league-scoped personal bests for the hidden Breakout game.

create table public.league_breakout_scores (
  league_id      uuid not null references public.leagues(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  score          integer not null check (score >= 0 and score <= 54000),
  achieved_at    timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (league_id, participant_id)
);

alter table public.league_breakout_scores enable row level security;

create index league_breakout_scores_ranking_idx
  on public.league_breakout_scores(league_id, score desc, achieved_at asc);

create trigger league_breakout_scores_updated_at
  before update on public.league_breakout_scores
  for each row execute function public.set_updated_at();

create or replace function public.is_league_breakout_member(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_league_admin(p_league_id) or exists (
    select 1
    from public.seasons s
    join public.season_participants sp on sp.season_id = s.id
    where s.league_id = p_league_id
      and sp.participant_id = public.get_participant_id()
  );
$$;

create policy "league_breakout_scores_select_members"
  on public.league_breakout_scores for select
  using (public.is_league_breakout_member(league_id));

create policy "league_breakout_scores_insert_own"
  on public.league_breakout_scores for insert
  with check (
    participant_id = public.get_participant_id()
    and public.is_league_breakout_member(league_id)
  );

create policy "league_breakout_scores_update_own"
  on public.league_breakout_scores for update
  using (
    participant_id = public.get_participant_id()
    and public.is_league_breakout_member(league_id)
  )
  with check (
    participant_id = public.get_participant_id()
    and public.is_league_breakout_member(league_id)
  );

create or replace function public.get_breakout_leaderboard(p_league_id uuid)
returns table (
  rank_position bigint,
  participant_id uuid,
  display_name text,
  score integer,
  achieved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_league_breakout_member(p_league_id) then
    raise exception 'Not a member of this league' using errcode = '42501';
  end if;

  return query
    select
      row_number() over (order by lbs.score desc, lbs.achieved_at asc),
      lbs.participant_id,
      p.display_name,
      lbs.score,
      lbs.achieved_at
    from public.league_breakout_scores lbs
    join public.participants p on p.id = lbs.participant_id
    where lbs.league_id = p_league_id
    order by lbs.score desc, lbs.achieved_at asc
    limit 20;
end;
$$;

create or replace function public.submit_breakout_score(
  p_league_id uuid,
  p_score integer
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
begin
  if v_participant_id is null then
    raise exception 'No participant record found' using errcode = '42501';
  end if;
  if not public.is_league_breakout_member(p_league_id) then
    raise exception 'Not a member of this league' using errcode = '42501';
  end if;
  if p_score < 0 or p_score > 54000 then
    raise exception 'Invalid Breakout score' using errcode = '22003';
  end if;

  insert into public.league_breakout_scores (league_id, participant_id, score)
  values (p_league_id, v_participant_id, p_score)
  on conflict on constraint league_breakout_scores_pkey do update
    set score = excluded.score,
        achieved_at = now()
    where excluded.score > league_breakout_scores.score;

  return query select * from public.get_breakout_leaderboard(p_league_id);
end;
$$;

revoke all on function public.is_league_breakout_member(uuid) from public;
revoke all on function public.get_breakout_leaderboard(uuid) from public;
revoke all on function public.submit_breakout_score(uuid, integer) from public;
grant execute on function public.is_league_breakout_member(uuid) to authenticated;
grant execute on function public.get_breakout_leaderboard(uuid) to authenticated;
grant execute on function public.submit_breakout_score(uuid, integer) to authenticated;
