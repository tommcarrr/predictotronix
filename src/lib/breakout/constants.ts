export { MAX_BREAKOUT_SCORE } from './rules';

export interface BreakoutLeaderboardEntry {
  position: number;
  participantId: string;
  displayName: string;
  score: number;
  achievedAt: string;
}

export interface BreakoutLeaderboardResult {
  success: boolean;
  leaderboard: BreakoutLeaderboardEntry[];
  participantId: string | null;
  error?: string;
}

export interface BreakoutRunStartResult {
  success: boolean;
  runId: string | null;
  error?: string;
}
