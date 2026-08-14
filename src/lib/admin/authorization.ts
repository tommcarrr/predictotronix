import { requireLeagueAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

function notFound(resource: string): never {
  throw new Error(`${resource.toUpperCase()}_NOT_FOUND`);
}

export async function requireLeagueAdminForSeason(seasonId: string) {
  const supabase = await createServiceClient();
  const { data: season } = await supabase
    .from('seasons')
    .select('id, league_id')
    .eq('id', seasonId)
    .maybeSingle();

  if (!season) notFound('season');
  const user = await requireLeagueAdmin(season.league_id);
  return { user, leagueId: season.league_id, seasonId: season.id };
}

export async function requireLeagueAdminForGameweek(gameweekId: string) {
  const supabase = await createServiceClient();
  const { data: gameweek } = await supabase
    .from('gameweeks')
    .select('id, season_id')
    .eq('id', gameweekId)
    .maybeSingle();

  if (!gameweek) notFound('gameweek');
  const authorization = await requireLeagueAdminForSeason(gameweek.season_id);
  return { ...authorization, gameweekId: gameweek.id };
}

export async function requireLeagueAdminForFixture(fixtureId: string) {
  const supabase = await createServiceClient();
  const { data: fixture } = await supabase
    .from('fixtures')
    .select('id, season_id')
    .eq('id', fixtureId)
    .maybeSingle();

  if (!fixture) notFound('fixture');
  const authorization = await requireLeagueAdminForSeason(fixture.season_id);
  return { ...authorization, fixtureId: fixture.id };
}

export async function requireLeagueAdminForFixtures(fixtureIds: string[]) {
  const uniqueFixtureIds = [...new Set(fixtureIds)];
  if (!uniqueFixtureIds.length) throw new Error('FIXTURES_REQUIRED');

  const supabase = await createServiceClient();
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('id, season_id')
    .in('id', uniqueFixtureIds);

  if (!fixtures || fixtures.length !== uniqueFixtureIds.length) notFound('fixture');
  const seasonIds = [...new Set(fixtures.map((fixture) => fixture.season_id))];
  if (seasonIds.length !== 1) throw new Error('FIXTURES_MUST_SHARE_SEASON');

  return requireLeagueAdminForSeason(seasonIds[0]);
}
