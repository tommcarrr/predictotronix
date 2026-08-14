import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildReminderDeliveryKey,
  getDueReminderWindows,
  REMINDER_WINDOWS,
} from '@/lib/notifications/reminders';

describe('reminder delivery occurrences', () => {
  it('detects a two-hour reminder for a 19:45 London kickoff', () => {
    const now = new Date('2026-08-13T16:45:00.000Z');
    const firstKickoff = new Date('2026-08-13T18:45:00.000Z');

    expect(getDueReminderWindows(now, firstKickoff)).toEqual([REMINDER_WINDOWS.TWO_HOURS_BEFORE]);
  });

  it('uses one stable key throughout a window and separates channels and occurrences', () => {
    const base = {
      participantId: 'participant-1',
      gameweekId: 'gameweek-1',
      channel: 'email' as const,
      reminderWindow: REMINDER_WINDOWS.TWO_HOURS_BEFORE,
    };

    const key = buildReminderDeliveryKey(base);

    expect(buildReminderDeliveryKey(base)).toBe(key);
    expect(buildReminderDeliveryKey({ ...base, channel: 'sms' })).not.toBe(key);
    expect(
      buildReminderDeliveryKey({
        ...base,
        reminderWindow: REMINDER_WINDOWS.DAY_10AM,
      })
    ).not.toBe(key);
  });

  it('backs delivery claims with a unique database index', () => {
    const migration = readFileSync(
      'supabase/migrations/012_notification_delivery_idempotency.sql',
      'utf8'
    );

    expect(migration).toContain("'processing'");
    expect(migration).toContain('create unique index notification_log_delivery_key_unique_idx');
    expect(migration).toContain('on public.notification_log(delivery_key)');
  });
});
