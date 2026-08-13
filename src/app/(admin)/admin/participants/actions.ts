'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { getUser, isSuperAdmin, requireLeagueAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function approveJoinRequest(
  requestId: string,
  userId: string,
  leagueId: string,
  selectedSeasonId: string
) {
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

  const [{ data: profile }, { data: authUserData, error: authUserError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', userId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(userId),
  ]);

  if (authUserError && !profile) {
    throw new Error(`Failed to resolve requesting user: ${authUserError.message}`);
  }

  const authUser = authUserData.user;
  const participantEmail = profile?.email ?? authUser?.email ?? null;
  const metadataDisplayName = authUser?.user_metadata?.display_name;
  const participantDisplayName =
    profile?.display_name ??
    (typeof metadataDisplayName === 'string' && metadataDisplayName.trim()
      ? metadataDisplayName.trim()
      : null) ??
    participantEmail?.split('@')[0] ??
    'Unknown user';

  // Create a participant record if one doesn't exist
  const { data: existingParticipant } = await supabase
    .from('participants')
    .select('id, display_name, email')
    .eq('user_id', userId)
    .maybeSingle();

  let participantId = existingParticipant?.id;

  if (!existingParticipant) {
    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({
        display_name: participantDisplayName,
        user_id: userId,
        email: participantEmail,
        is_offline: false,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`Failed to create participant: ${insertError.message}`);
    participantId = newParticipant?.id;
  } else if (
    existingParticipant.display_name === 'Unknown' ||
    existingParticipant.display_name === 'Unknown user' ||
    !existingParticipant.email
  ) {
    const { error: repairError } = await supabase
      .from('participants')
      .update({ display_name: participantDisplayName, email: participantEmail })
      .eq('id', existingParticipant.id);

    if (repairError) throw new Error(`Failed to repair participant details: ${repairError.message}`);
  }

  // Add to the active season for this league
  if (participantId) {
    const selectedSeasonQuery = supabase
      .from('seasons')
      .select('id')
      .eq('league_id', leagueId)
      .limit(1);

    const { data: selectedSeasons } = selectedSeasonId
      ? await selectedSeasonQuery.eq('id', selectedSeasonId)
      : await selectedSeasonQuery.eq('status', 'active');
    const targetSeason = selectedSeasons?.[0];

    if (targetSeason) {
      await supabase
        .from('season_participants')
        .upsert({ season_id: targetSeason.id, participant_id: participantId });
    }

    // Create default notification preferences
    await supabase
      .from('notification_preferences')
      .upsert({ participant_id: participantId }, { onConflict: 'participant_id' });
  }

  redirect('/admin/participants?tab=requests');
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

  redirect('/admin/participants?tab=requests');
}

export async function createOfflineParticipant(formData: FormData) {
  const user = await getUser();
  if (!user || !(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();
  const displayName = formData.get('display_name') as string;
  const email = (formData.get('email') as string | null) || null;
  const seasonId = (formData.get('season_id') as string | null) || null;

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

    if (seasonId) {
      const { data: season } = await supabase
        .from('seasons')
        .select('id')
        .eq('id', seasonId)
        .maybeSingle();

      if (season) {
        await supabase
          .from('season_participants')
          .insert({ participant_id: participant.id, season_id: season.id });
      }
    }
  }

  redirect('/admin/participants');
}

export async function updateParticipantDisplayName(
  leagueId: string,
  participantId: string,
  formData: FormData,
) {
  await requireLeagueAdmin(leagueId);

  const displayNameValue = formData.get('display_name');
  const displayName = typeof displayNameValue === 'string' ? displayNameValue.trim() : '';
  if (displayName.length < 2 || displayName.length > 80) {
    redirect('/admin/participants?error=Display+name+must+be+between+2+and+80+characters');
  }

  const supabase = await createServiceClient();
  const { data: enrolments, error: enrolmentError } = await supabase
    .from('season_participants')
    .select('season_id')
    .eq('participant_id', participantId);

  if (enrolmentError) throw new Error(`Failed to verify participant: ${enrolmentError.message}`);

  const seasonIds = (enrolments ?? []).map((row) => row.season_id);
  const { data: leagueSeason } = seasonIds.length
    ? await supabase
        .from('seasons')
        .select('id')
        .eq('league_id', leagueId)
        .in('id', seasonIds)
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (!leagueSeason) throw new Error('FORBIDDEN');

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .update({ display_name: displayName })
    .eq('id', participantId)
    .select('user_id')
    .single();

  if (participantError) {
    redirect(`/admin/participants?error=${encodeURIComponent(participantError.message)}`);
  }

  if (participant.user_id) {
    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase.from('profiles').update({ display_name: displayName }).eq('id', participant.user_id),
      supabase.auth.admin.updateUserById(participant.user_id, {
        user_metadata: { display_name: displayName },
      }),
    ]);

    if (profileError || authError) {
      throw new Error(`Display name updated partially: ${profileError?.message ?? authError?.message}`);
    }
  }

  revalidatePath('/admin/participants');
  revalidatePath('/admin/seasons');
  revalidatePath('/dashboard');
  redirect('/admin/participants?nameUpdated=1');
}

