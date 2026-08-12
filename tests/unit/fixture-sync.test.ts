import { describe, expect, it } from 'vitest';
import { gameweekNumberFromRound } from '@/lib/sync/fixtures';

describe('fixture sync gameweek mapping', () => {
  it.each([
    ['Regular Season - 1', 1],
    ['Regular Season - 38', 38],
    ['Gameweek 12', 12],
    ['Matchweek 7', 7],
  ])('extracts the gameweek number from %s', (round, expected) => {
    expect(gameweekNumberFromRound(round)).toBe(expected);
  });

  it.each(['Unassigned', 'Final', 'Regular Season', 'Gameweek 0']) (
    'does not invent a gameweek number for %s',
    (round) => expect(gameweekNumberFromRound(round)).toBeNull()
  );
});
