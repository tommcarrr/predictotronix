'use server';

import { getParticipant, requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  type BreakoutLeaderboardEntry,
  type BreakoutLeaderboardResult,
  type BreakoutRunStartResult,
} from './constants';
import { isValidBreakoutRunSummary, type BreakoutRunSummary } from './rules';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapLeaderboard(
  rows: Array<{
    rank_position: number;
    participant_id: string;
    display_name: string;
    score: number;
    achieved_at: string;
  }>
): BreakoutLeaderboardEntry[] {
  return rows.map((row) => ({
    position: Number(row.rank_position),
    participantId: row.participant_id,
    displayName: row.display_name,
    score: row.score,
    achievedAt: row.achieved_at,
  }));
}

function invalidLeagueResult(): BreakoutLeaderboardResult {
  return {
    success: false,
    leaderboard: [],
    participantId: null,
    error: 'This league is not available.',
  };
}

export async function getBreakoutLeaderboard(leagueId: string): Promise<BreakoutLeaderboardResult> {
  await requireUser();
  if (!UUID_PATTERN.test(leagueId)) return invalidLeagueResult();

  const [supabase, participant] = await Promise.all([createClient(), getParticipant()]);
  const { data, error } = await supabase.rpc('get_breakout_leaderboard', {
    p_league_id: leagueId,
  });

  if (error) {
    return {
      success: false,
      leaderboard: [],
      participantId: participant?.id ?? null,
      error: 'The league high scores could not be loaded.',
    };
  }

  return {
    success: true,
    leaderboard: mapLeaderboard(data ?? []),
    participantId: participant?.id ?? null,
  };
}

export async function startBreakoutRun(leagueId: string): Promise<BreakoutRunStartResult> {
  await requireUser();
  if (!UUID_PATTERN.test(leagueId)) {
    return {
      success: false,
      runId: null,
      error: 'This league is not available.',
    };
  }

  const [supabase, participant] = await Promise.all([createClient(), getParticipant()]);
  if (!participant) {
    return {
      success: false,
      runId: null,
      error: 'A participant profile is required to start a game.',
    };
  }

  const { data, error } = await supabase.rpc('start_breakout_run', {
    p_league_id: leagueId,
  });

  if (error || !data) {
    return {
      success: false,
      runId: null,
      error: 'A verified game could not be started. Check your connection and try again.',
    };
  }

  return { success: true, runId: data };
}

export async function submitBreakoutRun(
  leagueId: string,
  runId: string,
  summary: BreakoutRunSummary
): Promise<BreakoutLeaderboardResult> {
  await requireUser();
  if (!UUID_PATTERN.test(leagueId)) return invalidLeagueResult();
  if (!UUID_PATTERN.test(runId) || !isValidBreakoutRunSummary(summary)) {
    return {
      success: false,
      leaderboard: [],
      participantId: null,
      error: 'That game result could not be verified.',
    };
  }

  const [supabase, participant] = await Promise.all([createClient(), getParticipant()]);
  if (!participant) {
    return {
      success: false,
      leaderboard: [],
      participantId: null,
      error: 'A participant profile is required to save a score.',
    };
  }

  const { data, error } = await supabase.rpc('submit_breakout_run', {
    p_run_id: runId,
    p_league_id: leagueId,
    p_hits_by_level: summary.hitsByLevel,
    p_combo_awards: summary.comboAwards,
    p_lives_lost: summary.livesLost,
    p_max_combo: summary.maxCombo,
    p_duration_ms: summary.durationMs,
    p_finished: summary.finished,
  });

  if (error) {
    return {
      success: false,
      leaderboard: [],
      participantId: participant.id,
      error: 'Your score could not be verified or saved.',
    };
  }

  return {
    success: true,
    leaderboard: mapLeaderboard(data ?? []),
    participantId: participant.id,
  };
}
