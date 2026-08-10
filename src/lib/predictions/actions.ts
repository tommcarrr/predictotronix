'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getParticipant, requireUser } from '@/lib/auth';
import { isKickoffLocked } from '@/lib/scoring';
import { getSeasonNow } from '@/lib/clock';
import { revalidatePath } from 'next/cache';

export interface PredictionInput {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
}

export interface SubmitPredictionsResult {
  success: boolean;
  saved: number;
  errors: string[];
}

/**
 * Submit or update predictions for a batch of fixtures.
 * Server-side kickoff lock is validated for every fixture.
 * Participants can only submit for themselves (also enforced by RLS).
 */
export async function submitPredictions(
  inputs: PredictionInput[]
): Promise<SubmitPredictionsResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const participant = await getParticipant();

  if (!participant) {
    return { success: false, saved: 0, errors: ['No participant record found'] };
  }

  const errors: string[] = [];
  let saved = 0;
  const seasonTimes = new Map<string, Date>();

  for (const input of inputs) {
    // Server-side kickoff lock check (defence in depth — RLS also enforces this)
    const { data: fixture } = await supabase
      .from('fixtures')
      .select('id, kickoff, season_id')
      .eq('id', input.fixtureId)
      .single();

    if (!fixture) {
      errors.push(`Fixture ${input.fixtureId} not found`);
      continue;
    }

    let seasonNow = seasonTimes.get(fixture.season_id);
    if (!seasonNow) {
      seasonNow = await getSeasonNow(supabase, fixture.season_id);
      seasonTimes.set(fixture.season_id, seasonNow);
    }

    if (isKickoffLocked(new Date(fixture.kickoff), seasonNow)) {
      errors.push(`Fixture ${input.fixtureId}: kickoff has passed — prediction locked`);
      continue;
    }

    // Check for existing prediction (to determine audit action)
    const { data: existingPrediction } = await supabase
      .from('predictions')
      .select('id, home_score, away_score')
      .eq('fixture_id', input.fixtureId)
      .eq('participant_id', participant.id)
      .maybeSingle();

    const isEdit = !!existingPrediction;

    const { data: prediction, error: upsertError } = await supabase
      .from('predictions')
      .upsert(
        {
          fixture_id: input.fixtureId,
          participant_id: participant.id,
          season_id: fixture.season_id,
          home_score: input.homeScore,
          away_score: input.awayScore,
          entered_by: user.id,
          is_admin_entered: false,
        },
        { onConflict: 'fixture_id,participant_id' }
      )
      .select('id')
      .single();

    if (upsertError) {
      errors.push(`Fixture ${input.fixtureId}: ${upsertError.message}`);
      continue;
    }

    // Write audit trail
    await supabase.from('prediction_audit').insert({
      prediction_id: prediction.id,
      actor_id: user.id,
      action: isEdit ? 'edited' : 'created',
      previous_home_score: existingPrediction?.home_score ?? null,
      previous_away_score: existingPrediction?.away_score ?? null,
      new_home_score: input.homeScore,
      new_away_score: input.awayScore,
      is_admin_action: false,
    });

    saved++;
  }

  revalidatePath('/predictions');

  return { success: errors.length === 0, saved, errors };
}

/**
 * Admin: enter predictions on behalf of any participant (including offline).
 * Uses service-role client — bypasses RLS.
 */
export async function adminSubmitPredictions(
  participantId: string,
  inputs: PredictionInput[]
): Promise<SubmitPredictionsResult> {
  const user = await requireUser();
  const supabase = await createServiceClient();

  const errors: string[] = [];
  let saved = 0;

  for (const input of inputs) {
    const { data: fixture } = await supabase
      .from('fixtures')
      .select('id, kickoff, season_id')
      .eq('id', input.fixtureId)
      .single();

    if (!fixture) {
      errors.push(`Fixture ${input.fixtureId} not found`);
      continue;
    }

    const { data: existingPrediction } = await supabase
      .from('predictions')
      .select('id, home_score, away_score')
      .eq('fixture_id', input.fixtureId)
      .eq('participant_id', participantId)
      .maybeSingle();

    const isEdit = !!existingPrediction;

    const { data: prediction, error: upsertError } = await supabase
      .from('predictions')
      .upsert(
        {
          fixture_id: input.fixtureId,
          participant_id: participantId,
          season_id: fixture.season_id,
          home_score: input.homeScore,
          away_score: input.awayScore,
          entered_by: user.id,
          is_admin_entered: true,
        },
        { onConflict: 'fixture_id,participant_id' }
      )
      .select('id')
      .single();

    if (upsertError) {
      errors.push(`Fixture ${input.fixtureId}: ${upsertError.message}`);
      continue;
    }

    await supabase.from('prediction_audit').insert({
      prediction_id: prediction.id,
      actor_id: user.id,
      action: isEdit ? 'admin_edited' : 'admin_created',
      previous_home_score: existingPrediction?.home_score ?? null,
      previous_away_score: existingPrediction?.away_score ?? null,
      new_home_score: input.homeScore,
      new_away_score: input.awayScore,
      is_admin_action: true,
    });

    saved++;
  }

  revalidatePath('/admin');

  return { success: errors.length === 0, saved, errors };
}
