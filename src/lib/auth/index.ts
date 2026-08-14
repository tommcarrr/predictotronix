import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

/** Returns the authenticated user, or null if not logged in. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Returns true if the current user is a super admin. */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc('is_super_admin');
  return !!data;
}

/** Returns true if the current user has any administrative role. */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from('league_roles')
    .select('user_id')
    .eq('user_id', user.id)
    .in('role', ['super_admin', 'league_admin'])
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** Returns true if the current user is a league admin (or super admin) for the given league. */
export async function isLeagueAdmin(leagueId: string): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc('is_league_admin', { p_league_id: leagueId });
  return !!data;
}

/** Returns the participant record linked to the current user, or null. */
export async function getParticipant() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('participants')
    .select('*')
    .eq('user_id', user.id)
    .single();
  return data;
}

/** Returns true if the current user is enrolled in the given season. */
export async function isSeasonParticipant(seasonId: string): Promise<boolean> {
  const participant = await getParticipant();
  if (!participant) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from('season_participants')
    .select('id')
    .eq('season_id', seasonId)
    .eq('participant_id', participant.id)
    .maybeSingle();
  return !!data;
}

/**
 * Throws a redirect-safe error if the user is not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  return user;
}

/** Throws if the user is not a super admin. */
export async function requireSuperAdmin() {
  const user = await requireUser();
  const ok = await isSuperAdmin();
  if (!ok) throw new Error('FORBIDDEN');
  return user;
}

/** Throws if the user is not a league admin for the given league. */
export async function requireLeagueAdmin(leagueId: string) {
  const user = await requireUser();
  const ok = await isLeagueAdmin(leagueId);
  if (!ok) throw new Error('FORBIDDEN');
  return user;
}
