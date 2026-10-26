import { describe, expect, it } from 'vitest';
import { loadAllRows } from '@/lib/admin/load-all-rows';
import { getFixtureOutcomeReason } from '@/lib/admin/fixture-outcomes';

describe('outcome data loading', () => {
  it.each([1000, 250])('loads every prediction with a server cap of %i', async (cap) => {
    const rows = Array.from({ length: 2301 }, (_, id) => ({ id }));
    const result = await loadAllRows(async (from, to) => ({
      data: rows.slice(from, Math.min(to + 1, from + cap)),
      error: null,
    }));
    expect(result).toEqual({ data: rows, error: null });
  });

  it('discards partial data when a later page fails', async () => {
    const error = { message: 'Request failed' };
    const result = await loadAllRows(async (from) =>
      from === 0 ? { data: [{ id: 1 }], error: null } : { data: null, error }
    );
    expect(result).toEqual({ data: [], error });
  });
});

describe('outcomes from confirmed results', () => {
  const fixture = { result_confirmed: true, home_score: 2, away_score: 1 };

  it.each([null, 'incorrect', 'correct_result'])(
    'ignores missing or stale scoring label %s',
    (points_reason) => {
      const prediction = { participant_id: 'alice', home_score: 2, away_score: 1, points_reason };
      expect(getFixtureOutcomeReason(prediction, fixture)).toBe('exact');
      expect(getFixtureOutcomeReason(prediction, { ...fixture, home_score: 3 })).toBe(
        'correct_result'
      );
      expect(getFixtureOutcomeReason(prediction, { ...fixture, home_score: 0 })).toBe('incorrect');
    }
  );

  it('does not classify unconfirmed or incomplete scores', () => {
    const prediction = { participant_id: 'alice', home_score: 2, away_score: 1 };
    expect(getFixtureOutcomeReason(prediction, { ...fixture, result_confirmed: false })).toBeNull();
    expect(getFixtureOutcomeReason(prediction, { ...fixture, home_score: null })).toBeNull();
    expect(getFixtureOutcomeReason(prediction, { ...fixture, away_score: null })).toBeNull();
  });
});
