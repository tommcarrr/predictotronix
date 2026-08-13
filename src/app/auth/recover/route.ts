import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inviteAuthPath, normalizeInviteCode, withInviteParam } from '@/lib/invitations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const inviteCode = normalizeInviteCode(request.nextUrl.searchParams.get('invite'));

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type === 'recovery'
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { data: { user: null }, error: new Error('Missing recovery token') };

  if (result.error) {
    redirect(
      withInviteParam(
        '/forgot-password',
        inviteCode,
        'error',
        'This password reset link is invalid or has expired. Request a new one.'
      )
    );
  }

  const user = result.data.user ?? (await supabase.auth.getUser()).data.user;
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

  redirect(inviteCode ? inviteAuthPath('/reset-password', inviteCode) : '/reset-password');
}
