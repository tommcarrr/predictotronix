import { describe, expect, it } from 'vitest';
import { selectPredictionGameweek } from '@/lib/predictions/gameweek';

describe('selectPredictionGameweek', () => {
  const now = new Date('2026-08-11T12:00:00Z');
  const gameweeks = [
    { id: 'in-progress', label: 'Gameweek 1' },
    { id: 'upcoming', label: 'Gameweek 2' },
  ];

  it('skips a fully locked in-progress gameweek when a later gameweek is open', () => {
    const selected = selectPredictionGameweek(
      gameweeks,
      [
        { gameweek_id: 'in-progress', kickoff: '2026-08-11T11:00:00Z' },
        { gameweek_id: 'upcoming', kickoff: '2026-08-12T11:00:00Z' },
      ],
      now,
    );

    expect(selected?.id).toBe('upcoming');
  });

  it('keeps an in-progress gameweek when it still has an open fixture', () => {
    const selected = selectPredictionGameweek(
      gameweeks,
      [
        { gameweek_id: 'in-progress', kickoff: '2026-08-11T13:00:00Z' },
        { gameweek_id: 'upcoming', kickoff: '2026-08-12T11:00:00Z' },
      ],
      now,
    );

    expect(selected?.id).toBe('in-progress');
  });

  it('falls back to the earliest gameweek when all fixtures are locked', () => {
    const selected = selectPredictionGameweek(
      gameweeks,
      [{ gameweek_id: 'in-progress', kickoff: '2026-08-11T11:00:00Z' }],
      now,
    );

    expect(selected?.id).toBe('in-progress');
  });

  it('selects a requested gameweek from a notification deep link', () => {
    const selected = selectPredictionGameweek(gameweeks, [], now, 'upcoming');

    expect(selected?.id).toBe('upcoming');
  });

  it('ignores a requested gameweek that is not in the active season', () => {
    const selected = selectPredictionGameweek(
      gameweeks,
      [{ gameweek_id: 'upcoming', kickoff: '2026-08-12T11:00:00Z' }],
      now,
      'another-season'
    );

    expect(selected?.id).toBe('upcoming');
  });
});
