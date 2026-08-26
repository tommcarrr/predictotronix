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
import { CronJobStatusPanel, type CronJobRunStatus } from '@/components/admin/CronJobStatusPanel';
import { CRON_JOBS } from '@/lib/cron/jobs';
import {
  FixtureOutcomeView,
  type FixtureOutcomeGameweek,
} from '@/components/admin/FixtureOutcomeView';
import {
  getActiveFixtureOutcomePrediction,
  type FixtureOutcomePrediction,
} from '@/lib/admin/fixture-outcomes';

export const metadata = { title: 'Fixtures & Results | Admin' };
export const dynamic = 'force-dynamic';

export default async function FixturesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: requestedTab } = await searchParams;
  const tab = requestedTab === 'sync' || requestedTab === 'outcomes' ? requestedTab : 'fixtures';
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

  const [predictionResult, participantResult] =
    selectedSeason && tab === 'outcomes'
      ? await Promise.all([
          supabase
            .from('predictions')
            .select('fixture_id, participant_id, home_score, away_score, points_reason')
            .eq('season_id', selectedSeason.id)
            .in('points_reason', ['exact', 'correct_result']),
          supabase
            .from('season_participants')
            .select('participant_id, participants!inner(display_name)')
            .eq('season_id', selectedSeason.id),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

  const cronRunResults =
    tab === 'sync'
      ? await Promise.all(
          CRON_JOBS.map((job) =>
            supabase
              .from('cron_job_runs')
              .select(
                'id, job_name, status, started_at, finished_at, duration_ms, summary, error_details'
              )
              .eq('job_name', job.id)
              .order('started_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          )
        )
      : [];
  const cronRuns = cronRunResults
    .map(({ data }) => data)
    .filter((run): run is NonNullable<typeof run> => Boolean(run)) as CronJobRunStatus[];
  const cronLoadError = cronRunResults.find(({ error }) => error)?.error?.message;

  const canSync = Boolean(
    selectedSeason?.status === 'active' &&
    selectedSeason.season_type === 'production' &&
    selectedSeason.api_football_league_id &&
    selectedSeason.api_football_season
  );
  const activeHref =
    tab === 'sync'
      ? '/admin/fixtures?tab=sync'
      : tab === 'outcomes'
        ? '/admin/fixtures?tab=outcomes'
        : '/admin/fixtures';
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
    (first, second) => first.gameweekNumber - second.gameweekNumber
  );
  const participantNames = new Map(
    (participantResult.data ?? []).map((row: any) => [
      row.participant_id,
      row.participants.display_name as string,
    ])
  );
  const predictionsByFixture = new Map<
    string,
    { exactScores: FixtureOutcomePrediction[]; correctResults: FixtureOutcomePrediction[] }
  >();

  for (const prediction of predictionResult.data ?? []) {
    const outcomePrediction = getActiveFixtureOutcomePrediction(prediction, participantNames);
    if (!outcomePrediction) continue;

    const outcomes = predictionsByFixture.get(prediction.fixture_id) ?? {
      exactScores: [],
      correctResults: [],
    };
    if (prediction.points_reason === 'exact') outcomes.exactScores.push(outcomePrediction);
    if (prediction.points_reason === 'correct_result')
      outcomes.correctResults.push(outcomePrediction);
    predictionsByFixture.set(prediction.fixture_id, outcomes);
  }

  const outcomeGameweeks: FixtureOutcomeGameweek[] = exportGameweeks
    .map((gameweek) => ({
      id: gameweek.id,
      label: gameweek.label,
      gameweekNumber: gameweek.gameweekNumber,
      fixtures: gameweek.fixtures
        .filter(
          (fixture) =>
            fixture.resultConfirmed && fixture.homeScore !== null && fixture.awayScore !== null
        )
        .sort((first, second) => second.kickoff.localeCompare(first.kickoff))
        .map((fixture) => {
          const outcomes = predictionsByFixture.get(fixture.id) ?? {
            exactScores: [],
            correctResults: [],
          };
          return {
            id: fixture.id,
            homeTeamName: fixture.homeTeamName,
            awayTeamName: fixture.awayTeamName,
            kickoff: fixture.kickoff,
            homeScore: fixture.homeScore!,
            awayScore: fixture.awayScore!,
            exactScores: outcomes.exactScores.sort((first, second) =>
              first.displayName.localeCompare(second.displayName)
            ),
            correctResults: outcomes.correctResults.sort((first, second) =>
              first.displayName.localeCompare(second.displayName)
            ),
          };
        }),
    }))
    .filter((gameweek) => gameweek.fixtures.length > 0)
    .sort((first, second) => second.gameweekNumber - first.gameweekNumber);

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
          { href: '/admin/fixtures?tab=outcomes', label: 'Prediction outcomes' },
          { href: '/admin/fixtures?tab=sync', label: 'Sync' },
        ]}
      />

      {!selectedSeason && <AdminNotice>Select or create a season to view fixtures.</AdminNotice>}
      {tab === 'sync' && <CronJobStatusPanel runs={cronRuns} loadError={cronLoadError} />}
      {selectedSeason && tab === 'sync' && (
        <FixtureSyncConsole seasonId={selectedSeason.id} canSync={canSync} />
      )}
      {selectedSeason &&
        tab === 'outcomes' &&
        (predictionResult.error || participantResult.error) && (
          <AdminNotice tone="danger" role="alert">
            Prediction outcomes could not be loaded. Please refresh and try again.
          </AdminNotice>
        )}
      {selectedSeason &&
        tab === 'outcomes' &&
        !predictionResult.error &&
        !participantResult.error && <FixtureOutcomeView gameweeks={outcomeGameweeks} />}
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
