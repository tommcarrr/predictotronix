import type { PointsReason } from '@/types';

export interface ScoringResult {
  points: number;
  reason: PointsReason;
}

type Score = [number, number];
type Result = 'H' | 'D' | 'A';

function getResult([home, away]: Score): Result {
  if (home > away) return 'H';
  if (home === away) return 'D';
  return 'A';
}

/**
 * Score a single prediction against the actual result.
 * - Exact score  → 3 points
 * - Correct result only → 1 point
 * - Incorrect → 0 points
 */
export function scorePrediction(predicted: Score, actual: Score): ScoringResult {
  const [predHome, predAway] = predicted;
  const [actHome, actAway] = actual;

  if (predHome === actHome && predAway === actAway) {
    return { points: 3, reason: 'exact' };
  }

  if (getResult(predicted) === getResult(actual)) {
    return { points: 1, reason: 'correct_result' };
  }

  return { points: 0, reason: 'incorrect' };
}

export interface LeaderboardEntry {
  participantId: string;
  displayName: string;
  totalPoints: number;
  exactCount: number;
}

export interface RankedEntry extends LeaderboardEntry {
  position: number;
}

/**
 * Rank leaderboard entries with shared position logic.
 * Sorting: total points desc → display name asc.
 * Ties share the same position (1st, 1st, 3rd — not 1st, 2nd, 3rd).
 */
export function rankLeaderboard(entries: LeaderboardEntry[]): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.displayName.localeCompare(b.displayName);
  });

  let position = 1;
  return sorted.map((entry, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      if (entry.totalPoints !== prev.totalPoints) {
        position = i + 1;
      }
    }
    return { ...entry, position };
  });
}

/**
 * Returns true if the given kickoff time is in the past (predictions locked).
 * Uses a provided "now" for testability — defaults to real time.
 */
export function isKickoffLocked(kickoff: Date, now: Date = new Date()): boolean {
  return kickoff <= now;
}

/**
 * Calculate how many predictions a participant has submitted for a gameweek.
 */
export function calculateCompletion(
  fixtureCount: number,
  submittedCount: number
): { submitted: number; total: number; complete: boolean; outstanding: number } {
  return {
    submitted: submittedCount,
    total: fixtureCount,
    complete: submittedCount >= fixtureCount,
    outstanding: Math.max(0, fixtureCount - submittedCount),
  };
}
