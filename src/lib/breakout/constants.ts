export const MAX_BREAKOUT_SCORE = 54_000;

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
