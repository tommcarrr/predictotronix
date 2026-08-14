import { NextResponse, type NextRequest } from 'next/server';
import { requireLeagueAdminForSeason } from '@/lib/admin/authorization';
import { createSeasonWorkbook, type WorkbookGameweek, type WorkbookLeaderboardRow } from '@/lib/exports/season-workbook';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const seasonId = request.nextUrl.searchParams.get('seasonId');
  if (!seasonId) return new NextResponse('Missing seasonId', { status: 400 });
  try {
    await requireLeagueAdminForSeason(seasonId);
  } catch {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const supabase = await createServiceClient();
  const [seasonResult, gameweeksResult, fixturesResult, predictionsResult, standingsResult] = await Promise.all([
    supabase.from('seasons').select('id, name, leagues(name)').eq('id', seasonId).single(),
    supabase.from('gameweeks').select('id, label, gameweek_number, status').eq('season_id', seasonId).order('gameweek_number'),
    supabase.from('fixtures').select('id, gameweek_id, kickoff, home_team_name, away_team_name, status, home_score, away_score, result_confirmed').eq('season_id', seasonId).order('kickoff'),
    supabase.from('predictions').select('fixture_id, participant_id, home_score, away_score, points_awarded').eq('season_id', seasonId),
    supabase.rpc('get_season_leaderboard', { p_season_id: seasonId }),
  ]);
  const error = seasonResult.error ?? gameweeksResult.error ?? fixturesResult.error ?? predictionsResult.error ?? standingsResult.error;
  if (error) return new NextResponse(error.message, { status: 500 });

  const gameweeks = gameweeksResult.data ?? [];
  const weeklyResults = await Promise.all(gameweeks.map((gameweek) => supabase.rpc('get_gameweek_leaderboard', { p_gameweek_id: gameweek.id })));
  const weeklyError = weeklyResults.find((result) => result.error)?.error;
  if (weeklyError) return new NextResponse(weeklyError.message, { status: 500 });

  const season = seasonResult.data;
  if (!season) return new NextResponse('Season not found', { status: 404 });

  const fixtures = fixturesResult.data ?? [];
  const predictions = predictionsResult.data ?? [];
  const workbookGameweeks: WorkbookGameweek[] = gameweeks.map((gameweek, index) => {
    const weekFixtures = fixtures.filter((fixture) => fixture.gameweek_id === gameweek.id);
    const fixtureIds = new Set(weekFixtures.map((fixture) => fixture.id));
    return {
      label: gameweek.label ?? `Gameweek ${gameweek.gameweek_number}`,
      gameweekNumber: gameweek.gameweek_number,
      status: gameweek.status,
      fixtures: weekFixtures,
      predictions: predictions.filter((prediction) => fixtureIds.has(prediction.fixture_id)),
      standings: (weeklyResults[index].data ?? []) as WorkbookLeaderboardRow[],
    };
  });
  const league = Array.isArray(season.leagues) ? season.leagues[0] : season.leagues;
  const workbook = await createSeasonWorkbook({
    leagueName: league?.name ?? 'League', seasonName: season.name,
    standings: (standingsResult.data ?? []) as WorkbookLeaderboardRow[], gameweeks: workbookGameweeks,
  });
  const filename = `${season.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'season'}-export.xlsx`;
  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
