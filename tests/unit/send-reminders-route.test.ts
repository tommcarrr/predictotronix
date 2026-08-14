import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  createServiceClient,
  getSeasonNow,
  sendReminderEmail,
  sendReminderSms,
  shouldDryRunNotifications,
} = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  getSeasonNow: vi.fn(),
  sendReminderEmail: vi.fn(),
  sendReminderSms: vi.fn(),
  shouldDryRunNotifications: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createServiceClient }));
vi.mock('@/lib/clock', () => ({ getSeasonNow }));
vi.mock('@/lib/notifications/email', () => ({ sendReminderEmail }));
vi.mock('@/lib/notifications/sms', () => ({ sendReminderSms }));
vi.mock('@/lib/environment', () => ({ shouldDryRunNotifications }));

import { POST } from '@/app/api/cron/send-reminders/route';

function gameweeksQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    not: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.not.mockResolvedValue({
    data: [
      {
        id: 'gameweek-1',
        label: 'Gameweek 1',
        first_kickoff: '2026-08-13T18:45:00.000Z',
        season_id: 'season-1',
        seasons: { season_type: 'production', status: 'active' },
      },
    ],
  });
  return query;
}

function participantsQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockResolvedValue({
    data: [
      {
        participant_id: 'participant-1',
        participants: {
          id: 'participant-1',
          display_name: 'Player One',
          email: 'player@example.com',
          mobile: null,
          notification_preferences: [
            {
              email_enabled: true,
              sms_enabled: false,
              remind_when_complete: true,
              opted_out: false,
            },
          ],
        },
      },
    ],
  });
  return query;
}

describe('send reminders cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    getSeasonNow.mockResolvedValue(new Date('2026-08-13T16:45:00.000Z'));
    shouldDryRunNotifications.mockReturnValue(false);
    sendReminderEmail.mockResolvedValue({ success: true, messageId: 'email-1' });
    sendReminderSms.mockResolvedValue({ success: true, messageSid: 'sms-1' });
  });

  it('sends once when a later cron poll collides with the same delivery key', async () => {
    const single = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 'log-1' }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      });
    const insertQuery = { select: vi.fn(), single };
    insertQuery.select.mockReturnValue(insertQuery);
    const insert = vi.fn(() => insertQuery);

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));

    createServiceClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'gameweeks') return gameweeksQuery();
        if (table === 'season_participants') return participantsQuery();
        if (table === 'notification_log') return { insert, update };
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const request = () =>
      new NextRequest('http://localhost/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'x-cron-secret': 'cron-secret' },
      });

    const firstResponse = await POST(request());
    const secondResponse = await POST(request());

    await expect(firstResponse.json()).resolves.toMatchObject({ sent: 1, duplicates: 0 });
    await expect(secondResponse.json()).resolves.toMatchObject({ sent: 0, duplicates: 1 });
    expect(sendReminderEmail).toHaveBeenCalledTimes(1);
    expect(sendReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'reminder:participant-1:gameweek-1:email:two_hours_before',
      })
    );
    expect(update).toHaveBeenCalledTimes(1);
  });
});
