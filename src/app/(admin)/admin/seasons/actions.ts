'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { getUser, isSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSeason(leagueId: string, formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const name = formData.get('name') as string;
  const apiLeagueId = formData.get('api_football_league_id');
  const apiSeason = formData.get('api_football_season');
  const seasonType = formData.get('season_type') as 'production' | 'test' | 'demo';

  const { error } = await supabase.from('seasons').insert({
    league_id: leagueId,
    name,
    api_football_league_id: apiLeagueId ? parseInt(apiLeagueId as string, 10) : null,
    api_football_season: apiSeason ? parseInt(apiSeason as string, 10) : null,
    season_type: seasonType,
    status: 'setup',
  });

  if (error) {
    redirect(`/admin/seasons?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/seasons');
}

export async function updateSeasonStatus(
  seasonId: string,
  status: 'setup' | 'active' | 'completed' | 'archived'
) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  await supabase.from('seasons').update({ status }).eq('id', seasonId);

  revalidatePath('/admin/seasons');
}

export async function addSeasonParticipant(seasonId: string, participantId: string) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  await supabase
    .from('season_participants')
    .upsert({ season_id: seasonId, participant_id: participantId });

  revalidatePath('/admin/seasons');
}

export async function removeSeasonParticipant(seasonId: string, participantId: string) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  await supabase
    .from('season_participants')
    .delete()
    .eq('season_id', seasonId)
    .eq('participant_id', participantId);

  revalidatePath('/admin/seasons');
}

export async function deleteSeason(seasonId: string, formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const confirmation = formData.get('confirmation');
  const supabase = await createServiceClient();
  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .select('id, name, status')
    .eq('id', seasonId)
    .single();

  if (seasonError || !season) redirect('/admin/seasons?error=Season+not+found');
  if (season.status !== 'archived') {
    redirect('/admin/seasons?error=Archive+the+season+before+deleting+it');
  }
  if (confirmation !== season.name) {
    redirect('/admin/seasons?error=Enter+the+exact+season+name+to+confirm+deletion');
  }

  const { error: logError } = await supabase.from('notification_log').delete().eq('season_id', seasonId);
  if (logError) redirect(`/admin/seasons?error=${encodeURIComponent(logError.message)}`);

  const { error } = await supabase.from('seasons').delete().eq('id', seasonId);
  if (error) redirect(`/admin/seasons?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/admin');
  revalidatePath('/admin/seasons');
  revalidatePath('/admin/leagues');
  redirect('/admin/seasons?seasonDeleted=1');
}
