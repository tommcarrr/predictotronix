'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { getUser, isSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createLeague(formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;

  const { error } = await supabase.from('leagues').insert({
    name,
    slug,
    created_by: user.id,
    invite_active: true,
  });

  if (error) {
    redirect(`/admin/leagues?error=${encodeURIComponent(error.message)}`);
  }

  // Grant the creating user league_admin role
  const { data: league } = await supabase
    .from('leagues')
    .select('id')
    .eq('slug', slug)
    .single();

  if (league) {
    await supabase.from('league_roles').upsert({
      league_id: league.id,
      user_id: user.id,
      role: 'league_admin',
      granted_by: user.id,
    });
  }

  revalidatePath('/admin/leagues');
}

export async function assignLeagueAdmin(formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const leagueId = formData.get('league_id');
  const userId = formData.get('user_id');

  if (typeof leagueId !== 'string' || !leagueId || typeof userId !== 'string' || !userId) {
    redirect('/admin/leagues?error=Select+a+user+to+assign');
  }

  const supabase = await createServiceClient();
  const { error } = await supabase.from('league_roles').upsert(
    {
      league_id: leagueId,
      user_id: userId,
      role: 'league_admin',
      granted_by: user.id,
    },
    { onConflict: 'league_id,user_id,role' },
  );

  if (error) {
    redirect(`/admin/leagues?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/leagues');
  redirect('/admin/leagues?adminAssigned=1');
}

export async function regenerateInviteCode(leagueId: string) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();

  // Generate a new random invite code via the DB default expression
  await supabase
    .from('leagues')
    .update({ invite_code: crypto.randomUUID().replace(/-/g, '') })
    .eq('id', leagueId);

  revalidatePath('/admin/leagues');
}

export async function toggleInviteActive(leagueId: string, active: boolean) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  await supabase.from('leagues').update({ invite_active: active }).eq('id', leagueId);

  revalidatePath('/admin/leagues');
}

export async function deleteLeague(leagueId: string, formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const confirmation = formData.get('confirmation');
  const supabase = await createServiceClient();
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name, seasons(id, status)')
    .eq('id', leagueId)
    .single();

  if (leagueError || !league) redirect('/admin/leagues?error=League+not+found');
  if (confirmation !== league.name) {
    redirect('/admin/leagues?error=Enter+the+exact+league+name+to+confirm+deletion');
  }

  const seasons = league.seasons ?? [];
  if (seasons.some((season) => season.status !== 'archived')) {
    redirect('/admin/leagues?error=Archive+every+season+before+deleting+the+league');
  }

  const seasonIds = seasons.map((season) => season.id);
  if (seasonIds.length) {
    const { error: logError } = await supabase.from('notification_log').delete().in('season_id', seasonIds);
    if (logError) redirect(`/admin/leagues?error=${encodeURIComponent(logError.message)}`);
  }

  const { error } = await supabase.from('leagues').delete().eq('id', leagueId);
  if (error) redirect(`/admin/leagues?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/admin');
  revalidatePath('/admin/leagues');
  revalidatePath('/admin/seasons');
  redirect('/admin/leagues?leagueDeleted=1');
}
