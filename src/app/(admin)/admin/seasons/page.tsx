import { createServiceClient } from '@/lib/supabase/server';
import { createSeason, updateSeasonStatus, addSeasonParticipant, removeSeasonParticipant } from './actions';
import { getAdminContext } from '@/lib/admin/context';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Seasons | Admin' };

export const dynamic = 'force-dynamic';

export default async function SeasonsAdminPage() {
  const { selectedLeague, selectedSeason, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');
  const supabase = await createServiceClient();

  const { data: seasons } = selectedLeague
    ? await supabase
        .from('seasons')
        .select('id, name, status, season_type, api_football_league_id, api_football_season, created_at')
        .eq('league_id', selectedLeague.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  const { data: seasonParticipants } = selectedSeason
    ? await supabase
        .from('season_participants')
        .select('participant_id, participants!inner(id, display_name, is_offline)')
        .eq('season_id', selectedSeason.id)
    : { data: [] };

  const { data: allParticipants } = await supabase
    .from('participants')
    .select('id, display_name, is_offline')
    .order('display_name', { ascending: true });

  const enrolledIds = new Set((seasonParticipants ?? []).map((sp: any) => sp.participant_id));

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Seasons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedLeague ? `Manage seasons for ${selectedLeague.name}.` : 'Create a league before adding seasons.'}
        </p>
      </div>

      {selectedLeague && (
        <>
          {/* Existing seasons */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Seasons</h2>
            {!seasons?.length && (
              <p className="text-sm text-muted-foreground">No seasons yet for this league.</p>
            )}
            {seasons?.map((season) => (
              <div key={season.id} className={`rounded-lg border p-4 space-y-3 ${season.id === selectedSeason?.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{season.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {season.season_type !== 'production' && `[${season.season_type}] `}
                      API-Football: League {season.api_football_league_id ?? '—'} / Season {season.api_football_season ?? '—'}
                    </p>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    season.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    season.status === 'setup'   ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {season.status}
                  </span>
                </div>

                {/* Status transitions */}
                <div className="flex gap-2 flex-wrap">
                  {season.status === 'setup' && (
                    <form action={updateSeasonStatus.bind(null, season.id, 'active')}>
                      <button type="submit" className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                        Activate
                      </button>
                    </form>
                  )}
                  {season.status === 'active' && (
                    <form action={updateSeasonStatus.bind(null, season.id, 'completed')}>
                      <button type="submit" className="rounded border border-border px-3 py-1 text-xs hover:bg-accent">
                        Mark completed
                      </button>
                    </form>
                  )}
                  {(season.status === 'completed' || season.status === 'setup') && (
                    <form action={updateSeasonStatus.bind(null, season.id, 'archived')}>
                      <button type="submit" className="rounded border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">
                        Archive
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Create season */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Create New Season</h2>
            <form action={createSeason.bind(null, selectedLeague.id)} className="space-y-3 max-w-md">
              <div className="space-y-1">
                <label className="text-sm font-medium">Season name</label>
                <input name="name" type="text" required placeholder="2025/26" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">API-Football league ID</label>
                  <input name="api_football_league_id" type="number" placeholder="39" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Season year</label>
                  <input name="api_football_season" type="number" placeholder="2025" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Season type</label>
                <select name="season_type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="production">Production</option>
                  <option value="test">Test</option>
                  <option value="demo">Demo</option>
                </select>
              </div>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                Create Season
              </button>
            </form>
          </section>

          {/* Season participants */}
          {selectedSeason && (
            <section>
              <h2 className="text-lg font-semibold mb-1">
                Participants — {selectedSeason.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {enrolledIds.size} enrolled
              </p>
              <div className="space-y-1 max-w-md">
                {(allParticipants ?? []).map((p) => {
                  const enrolled = enrolledIds.has(p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <span className="text-sm">
                        {p.display_name}
                      </span>
                      {enrolled ? (
                        <form action={removeSeasonParticipant.bind(null, selectedSeason.id, p.id)}>
                          <button type="submit" className="text-xs text-destructive hover:underline">Remove</button>
                        </form>
                      ) : (
                        <form action={addSeasonParticipant.bind(null, selectedSeason.id, p.id)}>
                          <button type="submit" className="text-xs text-primary hover:underline">Add</button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
