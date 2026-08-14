import { createServiceClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/admin/context';
import { FixtureSyncConsole } from '@/components/admin/FixtureSyncConsole';
import { AdminBadge, statusTone } from '@/components/admin/AdminBadge';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { FixtureClipboardExport, type FixtureExportGameweek } from '@/components/admin/FixtureClipboardExport';

export const metadata = { title: 'Fixtures & Results | Admin' };
export const dynamic = 'force-dynamic';

export default async function FixturesAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requestedTab } = await searchParams;
  const tab = requestedTab === 'sync' ? 'sync' : 'fixtures';
  const { selectedLeague, selectedSeason } = await getAdminContext();
  const supabase = await createServiceClient();

  const { data: fixtures } = selectedSeason
    ? await supabase
        .from('fixtures')
        .select(`
          id, home_team_name, away_team_name, kickoff, status,
          home_score, away_score, result_confirmed, last_synced_at,
          gameweeks(id, label, gameweek_number)
        `)
        .eq('season_id', selectedSeason.id)
        .order('kickoff', { ascending: false })
    : { data: [] };

  const canSync = Boolean(
    selectedSeason?.status === 'active' &&
    selectedSeason.season_type === 'production' &&
    selectedSeason.api_football_league_id &&
    selectedSeason.api_football_season,
  );
  const activeHref = tab === 'sync' ? '/admin/fixtures?tab=sync' : '/admin/fixtures';
  const fixtureExportGameweeks = new Map<string, FixtureExportGameweek>();

  for (const fixture of fixtures ?? []) {
    const gameweek = fixture.gameweeks as unknown as {
      id: string;
      label: string | null;
      gameweek_number: number;
    } | null;
    if (!gameweek) continue;

    const exportGameweek = fixtureExportGameweeks.get(gameweek.id) ?? {
      id: gameweek.id,
      label: gameweek.label ?? `Gameweek ${gameweek.gameweek_number}`,
      gameweekNumber: gameweek.gameweek_number,
      fixtures: [],
    };
    exportGameweek.fixtures.push({
      id: fixture.id,
      homeTeamName: fixture.home_team_name,
      awayTeamName: fixture.away_team_name,
      kickoff: fixture.kickoff,
    });
    fixtureExportGameweeks.set(gameweek.id, exportGameweek);
  }

  const exportGameweeks = [...fixtureExportGameweeks.values()].sort(
    (first, second) => second.gameweekNumber - first.gameweekNumber,
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <AdminPageHeader eyebrow="Run" title="Fixtures & results" description={`${selectedLeague?.name ?? 'No league'} · ${selectedSeason?.name ?? 'No season selected'}`} />
      <AdminTabs
        label="Fixtures and synchronisation"
        activeHref={activeHref}
        items={[{ href: '/admin/fixtures', label: 'Fixtures & results' }, { href: '/admin/fixtures?tab=sync', label: 'Sync' }]}
      />

      {!selectedSeason && <AdminNotice>Select or create a season to view fixtures.</AdminNotice>}
      {selectedSeason && tab === 'sync' && <FixtureSyncConsole seasonId={selectedSeason.id} canSync={canSync} />}
      {selectedSeason && tab === 'fixtures' && !(fixtures ?? []).length && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No fixtures have been added to this season yet. Use the Sync tab for a production season.
        </div>
      )}

      {selectedSeason && tab === 'fixtures' && exportGameweeks.length > 0 && (
        <FixtureClipboardExport gameweeks={exportGameweeks} />
      )}

      {selectedSeason && tab === 'fixtures' && (fixtures ?? []).length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Gameweek</th>
                <th className="px-4 py-3 font-semibold">Match</th>
                <th className="px-4 py-3 font-semibold">Kickoff</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Result</th>
                <th className="px-4 py-3 font-semibold">Last synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(fixtures ?? []).map((fixture) => (
                <tr key={fixture.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3 text-muted-foreground">
                    {(fixture.gameweeks as unknown as { label: string | null } | null)?.label ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium">{fixture.home_team_name} vs {fixture.away_team_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(fixture.kickoff).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AdminBadge tone={fixture.status === 'postponed' ? 'amber' : statusTone(fixture.status)}>{fixture.status}</AdminBadge>
                      {fixture.result_confirmed && <AdminBadge tone="green">Confirmed</AdminBadge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{fixture.home_score !== null ? `${fixture.home_score}–${fixture.away_score}` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {fixture.last_synced_at ? new Date(fixture.last_synced_at).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
