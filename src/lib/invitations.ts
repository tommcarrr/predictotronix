import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
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
