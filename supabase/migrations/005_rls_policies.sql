-- Migration: 005_rls_policies
-- Row Level Security policies for all tables

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function public.get_participant_id()
returns uuid language sql stable security definer as $$
  select id from public.participants where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.league_roles
    where user_id = auth.uid()
      and role = 'super_admin'
      and league_id is null
  );
$$;

create or replace function public.is_league_admin(p_league_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.league_roles
    where user_id = auth.uid()
      and league_id = p_league_id
      and role = 'league_admin'
  ) or public.is_super_admin();
$$;

create or replace function public.is_season_participant(p_season_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.season_participants sp
    where sp.season_id = p_season_id
      and sp.participant_id = public.get_participant_id()
  );
$$;

-- ============================================================
-- profiles
-- ============================================================
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- ============================================================
-- participants
-- Users can only read their own participant record.
-- Admins use the service-role client (bypasses RLS).
-- ============================================================
create policy "participants_select_own"
  on public.participants for select
  using (user_id = auth.uid());

create policy "participants_update_own"
  on public.participants for update
  using (user_id = auth.uid() and is_offline = false);

-- ============================================================
-- leagues
-- Any authenticated user can read leagues (needed for invite flow).
-- Only super admins can insert/update.
-- ============================================================
create policy "leagues_select_authenticated"
  on public.leagues for select
  using (auth.role() = 'authenticated');

create policy "leagues_insert_super_admin"
  on public.leagues for insert
  with check (public.is_super_admin());

create policy "leagues_update_super_admin"
  on public.leagues for update
  using (public.is_super_admin());

-- ============================================================
-- seasons
-- Season participants can read their season.
-- League admins/super admins can manage seasons.
-- ============================================================
create policy "seasons_select_participant"
  on public.seasons for select
  using (public.is_season_participant(id) or public.is_super_admin());

create policy "seasons_insert_super_admin"
  on public.seasons for insert
  with check (public.is_super_admin());

create policy "seasons_update_super_admin"
  on public.seasons for update
  using (public.is_super_admin());

-- ============================================================
-- season_participants
-- Users can see their own enrollment.
-- Admins use service-role client.
-- ============================================================
create policy "season_participants_select_own"
  on public.season_participants for select
  using (participant_id = public.get_participant_id());

-- ============================================================
-- league_roles
-- Users can see their own roles.
-- Super admins can see all.
-- ============================================================
create policy "league_roles_select_own"
  on public.league_roles for select
  using (user_id = auth.uid() or public.is_super_admin());

-- ============================================================
-- join_requests
-- Users can see and manage their own requests.
-- ============================================================
create policy "join_requests_select_own"
  on public.join_requests for select
  using (user_id = auth.uid());

create policy "join_requests_insert_own"
  on public.join_requests for insert
  with check (user_id = auth.uid());

-- Only pending requests can be withdrawn/updated by the user
create policy "join_requests_update_own_pending"
  on public.join_requests for update
  using (user_id = auth.uid() and status = 'pending');

-- ============================================================
-- gameweeks
-- Season participants can read gameweeks for their seasons.
-- ============================================================
create policy "gameweeks_select_participant"
  on public.gameweeks for select
  using (public.is_season_participant(season_id));

-- ============================================================
-- fixtures
-- Season participants can read fixtures for their seasons.
-- ============================================================
create policy "fixtures_select_participant"
  on public.fixtures for select
  using (public.is_season_participant(season_id));

-- ============================================================
-- predictions
-- CRITICAL: participants may only see their own predictions.
-- Cross-participant visibility is blocked at the RLS level.
-- Admins use service-role client.
-- ============================================================
create policy "predictions_select_own"
  on public.predictions for select
  using (participant_id = public.get_participant_id());

create policy "predictions_insert_own_before_kickoff"
  on public.predictions for insert
  with check (
    participant_id = public.get_participant_id()
    and (
      select kickoff from public.fixtures where id = fixture_id
    ) > now()
  );

create policy "predictions_update_own_before_kickoff"
  on public.predictions for update
  using (
    participant_id = public.get_participant_id()
    and (
      select kickoff from public.fixtures where id = fixture_id
    ) > now()
  );

-- ============================================================
-- prediction_audit
-- Participants can read their own audit trail.
-- Admins use service-role client.
-- ============================================================
create policy "prediction_audit_select_own"
  on public.prediction_audit for select
  using (
    prediction_id in (
      select id from public.predictions
      where participant_id = public.get_participant_id()
    )
  );

-- ============================================================
-- notification_preferences
-- Participants manage their own preferences.
-- ============================================================
create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  using (participant_id = public.get_participant_id());

create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert
  with check (participant_id = public.get_participant_id());

create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  using (participant_id = public.get_participant_id());

-- ============================================================
-- notification_log
-- Participants can read their own notification history.
-- ============================================================
create policy "notification_log_select_own"
  on public.notification_log for select
  using (participant_id = public.get_participant_id());
