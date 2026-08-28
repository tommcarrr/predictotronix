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
    error: null,
  });
  return query;
}

function participantsQuery(
  preferences = {
    email_enabled: true,
    sms_enabled: false,
    remind_when_complete: true,
    opted_out: false,
  }
) {
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
          notification_preferences: preferences,
        },
      },
    ],
    error: null,
  });
  return query;
}

function fixturesQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockResolvedValue({ data: [{ id: 'fixture-1' }], error: null });
  return query;
}

describe('send reminders cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    getSeasonNow.mockResolvedValue(new Date('2026-08-13T09:00:00.000Z'));
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
    const existingClaimQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'log-1', status: 'sent' },
        error: null,
      }),
    };
    existingClaimQuery.select.mockReturnValue(existingClaimQuery);
    existingClaimQuery.eq.mockReturnValue(existingClaimQuery);

    const cronStartQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: { id: 'cron-run-1' }, error: null }),
    };
    cronStartQuery.select.mockReturnValue(cronStartQuery);
    const cronFinishEq = vi.fn().mockResolvedValue({ error: null });

    createServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'gameweeks') return gameweeksQuery();
        if (table === 'season_participants') return participantsQuery();
        if (table === 'fixtures') return fixturesQuery();
        if (table === 'notification_log') {
          return { insert, update, select: existingClaimQuery.select };
        }
        if (table === 'cron_job_runs') {
          return {
            insert: vi.fn(() => cronStartQuery),
            update: vi.fn(() => ({ eq: cronFinishEq })),
          };
        }
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
        idempotencyKey: 'reminder:participant-1:gameweek-1:email:day_10am',
      })
    );
    expect(update).toHaveBeenCalledTimes(1);
    expect(cronFinishEq).toHaveBeenCalledTimes(2);
    expect(cronFinishEq.mock.calls.every(([, runId]) => runId === 'cron-run-1')).toBe(true);
  });

  it('honors saved settings returned as a one-to-one preference object', async () => {
    const cronStartQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: { id: 'cron-run-1' }, error: null }),
    };
    cronStartQuery.select.mockReturnValue(cronStartQuery);

    createServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'gameweeks') return gameweeksQuery();
        if (table === 'season_participants') {
          return participantsQuery({
            email_enabled: true,
            sms_enabled: false,
            remind_when_complete: true,
            opted_out: true,
          });
        }
        if (table === 'fixtures') return fixturesQuery();
        if (table === 'cron_job_runs') {
          return {
            insert: vi.fn(() => cronStartQuery),
            update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'x-cron-secret': 'cron-secret' },
      })
    );

    await expect(response.json()).resolves.toMatchObject({ sent: 0, suppressed: 1 });
    expect(sendReminderEmail).not.toHaveBeenCalled();
    expect(sendReminderSms).not.toHaveBeenCalled();
  });

  it('reports a gameweek query failure instead of recording a successful empty run', async () => {
    const gameweekFailure = {
      select: vi.fn(),
      eq: vi.fn(),
      not: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'database unavailable' },
      }),
    };
    gameweekFailure.select.mockReturnValue(gameweekFailure);
    gameweekFailure.eq.mockReturnValue(gameweekFailure);

    const cronStartQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: { id: 'cron-run-1' }, error: null }),
    };
    cronStartQuery.select.mockReturnValue(cronStartQuery);
    const cronFinishEq = vi.fn().mockResolvedValue({ error: null });
    const cronUpdate = vi.fn(() => ({ eq: cronFinishEq }));

    createServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'gameweeks') return gameweekFailure;
        if (table === 'cron_job_runs') {
          return { insert: vi.fn(() => cronStartQuery), update: cronUpdate };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'x-cron-secret': 'cron-secret' },
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Could not load upcoming gameweeks for reminders.',
    });
    expect(sendReminderEmail).not.toHaveBeenCalled();
    expect(cronUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });

  it('counts dry runs separately from messages actually sent', async () => {
    shouldDryRunNotifications.mockReturnValue(true);
    sendReminderEmail.mockResolvedValue({ success: true, dryRun: true });

    const insertQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: { id: 'log-1' }, error: null }),
    };
    insertQuery.select.mockReturnValue(insertQuery);
    const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
    const cronStartQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: { id: 'cron-run-1' }, error: null }),
    };
    cronStartQuery.select.mockReturnValue(cronStartQuery);

    createServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'gameweeks') return gameweeksQuery();
        if (table === 'season_participants') return participantsQuery();
        if (table === 'fixtures') return fixturesQuery();
        if (table === 'notification_log') {
          return { insert: vi.fn(() => insertQuery), update };
        }
        if (table === 'cron_job_runs') {
          return {
            insert: vi.fn(() => cronStartQuery),
            update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'x-cron-secret': 'cron-secret' },
      })
    );

    await expect(response.json()).resolves.toMatchObject({ sent: 0, dryRuns: 1 });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'dry_run' }));
  });

  it('retries a provider failure on a later cron tick', async () => {
    sendReminderEmail
      .mockResolvedValueOnce({ success: false, error: 'temporary provider failure' })
      .mockResolvedValueOnce({ success: true, messageId: 'email-2' });

    const single = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 'log-1' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate key' } });
    const insertQuery = { select: vi.fn(), single };
    insertQuery.select.mockReturnValue(insertQuery);
    const insert = vi.fn(() => insertQuery);

    const existingClaimQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'log-1', status: 'failed' },
        error: null,
      }),
    };
    existingClaimQuery.select.mockReturnValue(existingClaimQuery);
    existingClaimQuery.eq.mockReturnValue(existingClaimQuery);

    const retryQuery = {
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'log-1' }, error: null }),
    };
    retryQuery.eq.mockReturnValue(retryQuery);
    retryQuery.select.mockReturnValue(retryQuery);
    const update = vi.fn((values: { status: string }) =>
      values.status === 'processing'
        ? retryQuery
        : { eq: vi.fn().mockResolvedValue({ error: null }) }
    );

    const cronStartQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: { id: 'cron-run-1' }, error: null }),
    };
    cronStartQuery.select.mockReturnValue(cronStartQuery);

    createServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'gameweeks') return gameweeksQuery();
        if (table === 'season_participants') return participantsQuery();
        if (table === 'fixtures') return fixturesQuery();
        if (table === 'notification_log') {
          return { insert, update, select: existingClaimQuery.select };
        }
        if (table === 'cron_job_runs') {
          return {
            insert: vi.fn(() => cronStartQuery),
            update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          };
        }
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

    await expect(firstResponse.json()).resolves.toMatchObject({ sent: 0 });
    await expect(secondResponse.json()).resolves.toMatchObject({ sent: 1, duplicates: 0 });
    expect(sendReminderEmail).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'processing' }));
  });

  it('reclaims an abandoned processing delivery after the timeout', async () => {
    const insertQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      }),
    };
    insertQuery.select.mockReturnValue(insertQuery);

    const existingClaimQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'log-1',
          status: 'processing',
          sent_at: '2026-08-13T08:45:00.000Z',
        },
        error: null,
      }),
    };
    existingClaimQuery.select.mockReturnValue(existingClaimQuery);
    existingClaimQuery.eq.mockReturnValue(existingClaimQuery);

    const retryQuery = {
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'log-1' }, error: null }),
    };
    retryQuery.eq.mockReturnValue(retryQuery);
    retryQuery.select.mockReturnValue(retryQuery);
    const update = vi.fn((values: { status: string }) =>
      values.status === 'processing'
        ? retryQuery
        : { eq: vi.fn().mockResolvedValue({ error: null }) }
    );

    const cronStartQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: { id: 'cron-run-1' }, error: null }),
    };
    cronStartQuery.select.mockReturnValue(cronStartQuery);

    createServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'gameweeks') return gameweeksQuery();
        if (table === 'season_participants') return participantsQuery();
        if (table === 'fixtures') return fixturesQuery();
        if (table === 'notification_log') {
          return {
            insert: vi.fn(() => insertQuery),
            update,
            select: existingClaimQuery.select,
          };
        }
        if (table === 'cron_job_runs') {
          return {
            insert: vi.fn(() => cronStartQuery),
            update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'x-cron-secret': 'cron-secret' },
      })
    );

    await expect(response.json()).resolves.toMatchObject({ sent: 1, duplicates: 0 });
    expect(retryQuery.eq).toHaveBeenCalledWith('sent_at', '2026-08-13T08:45:00.000Z');
    expect(sendReminderEmail).toHaveBeenCalledTimes(1);
  });

  it('promotes an existing dry-run claim when the season becomes live', async () => {
    const insertQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      }),
    };
    insertQuery.select.mockReturnValue(insertQuery);

    const existingClaimQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'log-1', status: 'dry_run' },
        error: null,
      }),
    };
    existingClaimQuery.select.mockReturnValue(existingClaimQuery);
    existingClaimQuery.eq.mockReturnValue(existingClaimQuery);

    const retryQuery = {
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'log-1' }, error: null }),
    };
    retryQuery.eq.mockReturnValue(retryQuery);
    retryQuery.select.mockReturnValue(retryQuery);
    const update = vi.fn((values: { status: string }) =>
      values.status === 'processing'
        ? retryQuery
        : { eq: vi.fn().mockResolvedValue({ error: null }) }
    );

    const cronStartQuery = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ data: { id: 'cron-run-1' }, error: null }),
    };
    cronStartQuery.select.mockReturnValue(cronStartQuery);

    createServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'gameweeks') return gameweeksQuery();
        if (table === 'season_participants') return participantsQuery();
        if (table === 'fixtures') return fixturesQuery();
        if (table === 'notification_log') {
          return {
            insert: vi.fn(() => insertQuery),
            update,
            select: existingClaimQuery.select,
          };
        }
        if (table === 'cron_job_runs') {
          return {
            insert: vi.fn(() => cronStartQuery),
            update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'x-cron-secret': 'cron-secret' },
      })
    );

    await expect(response.json()).resolves.toMatchObject({ sent: 1, duplicates: 0 });
    expect(retryQuery.eq).toHaveBeenCalledWith('status', 'dry_run');
    expect(sendReminderEmail).toHaveBeenCalledTimes(1);
  });
});
