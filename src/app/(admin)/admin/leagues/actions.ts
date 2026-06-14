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
