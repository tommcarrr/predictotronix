import { describe, it, expect } from 'vitest';
import {
  scorePrediction,
  rankLeaderboard,
  isKickoffLocked,
  calculateCompletion,
  type LeaderboardEntry,
} from '@/lib/scoring';

describe('scorePrediction', () => {
  it('awards 3 points for an exact score', () => {
    expect(scorePrediction([2, 1], [2, 1])).toEqual({ points: 3, reason: 'exact' });
    expect(scorePrediction([0, 0], [0, 0])).toEqual({ points: 3, reason: 'exact' });
  });

  it('awards 1 point for a correct result (home win)', () => {
    expect(scorePrediction([2, 1], [3, 1])).toEqual({ points: 1, reason: 'correct_result' });
    expect(scorePrediction([1, 0], [4, 2])).toEqual({ points: 1, reason: 'correct_result' });
  });

  it('awards 1 point for a correct result (away win)', () => {
    expect(scorePrediction([0, 2], [1, 3])).toEqual({ points: 1, reason: 'correct_result' });
  });

  it('awards 1 point for a correct result (draw)', () => {
    expect(scorePrediction([1, 1], [2, 2])).toEqual({ points: 1, reason: 'correct_result' });
  });

  it('awards 0 points for an incorrect result', () => {
    expect(scorePrediction([2, 1], [1, 1])).toEqual({ points: 0, reason: 'incorrect' });
    expect(scorePrediction([0, 1], [1, 0])).toEqual({ points: 0, reason: 'incorrect' });
    expect(scorePrediction([1, 1], [1, 0])).toEqual({ points: 0, reason: 'incorrect' });
  });
});

describe('rankLeaderboard', () => {
  it('sorts by total points descending', () => {
    const entries: LeaderboardEntry[] = [
      { participantId: 'b', displayName: 'Bob', totalPoints: 6, exactCount: 1 },
      { participantId: 'a', displayName: 'Alice', totalPoints: 9, exactCount: 1 },
    ];
    const ranked = rankLeaderboard(entries);
    expect(ranked[0].participantId).toBe('a');
    expect(ranked[0].position).toBe(1);
    expect(ranked[1].position).toBe(2);
  });

  it('uses exact count as tiebreaker', () => {
    const entries: LeaderboardEntry[] = [
      { participantId: 'b', displayName: 'Bob', totalPoints: 9, exactCount: 1 },
      { participantId: 'a', displayName: 'Alice', totalPoints: 9, exactCount: 3 },
    ];
    const ranked = rankLeaderboard(entries);
    expect(ranked[0].participantId).toBe('a');
  });

  it('assigns shared positions for tied entries', () => {
    const entries: LeaderboardEntry[] = [
      { participantId: 'a', displayName: 'Alice', totalPoints: 9, exactCount: 2 },
      { participantId: 'b', displayName: 'Bob', totalPoints: 9, exactCount: 2 },
      { participantId: 'c', displayName: 'Carol', totalPoints: 6, exactCount: 1 },
    ];
    const ranked = rankLeaderboard(entries);
    const positions = ranked.map((r) => r.position);
    // Two tied at position 1, next is position 3 (not 2)
    expect(positions.filter((p) => p === 1)).toHaveLength(2);
    expect(positions).toContain(3);
    expect(positions).not.toContain(2);
  });

  it('handles a single entry', () => {
    const ranked = rankLeaderboard([
      { participantId: 'a', displayName: 'Alice', totalPoints: 3, exactCount: 1 },
    ]);
    expect(ranked[0].position).toBe(1);
  });

  it('handles empty leaderboard', () => {
    expect(rankLeaderboard([])).toEqual([]);
  });
});

describe('isKickoffLocked', () => {
  const kickoff = new Date('2025-08-17T12:30:00Z');

  it('returns false before kickoff', () => {
    const before = new Date('2025-08-17T12:29:59Z');
    expect(isKickoffLocked(kickoff, before)).toBe(false);
  });

  it('returns true at kickoff', () => {
    expect(isKickoffLocked(kickoff, kickoff)).toBe(true);
  });

  it('returns true after kickoff', () => {
    const after = new Date('2025-08-17T13:00:00Z');
    expect(isKickoffLocked(kickoff, after)).toBe(true);
  });
});

describe('calculateCompletion', () => {
  it('marks complete when all predictions submitted', () => {
    const result = calculateCompletion(10, 10);
    expect(result.complete).toBe(true);
    expect(result.outstanding).toBe(0);
  });

  it('calculates outstanding correctly', () => {
    const result = calculateCompletion(10, 7);
    expect(result.complete).toBe(false);
    expect(result.outstanding).toBe(3);
    expect(result.submitted).toBe(7);
    expect(result.total).toBe(10);
  });

  it('handles zero submissions', () => {
    const result = calculateCompletion(5, 0);
    expect(result.complete).toBe(false);
    expect(result.outstanding).toBe(5);
  });
});
