'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function submitJoinRequest(leagueId: string, inviteCode: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from('join_requests').insert({
    league_id: leagueId,
    user_id: user.id,
    status: 'pending',
  });

  if (error && !error.message.includes('duplicate')) {
    redirect(`/join/${inviteCode}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/join/${inviteCode}?requested=true`);
}
