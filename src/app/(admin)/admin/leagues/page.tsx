import { createServiceClient } from '@/lib/supabase/server';
import { createLeague, regenerateInviteCode } from './actions';
import { getAdminContext } from '@/lib/admin/context';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Leagues | Admin' };

export const dynamic = 'force-dynamic';

export default async function LeaguesAdminPage() {
  const { selectedLeague, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');
  const supabase = await createServiceClient();

  const { data: leagues } = selectedLeague
    ? await supabase
        .from('leagues')
        .select(`
          id, name, slug, invite_code, invite_active, created_at,
          seasons(id, name, status, season_type)
        `)
        .eq('id', selectedLeague.id)
    : { data: [] };

  // Pending join requests per league
  const { data: pendingCounts } = await supabase
    .from('join_requests')
    .select('league_id')
    .eq('status', 'pending')
    .eq('league_id', selectedLeague?.id ?? '');

  const pendingByLeague = new Map<string, number>();
  for (const r of pendingCounts ?? []) {
    pendingByLeague.set(r.league_id, (pendingByLeague.get(r.league_id) ?? 0) + 1);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">League settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedLeague ? `Invite links and seasons for ${selectedLeague.name}.` : 'Create your first league.'}
        </p>
      </div>

      {/* Existing leagues */}
      <section className="space-y-4">
        {!leagues?.length && (
          <p className="text-sm text-muted-foreground">No leagues yet.</p>
        )}
        {leagues?.map((league) => {
          const pending = pendingByLeague.get(league.id) ?? 0;
          const inviteUrl = `${appUrl}/join/${league.invite_code}`;
          return (
            <div key={league.id} className="rounded-lg border border-border p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg">{league.name}</h2>
                  <p className="text-xs text-muted-foreground">/{league.slug}</p>
                </div>
                {pending > 0 && (
                  <a
                    href="/admin/participants"
                    className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-medium text-destructive-foreground"
                  >
                    {pending} pending
                  </a>
                )}
              </div>

              {/* Seasons */}
              <div className="flex flex-wrap gap-2">
                {((league as any).seasons ?? []).map((s: any) => (
                  <a
                    key={s.id}
                    href="/admin/seasons"
                    className="rounded px-2 py-0.5 text-xs bg-muted text-muted-foreground hover:bg-accent"
                  >
                    {s.name} · {s.status}
                    {s.season_type !== 'production' && ` (${s.season_type})`}
                  </a>
                ))}
                <a
                  href="/admin/seasons"
                  className="rounded px-2 py-0.5 text-xs border border-dashed border-border text-muted-foreground hover:bg-accent"
                >
                  + New season
                </a>
              </div>

              {/* Invite link */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Invite link {!league.invite_active && '(inactive)'}
                </p>
                <div className="flex items-center gap-2">
                  <code
                    className={`flex-1 rounded bg-muted px-3 py-1.5 text-xs break-all ${!league.invite_active ? 'opacity-50' : ''}`}
                  >
                    {inviteUrl}
                  </code>
                  <form action={regenerateInviteCode.bind(null, league.id)}>
                    <button
                      type="submit"
                      className="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent whitespace-nowrap"
                    >
                      Regenerate
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Create league */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Create New League</h2>
        <form action={createLeague} className="space-y-3 max-w-md">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              League name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Premier League Predictors"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug (URL-safe identifier)
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              placeholder="pl-predictors"
              pattern="[a-z0-9-]+"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Create League
          </button>
        </form>
      </section>
    </main>
  );
}
