'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { getUser, isSuperAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function approveJoinRequest(requestId: string, userId: string, leagueId: string) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();

  // Approve the request
  const { data: updatedRows, error: updateError } = await supabase
    .from('join_requests')
    .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('id');

  if (updateError) throw new Error(`Failed to approve request: ${updateError.message}`);
  if (!updatedRows || updatedRows.length === 0) {
    throw new Error(
      'Join request not found or could not be updated — check that SUPABASE_SERVICE_ROLE_KEY is set correctly on Render.',
    );
  }

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
      .maybeSingle();

    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({
        display_name: profile?.display_name ?? profile?.email ?? 'Unknown',
        user_id: userId,
        email: profile?.email,
        is_offline: false,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`Failed to create participant: ${insertError.message}`);
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

  redirect('/admin/participants');
}

export async function rejectJoinRequest(requestId: string) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('join_requests')
    .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw new Error(`Failed to reject request: ${error.message}`);

  redirect('/admin/participants');
}

export async function createOfflineParticipant(formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const displayName = formData.get('display_name') as string;
  const email = (formData.get('email') as string | null) || null;

  const { data: participant, error } = await supabase
    .from('participants')
    .insert({ display_name: displayName, email, is_offline: true })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create participant: ${error.message}`);

  if (participant) {
    await supabase
      .from('notification_preferences')
      .insert({ participant_id: participant.id, email_enabled: false });
  }

  redirect('/admin/participants');
}

