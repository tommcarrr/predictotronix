import { NextResponse, type NextRequest } from 'next/server';
import { requireLeagueAdminForGameweek } from '@/lib/admin/authorization';
import {
  createCompletedGameweekWorkbook,
  type GameweekWorkbookFixture,
  type GameweekWorkbookPrediction,
} from '@/lib/exports/gameweek-workbook';
import type { WorkbookLeaderboardRow } from '@/lib/exports/season-workbook';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function filenamePart(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const gameweekId = request.nextUrl.searchParams.get('gameweekId');
  if (!gameweekId) return new NextResponse('Missing gameweekId', { status: 400 });

  let seasonId: string;
  try {
    ({ seasonId } = await requireLeagueAdminForGameweek(gameweekId));
  } catch {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const supabase = await createServiceClient();
  const gameweekResult = await supabase
    .from('gameweeks')
    .select('id, season_id, label, gameweek_number, status')
    .eq('id', gameweekId)
    .eq('season_id', seasonId)
    .maybeSingle();

  if (gameweekResult.error) {
    return new NextResponse(gameweekResult.error.message, { status: 500 });
  }
  const gameweek = gameweekResult.data;
  if (!gameweek) return new NextResponse('Gameweek not found', { status: 404 });
  if (gameweek.status !== 'completed') {
    return new NextResponse('Gameweek analysis is available after the gameweek is completed', {
      status: 409,
    });
  }

  const [seasonResult, fixturesResult, standingsResult] = await Promise.all([
    supabase.from('seasons').select('id, name, leagues(name)').eq('id', seasonId).single(),
    supabase
      .from('fixtures')
      .select(
        'id, kickoff, home_team_name, away_team_name, status, home_score, away_score, result_confirmed'
      )
      .eq('gameweek_id', gameweekId)
      .order('kickoff'),
    supabase.rpc('get_gameweek_leaderboard', { p_gameweek_id: gameweekId }),
  ]);
  const initialError = seasonResult.error ?? fixturesResult.error ?? standingsResult.error;
  if (initialError) return new NextResponse(initialError.message, { status: 500 });

  const fixtures = (fixturesResult.data ?? []) as GameweekWorkbookFixture[];
  const fixtureIds = fixtures.map((fixture) => fixture.id);
  const predictionsResult = fixtureIds.length
    ? await supabase
        .from('predictions')
        .select(
          'fixture_id, participant_id, home_score, away_score, points_awarded, points_reason, is_admin_entered'
        )
        .in('fixture_id', fixtureIds)
    : { data: [] as GameweekWorkbookPrediction[], error: null };
  if (predictionsResult.error) {
    return new NextResponse(predictionsResult.error.message, { status: 500 });
  }

  const season = seasonResult.data;
  if (!season) return new NextResponse('Season not found', { status: 404 });
  const league = Array.isArray(season.leagues) ? season.leagues[0] : season.leagues;
  const label = gameweek.label ?? `Gameweek ${gameweek.gameweek_number}`;
  const workbook = await createCompletedGameweekWorkbook({
    leagueName: league?.name ?? 'League',
    seasonName: season.name,
    gameweekLabel: label,
    gameweekNumber: gameweek.gameweek_number,
    fixtures,
    predictions: (predictionsResult.data ?? []) as GameweekWorkbookPrediction[],
    standings: (standingsResult.data ?? []) as WorkbookLeaderboardRow[],
  });
  const filename = `${filenamePart(label) || `gameweek-${gameweek.gameweek_number}`}-analysis.xlsx`;

  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
