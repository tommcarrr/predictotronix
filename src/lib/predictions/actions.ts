'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getParticipant, requireUser } from '@/lib/auth';
import {
  requireLeagueAdminForFixtures,
  requireLeagueAdminForGameweek,
} from '@/lib/admin/authorization';
import { isKickoffLocked } from '@/lib/scoring';
import { getSeasonNow } from '@/lib/clock';
import { revalidatePath } from 'next/cache';
import {
  parsePredictionEmail,
  type ExtractedEmailPrediction,
  type EmailImportFixture,
} from './email-import-parser';
import { extractPredictionsWithLlm, getPredictionImportLlmConfig } from './email-import-llm';

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

export interface ClearPredictionsResult {
  success: boolean;
  cleared: number;
  clearedFixtureIds: string[];
  errors: string[];
}

export interface ExtractEmailPredictionsResult {
  success: boolean;
  predictions: ExtractedEmailPrediction[];
  unmatchedFixtureIds: string[];
  warnings: string[];
  llmConfigured: boolean;
  usedLlm: boolean;
  error?: string;
}

function hasValidScores(input: PredictionInput) {
  return (
    Number.isInteger(input.homeScore) &&
    Number.isInteger(input.awayScore) &&
    input.homeScore >= 0 &&
    input.awayScore >= 0 &&
    input.homeScore <= 99 &&
    input.awayScore <= 99
  );
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
    if (!hasValidScores(input)) {
      errors.push(`Fixture ${input.fixtureId}: scores must be whole numbers from 0 to 99`);
      continue;
    }

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

  revalidatePath('/dashboard');

  return { success: errors.length === 0, saved, errors };
}

/**
 * Clear this participant's predictions for unlocked fixtures in a gameweek.
 * Fixture ownership and kickoff locks are re-checked server-side, with RLS
 * providing a second ownership and real-kickoff boundary.
 */
export async function clearPredictions(fixtureIds: string[]): Promise<ClearPredictionsResult> {
  await requireUser();
  const supabase = await createClient();
  const participant = await getParticipant();

  if (!participant) {
    return {
      success: false,
      cleared: 0,
      clearedFixtureIds: [],
      errors: ['No participant record found'],
    };
  }

  const uniqueFixtureIds = [...new Set(fixtureIds)].filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  );

  if (uniqueFixtureIds.length === 0 || uniqueFixtureIds.length > 100) {
    return {
      success: false,
      cleared: 0,
      clearedFixtureIds: [],
      errors: ['Invalid fixture selection'],
    };
  }

  const { data: fixtures, error: fixturesError } = await supabase
    .from('fixtures')
    .select('id, kickoff, season_id')
    .in('id', uniqueFixtureIds);

  if (fixturesError) {
    return {
      success: false,
      cleared: 0,
      clearedFixtureIds: [],
      errors: ['Fixtures could not be checked'],
    };
  }

  const fixturesById = new Map((fixtures ?? []).map((fixture) => [fixture.id, fixture]));
  const seasonTimes = new Map<string, Date>();
  const clearableFixtureIds: string[] = [];
  const errors: string[] = [];

  for (const fixtureId of uniqueFixtureIds) {
    const fixture = fixturesById.get(fixtureId);
    if (!fixture) {
      errors.push(`Fixture ${fixtureId} not found`);
      continue;
    }

    let seasonNow = seasonTimes.get(fixture.season_id);
    if (!seasonNow) {
      seasonNow = await getSeasonNow(supabase, fixture.season_id);
      seasonTimes.set(fixture.season_id, seasonNow);
    }

    if (isKickoffLocked(new Date(fixture.kickoff), seasonNow)) {
      errors.push(`Fixture ${fixtureId}: kickoff has passed — prediction locked`);
      continue;
    }

    clearableFixtureIds.push(fixtureId);
  }

  if (clearableFixtureIds.length === 0) {
    return { success: false, cleared: 0, clearedFixtureIds: [], errors };
  }

  const { data: clearedPredictions, error: deleteError } = await supabase
    .from('predictions')
    .delete()
    .eq('participant_id', participant.id)
    .in('fixture_id', clearableFixtureIds)
    .select('fixture_id');

  if (deleteError) {
    errors.push('Predictions could not be cleared');
    return { success: false, cleared: 0, clearedFixtureIds: [], errors };
  }

  const clearedFixtureIds = (clearedPredictions ?? []).map((prediction) => prediction.fixture_id);

  revalidatePath('/dashboard');

  return {
    success: errors.length === 0,
    cleared: clearedFixtureIds.length,
    clearedFixtureIds,
    errors,
  };
}

