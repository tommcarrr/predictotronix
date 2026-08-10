'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { getUser, isSuperAdmin } from '@/lib/auth';
import { clockTimeForGameweek, type SeasonClockPosition } from '@/lib/clock';
import { assertSafeStagingTarget } from '@/lib/environment';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function guardTestSeason(seasonId: string): Promise<boolean> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('seasons')
    .select('season_type')
    .eq('id', seasonId)
    .single();
  return data?.season_type === 'test' || data?.season_type === 'demo';
}

async function requireStagingSuperAdmin() {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  try {
    assertSafeStagingTarget();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unsafe staging target';
    redirect(`/admin/test-tools?error=${encodeURIComponent(message)}`);
  }

  return user;
}

/** Move a test/demo season clock to a useful point around a selected gameweek. */
export async function setSeasonClock(formData: FormData) {
  const user = await requireStagingSuperAdmin();
  const seasonId = String(formData.get('season_id') ?? '');
  const gameweekId = String(formData.get('gameweek_id') ?? '');
  const position = String(formData.get('position') ?? '') as SeasonClockPosition;

  if (!['before', 'in_progress', 'after'].includes(position)) {
    redirect('/admin/test-tools?error=Invalid+clock+position');
  }
  if (!(await guardTestSeason(seasonId))) {
    redirect('/admin/test-tools?error=Not+a+test+season');
  }

  const supabase = await createServiceClient();
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('kickoff')
    .eq('season_id', seasonId)
    .eq('gameweek_id', gameweekId)
    .order('kickoff', { ascending: true });

  if (!fixtures?.length) {
    redirect(`/admin/test-tools?season=${seasonId}&error=Gameweek+has+no+fixtures`);
  }

  const simulatedNow = clockTimeForGameweek(
    new Date(fixtures[0].kickoff),
    new Date(fixtures[fixtures.length - 1].kickoff),
    position,
  );

  const { error } = await supabase.from('season_runtime_settings').upsert({
    season_id: seasonId,
    simulated_now: simulatedNow.toISOString(),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/admin/test-tools?season=${seasonId}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/test-tools');
  revalidatePath('/dashboard');
  revalidatePath('/predictions');
  redirect(`/admin/test-tools?season=${seasonId}&clock=updated`);
}

/** Return a test/demo season to real time. */
export async function clearSeasonClock(formData: FormData) {
  await requireStagingSuperAdmin();
  const seasonId = String(formData.get('season_id') ?? '');

  if (!(await guardTestSeason(seasonId))) {
    redirect('/admin/test-tools?error=Not+a+test+season');
  }

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('season_runtime_settings')
    .delete()
    .eq('season_id', seasonId);

  if (error) {
    redirect(`/admin/test-tools?season=${seasonId}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/test-tools');
  revalidatePath('/dashboard');
  revalidatePath('/predictions');
  redirect(`/admin/test-tools?season=${seasonId}&clock=cleared`);
}

/** Inject a result for a fixture and auto-score predictions. Test seasons only. */
export async function injectResult(fixtureId: string, formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const homeScore = parseInt(formData.get('home_score') as string, 10);
  const awayScore = parseInt(formData.get('away_score') as string, 10);

  // Verify this fixture belongs to a test/demo season
  const { data: fixture } = await supabase
    .from('fixtures')
    .select('season_id, kickoff')
    .eq('id', fixtureId)
    .single();

  if (!fixture || !(await guardTestSeason(fixture.season_id))) {
    redirect('/admin/test-tools?error=Not+a+test+season');
  }

  await supabase.from('fixtures').update({
    home_score: homeScore,
    away_score: awayScore,
    result_confirmed: true,
    status: 'finished',
    last_synced_at: new Date().toISOString(),
  }).eq('id', fixtureId);

  await supabase.rpc('score_predictions', { p_fixture_id: fixtureId });

  revalidatePath('/admin/test-tools');
}

/** Mark a fixture as postponed. Test seasons only. */
export async function markFixturePostponed(fixtureId: string) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const { data: fixture } = await supabase
    .from('fixtures')
    .select('season_id')
    .eq('id', fixtureId)
    .single();

  if (!fixture || !(await guardTestSeason(fixture.season_id))) {
    redirect('/admin/test-tools?error=Not+a+test+season');
  }

  await supabase.from('fixtures').update({ status: 'postponed' }).eq('id', fixtureId);

  revalidatePath('/admin/test-tools');
}

/** Fast-forward the next incomplete gameweek — inject random results and score all predictions. */
export async function fastForwardGameweek(formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const seasonId = formData.get('season_id') as string;
  if (!(await guardTestSeason(seasonId))) {
    redirect('/admin/test-tools?error=Not+a+test+season');
  }

  const supabase = await createServiceClient();

  // Find the first non-completed gameweek
  const { data: gameweek } = await supabase
    .from('gameweeks')
    .select('id')
    .eq('season_id', seasonId)
    .in('status', ['upcoming', 'in_progress'])
    .order('gameweek_number', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!gameweek) {
    redirect('/admin/test-tools?error=No+incomplete+gameweeks');
  }

  // Get all unfinished fixtures in this gameweek
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('id')
    .eq('gameweek_id', gameweek.id)
    .eq('result_confirmed', false)
    .in('status', ['scheduled', 'live']);

  for (const f of fixtures ?? []) {
    const homeScore = Math.floor(Math.random() * 5);
    const awayScore = Math.floor(Math.random() * 5);

    await supabase.from('fixtures').update({
      home_score: homeScore,
      away_score: awayScore,
      result_confirmed: true,
      status: 'finished',
      last_synced_at: new Date().toISOString(),
    }).eq('id', f.id);

    await supabase.rpc('score_predictions', { p_fixture_id: f.id });
  }

  // Mark gameweek as completed
  await supabase.from('gameweeks').update({ status: 'completed' }).eq('id', gameweek.id);

  revalidatePath('/admin/test-tools');
  revalidatePath('/leaderboard');
}
