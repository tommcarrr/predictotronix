import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildReminderDeliveryKey,
  getDueReminderWindows,
  REMINDER_WINDOWS,
} from '@/lib/notifications/reminders';

describe('reminder delivery occurrences', () => {
  it('detects 10:00 on the kickoff day during British Summer Time', () => {
    const now = new Date('2026-08-22T09:00:00.000Z');
    const firstKickoff = new Date('2026-08-22T14:00:00.000Z');

    expect(getDueReminderWindows(now, firstKickoff)).toEqual([REMINDER_WINDOWS.DAY_10AM]);
  });

  it('does not send the matchday reminder at 10:00 on an earlier day', () => {
    const now = new Date('2026-08-21T09:00:00.000Z');
    const firstKickoff = new Date('2026-08-22T14:00:00.000Z');

    expect(getDueReminderWindows(now, firstKickoff)).toEqual([]);
  });

  it('detects 10:00 on the kickoff day during Greenwich Mean Time', () => {
    const now = new Date('2026-12-05T10:00:00.000Z');
    const firstKickoff = new Date('2026-12-05T15:00:00.000Z');

    expect(getDueReminderWindows(now, firstKickoff)).toEqual([REMINDER_WINDOWS.DAY_10AM]);
  });

  it('detects a two-hour reminder for a 19:45 London kickoff', () => {
    const now = new Date('2026-08-13T16:45:00.000Z');
    const firstKickoff = new Date('2026-08-13T18:45:00.000Z');

    expect(getDueReminderWindows(now, firstKickoff)).toEqual([REMINDER_WINDOWS.TWO_HOURS_BEFORE]);
  });

  it('catches up the latest due reminder without returning older occurrences', () => {
    const now = new Date('2026-08-22T12:15:00.000Z');
    const firstKickoff = new Date('2026-08-22T14:00:00.000Z');

    expect(getDueReminderWindows(now, firstKickoff)).toEqual([REMINDER_WINDOWS.TWO_HOURS_BEFORE]);
  });

  it('does not return reminders at or after kickoff', () => {
    const firstKickoff = new Date('2026-08-22T14:00:00.000Z');

    expect(getDueReminderWindows(firstKickoff, firstKickoff)).toEqual([]);
    expect(getDueReminderWindows(new Date('2026-08-22T14:15:00.000Z'), firstKickoff)).toEqual([]);
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

  it('backfills preferences and creates defaults for future participants', () => {
    const migration = readFileSync(
      'supabase/migrations/016_notification_preferences_defaults.sql',
      'utf8'
    );

    expect(migration).toContain('insert into public.notification_preferences');
    expect(migration).toContain('select id, not is_offline');
    expect(migration).toContain('participants_create_notification_preferences');
  });
});
