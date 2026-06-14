import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/auth';

type Format = 'text' | 'markdown' | 'html' | 'csv';

interface LeaderboardRow {
  position: number;
  display_name: string;
  total_points: number;
  exact_count: number;
  predictions_submitted: number;
}

function formatLeaderboard(rows: LeaderboardRow[], format: Format): string {
  if (!rows.length) return 'No data.';

  if (format === 'csv') {
    const header = 'Position,Player,Points,Exact,Predictions';
    const body = rows.map(
      (r) =>
        `${r.position},"${r.display_name}",${r.total_points},${r.exact_count},${r.predictions_submitted}`
    );
    return [header, ...body].join('\n');
  }

  if (format === 'markdown') {
    const header = '| Pos | Player | Pts | ★ | P |\n|-----|--------|-----|---|---|';
    const body = rows.map(
      (r) =>
        `| ${r.position} | ${r.display_name} | ${r.total_points} | ${r.exact_count} | ${r.predictions_submitted} |`
    );
    return [header, ...body].join('\n');
  }

  if (format === 'html') {
    const header = `<table>
  <thead><tr><th>Pos</th><th>Player</th><th>Pts</th><th>Exact</th><th>P</th></tr></thead>
  <tbody>`;
    const body = rows
      .map(
        (r) =>
          `    <tr><td>${r.position}</td><td>${r.display_name}</td><td>${r.total_points}</td><td>${r.exact_count}</td><td>${r.predictions_submitted}</td></tr>`
      )
      .join('\n');
    return `${header}\n${body}\n  </tbody>\n</table>`;
  }

  // Plain text
  const maxName = Math.max(...rows.map((r) => r.display_name.length), 10);
  const lines = rows.map(
    (r) =>
      `${String(r.position).padStart(3)}. ${r.display_name.padEnd(maxName + 2)} ${String(
        r.total_points
      ).padStart(4)} pts   ${r.exact_count} exact   ${r.predictions_submitted} scored`
  );
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const seasonId = searchParams.get('seasonId');
  const format = (searchParams.get('format') ?? 'text') as Format;

  if (!seasonId) {
    return new NextResponse('Missing seasonId', { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase.rpc('get_season_leaderboard', {
    p_season_id: seasonId,
  });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const formatted = formatLeaderboard(data ?? [], format);
  return new NextResponse(formatted, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
