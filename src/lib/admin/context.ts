import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUser, isSuperAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export const ADMIN_LEAGUE_COOKIE = 'predictotronix_admin_league';
export const ADMIN_SEASON_COOKIE = 'predictotronix_admin_season';

export const getAdminContext = cache(async () => {
  const user = await getUser();
  if (!user) redirect('/login');

  const supabase = await createServiceClient();
  const superAdmin = await isSuperAdmin();

  let accessibleLeagueIds: string[] | null = null;
  if (!superAdmin) {
    const { data: roles } = await supabase
      .from('league_roles')
      .select('league_id')
      .eq('user_id', user.id)
      .eq('role', 'league_admin');

    accessibleLeagueIds = (roles ?? [])
      .map((role) => role.league_id)
      .filter((id): id is string => Boolean(id));

    if (!accessibleLeagueIds.length) redirect('/dashboard');
  }

  let leaguesQuery = supabase
    .from('leagues')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (accessibleLeagueIds) {
    leaguesQuery = leaguesQuery.in('id', accessibleLeagueIds);
  }

  const { data: leagues } = await leaguesQuery;
  const leagueList = leagues ?? [];
  const cookieStore = await cookies();
  const requestedLeagueId = cookieStore.get(ADMIN_LEAGUE_COOKIE)?.value;
  const selectedLeague =
    leagueList.find((league) => league.id === requestedLeagueId) ?? leagueList[0] ?? null;

  const { data: seasons } = selectedLeague
    ? await supabase
        .from('seasons')
        .select('id, name, status, season_type, league_id, api_football_league_id, api_football_season, created_at')
        .eq('league_id', selectedLeague.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  const seasonList = seasons ?? [];
  const requestedSeasonId = cookieStore.get(ADMIN_SEASON_COOKIE)?.value;
  const selectedSeason =
    seasonList.find((season) => season.id === requestedSeasonId) ??
    seasonList.find((season) => season.status === 'active') ??
    seasonList[0] ??
    null;

  return {
    user,
    superAdmin,
    leagues: leagueList,
    seasons: seasonList,
    selectedLeague,
    selectedSeason,
  };
});

export type AdminContext = Awaited<ReturnType<typeof getAdminContext>>;
