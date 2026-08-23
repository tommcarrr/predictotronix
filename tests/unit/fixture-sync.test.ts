import { describe, expect, it } from 'vitest';
import { deriveGameweekStatus, gameweekNumberFromRound } from '@/lib/sync/fixtures';

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

describe('deriveGameweekStatus', () => {
  const now = new Date('2026-08-23T15:00:00.000Z');

  it('keeps a gameweek upcoming before its fixtures start', () => {
    expect(
      deriveGameweekStatus(
        [{ kickoff: '2026-08-24T15:00:00.000Z', status: 'scheduled' }],
        now
      )
    ).toBe('upcoming');
  });

  it('marks a gameweek in progress once a fixture has started or finished', () => {
    expect(
      deriveGameweekStatus(
        [
          { kickoff: '2026-08-23T12:00:00.000Z', status: 'finished' },
          { kickoff: '2026-08-23T17:00:00.000Z', status: 'scheduled' },
        ],
        now
      )
    ).toBe('in_progress');
  });

  it('marks a gameweek completed when every fixture is terminal', () => {
    expect(
      deriveGameweekStatus(
        [
          { kickoff: '2026-08-23T12:00:00.000Z', status: 'finished' },
          { kickoff: '2026-08-23T14:00:00.000Z', status: 'cancelled' },
        ],
        now
      )
    ).toBe('completed');
  });

  it('does not complete a gameweek while a postponed fixture remains', () => {
    expect(
      deriveGameweekStatus(
        [
          { kickoff: '2026-08-23T12:00:00.000Z', status: 'finished' },
          { kickoff: '2026-08-23T14:00:00.000Z', status: 'postponed' },
        ],
        now
      )
    ).toBe('in_progress');
  });
});
