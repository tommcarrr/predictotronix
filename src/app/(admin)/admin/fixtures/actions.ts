'use server';

import { isSuperAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { ApiFootballProvider } from '@/lib/api-football/client';
import { syncFixtures, syncResults } from '@/lib/sync/fixtures';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getProductionSeasons() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('seasons')
    .select('id, api_football_league_id, api_football_season')
    .eq('status', 'active')
    .eq('season_type', 'production')
    .not('api_football_league_id', 'is', null);
  return data ?? [];
}

export async function triggerFixtureSync() {
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const provider = new ApiFootballProvider();
  const seasons = await getProductionSeasons();

  for (const season of seasons) {
    await syncFixtures(
      supabase,
      provider,
      season.id,
      season.api_football_league_id!,
      season.api_football_season!
    );
  }

  revalidatePath('/admin/fixtures');
}

export async function triggerResultSync() {
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const provider = new ApiFootballProvider();
  const seasons = await getProductionSeasons();

  for (const season of seasons) {
    await syncResults(
      supabase,
      provider,
      season.id,
      season.api_football_league_id!,
      season.api_football_season!
    );
  }

  revalidatePath('/admin/fixtures');
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
