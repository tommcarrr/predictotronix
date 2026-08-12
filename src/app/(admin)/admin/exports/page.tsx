import { ExportPanel, type GameweekStandings, type LeaderboardRow } from '@/components/admin/ExportPanel';
import { getAdminContext } from '@/lib/admin/context';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Standings | Admin' };

export const dynamic = 'force-dynamic';

export default async function ExportsAdminPage() {
  const { selectedLeague, selectedSeason, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');

  let seasonRows: LeaderboardRow[] = [];
  let gameweekStandings: GameweekStandings[] = [];

  if (selectedSeason) {
    const supabase = await createServiceClient();
    const [seasonResult, gameweeksResult] = await Promise.all([
      supabase.rpc('get_season_leaderboard', { p_season_id: selectedSeason.id }),
      supabase
        .from('gameweeks')
        .select('id, label, gameweek_number, status')
        .eq('season_id', selectedSeason.id)
        .neq('status', 'upcoming')
        .order('gameweek_number', { ascending: false }),
    ]);

    seasonRows = (seasonResult.data ?? []) as LeaderboardRow[];
    const gameweeks = gameweeksResult.data ?? [];
    const scores = await Promise.all(
      gameweeks.map((gameweek) =>
        supabase.rpc('get_gameweek_leaderboard', { p_gameweek_id: gameweek.id })
      )
    );

    gameweekStandings = gameweeks.map((gameweek, index) => ({
      id: gameweek.id,
      label: gameweek.label ?? `Gameweek ${gameweek.gameweek_number}`,
      gameweekNumber: gameweek.gameweek_number,
      status: gameweek.status,
      rows: (scores[index].data ?? []) as LeaderboardRow[],
    }));
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 py-6 sm:p-6 sm:py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">League performance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Standings & scores</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Follow the overall table and review every player’s gameweek performance.
          </p>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {selectedLeague?.name ?? 'No league'} <span className="mx-1 text-border">/</span> {selectedSeason?.name ?? 'No season'}
        </p>
      </div>

      {selectedSeason ? (
        <ExportPanel
          key={selectedSeason.id}
          seasonId={selectedSeason.id}
          seasonRows={seasonRows}
          gameweeks={gameweekStandings}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-medium">Select a season to view standings</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose a league and season from the controls above.</p>
        </div>
      )}
    </main>
  );
}
