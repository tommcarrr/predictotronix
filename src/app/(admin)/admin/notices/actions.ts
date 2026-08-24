'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser, isLeagueAdmin, isSuperAdmin } from '@/lib/auth';
import { validateLoginNoticeInput } from '@/lib/login-notices';
import { createServiceClient } from '@/lib/supabase/server';

const noticesPath = '/admin/notices';

function redirectWithError(message: string): never {
  redirect(`${noticesPath}?error=${encodeURIComponent(message)}`);
}

async function canManageScope(leagueId: string | null) {
  return leagueId === null ? isSuperAdmin() : isLeagueAdmin(leagueId);
}

export async function createLoginNotice(formData: FormData) {
  const user = await getUser();
  if (!user) redirect('/login');

  const scope = String(formData.get('scope') ?? 'league');
  const requestedLeagueId = String(formData.get('league_id') ?? '');
  const leagueId = scope === 'global' ? null : requestedLeagueId || null;

  if (!['global', 'league'].includes(scope) || (scope === 'league' && !leagueId)) {
    redirectWithError('Choose who should receive this notice.');
  }
  if (!(await canManageScope(leagueId))) redirect('/dashboard');

  const validated = validateLoginNoticeInput(formData);
  if (!validated.ok) redirectWithError(validated.error);

  const supabase = await createServiceClient();
  const { error } = await supabase.from('login_notices').insert({
    league_id: leagueId,
    title: validated.value.title,
    body: validated.value.body,
    tone: validated.value.tone,
    display_mode: validated.value.displayMode,
    expires_at: validated.value.expiresAt,
    created_by: user.id,
  });

  if (error) redirectWithError(error.message);

  revalidatePath('/dashboard');
  revalidatePath(noticesPath);
  redirect(`${noticesPath}?created=1`);
}

export async function expireLoginNotice(noticeId: string) {
  const user = await getUser();
  if (!user) redirect('/login');

  const supabase = await createServiceClient();
  const { data: notice } = await supabase
    .from('login_notices')
    .select('id, league_id')
    .eq('id', noticeId)
    .maybeSingle();

  if (!notice) redirectWithError('Notice not found.');
  if (!(await canManageScope(notice.league_id))) redirect('/dashboard');

  const { error } = await supabase
    .from('login_notices')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', notice.id);

  if (error) redirectWithError(error.message);

  revalidatePath('/dashboard');
  revalidatePath(noticesPath);
  redirect(`${noticesPath}?expired=1`);
}
