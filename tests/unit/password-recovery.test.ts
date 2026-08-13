import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { cookieStore, createClient, redirect } = vi.hoisted(() => ({
  cookieStore: {
    delete: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
  createClient: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock('next/navigation', () => ({ redirect }));

import { requestPasswordReset, updatePassword } from '@/lib/auth/actions';
import { GET as recoverPassword } from '@/app/auth/recover/route';

describe('password recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.get.mockReturnValue(undefined);
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('sends an enumeration-safe reset email and preserves an invite', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    createClient.mockResolvedValue({ auth: { resetPasswordForEmail } });
    const formData = new FormData();
    formData.set('email', 'player@example.com');
    formData.set('invite_code', 'league_123');

    await expect(requestPasswordReset(formData)).rejects.toThrow(
      'REDIRECT:/forgot-password?message=If+an+account+exists+for+that+email%2C+a+password+reset+link+is+on+its+way.&invite=league_123'
    );
    expect(resetPasswordForEmail).toHaveBeenCalledWith('player@example.com', {
      redirectTo: 'http://localhost:3000/auth/recover?invite=league_123',
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      'predictotronix_pending_invite',
      'league_123',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' })
    );
  });

  it('exchanges a recovery code and sends the user to the password form', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    createClient.mockResolvedValue({ auth: { exchangeCodeForSession } });

    await expect(
      recoverPassword(
        new NextRequest('http://localhost/auth/recover?code=recovery-code&invite=league_123')
      )
    ).rejects.toThrow('REDIRECT:/reset-password?invite=league_123');
    expect(exchangeCodeForSession).toHaveBeenCalledWith('recovery-code');
  });

  it('rejects an invalid or expired recovery link', async () => {
    createClient.mockResolvedValue({ auth: {} });

    await expect(recoverPassword(new NextRequest('http://localhost/auth/recover'))).rejects.toThrow(
      'REDIRECT:/forgot-password?error=This+password+reset+link+is+invalid+or+has+expired.+Request+a+new+one.'
    );
  });

  it('updates the authenticated user password and ends the recovery session', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createClient.mockResolvedValue({ auth: { getUser, updateUser, signOut } });
    const formData = new FormData();
    formData.set('password', 'new-password');
    formData.set('confirm_password', 'new-password');
    formData.set('invite_code', 'league_123');

    await expect(updatePassword(formData)).rejects.toThrow(
      'REDIRECT:/login?message=Password+updated.+Sign+in+with+your+new+password.&invite=league_123'
    );
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('does not update mismatched passwords', async () => {
    const updateUser = vi.fn();
    createClient.mockResolvedValue({ auth: { updateUser } });
    const formData = new FormData();
    formData.set('password', 'new-password');
    formData.set('confirm_password', 'different-password');

    await expect(updatePassword(formData)).rejects.toThrow(
      'REDIRECT:/reset-password?error=The+passwords+do+not+match.'
    );
    expect(updateUser).not.toHaveBeenCalled();
  });
});
