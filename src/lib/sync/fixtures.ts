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

export type SyncLogLevel = 'info' | 'success' | 'warning' | 'error';

export interface SyncLogEntry {
  timestamp: string;
  level: SyncLogLevel;
  message: string;
  details?: Record<string, string | number | boolean | null>;
}

export type SyncLogger = (entry: SyncLogEntry) => void;

function log(
  logger: SyncLogger | undefined,
  level: SyncLogLevel,
  message: string,
  details?: SyncLogEntry['details']
) {
  const entry = { timestamp: new Date().toISOString(), level, message, details };
  logger?.(entry);
  const detailsSuffix = details ? ` ${JSON.stringify(details)}` : '';
  const output = `[fixture-sync] ${message}${detailsSuffix}`;
  if (level === 'error') console.error(output);
  else if (level === 'warning') console.warn(output);
  else console.info(output);
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
  season: number,
  logger?: SyncLogger
): Promise<SyncResult> {
  const errors: string[] = [];
  let upserted = 0;

  log(logger, 'info', 'Starting fixture sync', { seasonId, leagueId, season });
  log(logger, 'info', 'Requesting fixtures from provider', { provider: provider.name, leagueId, season });
  const apiFixtures = await provider.getSeasonFixtures(leagueId, season);
  log(
    logger,
    apiFixtures.length ? 'success' : 'warning',
    apiFixtures.length ? 'Fixture provider returned fixtures' : 'Fixture provider returned no fixtures',
    { provider: provider.name, fixtureCount: apiFixtures.length }
  );

  // Build a round → gameweek_id map from existing gameweeks
  const { data: gameweeks, error: gameweeksError } = await supabase
    .from('gameweeks')
    .select('id, api_football_round')
    .eq('season_id', seasonId);

  if (gameweeksError) {
    const message = `Could not load gameweeks: ${gameweeksError.message}`;
    log(logger, 'error', message);
    return { upserted, errors: [message] };
  }

  log(logger, gameweeks?.length ? 'info' : 'warning', 'Loaded season gameweek mappings', {
    gameweekCount: gameweeks?.length ?? 0,
  });

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
        const message = `Fixture ${fixture.id}: ${error.message}`;
        errors.push(message);
        log(logger, 'error', 'Fixture upsert failed', {
          fixtureId: fixture.id,
          round: fixture.league.round,
          error: error.message,
        });
      } else {
        upserted++;
      }
    } catch (err) {
      const message = `Fixture ${fixture.id}: ${String(err)}`;
      errors.push(message);
      log(logger, 'error', 'Unexpected fixture processing error', {
        fixtureId: fixture.id,
        error: String(err),
      });
    }
  }

  log(logger, errors.length ? 'warning' : 'success', 'Fixture sync finished', {
    received: apiFixtures.length,
    upserted,
    failed: errors.length,
    unmatchedGameweeks: apiFixtures.filter(
      (fixture) => !roundToGameweekId.has(fixture.league.round)
    ).length,
  });
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
  season: number,
  logger?: SyncLogger
): Promise<{ scored: number; errors: string[] }> {
  const errors: string[] = [];
  let scored = 0;

  // Get unconfirmed fixtures that are not postponed/cancelled/abandoned
  log(logger, 'info', 'Starting result sync', { seasonId, leagueId, season });
  const { data: pendingFixtures, error: pendingError } = await supabase
    .from('fixtures')
    .select('id, api_football_fixture_id, kickoff')
    .eq('season_id', seasonId)
    .eq('result_confirmed', false)
    .in('status', ['scheduled', 'live', 'finished'])
    .lt('kickoff', new Date().toISOString());

  if (pendingError) {
    const message = `Could not load pending fixtures: ${pendingError.message}`;
    log(logger, 'error', message);
    return { scored, errors: [message] };
  }

  log(logger, pendingFixtures?.length ? 'info' : 'warning', 'Loaded fixtures awaiting results', {
    pendingCount: pendingFixtures?.length ?? 0,
  });

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
        log(logger, 'error', 'Fixture result update failed', {
          fixtureId: pending.id,
          error: updateError.message,
        });
        continue;
      }

      // Auto-score predictions for this fixture
      const { error: scoreError } = await supabase.rpc('score_predictions', {
        p_fixture_id: pending.id,
      });

      if (scoreError) {
        errors.push(`Score fixture ${pending.id}: ${scoreError.message}`);
        log(logger, 'error', 'Prediction scoring failed', {
          fixtureId: pending.id,
          error: scoreError.message,
        });
      } else {
        scored++;
      }
    } catch (err) {
      errors.push(`Fixture ${pending.id}: ${String(err)}`);
      log(logger, 'error', 'Unexpected result processing error', {
        fixtureId: pending.id,
        error: String(err),
      });
    }
  }

  log(logger, errors.length ? 'warning' : 'success', 'Result sync finished', {
    checked: pendingFixtures.length,
    scored,
    failed: errors.length,
  });
  return { scored, errors };
}
