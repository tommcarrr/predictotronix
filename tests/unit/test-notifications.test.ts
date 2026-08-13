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

import { sendTestEmail } from '@/lib/notifications/email';
import { sendTestSms } from '@/lib/notifications/sms';

describe('test notification providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    twilioFactory.mockReturnValue({ messages: { create: smsCreate } });
  });

  it('sends a clearly labelled test email and escapes the display name', async () => {
    emailSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

    await expect(sendTestEmail({
      to: 'player@example.com',
      displayName: '<Player & Co>',
    })).resolves.toEqual({ success: true, messageId: 'email-123' });

    expect(emailSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'player@example.com',
      subject: 'Predictotronix test notification',
      html: expect.stringContaining('&lt;Player &amp; Co&gt;'),
    }));
  });

  it('sends a clearly labelled test SMS', async () => {
    smsCreate.mockResolvedValue({ sid: 'sms-123' });

    await expect(sendTestSms({ to: '+447700900000' }))
      .resolves.toEqual({ success: true, messageSid: 'sms-123' });

    expect(smsCreate).toHaveBeenCalledWith(expect.objectContaining({
      to: '+447700900000',
      body: expect.stringContaining('test notification'),
    }));
  });

  it('returns provider errors without throwing', async () => {
    emailSend.mockResolvedValue({ data: null, error: { message: 'Rejected' } });
    smsCreate.mockRejectedValue(new Error('Unavailable'));

    await expect(sendTestEmail({ to: 'player@example.com', displayName: 'Player' }))
      .resolves.toEqual({ success: false, error: 'Rejected' });
    await expect(sendTestSms({ to: '+447700900000' }))
      .resolves.toMatchObject({ success: false, error: expect.stringContaining('Unavailable') });
  });
});
