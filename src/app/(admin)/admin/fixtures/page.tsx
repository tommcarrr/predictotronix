import { createServiceClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/admin/context';
import { getSeasonNow } from '@/lib/clock';
import { FixtureSyncConsole } from '@/components/admin/FixtureSyncConsole';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import {
  FixtureClipboardExport,
  type FixtureExportGameweek,
} from '@/components/admin/FixtureClipboardExport';

export const metadata = { title: 'Fixtures & Results | Admin' };
export const dynamic = 'force-dynamic';

export default async function FixturesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: requestedTab } = await searchParams;
  const tab = requestedTab === 'sync' ? 'sync' : 'fixtures';
  const { selectedLeague, selectedSeason } = await getAdminContext();
  const supabase = await createServiceClient();
  const seasonNow = selectedSeason ? await getSeasonNow(supabase, selectedSeason.id) : new Date();

  const { data: fixtures } = selectedSeason
    ? await supabase
        .from('fixtures')
        .select(
          `
          id, home_team_name, away_team_name, kickoff, status,
          home_score, away_score, result_confirmed, last_synced_at,
          gameweeks(id, label, gameweek_number)
        `
        )
        .eq('season_id', selectedSeason.id)
        .order('kickoff', { ascending: false })
    : { data: [] };

  const canSync = Boolean(
    selectedSeason?.status === 'active' &&
    selectedSeason.season_type === 'production' &&
    selectedSeason.api_football_league_id &&
    selectedSeason.api_football_season
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
      status: fixture.status,
      homeScore: fixture.home_score,
      awayScore: fixture.away_score,
      resultConfirmed: fixture.result_confirmed,
      lastSyncedAt: fixture.last_synced_at,
    });
    fixtureExportGameweeks.set(gameweek.id, exportGameweek);
  }

  const exportGameweeks = [...fixtureExportGameweeks.values()].sort(
    (first, second) => second.gameweekNumber - first.gameweekNumber
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <AdminPageHeader
        eyebrow="Run"
        title="Fixtures & results"
        description={`${selectedLeague?.name ?? 'No league'} · ${selectedSeason?.name ?? 'No season selected'}`}
      />
      <AdminTabs
        label="Fixtures and synchronisation"
        activeHref={activeHref}
        items={[
          { href: '/admin/fixtures', label: 'Fixtures & results' },
          { href: '/admin/fixtures?tab=sync', label: 'Sync' },
        ]}
      />

      {!selectedSeason && <AdminNotice>Select or create a season to view fixtures.</AdminNotice>}
      {selectedSeason && tab === 'sync' && (
        <FixtureSyncConsole seasonId={selectedSeason.id} canSync={canSync} />
      )}
      {selectedSeason && tab === 'fixtures' && !(fixtures ?? []).length && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No fixtures have been added to this season yet. Use the Sync tab for a production season.
        </div>
      )}

      {selectedSeason && tab === 'fixtures' && exportGameweeks.length > 0 && (
        <FixtureClipboardExport gameweeks={exportGameweeks} now={seasonNow.toISOString()} />
      )}
    </main>
  );
}
