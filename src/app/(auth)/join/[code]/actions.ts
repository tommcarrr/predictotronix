'use server';

import { requireUser } from '@/lib/auth';
import { ensureJoinRequest, invitePath, normalizeInviteCode } from '@/lib/invitations';
import { redirect } from 'next/navigation';

export async function submitJoinRequest(rawInviteCode: string) {
  const user = await requireUser();
  const inviteCode = normalizeInviteCode(rawInviteCode);
  if (!inviteCode) redirect('/login?error=This+invite+link+is+invalid');

  let outcome;
  try {
    outcome = await ensureJoinRequest(user.id, inviteCode);
  } catch {
    redirect(`${invitePath(inviteCode)}?error=${encodeURIComponent('Unable to send your request. Please try again.')}`);
  }

  if (outcome.status === 'approved') {
    redirect('/dashboard?joined=1');
  }
  if (outcome.status === 'rejected') {
    redirect(`${invitePath(inviteCode)}?rejected=true`);
  }
  if (outcome.status === 'invalid') {
    redirect(invitePath(inviteCode));
  }

  redirect(`${invitePath(inviteCode)}?requested=true`);
}
