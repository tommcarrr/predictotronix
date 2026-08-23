import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiFixture, FixtureProvider } from '../api-football/types';
import type { FixtureStatus, GameweekStatus } from '@/types';

interface GameweekFixtureState {
  kickoff: string;
  status: FixtureStatus;
}

const completedFixtureStatuses = new Set<FixtureStatus>([
  'finished',
  'cancelled',
  'abandoned',
]);

export function deriveGameweekStatus(
  fixtures: GameweekFixtureState[],
  now = new Date()
): GameweekStatus {
  if (fixtures.length === 0) return 'upcoming';
  if (fixtures.every((fixture) => completedFixtureStatuses.has(fixture.status))) {
    return 'completed';
  }

  const hasStarted = fixtures.some(
    (fixture) =>
      fixture.status === 'live' ||
      completedFixtureStatuses.has(fixture.status) ||
      new Date(fixture.kickoff) <= now
  );
  return hasStarted ? 'in_progress' : 'upcoming';
}

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

export function gameweekNumberFromRound(round: string): number | null {
  const match = round.match(/(?:Regular Season|Gameweek|Matchweek)\s*-?\s*(\d+)$/i);
  if (!match) return null;
  const gameweekNumber = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(gameweekNumber) && gameweekNumber > 0 ? gameweekNumber : null;
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

async function syncGameweekStatuses(
  supabase: SupabaseClient,
  seasonId: string,
  logger?: SyncLogger
): Promise<string[]> {
  const errors: string[] = [];
  const [{ data: gameweeks, error: gameweeksError }, { data: fixtures, error: fixturesError }] =
    await Promise.all([
      supabase.from('gameweeks').select('id, status').eq('season_id', seasonId),
      supabase.from('fixtures').select('gameweek_id, kickoff, status').eq('season_id', seasonId),
    ]);

  if (gameweeksError || fixturesError) {
    const message = `Could not refresh gameweek statuses: ${
      gameweeksError?.message ?? fixturesError?.message
    }`;
    log(logger, 'error', message);
    return [message];
  }

  const fixturesByGameweek = new Map<string, GameweekFixtureState[]>();
  for (const fixture of fixtures ?? []) {
    if (!fixture.gameweek_id) continue;
    const states = fixturesByGameweek.get(fixture.gameweek_id) ?? [];
    states.push({ kickoff: fixture.kickoff, status: fixture.status });
    fixturesByGameweek.set(fixture.gameweek_id, states);
  }

  let updated = 0;
  const now = new Date();
  for (const gameweek of gameweeks ?? []) {
    const nextStatus = deriveGameweekStatus(fixturesByGameweek.get(gameweek.id) ?? [], now);
    const shouldAdvance =
      (gameweek.status === 'upcoming' && nextStatus !== 'upcoming') ||
      (gameweek.status === 'in_progress' && nextStatus === 'completed');
    if (!shouldAdvance) continue;

    const { error } = await supabase
      .from('gameweeks')
      .update({ status: nextStatus })
      .eq('id', gameweek.id);
    if (error) {
      const message = `Update gameweek ${gameweek.id}: ${error.message}`;
      errors.push(message);
      log(logger, 'error', 'Gameweek status update failed', {
        gameweekId: gameweek.id,
        status: nextStatus,
        error: error.message,
      });
    } else {
      updated++;
    }
  }

  log(logger, errors.length ? 'warning' : 'success', 'Gameweek statuses refreshed', {
    checked: gameweeks?.length ?? 0,
    updated,
    failed: errors.length,
  });
  return errors;
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

  const providerRounds = new Map<number, string>();
  for (const fixture of apiFixtures) {
    const gameweekNumber = gameweekNumberFromRound(fixture.league.round);
    if (gameweekNumber !== null) providerRounds.set(gameweekNumber, fixture.league.round);
  }

  if (providerRounds.size > 0) {
    const { error: gameweekUpsertError } = await supabase.from('gameweeks').upsert(
      [...providerRounds].map(([gameweekNumber, round]) => ({
        season_id: seasonId,
        gameweek_number: gameweekNumber,
        label: `Gameweek ${gameweekNumber}`,
        api_football_round: round,
      })),
      { onConflict: 'season_id,gameweek_number', ignoreDuplicates: false }
    );

    if (gameweekUpsertError) {
      const message = `Could not create or update gameweeks: ${gameweekUpsertError.message}`;
      log(logger, 'error', message, { discoveredRounds: providerRounds.size });
      return { upserted, errors: [message] };
    }

    log(logger, 'success', 'Created or updated provider gameweeks', {
      gameweekCount: providerRounds.size,
    });
  }

  // Build a round → gameweek_id map after ensuring provider rounds exist.
  const { data: gameweeks, error: gameweeksError } = await supabase
    .from('gameweeks')
    .select('id, gameweek_number, api_football_round')
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
    roundToGameweekId.set(`Regular Season - ${gw.gameweek_number}`, gw.id);
    roundToGameweekId.set(`Gameweek ${gw.gameweek_number}`, gw.id);
    roundToGameweekId.set(`Matchweek ${gw.gameweek_number}`, gw.id);
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
  errors.push(...(await syncGameweekStatuses(supabase, seasonId, logger)));
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

  if (!pendingFixtures?.length) {
    errors.push(...(await syncGameweekStatuses(supabase, seasonId, logger)));
    return { scored, errors };
  }

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
  errors.push(...(await syncGameweekStatuses(supabase, seasonId, logger)));
  return { scored, errors };
}
