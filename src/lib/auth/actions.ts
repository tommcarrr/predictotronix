'use server';

import { createClient } from '@/lib/supabase/server';
import {
  ensureJoinRequest,
  invitePath,
  normalizeInviteCode,
  PENDING_INVITE_COOKIE,
  withInviteParam,
  type JoinRequestOutcome,
} from '@/lib/invitations';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const pendingInviteCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

function friendlyAuthError(message: string, mode: 'login' | 'register') {
  const normalized = message.toLowerCase();
  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return 'An account already exists for this email. Sign in instead.';
  }
  if (normalized.includes('invalid login credentials')) {
    return 'The email or password is incorrect.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email before signing in.';
  }
  if (normalized.includes('password')) {
    return 'Use a password with at least 8 characters.';
  }
  return mode === 'register'
    ? 'We could not create your account. Please try again.'
    : 'We could not sign you in. Please try again.';
}

function destinationForInvite(code: string, outcome: JoinRequestOutcome) {
  if (outcome.status === 'approved') {
    return '/dashboard?joined=1';
  }
  const params = new URLSearchParams();
  if (outcome.status === 'pending') params.set('requested', 'true');
  if (outcome.status === 'rejected') params.set('rejected', 'true');
  const query = params.toString();
  return `${invitePath(code)}${query ? `?${query}` : ''}`;
}

async function rememberInvite(code: string | null) {
  if (!code) return;
  (await cookies()).set(PENDING_INVITE_COOKIE, code, pendingInviteCookieOptions);
}

async function clearRememberedInvite() {
  (await cookies()).delete(PENDING_INVITE_COOKIE);
}

async function ensureInviteOrRecover(userId: string, inviteCode: string) {
  try {
    return await ensureJoinRequest(userId, inviteCode);
  } catch {
    redirect(
      `${invitePath(inviteCode)}?error=${encodeURIComponent(
        'Your account is ready, but we could not send the join request. Please try again.',
      )}`,
    );
  }
}

function confirmationUrl(inviteCode: string | null) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = new URL('/auth/confirm', appUrl);
  if (inviteCode) url.searchParams.set('invite', inviteCode);
  return url.toString();
}

function recoveryUrl(inviteCode: string | null) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = new URL('/auth/recover', appUrl);
  if (inviteCode) url.searchParams.set('invite', inviteCode);
  return url.toString();
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();
  const inviteCode = normalizeInviteCode(formData.get('invite_code'));

  if (displayName.length < 2 || displayName.length > 80) {
    redirect(withInviteParam('/register', inviteCode, 'error', 'Display name must be between 2 and 80 characters.'));
  }
  if (!email || !email.includes('@')) {
    redirect(withInviteParam('/register', inviteCode, 'error', 'Enter a valid email address.'));
  }
  if (password.length < 8) {
    redirect(withInviteParam('/register', inviteCode, 'error', 'Use a password with at least 8 characters.'));
  }

  await rememberInvite(inviteCode);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: confirmationUrl(inviteCode),
    },
  });

  if (error) {
    redirect(withInviteParam('/register', inviteCode, 'error', friendlyAuthError(error.message, 'register')));
  }

  if (data.session && data.user) {
    if (inviteCode) {
      const outcome = await ensureInviteOrRecover(data.user.id, inviteCode);
      await clearRememberedInvite();
      redirect(destinationForInvite(inviteCode, outcome));
    }
    redirect('/dashboard');
  }

  const message = inviteCode
    ? 'Account created. Confirm your email, then sign in to finish joining your league.'
    : 'Account created. Confirm your email, then sign in.';
  redirect(withInviteParam('/login', inviteCode, 'message', message));
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const cookieStore = await cookies();
  const inviteCode =
    normalizeInviteCode(formData.get('invite_code')) ??
    normalizeInviteCode(cookieStore.get(PENDING_INVITE_COOKIE)?.value);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(withInviteParam('/login', inviteCode, 'error', friendlyAuthError(error.message, 'login')));
  }

  if (inviteCode && data.user) {
    const outcome = await ensureInviteOrRecover(data.user.id, inviteCode);
    await clearRememberedInvite();
    redirect(destinationForInvite(inviteCode, outcome));
  }

  redirect('/');
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const inviteCode = normalizeInviteCode(formData.get('invite_code'));

  if (!email || !email.includes('@')) {
    redirect(
      withInviteParam('/forgot-password', inviteCode, 'error', 'Enter a valid email address.')
    );
  }

  await rememberInvite(inviteCode);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: recoveryUrl(inviteCode),
  });

  if (error) {
    redirect(
      withInviteParam(
        '/forgot-password',
        inviteCode,
        'error',
        'We could not send a reset email. Please wait a moment and try again.'
      )
    );
  }

  redirect(
    withInviteParam(
      '/forgot-password',
      inviteCode,
      'message',
      'If an account exists for that email, a password reset link is on its way.'
    )
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirm_password') ?? '');
  const cookieStore = await cookies();
  const inviteCode =
    normalizeInviteCode(formData.get('invite_code')) ??
    normalizeInviteCode(cookieStore.get(PENDING_INVITE_COOKIE)?.value);

  if (password.length < 8) {
    redirect(
      withInviteParam(
        '/reset-password',
        inviteCode,
        'error',
        'Use a password with at least 8 characters.'
      )
    );
  }
  if (password !== confirmPassword) {
    redirect(
      withInviteParam('/reset-password', inviteCode, 'error', 'The passwords do not match.')
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      withInviteParam(
        '/forgot-password',
        inviteCode,
        'error',
        'This password reset link is invalid or has expired. Request a new one.'
      )
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(
      withInviteParam(
        '/reset-password',
        inviteCode,
        'error',
        'We could not update your password. Request a new reset link and try again.'
      )
    );
  }

  await supabase.auth.signOut({ scope: 'local' });
  redirect(
    withInviteParam(
      '/login',
      inviteCode,
      'message',
      'Password updated. Sign in with your new password.'
    )
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
