'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { getUser, isSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function approveJoinRequest(requestId: string, userId: string, leagueId: string) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();

  // Approve the request
  await supabase
    .from('join_requests')
    .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  // Create a participant record if one doesn't exist
  const { data: existingParticipant } = await supabase
    .from('participants')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  let participantId = existingParticipant?.id;

  if (!participantId) {
    // Get user profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', userId)
      .single();

    const { data: newParticipant } = await supabase
      .from('participants')
      .insert({
        display_name: profile?.display_name ?? profile?.email ?? 'Unknown',
        user_id: userId,
        email: profile?.email,
        is_offline: false,
      })
      .select('id')
      .single();

    participantId = newParticipant?.id;
  }

  // Add to the active season for this league
  if (participantId) {
    const { data: activeSeason } = await supabase
      .from('seasons')
      .select('id')
      .eq('league_id', leagueId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeSeason) {
      await supabase
        .from('season_participants')
        .upsert({ season_id: activeSeason.id, participant_id: participantId });
    }

    // Create default notification preferences
    await supabase
      .from('notification_preferences')
      .upsert({ participant_id: participantId }, { onConflict: 'participant_id' });
  }

  revalidatePath('/admin/participants');
}

export async function rejectJoinRequest(requestId: string) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  await supabase
    .from('join_requests')
    .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  revalidatePath('/admin/participants');
}

export async function createOfflineParticipant(formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const displayName = formData.get('display_name') as string;
  const email = (formData.get('email') as string | null) || null;

  const { data: participant } = await supabase
    .from('participants')
    .insert({ display_name: displayName, email, is_offline: true })
    .select('id')
    .single();

  if (participant) {
    await supabase
      .from('notification_preferences')
      .insert({ participant_id: participant.id, email_enabled: false });
  }

  revalidatePath('/admin/participants');
}
