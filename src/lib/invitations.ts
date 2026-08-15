import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
import { sendJoinRequestEmail } from '@/lib/notifications/email';
import type { Database } from '@/types/database';

export const PENDING_INVITE_COOKIE = 'predictotronix_pending_invite';

const INVITE_CODE_PATTERN = /^[a-zA-Z0-9_-]{6,128}$/;

export interface InviteLeague {
  id: string;
  name: string;
}

export type JoinRequestOutcome =
  | { status: 'pending'; league: InviteLeague; created: boolean }
  | { status: 'approved'; league: InviteLeague; created: false }
  | { status: 'rejected'; league: InviteLeague; created: false }
  | { status: 'invalid'; league: null; created: false };

export function normalizeInviteCode(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== 'string') return null;
  const code = value.trim();
  return INVITE_CODE_PATTERN.test(code) ? code : null;
}

export function invitePath(code: string) {
  return `/join/${encodeURIComponent(code)}`;
}

type InviteAuthRoute = '/login' | '/register' | '/forgot-password' | '/reset-password';

export function inviteAuthPath(route: InviteAuthRoute, code: string) {
  return `${route}?invite=${encodeURIComponent(code)}`;
}

export function withInviteParam(
  route: InviteAuthRoute,
  code: string | null,
  key: 'error' | 'message',
  value: string,
) {
  const params = new URLSearchParams({ [key]: value });
  if (code) params.set('invite', code);
  return `${route}?${params.toString()}`;
}

async function notifyLeagueAdmins(
  client: SupabaseClient<Database>,
  league: InviteLeague,
  userId: string,
) {
  const [{ data: roles, error: rolesError }, { data: applicant, error: applicantError }] = await Promise.all([
    client.from('league_roles').select('user_id').eq('league_id', league.id).eq('role', 'league_admin'),
    client.from('profiles').select('display_name, email').eq('id', userId).maybeSingle(),
  ]);

  if (rolesError || applicantError || !applicant || !roles?.length) {
    console.error('Unable to prepare join-request admin notification', {
      leagueId: league.id,
      userId,
      error: rolesError?.message ?? applicantError?.message ?? 'No league administrators found',
    });
    return;
  }

  const adminIds = [...new Set(roles.map((role) => role.user_id))];
  const { data: admins, error: adminsError } = await client
    .from('profiles')
    .select('id, display_name, email')
    .in('id', adminIds);

  if (adminsError || !admins?.length) {
    console.error('Unable to load league administrators for join-request notification', {
      leagueId: league.id,
      error: adminsError?.message ?? 'No administrator profiles found',
    });
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const reviewUrl = new URL('/admin/participants?tab=requests', appUrl).toString();
  const results = await Promise.all(admins.map((admin) => sendJoinRequestEmail({
    to: admin.email,
    adminDisplayName: admin.display_name,
    applicantDisplayName: applicant.display_name,
    applicantEmail: applicant.email,
    leagueName: league.name,
    reviewUrl,
    idempotencyKey: `join-request:${league.id}:${userId}:${admin.id}`,
  })));

  results.forEach((result, index) => {
    if (!result.success) {
      console.error('Unable to send join-request admin notification', {
        leagueId: league.id,
        adminId: admins[index].id,
        error: result.error,
      });
    }
  });
}

export async function getInviteLeague(rawCode: string | null | undefined): Promise<InviteLeague | null> {
  const code = normalizeInviteCode(rawCode);
  if (!code) return null;

  // Invite details must be visible before authentication, but the leagues table
  // itself remains protected by RLS. Resolve the small public DTO server-side.
  const supabase = createServiceClient();
  const { data: league, error } = await supabase
    .from('leagues')
    .select('id, name, invite_active')
    .eq('invite_code', code)
    .maybeSingle();

  if (error || !league?.invite_active) return null;
  return { id: league.id, name: league.name };
}

export async function ensureJoinRequest(
  userId: string,
  rawCode: string | null | undefined,
  client: SupabaseClient<Database> = createServiceClient(),
): Promise<JoinRequestOutcome> {
  const code = normalizeInviteCode(rawCode);
  if (!code) return { status: 'invalid', league: null, created: false };

  const { data: league, error: leagueError } = await client
    .from('leagues')
    .select('id, name, invite_active')
    .eq('invite_code', code)
    .maybeSingle();

  if (leagueError || !league?.invite_active) {
    return { status: 'invalid', league: null, created: false };
  }

  const inviteLeague = { id: league.id, name: league.name };
  const { data: existing, error: existingError } = await client
    .from('join_requests')
    .select('status')
    .eq('league_id', league.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) throw new Error('Unable to check your existing join request.');
  if (existing?.status === 'approved') {
    return { status: 'approved', league: inviteLeague, created: false };
  }
  if (existing?.status === 'pending') {
    return { status: 'pending', league: inviteLeague, created: false };
  }
  if (existing?.status === 'rejected') {
    return { status: 'rejected', league: inviteLeague, created: false };
  }

  const { error: insertError } = await client.from('join_requests').insert({
    league_id: league.id,
    user_id: userId,
    status: 'pending',
  });

  if (!insertError) {
    await notifyLeagueAdmins(client, inviteLeague, userId);
    return { status: 'pending', league: inviteLeague, created: true };
  }

  // A double-submit or two open tabs can race the unique constraint. Read the
  // canonical state rather than surfacing a database error to the player.
  const { data: racedRequest } = await client
    .from('join_requests')
    .select('status')
    .eq('league_id', league.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (racedRequest?.status === 'pending') {
    return { status: 'pending', league: inviteLeague, created: false };
  }
  if (racedRequest?.status === 'approved') {
    return { status: 'approved', league: inviteLeague, created: false };
  }
  if (racedRequest?.status === 'rejected') {
    return { status: 'rejected', league: inviteLeague, created: false };
  }

  throw new Error('Unable to send your join request. Please try again.');
}
