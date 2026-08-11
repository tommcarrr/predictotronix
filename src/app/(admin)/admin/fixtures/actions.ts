'use server';

import { isSuperAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { ApiFootballProvider } from '@/lib/api-football/client';
import { syncFixtures, syncResults, type SyncLogEntry } from '@/lib/sync/fixtures';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getEnvironmentPolicy } from '@/lib/environment';

function assertExternalFixtureSyncEnabled() {
  if (!getEnvironmentPolicy().externalFixtureSyncEnabled) {
    throw new Error('External fixture synchronization is disabled in this environment.');
  }
}

async function getProductionSeason(seasonId: string) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('seasons')
    .select('id, api_football_league_id, api_football_season')
    .eq('id', seasonId)
    .eq('status', 'active')
    .eq('season_type', 'production')
    .not('api_football_league_id', 'is', null)
    .maybeSingle();
  return data;
}

export interface SyncActionState {
  status: 'idle' | 'success' | 'warning' | 'error';
  operation?: 'fixtures' | 'results';
  message: string;
  logs: SyncLogEntry[];
}

function actionLogger(logs: SyncLogEntry[]) {
  return (entry: SyncLogEntry) => logs.push(entry);
}

function failureEntry(message: string): SyncLogEntry {
  return { timestamp: new Date().toISOString(), level: 'error', message };
}

export async function triggerFixtureSync(
  seasonId: string,
  _previousState: SyncActionState,
  _formData: FormData
): Promise<SyncActionState> {
  if (!(await isSuperAdmin())) redirect('/dashboard');
  const logs: SyncLogEntry[] = [];

  try {
    assertExternalFixtureSyncEnabled();
    const supabase = await createServiceClient();
    const provider = new ApiFootballProvider();
    const season = await getProductionSeason(seasonId);
    if (!season) throw new Error('The selected season is not available for production sync.');

    const result = await syncFixtures(
      supabase,
      provider,
      season.id,
      season.api_football_league_id!,
      season.api_football_season!,
      actionLogger(logs)
    );
    revalidatePath('/admin/fixtures');
    return {
      status: result.errors.length ? 'warning' : 'success',
      operation: 'fixtures',
      message: `Fixture sync completed: ${result.upserted} upserted, ${result.errors.length} failed.`,
      logs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[admin/fixture-sync]', error);
    logs.push(failureEntry(message));
    return { status: 'error', operation: 'fixtures', message, logs };
  }
}

export async function triggerResultSync(
  seasonId: string,
  _previousState: SyncActionState,
  _formData: FormData
): Promise<SyncActionState> {
  if (!(await isSuperAdmin())) redirect('/dashboard');
  const logs: SyncLogEntry[] = [];

  try {
    assertExternalFixtureSyncEnabled();
    const supabase = await createServiceClient();
    const provider = new ApiFootballProvider();
    const season = await getProductionSeason(seasonId);
    if (!season) throw new Error('The selected season is not available for production sync.');

    const result = await syncResults(
      supabase,
      provider,
      season.id,
      season.api_football_league_id!,
      season.api_football_season!,
      actionLogger(logs)
    );
    revalidatePath('/admin/fixtures');
    return {
      status: result.errors.length ? 'warning' : 'success',
      operation: 'results',
      message: `Result sync completed: ${result.scored} scored, ${result.errors.length} failed.`,
      logs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[admin/result-sync]', error);
    logs.push(failureEntry(message));
    return { status: 'error', operation: 'results', message, logs };
  }
}

export async function correctResult(
  fixtureId: string,
  homeScore: number,
  awayScore: number
) {
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();

  await supabase
    .from('fixtures')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      result_confirmed: true,
      status: 'finished',
    })
    .eq('id', fixtureId);

  // Re-score all predictions for this fixture
  await supabase.rpc('recalculate_fixture_scores', { p_fixture_id: fixtureId });

  revalidatePath('/admin/fixtures');
}
