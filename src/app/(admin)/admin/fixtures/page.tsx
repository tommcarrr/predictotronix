import { redirect } from 'next/navigation';
import { isSuperAdmin, getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { triggerFixtureSync, triggerResultSync } from './actions';

export const dynamic = 'force-dynamic';

export default async function FixturesAdminPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select(`
      id, home_team_name, away_team_name, kickoff, status,
      home_score, away_score, result_confirmed, last_synced_at,
      gameweeks(label)
    `)
    .order('kickoff', { ascending: false })
    .limit(50);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <a href="/admin" className="text-sm text-muted-foreground hover:underline">
            ← Admin
          </a>
          <h1 className="text-2xl font-bold mt-1">Fixtures & Results</h1>
        </div>
        <div className="flex gap-2">
          <form action={triggerFixtureSync}>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Sync Fixtures
            </button>
          </form>
          <form action={triggerResultSync}>
            <button
              type="submit"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Sync Results
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-x-auto">
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
      </div>
    </div>
  );
}
