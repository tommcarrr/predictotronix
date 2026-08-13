'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth';
import {
  ADMIN_LEAGUE_COOKIE,
  ADMIN_SEASON_COOKIE,
  ADMIN_VIEW_AS_LEAGUE_COOKIE,
  getAdminContext,
} from '@/lib/admin/context';
import { createServiceClient } from '@/lib/supabase/server';

const viewAsCookieOptions = {
  httpOnly: true,
  path: '/admin',
  sameSite: 'lax' as const,
};

const cookieOptions = {
  ...viewAsCookieOptions,
  maxAge: 60 * 60 * 24 * 365,
};

export async function setAdminLeague(formData: FormData) {
  const leagueId = formData.get('league_id');
  if (typeof leagueId !== 'string') return;

  const context = await getAdminContext();
  if (!context.leagues.some((league) => league.id === leagueId)) return;

  const supabase = await createServiceClient();
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, status')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false });
  const nextSeason =
    seasons?.find((season) => season.status === 'active') ?? seasons?.[0] ?? null;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_LEAGUE_COOKIE, leagueId, cookieOptions);
  if (nextSeason) {
    cookieStore.set(ADMIN_SEASON_COOKIE, nextSeason.id, cookieOptions);
  } else {
    cookieStore.delete(ADMIN_SEASON_COOKIE);
  }
  revalidatePath('/admin', 'layout');
}

export async function setAdminSeason(formData: FormData) {
  const seasonId = formData.get('season_id');
  if (typeof seasonId !== 'string') return;

  const context = await getAdminContext();
  if (!context.seasons.some((season) => season.id === seasonId)) return;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SEASON_COOKIE, seasonId, cookieOptions);
  revalidatePath('/admin', 'layout');
}

export async function viewAsLeagueAdmin(formData: FormData) {
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const leagueId = formData.get('league_id');
  if (typeof leagueId !== 'string') return;

  const supabase = await createServiceClient();
  const { data: league } = await supabase
    .from('leagues')
    .select('id')
    .eq('id', leagueId)
    .maybeSingle();
  if (!league) return;

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, status')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false });
  const nextSeason =
    seasons?.find((season) => season.status === 'active') ?? seasons?.[0] ?? null;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_VIEW_AS_LEAGUE_COOKIE, leagueId, viewAsCookieOptions);
  cookieStore.set(ADMIN_LEAGUE_COOKIE, leagueId, cookieOptions);
  if (nextSeason) {
    cookieStore.set(ADMIN_SEASON_COOKIE, nextSeason.id, cookieOptions);
  } else {
    cookieStore.delete(ADMIN_SEASON_COOKIE);
  }

  redirect('/admin/participants');
}

export async function stopViewingAsLeagueAdmin() {
  if (!(await isSuperAdmin())) redirect('/dashboard');

  (await cookies()).set(ADMIN_VIEW_AS_LEAGUE_COOKIE, '', {
    ...viewAsCookieOptions,
    maxAge: 0,
  });
  redirect('/admin/leagues');
}
