import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createServiceClient,
  getUser,
  isSuperAdmin,
  redirect,
  revalidatePath,
  sendTestEmail,
  sendTestSms,
} = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  getUser: vi.fn(),
  isSuperAdmin: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  sendTestEmail: vi.fn(),
  sendTestSms: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createServiceClient }));
vi.mock('@/lib/auth', () => ({ getUser, isSuperAdmin }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/notifications/email', () => ({ sendTestEmail }));
vi.mock('@/lib/notifications/sms', () => ({ sendTestSms }));

import { sendTestNotification } from '@/app/(admin)/admin/test-tools/actions';

function queryReturning(method: 'single' | 'maybeSingle', value: unknown) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query[method] = vi.fn().mockResolvedValue(value);
  return query;
}

describe('sendTestNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ id: 'admin-1' });
    isSuperAdmin.mockResolvedValue(true);
    sendTestEmail.mockResolvedValue({ success: true, messageId: 'email-1' });
    sendTestSms.mockResolvedValue({ success: true, messageSid: 'sms-1' });
  });

  it('sends to a participant in an active live season', async () => {
    const seasonQuery = queryReturning('single', { data: { status: 'active' } });
    const participantQuery = queryReturning('maybeSingle', {
      data: {
        participants: {
          id: 'participant-1',
          display_name: 'Live Player',
          email: 'live@example.com',
          mobile: null,
        },
      },
      error: null,
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    createServiceClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'seasons') return seasonQuery;
        if (table === 'season_participants') return participantQuery;
        if (table === 'notification_log') return { insert };
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('season_id', 'live-season');
    formData.set('participant_id', 'participant-1');
    formData.set('channel', 'email');

    await expect(sendTestNotification(formData)).rejects.toThrow(
      'REDIRECT:/admin/test-tools?tab=notifications&notification=sent&channel=email',
    );
    expect(sendTestEmail).toHaveBeenCalledWith({
      to: 'live@example.com',
      displayName: 'Live Player',
    });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      season_id: 'live-season',
      notification_type: 'test',
      status: 'sent',
    }));
  });

  it('refuses an inactive season before contacting a provider', async () => {
    const seasonQuery = queryReturning('single', { data: { status: 'completed' } });
    createServiceClient.mockResolvedValue({
      from: vi.fn(() => seasonQuery),
    });

    const formData = new FormData();
    formData.set('season_id', 'old-season');
    formData.set('participant_id', 'participant-1');
    formData.set('channel', 'email');

    await expect(sendTestNotification(formData)).rejects.toThrow(
      'REDIRECT:/admin/test-tools?tab=notifications&error=Season+must+be+active',
    );
    expect(sendTestEmail).not.toHaveBeenCalled();
    expect(sendTestSms).not.toHaveBeenCalled();
  });
});
