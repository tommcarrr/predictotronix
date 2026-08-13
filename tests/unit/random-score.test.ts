import { describe, expect, it } from 'vitest';
import { weightedRandomScore } from '@/lib/predictions/random-score';

describe('weightedRandomScore', () => {
  it.each([
    [0, 0],
    [0.2999, 0],
    [0.3, 1],
    [0.5999, 1],
    [0.6, 2],
    [0.7999, 2],
    [0.8, 3],
    [0.9099, 3],
    [0.91, 4],
    [0.9699, 4],
    [0.97, 5],
    [0.9999, 5],
  ])('maps random value %f to score %i', (randomValue, expectedScore) => {
    expect(weightedRandomScore(() => randomValue)).toBe(expectedScore);
  });
});
