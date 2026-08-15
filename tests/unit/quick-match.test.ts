import { describe, expect, it } from 'vitest';
import {
  chanceProfileForRound,
  markerPositionAtElapsed,
  QUICK_MATCH_CHANCE_PROFILES,
  resolveQuickMatchChance,
} from '@/components/participant/QuickMatchGame';

describe('Quick Match mechanics', () => {
  it('moves the timing marker from end to end and back', () => {
    expect(markerPositionAtElapsed(0, 1_200)).toBe(0);
    expect(markerPositionAtElapsed(300, 1_200)).toBe(50);
    expect(markerPositionAtElapsed(600, 1_200)).toBe(100);
    expect(markerPositionAtElapsed(900, 1_200)).toBe(50);
    expect(markerPositionAtElapsed(1_200, 1_200)).toBe(0);
  });

  it('moves farther in the same time when the chance is faster', () => {
    expect(markerPositionAtElapsed(225, QUICK_MATCH_CHANCE_PROFILES.clear.cycleMs)).toBe(30);
    expect(markerPositionAtElapsed(225, QUICK_MATCH_CHANCE_PROFILES.long.cycleMs)).toBe(50);
  });

  it('always scores inside the visible green zone', () => {
    expect(
      resolveQuickMatchChance({
        markerPosition: 59,
        targetPosition: 50,
        targetWidth: 18,
      })
    ).toEqual({ goal: true, outcome: 'GOAL' });
  });

  it('never scores outside the visible green zone', () => {
    const savedChance = resolveQuickMatchChance({
      markerPosition: 60,
      targetPosition: 50,
      targetWidth: 18,
    });
    const wideChance = resolveQuickMatchChance({
      markerPosition: 80,
      targetPosition: 50,
      targetWidth: 18,
    });

    expect(savedChance).toEqual({ goal: false, outcome: 'SAVED' });
    expect(wideChance).toEqual({ goal: false, outcome: 'WIDE' });
  });

  it('makes tougher chances visibly smaller and faster', () => {
    const clearChance = QUICK_MATCH_CHANCE_PROFILES.clear;
    const halfChance = QUICK_MATCH_CHANCE_PROFILES.half;
    const longShot = QUICK_MATCH_CHANCE_PROFILES.long;

    expect(clearChance.targetWidth).toBeGreaterThan(halfChance.targetWidth);
    expect(halfChance.targetWidth).toBeGreaterThan(longShot.targetWidth);
    expect(clearChance.cycleMs).toBeGreaterThan(halfChance.cycleMs);
    expect(halfChance.cycleMs).toBeGreaterThan(longShot.cycleMs);
  });

  it('gives both teams the same mix of chance conditions', () => {
    const homeChances = [0, 2, 4, 6].map((round) => chanceProfileForRound(round).label);
    const awayChances = [1, 3, 5, 7].map((round) => chanceProfileForRound(round).label);

    expect(homeChances.sort()).toEqual(awayChances.sort());
  });
});
