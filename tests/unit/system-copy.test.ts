import { describe, expect, it } from 'vitest';
import {
  getDailySocialShareVariant,
  SOCIAL_SHARE_VARIANTS,
  selectSystemReassurance,
  SYSTEM_REASSURANCES,
} from '@/lib/brand/system-copy';

describe('system reassurance copy', () => {
  it('selects stable email decoration from the supplied context', () => {
    const seed = 'player@example.com:Gameweek 12:2026-08-15T14:00:00.000Z';

    expect(selectSystemReassurance(seed)).toBe(selectSystemReassurance(seed));
    expect(SYSTEM_REASSURANCES).toContain(selectSystemReassurance(seed));
  });

  it('makes every reassurance reachable through deterministic rotation', () => {
    const selections = new Set(
      Array.from({ length: 100 }, (_, index) => selectSystemReassurance(`message-${index}`))
    );

    expect(selections).toEqual(new Set(SYSTEM_REASSURANCES));
  });

  it('keeps a social variant stable for a UTC day while rotating across days', () => {
    const first = getDailySocialShareVariant(new Date('2026-08-25T00:01:00.000Z'));
    const later = getDailySocialShareVariant(new Date('2026-08-25T23:59:00.000Z'));
    const selections = new Set(
      Array.from(
        { length: 12 },
        (_, index) => getDailySocialShareVariant(new Date(Date.UTC(2026, 7, 25 + index))).status
      )
    );

    expect(first).toBe(later);
    expect(SOCIAL_SHARE_VARIANTS).toContain(first);
    expect(selections.size).toBeGreaterThan(1);
  });
});
