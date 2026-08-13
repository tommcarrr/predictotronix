import { createServiceClient } from '@/lib/supabase/server';
import { getSeasonNow } from '@/lib/clock';
import { getEnvironmentPolicy } from '@/lib/environment';
import { getAdminContext } from '@/lib/admin/context';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import {
  clearSeasonClock,
  fastForwardGameweek,
  injectResult,
  markFixturePostponed,
  setSeasonClock,
} from './actions';

export const metadata = { title: 'Test Season Tools | Admin' };

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ tab?: string; error?: string; clock?: string }>;
}

function formatLondonDate(value: Date | string) {
  return new Date(value).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default async function TestToolsPage({ searchParams }: Props) {
  const query = await searchParams;
  const tab = query.tab === 'fixtures' || query.tab === 'gameweek' ? query.tab : 'clock';
  const { selectedLeague, selectedSeason, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');
  const supabase = await createServiceClient();

  const isTestSeason = Boolean(
    selectedSeason &&
    ['test', 'demo'].includes(selectedSeason.season_type) &&
    selectedSeason.status === 'active'
  );
  const selectedSeasonId = isTestSeason ? selectedSeason?.id : undefined;

  const { data: fixtures } = selectedSeasonId
    ? await supabase
        .from('fixtures')
        .select('id, home_team_name, away_team_name, kickoff, status, home_score, away_score, result_confirmed, gameweeks(label)')
        .eq('season_id', selectedSeasonId)
        .order('kickoff', { ascending: true })
    : { data: [] };

  const { data: gameweeks } = selectedSeasonId
    ? await supabase
        .from('gameweeks')
        .select('id, gameweek_number, label, status, first_kickoff')
        .eq('season_id', selectedSeasonId)
        .order('gameweek_number', { ascending: true })
    : { data: [] };

  const { data: clockSetting } = selectedSeasonId
    ? await supabase
        .from('season_runtime_settings')
        .select('simulated_now, updated_at')
        .eq('season_id', selectedSeasonId)
        .maybeSingle()
    : { data: null };

  const seasonNow = selectedSeasonId
    ? await getSeasonNow(supabase, selectedSeasonId)
    : new Date();
  const stagingClockEnabled = getEnvironmentPolicy().appEnvironment === 'staging';

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <AdminPageHeader
        eyebrow="System"
        title="Test season tools"
        description={
          <>
          {selectedLeague?.name ?? 'No league'} · {selectedSeason?.name ?? 'No season selected'}. Only active <strong>test</strong> and <strong>demo</strong> seasons can be modified here.
          </>
        }
      />

      {query.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {query.error}
        </div>
      )}
      {query.clock && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          Season clock {query.clock === 'cleared' ? 'returned to real time' : 'updated'}.
        </div>
      )}

      {!isTestSeason ? (
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Select an active test or demo season in the shared season selector above.{' '}
            <Link href="/admin/seasons" className="text-primary hover:underline">Manage seasons.</Link>
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AdminBadge tone="amber">Test mode</AdminBadge>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Notifications will be dry-run only (logged, not sent).</p>
          </div>

          <AdminTabs
            label="Test season tools"
            activeHref={tab === 'clock' ? '/admin/test-tools' : `/admin/test-tools?tab=${tab}`}
            items={[
              { href: '/admin/test-tools', label: 'Clock' },
              { href: '/admin/test-tools?tab=fixtures', label: 'Fixture simulation' },
              { href: '/admin/test-tools?tab=gameweek', label: 'Gameweek' },
            ]}
          />

          {tab === 'clock' && <section className="rounded-lg border border-border p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Simulated season clock</h2>
              <p className="text-sm text-muted-foreground">
                Current season time: <strong>{formatLondonDate(seasonNow)}</strong>{' '}
                ({clockSetting?.simulated_now ? 'simulated' : 'real time'}). Prediction locks and reminders use this value.
              </p>
              {!stagingClockEnabled && (
                <p className="mt-2 text-sm text-destructive">
                  Clock controls are disabled unless APP_ENV is staging and the staging Supabase project guard matches.
                </p>
              )}
            </div>

            <form action={setSeasonClock} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="season_id" value={selectedSeasonId} />
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="gameweek_id">Gameweek</label>
                <select id="gameweek_id" name="gameweek_id" required disabled={!stagingClockEnabled}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50">
                  {(gameweeks ?? []).map((gameweek) => (
                    <option key={gameweek.id} value={gameweek.id}>
                      {gameweek.label ?? `Gameweek ${gameweek.gameweek_number}`} — {gameweek.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="position">Test moment</label>
                <select id="position" name="position" defaultValue="in_progress" disabled={!stagingClockEnabled}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50">
                  <option value="before">24 hours before kickoff</option>
                  <option value="in_progress">1 hour after first kickoff</option>
                  <option value="after">3 hours after last kickoff</option>
                </select>
              </div>
              <button type="submit" disabled={!stagingClockEnabled || !gameweeks?.length}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                Set clock
              </button>
            </form>

            {clockSetting?.simulated_now && (
              <form action={clearSeasonClock}>
                <input type="hidden" name="season_id" value={selectedSeasonId} />
                <button type="submit" disabled={!stagingClockEnabled}
                  className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50">
                  Return to real time
                </button>
              </form>
            )}
          </section>}

          {/* Fixtures table with inject result controls */}
          {tab === 'fixtures' && <section>
            <h2 className="text-lg font-semibold mb-3">Fixtures — {selectedLeague?.name} · {selectedSeason?.name}</h2>
            <div className="space-y-2">
              {(fixtures ?? []).map((f: any) => (
                <div key={f.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {f.home_team_name} vs {f.away_team_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {f.gameweeks?.label} ·{' '}
                        {formatLondonDate(f.kickoff)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        f.result_confirmed ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        f.status === 'postponed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {f.result_confirmed ? `${f.home_score}–${f.away_score} ✓` : f.status}
                      </span>
                    </div>
                  </div>

                  {!f.result_confirmed && f.status !== 'postponed' && (
                    <div className="flex flex-wrap gap-2 items-end">
                      {/* Inject result form */}
                      <form action={injectResult.bind(null, f.id)} className="flex items-end gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Home</label>
                          <input name="home_score" type="number" min="0" max="20" defaultValue="0"
                            className="w-14 rounded border border-border bg-background px-2 py-1 text-sm text-center" />
                        </div>
                        <span className="text-muted-foreground pb-1">–</span>
                        <div>
                          <label className="text-xs text-muted-foreground">Away</label>
                          <input name="away_score" type="number" min="0" max="20" defaultValue="0"
                            className="w-14 rounded border border-border bg-background px-2 py-1 text-sm text-center" />
                        </div>
                        <button type="submit"
                          className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
                          Inject result &amp; score
                        </button>
                      </form>

                      <form action={markFixturePostponed.bind(null, f.id)}>
                        <button type="submit"
                          className="rounded border border-yellow-400 px-3 py-1.5 text-xs text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                          Mark postponed
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>}

          {/* Fast-forward a gameweek */}
          {tab === 'gameweek' && <section>
            <h2 className="text-lg font-semibold mb-3">Fast-forward Gameweek</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Marks all unplayed fixtures in a gameweek as finished with randomised scores and scores all predictions.
            </p>
            <form action={fastForwardGameweek} className="flex items-end gap-3">
              <input type="hidden" name="season_id" value={selectedSeasonId} />
              <button type="submit"
                className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                Fast-forward next GW
              </button>
            </form>
          </section>}
        </>
      )}
    </main>
  );
}
