import { beforeEach, describe, expect, it, vi } from 'vitest';

const { emailSend, smsCreate, twilioFactory } = vi.hoisted(() => ({
  emailSend: vi.fn(),
  smsCreate: vi.fn(),
  twilioFactory: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: emailSend };
  },
}));

vi.mock('twilio', () => ({
  default: twilioFactory,
}));

import { sendJoinRequestEmail, sendReminderEmail, sendTestEmail } from '@/lib/notifications/email';
import { SYSTEM_REASSURANCES } from '@/lib/brand/system-copy';
import { sendTestSms } from '@/lib/notifications/sms';

describe('test notification providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    twilioFactory.mockReturnValue({ messages: { create: smsCreate } });
  });

  it('sends a clearly labelled test email and escapes the display name', async () => {
    emailSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

    await expect(
      sendTestEmail({
        to: 'player@example.com',
        displayName: '<Player & Co>',
      })
    ).resolves.toEqual({ success: true, messageId: 'email-123' });

    expect(emailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'player@example.com',
        subject: '[PREDICTOTRONIX] Test notification',
        html: expect.stringContaining('&lt;Player &amp; Co&gt;'),
        text: expect.stringContaining('EMAIL STATUS: OPERATIONAL'),
      })
    );

    const message = emailSend.mock.calls[0][0];
    expect(message.html).toContain('PREDICTOTRONIX');
    expect(message.html).toContain('SYSTEM TEST');
    expect(message.html).toContain('EMAIL STATUS: OPERATIONAL');
    expect(SYSTEM_REASSURANCES.some((line) => message.html.includes(line))).toBe(true);
    expect(SYSTEM_REASSURANCES.some((line) => message.text.includes(line))).toBe(true);
  });

  it('sends a branded reminder with escaped content and a plain-text fallback', async () => {
    emailSend.mockResolvedValue({ data: { id: 'email-456' }, error: null });

    await expect(
      sendReminderEmail({
        to: 'player@example.com',
        displayName: '<Player & Co>',
        gameweekLabel: 'Gameweek <12>',
        firstKickoff: new Date('2026-08-15T14:00:00Z'),
        predictionsUrl: 'https://example.com/predictions/gameweek-12?from=email&mode=full',
      })
    ).resolves.toEqual({ success: true, messageId: 'email-456' });

    const message = emailSend.mock.calls[0][0];
    expect(message.subject).toBe('[PREDICTOTRONIX] Gameweek <12> prediction reminder');
    expect(message.html).toContain('PREDICTION DEADLINE');
    expect(message.html).toContain('&lt;Player &amp; Co&gt;');
    expect(message.html).toContain('Gameweek &lt;12&gt;');
    expect(message.html).toContain('from=email&amp;mode=full');
    expect(message.text).toContain(
      'https://example.com/predictions/gameweek-12?from=email&mode=full'
    );
    expect(SYSTEM_REASSURANCES.some((line) => message.html.includes(line))).toBe(true);
    expect(SYSTEM_REASSURANCES.some((line) => message.text.includes(line))).toBe(true);
  });

  it('sends an idempotent join-request email to a league admin', async () => {
    emailSend.mockResolvedValue({ data: { id: 'email-join' }, error: null });

    await expect(
      sendJoinRequestEmail({
        to: 'admin@example.com',
        adminDisplayName: 'Admin <One>',
        applicantDisplayName: 'Player & Co',
        applicantEmail: 'player@example.com',
        leagueName: 'Office <League>',
        reviewUrl: 'https://example.com/admin/participants?tab=requests&from=email',
        idempotencyKey: 'join-request:league-1:user-1:admin-1',
      })
    ).resolves.toEqual({ success: true, messageId: 'email-join' });

    expect(emailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@example.com',
        subject: '[PREDICTOTRONIX] New join request for Office <League>',
        html: expect.stringContaining('Player &amp; Co'),
        text: expect.stringContaining('player@example.com'),
      }),
      { idempotencyKey: 'join-request:league-1:user-1:admin-1' }
    );
    expect(emailSend.mock.calls[0][0].html).toContain('tab=requests&amp;from=email');
    expect(SYSTEM_REASSURANCES.some((line) => emailSend.mock.calls[0][0].html.includes(line))).toBe(
      true
    );
  });

  it('sends a clearly labelled test SMS', async () => {
    smsCreate.mockResolvedValue({ sid: 'sms-123' });

    await expect(sendTestSms({ to: '+447700900000' })).resolves.toEqual({
      success: true,
      messageSid: 'sms-123',
    });

    expect(smsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+447700900000',
        body: expect.stringContaining('test notification'),
      })
    );
  });

  it('returns provider errors without throwing', async () => {
    emailSend.mockResolvedValue({ data: null, error: { message: 'Rejected' } });
    smsCreate.mockRejectedValue(new Error('Unavailable'));

    await expect(
      sendTestEmail({ to: 'player@example.com', displayName: 'Player' })
    ).resolves.toEqual({ success: false, error: 'Rejected' });
    await expect(sendTestSms({ to: '+447700900000' })).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('Unavailable'),
    });
  });

  it('passes the delivery key to Resend for idempotent reminder retries', async () => {
    emailSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

    await sendReminderEmail({
      to: 'player@example.com',
      displayName: 'Player',
      gameweekLabel: 'Gameweek 1',
      firstKickoff: new Date('2026-08-13T18:45:00.000Z'),
      predictionsUrl: 'https://example.com/predictions/gameweek-1',
      idempotencyKey: 'reminder:participant-1:gameweek-1:email:two_hours_before',
    });

    expect(emailSend).toHaveBeenCalledWith(expect.objectContaining({ to: 'player@example.com' }), {
      idempotencyKey: 'reminder:participant-1:gameweek-1:email:two_hours_before',
    });
  });
});
