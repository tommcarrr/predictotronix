'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function dismissLoginNotice(noticeId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: notice } = await supabase
    .from('login_notices')
    .select('id, display_mode')
    .eq('id', noticeId)
    .maybeSingle();

  if (!notice) return;

  let sessionId: string | null = null;
  if (notice.display_mode === 'every_login') {
    const { data } = await supabase.auth.getClaims();
    sessionId = data?.claims.session_id ?? null;
    if (!sessionId) return;
  }

  const { error } = await supabase.from('login_notice_dismissals').insert({
    notice_id: notice.id,
    user_id: user.id,
    session_id: sessionId,
  });

  // A duplicate can only mean this dismissal has already been recorded.
  if (error && error.code !== '23505') throw error;
  revalidatePath('/dashboard');
}