/**
 * Admin: parse pasted email text into a review-only prediction draft.
 * Fixtures are re-read by gameweek so the client cannot supply team names or IDs
 * to the deterministic parser or optional LLM fallback.
 */
export async function adminExtractEmailPredictions(
  gameweekId: string,
  email: string
): Promise<ExtractEmailPredictionsResult> {
  const llmConfig = getPredictionImportLlmConfig();
  const emptyResult = {
    predictions: [],
    unmatchedFixtureIds: [],
    warnings: [],
    llmConfigured: Boolean(llmConfig),
    usedLlm: false,
  };

  if (!gameweekId) {
    return { success: false, ...emptyResult, error: 'Select a gameweek first.' };
  }
  if (typeof email !== 'string' || !email.trim()) {
    return { success: false, ...emptyResult, error: 'Paste an email first.' };
  }
  if (email.length > 50_000) {
    return {
      success: false,
      ...emptyResult,
      error: 'The pasted email is too long. Remove quoted history and try again.',
    };
  }

  await requireLeagueAdminForGameweek(gameweekId);

  const supabase = await createServiceClient();
  const { data: fixtureRows, error: fixturesError } = await supabase
    .from('fixtures')
    .select('id, home_team_name, away_team_name')
    .eq('gameweek_id', gameweekId)
    .order('kickoff', { ascending: true });

  if (fixturesError) {
    return {
      success: false,
      ...emptyResult,
      error: 'Fixtures could not be loaded for this gameweek.',
    };
  }

  const fixtures: EmailImportFixture[] = (fixtureRows ?? []).map((fixture) => ({
    id: fixture.id,
    homeTeamName: fixture.home_team_name,
    awayTeamName: fixture.away_team_name,
  }));
  if (fixtures.length === 0) {
    return { success: false, ...emptyResult, error: 'This gameweek has no fixtures.' };
  }

  const deterministic = parsePredictionEmail(email, fixtures);
  const unmatchedFixtures = fixtures.filter((fixture) =>
    deterministic.unmatchedFixtureIds.includes(fixture.id)
  );
  const llm =
    llmConfig && unmatchedFixtures.length > 0
      ? await extractPredictionsWithLlm(email, unmatchedFixtures, llmConfig)
      : { predictions: [], warnings: [] };
  const predictions = [...deterministic.predictions, ...llm.predictions];
  const matchedIds = new Set(predictions.map((prediction) => prediction.fixtureId));
  const unmatchedFixtureIds = fixtures
    .filter((fixture) => !matchedIds.has(fixture.id))
    .map((fixture) => fixture.id);
  const warnings = [...deterministic.warnings, ...llm.warnings];

  if (!llmConfig && unmatchedFixtureIds.length > 0) {
    warnings.push(
      'Some fixtures could not be read deterministically. Configure the optional LLM fallback or enter those scores manually.'
    );
  }

  return {
    success: true,
    predictions,
    unmatchedFixtureIds,
    warnings,
    llmConfigured: Boolean(llmConfig),
    usedLlm: llm.predictions.length > 0,
  };
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

  const errors: string[] = [];
  let saved = 0;

  if (!participantId) {
    return { success: false, saved: 0, errors: ['Select a participant'] };
  }

  if (!inputs.length) {
    return { success: false, saved: 0, errors: ['No predictions supplied'] };
  }

  await requireLeagueAdminForFixtures(inputs.map((input) => input.fixtureId));
  const supabase = await createServiceClient();

  for (const input of inputs) {
    if (!hasValidScores(input)) {
      errors.push(`Fixture ${input.fixtureId}: scores must be whole numbers from 0 to 99`);
      continue;
    }

    const { data: fixture } = await supabase
      .from('fixtures')
      .select('id, season_id, result_confirmed')
      .eq('id', input.fixtureId)
      .single();

    if (!fixture) {
      errors.push(`Fixture ${input.fixtureId} not found`);
      continue;
    }

    const { data: enrolment } = await supabase
      .from('season_participants')
      .select('id')
      .eq('season_id', fixture.season_id)
      .eq('participant_id', participantId)
      .maybeSingle();

    if (!enrolment) {
      errors.push(`Fixture ${input.fixtureId}: participant is not enrolled in this season`);
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

    if (fixture.result_confirmed) {
      const { error: scoringError } = await supabase.rpc('score_predictions', {
        p_fixture_id: fixture.id,
      });

      if (scoringError) {
        errors.push(`Fixture ${input.fixtureId}: saved but could not be scored`);
      }
    }

    saved++;
  }

  revalidatePath('/admin/predictions');
  revalidatePath('/leaderboard');

  return { success: errors.length === 0, saved, errors };
}
