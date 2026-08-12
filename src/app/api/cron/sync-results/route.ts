import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createProductionFixtureProvider } from '@/lib/fixtures/provider';
import { syncResults } from '@/lib/sync/fixtures';
import { getEnvironmentPolicy } from '@/lib/environment';

function validateCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret');
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!getEnvironmentPolicy().externalFixtureSyncEnabled) {
    return NextResponse.json(
      { error: 'External result synchronization is disabled in this environment.' },
      { status: 409 },
    );
  }

  try {
    const supabase = await createServiceClient();
    const provider = createProductionFixtureProvider();

    const { data: seasons, error } = await supabase
      .from('seasons')
      .select('id, api_football_league_id, api_football_season')
      .eq('status', 'active')
      .eq('season_type', 'production')
      .not('api_football_league_id', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error('[cron/sync-results]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
