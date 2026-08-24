import { describe, expect, it } from 'vitest';
import {
  BREAKOUT_LEVEL_HIT_CAPS,
  BREAKOUT_LEVELS,
  COMBO_BONUS,
  LIFE_LOSS_PENALTY,
  MAX_BREAKOUT_SCORE,
  PERFECT_GAME_BONUS,
  TOTAL_BREAKOUT_LEVELS,
  calculateBreakoutScore,
  isValidBreakoutRunSummary,
} from '@/lib/breakout/rules';

describe('Breakout rules', () => {
  it('defines ten distinct levels with escalating speed, paddle pressure, and brick durability', () => {
    expect(BREAKOUT_LEVELS).toHaveLength(TOTAL_BREAKOUT_LEVELS);
    expect(new Set(BREAKOUT_LEVELS.map(({ layout }) => layout.join('|'))).size).toBe(10);
    expect(BREAKOUT_LEVELS.map(({ paddleWidth }) => paddleWidth)).toEqual(
      [...BREAKOUT_LEVELS].map(({ paddleWidth }) => paddleWidth).sort((a, b) => b - a)
    );
    expect(BREAKOUT_LEVELS.map(({ ballSpeedMultiplier }) => ballSpeedMultiplier)).toEqual(
      [...BREAKOUT_LEVELS]
        .map(({ ballSpeedMultiplier }) => ballSpeedMultiplier)
        .sort((a, b) => a - b)
    );
    expect(BREAKOUT_LEVELS[7].layout.join('')).toContain('3');
  });

  it('differentiates scores through combos, life penalties, and perfect completion', () => {
    const completed = {
      hitsByLevel: [...BREAKOUT_LEVEL_HIT_CAPS],
      comboAwards: 12,
      livesLost: 0,
      maxCombo: 15,
      durationMs: 600_000,
      finished: true,
    };
    const cleanScore = calculateBreakoutScore(completed);

    expect(calculateBreakoutScore({ ...completed, comboAwards: 13 })).toBe(
      cleanScore + COMBO_BONUS
    );
    expect(calculateBreakoutScore({ ...completed, livesLost: 1 })).toBe(
      cleanScore - LIFE_LOSS_PENALTY - PERFECT_GAME_BONUS
    );
  });

  it('rejects impossible progress, hit counts, and completion speed', () => {
    expect(
      isValidBreakoutRunSummary({
        hitsByLevel: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        comboAwards: 0,
        livesLost: 0,
        maxCombo: 1,
        durationMs: 10_000,
        finished: false,
      })
    ).toBe(false);
    expect(
      isValidBreakoutRunSummary({
        hitsByLevel: [BREAKOUT_LEVEL_HIT_CAPS[0] + 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        comboAwards: 0,
        livesLost: 0,
        maxCombo: 0,
        durationMs: 10_000,
        finished: false,
      })
    ).toBe(false);
    expect(
      isValidBreakoutRunSummary({
        hitsByLevel: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        comboAwards: 0,
        livesLost: 0,
        maxCombo: 1,
        durationMs: 100,
        finished: false,
      })
    ).toBe(false);
  });

  it('keeps a perfect maximum run within the shared score bound', () => {
    const totalHits = BREAKOUT_LEVEL_HIT_CAPS.reduce((total, hits) => total + hits, 0);
    const summary = {
      hitsByLevel: [...BREAKOUT_LEVEL_HIT_CAPS],
      comboAwards: BREAKOUT_LEVEL_HIT_CAPS.reduce(
        (awards, hits) => awards + Math.floor(hits / 5),
        0
      ),
      livesLost: 0,
      maxCombo: totalHits,
      durationMs: 900_000,
      finished: true,
    };

    expect(isValidBreakoutRunSummary(summary)).toBe(true);
    expect(calculateBreakoutScore(summary)).toBe(MAX_BREAKOUT_SCORE);
  });

  it('accepts a legitimate long game while retaining a generous impossible-speed guard', () => {
    const longCompletedRun = {
      hitsByLevel: [...BREAKOUT_LEVEL_HIT_CAPS],
      comboAwards: 0,
      livesLost: 2,
      maxCombo: 8,
      durationMs: 3 * 60 * 60 * 1_000,
      finished: true,
    };

    expect(isValidBreakoutRunSummary(longCompletedRun)).toBe(true);
    expect(isValidBreakoutRunSummary({ ...longCompletedRun, durationMs: 22_000_000 })).toBe(false);
    expect(isValidBreakoutRunSummary({ ...longCompletedRun, durationMs: 1_000 })).toBe(false);
  });
});
