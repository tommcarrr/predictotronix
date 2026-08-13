import type { EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ensureJoinRequest,
  invitePath,
  normalizeInviteCode,
  PENDING_INVITE_COOKIE,
  withInviteParam,
} from '@/lib/invitations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const cookieStore = await cookies();
  const inviteCode =
    normalizeInviteCode(request.nextUrl.searchParams.get('invite')) ??
    normalizeInviteCode(cookieStore.get(PENDING_INVITE_COOKIE)?.value);

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { data: { user: null }, error: new Error('Missing confirmation token') };

  if (result.error) {
    redirect(withInviteParam('/login', inviteCode, 'error', 'This confirmation link is invalid or has expired.'));
  }

  const user = result.data.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) {
    redirect(withInviteParam('/login', inviteCode, 'error', 'Confirm your email, then sign in to continue.'));
  }

  if (inviteCode) {
    let outcome;
    try {
      outcome = await ensureJoinRequest(user.id, inviteCode);
    } catch {
      redirect(
        `${invitePath(inviteCode)}?error=${encodeURIComponent(
          'Your email is confirmed, but we could not send the join request. Please try again.',
        )}`,
      );
    }
    cookieStore.delete(PENDING_INVITE_COOKIE);

    if (outcome.status === 'approved') {
      redirect('/dashboard?joined=1');
    }
    if (outcome.status === 'rejected') {
      redirect(`${invitePath(inviteCode)}?rejected=true`);
    }
    redirect(`${invitePath(inviteCode)}?requested=true`);
  }

  redirect('/dashboard');
}
