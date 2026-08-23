import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireLeagueAdminForSeason } from '@/lib/admin/authorization';
import {
  formatLeaderboard,
  leaderboardBeforeLatestGameweek,
  type ExportLeaderboardRow,
  type LeaderboardExportFormat,
} from '@/lib/exports/leaderboard';

const validFormats = new Set<LeaderboardExportFormat>(['text', 'markdown', 'html', 'csv']);

function contentType(format: LeaderboardExportFormat) {
  if (format === 'html') return 'text/html; charset=utf-8';
  if (format === 'csv') return 'text/csv; charset=utf-8';
  if (format === 'markdown') return 'text/markdown; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const seasonId = searchParams.get('seasonId');
  const gameweekId = searchParams.get('gameweekId');
  const requestedFormat = searchParams.get('format') ?? 'text';
  const format: LeaderboardExportFormat = validFormats.has(
    requestedFormat as LeaderboardExportFormat
  )
    ? (requestedFormat as LeaderboardExportFormat)
    : 'text';

  if (!seasonId) {
    return new NextResponse('Missing seasonId', { status: 400 });
  }

  try {
    await requireLeagueAdminForSeason(seasonId);
  } catch {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const supabase = await createServiceClient();
  if (gameweekId) {
    const { data: gameweek } = await supabase
      .from('gameweeks')
      .select('id')
      .eq('id', gameweekId)
      .eq('season_id', seasonId)
      .maybeSingle();
    if (!gameweek) return new NextResponse('Gameweek not found', { status: 404 });
  }
  const { data, error } = gameweekId
    ? await supabase.rpc('get_gameweek_leaderboard', { p_gameweek_id: gameweekId })
    : await supabase.rpc('get_season_leaderboard', { p_season_id: seasonId });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  let previousPositions: Map<string, number> | undefined;
  if (!gameweekId) {
    const { data: startedGameweeks, error: gameweeksError } = await supabase
      .from('gameweeks')
      .select('id, gameweek_number')
      .eq('season_id', seasonId)
      .neq('status', 'upcoming')
      .order('gameweek_number', { ascending: true });
    if (gameweeksError) return new NextResponse(gameweeksError.message, { status: 500 });

    const started = startedGameweeks ?? [];
    if (started.length > 1) {
      const latestGameweek = started.at(-1)!;
      const latestResult = await supabase.rpc('get_gameweek_leaderboard', {
        p_gameweek_id: latestGameweek.id,
      });
      if (latestResult.error) {
        return new NextResponse(latestResult.error.message, { status: 500 });
      }

      const previousTable = leaderboardBeforeLatestGameweek(
        (data ?? []) as ExportLeaderboardRow[],
        (latestResult.data ?? []) as ExportLeaderboardRow[]
      );
      previousPositions = new Map(
        previousTable.map((row) => [row.participant_id, row.position])
      );
    }
  }

  const formatted = formatLeaderboard(
    (data ?? []) as ExportLeaderboardRow[],
    format,
    gameweekId ? 'gameweek' : 'season',
    previousPositions
  );
  return new NextResponse(formatted, {
    headers: {
      'Content-Type': contentType(format),
      'Cache-Control': 'private, no-store',
    },
  });
}
