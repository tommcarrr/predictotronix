import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieStore, createClient, getInviteLeague, redirect } = vi.hoisted(() => ({
  cookieStore: {
    delete: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
  createClient: vi.fn(),
  getInviteLeague: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient,
  createServiceClient: vi.fn(),
}));
vi.mock('@/lib/invitations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/invitations')>();
  return { ...actual, getInviteLeague };
});
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock('next/navigation', () => ({ redirect }));

import { signUp } from '@/lib/auth/actions';

function signupForm(inviteCode?: string) {
  const formData = new FormData();
  formData.set('display_name', 'New Player');
  formData.set('email', 'player@example.com');
  formData.set('password', 'password123');
  if (inviteCode) formData.set('invite_code', inviteCode);
  return formData;
}

describe('invitation-only signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('rejects signup without an invitation before creating an auth client', async () => {
    await expect(signUp(signupForm())).rejects.toThrow(
      'REDIRECT:/register?error=Registration+requires+a+valid+league+invitation.'
    );

    expect(getInviteLeague).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('rejects an inactive or unknown invitation before creating an account', async () => {
    getInviteLeague.mockResolvedValue(null);

    await expect(signUp(signupForm('league_123'))).rejects.toThrow(
      'REDIRECT:/register?error=Registration+requires+a+valid+league+invitation.'
    );

    expect(getInviteLeague).toHaveBeenCalledWith('league_123');
    expect(createClient).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('creates an account when the invitation is active', async () => {
    const supabaseSignUp = vi.fn().mockResolvedValue({
      data: { session: null, user: { id: 'user-1' } },
      error: null,
    });
    getInviteLeague.mockResolvedValue({ id: 'league-1', name: 'Office League' });
    createClient.mockResolvedValue({ auth: { signUp: supabaseSignUp } });

    await expect(signUp(signupForm('league_123'))).rejects.toThrow(
      'REDIRECT:/login?message=Account+created.+Confirm+your+email%2C+then+sign+in+to+finish+joining+your+league.&invite=league_123'
    );

    expect(supabaseSignUp).toHaveBeenCalledWith({
      email: 'player@example.com',
      password: 'password123',
      options: {
        data: { display_name: 'New Player' },
        emailRedirectTo: 'http://localhost:3000/auth/confirm?invite=league_123',
      },
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      'predictotronix_pending_invite',
      'league_123',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' })
    );
  });
});
