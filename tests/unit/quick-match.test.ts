import { describe, expect, it } from 'vitest';
import {
  markerPositionAtElapsed,
  resolveQuickMatchChance,
} from '@/components/participant/QuickMatchGame';

describe('Quick Match mechanics', () => {
  it('moves the timing marker from end to end and back', () => {
    expect(markerPositionAtElapsed(0)).toBe(0);
    expect(markerPositionAtElapsed(450)).toBe(50);
    expect(markerPositionAtElapsed(900)).toBe(100);
    expect(markerPositionAtElapsed(1_350)).toBe(50);
    expect(markerPositionAtElapsed(1_800)).toBe(0);
  });

  it('applies a modest home advantage to equally timed chances', () => {
    const homeChance = resolveQuickMatchChance({
      markerPosition: 50,
      targetPosition: 50,
      attackingSide: 'home',
      random: () => 0.45,
    });
    const awayChance = resolveQuickMatchChance({
      markerPosition: 50,
      targetPosition: 50,
      attackingSide: 'away',
      random: () => 0.45,
    });

    expect(homeChance).toEqual({ goal: true, quality: 'PERFECT' });
    expect(awayChance).toEqual({ goal: false, quality: 'PERFECT' });
  });

  it('keeps badly timed chances unlikely to score', () => {
    expect(
      resolveQuickMatchChance({
        markerPosition: 0,
        targetPosition: 50,
        attackingSide: 'home',
        random: () => 0.5,
      })
    ).toEqual({ goal: false, quality: 'WIDE' });
  });
});
