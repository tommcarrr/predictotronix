import { describe, expect, it } from 'vitest';
import { clockTimeForGameweek } from '@/lib/clock';

describe('clockTimeForGameweek', () => {
  const first = new Date('2026-10-03T12:30:00Z');
  const last = new Date('2026-10-04T16:30:00Z');

  it('positions time before the prediction deadline', () => {
    expect(clockTimeForGameweek(first, last, 'before').toISOString()).toBe(
      '2026-10-02T12:30:00.000Z',
    );
  });

  it('positions time during a partially locked gameweek', () => {
    expect(clockTimeForGameweek(first, last, 'in_progress').toISOString()).toBe(
      '2026-10-03T13:30:00.000Z',
    );
  });

  it('positions time after all fixtures', () => {
    expect(clockTimeForGameweek(first, last, 'after').toISOString()).toBe(
      '2026-10-04T19:30:00.000Z',
    );
  });

  it('rejects an inverted kickoff range', () => {
    expect(() => clockTimeForGameweek(last, first, 'before')).toThrow(
      'Invalid gameweek kickoff range',
    );
  });
});
