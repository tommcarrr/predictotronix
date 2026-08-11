-- supabase/seed.sql
-- Development seed data — mini test season
-- This data is isolated to season_type = 'test' and safe to reset at any time.
-- Do NOT apply to production.

-- ============================================================
-- NOTE: auth.users are created via Supabase Auth API in practice.
-- For local dev, insert directly into auth.users (local only).
-- ============================================================

-- Test league
insert into public.leagues (id, name, slug, invite_code, invite_active, created_by)
values (
  '00000000-0000-0000-0000-000000000001',
  'Test Predictor League',
  'test-predictor-league',
  'testinvitecode001',
  true,
  null
) on conflict do nothing;

-- Test season (season_type = 'test')
insert into public.seasons (id, league_id, name, api_football_league_id, api_football_season, season_type, status)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  '2024/25 Test Season',
  39,
  2024,
  'test',
  'active'
) on conflict do nothing;

-- Gameweeks
insert into public.gameweeks (id, season_id, gameweek_number, label, api_football_round, status, first_kickoff)
values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000010', 1,
   'Gameweek 1', 'Regular Season - 1', 'completed',
   '2024-08-17 12:30:00+00'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000010', 2,
   'Gameweek 2', 'Regular Season - 2', 'in_progress',
   '2024-08-24 12:30:00+00'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000010', 3,
   'Gameweek 3', 'Regular Season - 3', 'upcoming',
   '2024-08-31 12:30:00+00')
on conflict do nothing;

-- Fixtures — Gameweek 1 (completed)
insert into public.fixtures (id, season_id, gameweek_id, api_football_fixture_id, home_team_name, away_team_name, kickoff, status, home_score, away_score, result_confirmed)
values
  ('00000000-0000-0000-0002-000000000001',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0001-000000000001',
   1001, 'Arsenal', 'Wolves',
   '2024-08-17 12:30:00+00', 'finished', 2, 0, true),
  ('00000000-0000-0000-0002-000000000002',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0001-000000000001',
   1002, 'Chelsea', 'Man City',
   '2024-08-17 15:00:00+00', 'finished', 1, 2, true),
  ('00000000-0000-0000-0002-000000000003',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0001-000000000001',
   1003, 'Liverpool', 'Ipswich',
   '2024-08-17 17:30:00+00', 'finished', 2, 0, true)
on conflict do nothing;

-- Fixtures — Gameweek 2 (some played, one rescheduled)
insert into public.fixtures (id, season_id, gameweek_id, api_football_fixture_id, home_team_name, away_team_name, kickoff, status, home_score, away_score, result_confirmed)
values
  ('00000000-0000-0000-0002-000000000004',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0001-000000000002',
   1004, 'Arsenal', 'Brighton',
   '2024-08-24 12:30:00+00', 'finished', 1, 1, true),
  ('00000000-0000-0000-0002-000000000005',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0001-000000000002',
   1005, 'Wolves', 'Chelsea',
   '2024-08-24 15:00:00+00', 'scheduled', null, null, false),
  ('00000000-0000-0000-0002-000000000006',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0001-000000000002',
   1006, 'Man City', 'Ipswich',
   '2024-08-28 19:45:00+00', 'postponed', null, null, false)  -- rescheduled example
on conflict do nothing;

-- Fixtures — Gameweek 3 (upcoming)
insert into public.fixtures (id, season_id, gameweek_id, api_football_fixture_id, home_team_name, away_team_name, kickoff, status, home_score, away_score, result_confirmed)
values
  ('00000000-0000-0000-0002-000000000007',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0001-000000000003',
   1007, 'Brighton', 'Arsenal',
   '2024-08-31 12:30:00+00', 'scheduled', null, null, false),
  ('00000000-0000-0000-0002-000000000008',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0001-000000000003',
   1008, 'Liverpool', 'Man City',
   '2024-08-31 15:00:00+00', 'scheduled', null, null, false)
on conflict do nothing;

-- Offline participants (no user_id)
insert into public.participants (id, display_name, user_id, email, is_offline)
values
  ('00000000-0000-0000-0003-000000000001', 'Alice', null, 'alice@example.com', true),
  ('00000000-0000-0000-0003-000000000002', 'Bob',   null, 'bob@example.com',   true)
on conflict do nothing;

-- Season enrollment for offline participants
insert into public.season_participants (season_id, participant_id)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0003-000000000001'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0003-000000000002')
on conflict do nothing;

-- Notification preferences for offline participants
insert into public.notification_preferences (participant_id, email_enabled, sms_enabled)
values
  ('00000000-0000-0000-0003-000000000001', true, false),
  ('00000000-0000-0000-0003-000000000002', false, false)
on conflict do nothing;

-- Admin-entered predictions for offline participants — GW1
-- Alice: all 3 predictions (GW1 complete)
insert into public.predictions (fixture_id, participant_id, season_id, home_score, away_score, is_admin_entered)
values
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000010', 2, 0, true),  -- exact
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000010', 2, 1, true),  -- correct result (A wins)
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000010', 1, 0, true)   -- incorrect
on conflict do nothing;

-- Bob: only 2 predictions for GW1 (missing one)
insert into public.predictions (fixture_id, participant_id, season_id, home_score, away_score, is_admin_entered)
values
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000010', 1, 0, true),  -- correct result
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000010', 0, 1, true)   -- incorrect
on conflict do nothing;

-- Score GW1 predictions (fixtures are confirmed)
select public.score_predictions('00000000-0000-0000-0002-000000000001');
select public.score_predictions('00000000-0000-0000-0002-000000000002');
select public.score_predictions('00000000-0000-0000-0002-000000000003');
select public.score_predictions('00000000-0000-0000-0002-000000000004');
