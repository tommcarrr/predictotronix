import { NextResponse, type NextRequest } from 'next/server';
import { createProductionFixtureProvider } from '@/lib/fixtures/provider';
import { syncResults } from '@/lib/sync/fixtures';
import { getEnvironmentPolicy } from '@/lib/environment';
import { CronExecutionError, executeCronJob } from '@/lib/cron/run';

function validateCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret');
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return executeCronJob('sync-results', async (supabase) => {
    if (!getEnvironmentPolicy().externalFixtureSyncEnabled) {
      throw new CronExecutionError(
        'External result synchronization is disabled in this environment.',
        409
      );
    }
    const provider = createProductionFixtureProvider();

    const { data: seasons, error } = await supabase
      .from('seasons')
      .select('id, api_football_league_id, api_football_season')
      .eq('status', 'active')
      .eq('season_type', 'production')
      .not('api_football_league_id', 'is', null);

    if (error) {
      throw new CronExecutionError('Could not load production seasons.', 500, {
        databaseError: error,
      });
    }

    const results = [];

    for (const season of seasons ?? []) {
      const result = await syncResults(
        supabase,
        provider,
        season.id,
        season.api_football_league_id!,
        season.api_football_season!
      );
      results.push({ seasonId: season.id, ...result });
    }

    const errors = results.flatMap((result) => result.errors);
    return {
      body: { ok: errors.length === 0, timestamp: new Date().toISOString(), results },
      summary: {
        seasonsProcessed: results.length,
        fixturesScored: results.reduce((total, result) => total + result.scored, 0),
        errorCount: errors.length,
      },
      errors,
    };
  });
}
