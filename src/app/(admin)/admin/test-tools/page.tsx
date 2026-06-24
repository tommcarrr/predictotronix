import { redirect } from 'next/navigation';
import { isSuperAdmin, getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { injectResult, markFixturePostponed, fastForwardGameweek } from './actions';

export const dynamic = 'force-dynamic';

export default async function TestToolsPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();

  // Only show test/demo seasons
  const { data: testSeasons } = await supabase
    .from('seasons')
    .select('id, name, season_type, league_id, leagues(name)')
    .in('season_type', ['test', 'demo'])
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const selectedSeasonId = testSeasons?.[0]?.id;

  const { data: fixtures } = selectedSeasonId
    ? await supabase
        .from('fixtures')
        .select('id, home_team_name, away_team_name, kickoff, status, home_score, away_score, result_confirmed, gameweeks(label)')
        .eq('season_id', selectedSeasonId)
        .order('kickoff', { ascending: true })
    : { data: [] };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <a href="/admin" className="text-sm text-muted-foreground hover:underline">← Admin</a>
        <h1 className="text-2xl font-bold mt-1">Test Season Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Only affects <strong>test</strong> and <strong>demo</strong> seasons. Production data is never modified here.
        </p>
      </div>

      {!testSeasons?.length ? (
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">
            No active test/demo seasons found.{' '}
            <a href="/admin/seasons" className="text-primary hover:underline">Create one first.</a>
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              ⚠️ Test mode active — notifications will be dry-run only (logged, not sent).
            </p>
          </div>

          {/* Fixtures table with inject result controls */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Fixtures — {(testSeasons[0] as any).leagues?.name} · {testSeasons[0].name}</h2>
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
                        {new Date(f.kickoff).toLocaleString('en-GB', {
                          timeZone: 'Europe/London',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
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
          </section>

          {/* Fast-forward a gameweek */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Fast-forward Gameweek</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Marks all unplayed fixtures in a gameweek as finished with randomised scores and scores all predictions.
            </p>
            <form action={fastForwardGameweek} className="flex gap-3 items-end max-w-sm">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Season</label>
                <select name="season_id" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {(testSeasons ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s as any).leagues?.name} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit"
                className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                Fast-forward next GW
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
