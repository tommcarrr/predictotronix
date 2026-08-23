'use server';

import { getParticipant, requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  MAX_BREAKOUT_SCORE,
  type BreakoutLeaderboardEntry,
  type BreakoutLeaderboardResult,
} from './constants';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapLeaderboard(
  rows: Array<{
    rank_position: number;
    participant_id: string;
    display_name: string;
    score: number;
    achieved_at: string;
  }>,
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

export async function getBreakoutLeaderboard(
  leagueId: string,
): Promise<BreakoutLeaderboardResult> {
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

export async function submitBreakoutScore(
  leagueId: string,
  score: number,
): Promise<BreakoutLeaderboardResult> {
  await requireUser();
  if (!UUID_PATTERN.test(leagueId)) return invalidLeagueResult();
  if (!Number.isInteger(score) || score < 0 || score > MAX_BREAKOUT_SCORE) {
    return {
      success: false,
      leaderboard: [],
      participantId: null,
      error: 'That score is invalid.',
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

  const { data, error } = await supabase.rpc('submit_breakout_score', {
    p_league_id: leagueId,
    p_score: score,
  });

  if (error) {
    return {
      success: false,
      leaderboard: [],
      participantId: participant.id,
      error: 'Your score could not be saved. Check your connection and try again.',
    };
  }

  return {
    success: true,
    leaderboard: mapLeaderboard(data ?? []),
    participantId: participant.id,
  };
}
