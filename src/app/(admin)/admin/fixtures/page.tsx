import { createServiceClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/admin/context';
import { redirect } from 'next/navigation';
import { FixtureSyncConsole } from '@/components/admin/FixtureSyncConsole';

export const metadata = { title: 'Fixtures & Results | Admin' };

export const dynamic = 'force-dynamic';

export default async function FixturesAdminPage() {
  const { selectedLeague, selectedSeason, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');
  const supabase = await createServiceClient();

  const { data: fixtures } = selectedSeason
    ? await supabase
        .from('fixtures')
        .select(`
          id, home_team_name, away_team_name, kickoff, status,
          home_score, away_score, result_confirmed, last_synced_at,
          gameweeks(label)
        `)
        .eq('season_id', selectedSeason.id)
        .order('kickoff', { ascending: false })
    : { data: [] };

  const canSync = Boolean(
    selectedSeason?.status === 'active' &&
    selectedSeason.season_type === 'production' &&
    selectedSeason.api_football_league_id &&
    selectedSeason.api_football_season
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fixtures & Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedLeague?.name ?? 'No league'} · {selectedSeason?.name ?? 'No season selected'}
          </p>
        </div>
      </div>

      {selectedSeason && <FixtureSyncConsole seasonId={selectedSeason.id} canSync={canSync} />}

      {!selectedSeason && (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Select or create a season to view fixtures.
        </p>
      )}

      {selectedSeason && !(fixtures ?? []).length && (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No fixtures have been added to this season yet.
        </p>
      )}

      {(fixtures ?? []).length > 0 && <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="text-left py-2 pr-4">Gameweek</th>
              <th className="text-left py-2 pr-4">Match</th>
              <th className="text-left py-2 pr-4">Kickoff</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2 pr-4">Result</th>
              <th className="text-left py-2">Last synced</th>
            </tr>
          </thead>
          <tbody>
            {(fixtures ?? []).map((f) => (
              <tr key={f.id} className="border-b border-border/50 hover:bg-accent/50">
                <td className="py-2 pr-4 text-muted-foreground">
                  {(f.gameweeks as any)?.label ?? '—'}
                </td>
                <td className="py-2 pr-4 font-medium">
                  {f.home_team_name} vs {f.away_team_name}
                </td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {new Date(f.kickoff).toLocaleString('en-GB', {
                    timeZone: 'Europe/London',
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                      f.status === 'finished'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : f.status === 'postponed'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {f.status}
                  </span>
                  {f.result_confirmed && (
                    <span className="ml-1 text-xs text-green-600 dark:text-green-400">✓</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {f.home_score !== null ? `${f.home_score}–${f.away_score}` : '—'}
                </td>
                <td className="py-2 text-muted-foreground text-xs">
                  {f.last_synced_at
                    ? new Date(f.last_synced_at).toLocaleString('en-GB', {
                        timeZone: 'Europe/London',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </main>
  );
}
