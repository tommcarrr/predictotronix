import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiFixture, FixtureProvider } from '../api-football/types';
import type { FixtureStatus } from '@/types';

/** Map API-Football status codes to our fixture status enum. */
function mapFixtureStatus(apiStatus: string): FixtureStatus {
  const finishedStatuses = ['FT', 'AET', 'PEN'];
  const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];
  const postponedStatuses = ['PST'];
  const cancelledStatuses = ['CANC', 'WO'];
  const abandonedStatuses = ['ABD'];

  if (finishedStatuses.includes(apiStatus)) return 'finished';
  if (liveStatuses.includes(apiStatus)) return 'live';
  if (postponedStatuses.includes(apiStatus)) return 'postponed';
  if (cancelledStatuses.includes(apiStatus)) return 'cancelled';
  if (abandonedStatuses.includes(apiStatus)) return 'abandoned';
  return 'scheduled';
}

export interface SyncResult {
  upserted: number;
  errors: string[];
}

/**
 * Sync all fixtures for a season from the provider into the database.
 * Idempotent: safe to run multiple times — uses upsert on api_football_fixture_id.
 */
export async function syncFixtures(
  supabase: SupabaseClient,
  provider: FixtureProvider,
  seasonId: string,
  leagueId: number,
  season: number
): Promise<SyncResult> {
  const errors: string[] = [];
  let upserted = 0;

  const apiFixtures = await provider.getSeasonFixtures(leagueId, season);

  // Build a round → gameweek_id map from existing gameweeks
  const { data: gameweeks } = await supabase
    .from('gameweeks')
    .select('id, api_football_round')
    .eq('season_id', seasonId);

  const roundToGameweekId = new Map<string, string>();
  for (const gw of gameweeks ?? []) {
    if (gw.api_football_round) {
      roundToGameweekId.set(gw.api_football_round, gw.id);
    }
  }

  for (const fixture of apiFixtures) {
    try {
      const gameweekId = roundToGameweekId.get(fixture.league.round) ?? null;
      const status = mapFixtureStatus(fixture.status.short);

      const { error } = await supabase.from('fixtures').upsert(
        {
          season_id: seasonId,
          gameweek_id: gameweekId,
          api_football_fixture_id: fixture.id,
          home_team_name: fixture.teams.home.name,
          away_team_name: fixture.teams.away.name,
          home_team_api_id: fixture.teams.home.id,
          away_team_api_id: fixture.teams.away.id,
          kickoff: fixture.date,
          status,
          home_score: fixture.goals.home,
          away_score: fixture.goals.away,
          result_confirmed: status === 'finished',
          api_football_status: fixture.status.short,
          api_football_data: fixture,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'api_football_fixture_id', ignoreDuplicates: false }
      );

      if (error) {
        errors.push(`Fixture ${fixture.id}: ${error.message}`);
      } else {
        upserted++;
      }
    } catch (err) {
      errors.push(`Fixture ${fixture.id}: ${String(err)}`);
    }
  }

  return { upserted, errors };
}

/**
 * Sync results for a season and auto-score newly confirmed fixtures.
 * Only processes fixtures that are not yet result_confirmed.
 */
export async function syncResults(
  supabase: SupabaseClient,
  provider: FixtureProvider,
  seasonId: string,
  leagueId: number,
  season: number
): Promise<{ scored: number; errors: string[] }> {
  const errors: string[] = [];
  let scored = 0;

  // Get unconfirmed fixtures that are not postponed/cancelled/abandoned
  const { data: pendingFixtures } = await supabase
    .from('fixtures')
    .select('id, api_football_fixture_id, kickoff')
    .eq('season_id', seasonId)
    .eq('result_confirmed', false)
    .in('status', ['scheduled', 'live', 'finished'])
    .lt('kickoff', new Date().toISOString());

  if (!pendingFixtures?.length) return { scored, errors };

  for (const pending of pendingFixtures) {
    if (!pending.api_football_fixture_id) continue;

    try {
      const apiFixture = await provider.getFixture(pending.api_football_fixture_id);
      if (!apiFixture) continue;

      const status = mapFixtureStatus(apiFixture.status.short);
      if (status !== 'finished') continue;

      // Update the fixture
      const { error: updateError } = await supabase
        .from('fixtures')
        .update({
          status: 'finished',
          home_score: apiFixture.goals.home,
          away_score: apiFixture.goals.away,
          result_confirmed: true,
          api_football_status: apiFixture.status.short,
          api_football_data: apiFixture,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', pending.id);

      if (updateError) {
        errors.push(`Update fixture ${pending.id}: ${updateError.message}`);
        continue;
      }

      // Auto-score predictions for this fixture
      const { error: scoreError } = await supabase.rpc('score_predictions', {
        p_fixture_id: pending.id,
      });

      if (scoreError) {
        errors.push(`Score fixture ${pending.id}: ${scoreError.message}`);
      } else {
        scored++;
      }
    } catch (err) {
      errors.push(`Fixture ${pending.id}: ${String(err)}`);
    }
  }

  return { scored, errors };
}
