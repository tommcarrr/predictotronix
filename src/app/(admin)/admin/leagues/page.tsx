import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import { createLeague } from './actions';
import { getAdminContext } from '@/lib/admin/context';
import { redirect } from 'next/navigation';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminDialog } from '@/components/admin/AdminDialog';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const metadata = { title: 'Leagues | Admin' };
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ error?: string; leagueCreated?: string; leagueDeleted?: string }>;
};

export default async function LeaguesAdminPage({ searchParams }: Props) {
  const { error, leagueCreated, leagueDeleted } = await searchParams;
  const { superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');
  const supabase = await createServiceClient();

  const [{ data: leagues }, { data: pendingRequests }, { data: adminRoles }] = await Promise.all([
    supabase
      .from('leagues')
      .select('id, name, slug, invite_active, created_at, seasons(id, name, status, season_type)')
      .order('name'),
    supabase.from('join_requests').select('league_id').eq('status', 'pending'),
    supabase.from('league_roles').select('league_id').eq('role', 'league_admin'),
  ]);

  const pendingByLeague = new Map<string, number>();
  for (const request of pendingRequests ?? []) {
    if (!request.league_id) continue;
    pendingByLeague.set(request.league_id, (pendingByLeague.get(request.league_id) ?? 0) + 1);
  }

  const adminsByLeague = new Map<string, number>();
  for (const role of adminRoles ?? []) {
    if (!role.league_id) continue;
    adminsByLeague.set(role.league_id, (adminsByLeague.get(role.league_id) ?? 0) + 1);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <AdminPageHeader
        eyebrow="Configure"
        title="Leagues"
        description="Choose a league to manage its invitations, administrators and deletion settings."
        actions={
          <AdminDialog
            trigger={<><Plus className="size-4" />Create league</>}
            title="Create a league"
            description="A league is the top-level workspace for seasons and participants."
          >
            <form action={createLeague} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="new-league-name" className="text-sm font-medium">League name</label>
                <input
                  id="new-league-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Premier League Predictors"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="new-league-slug" className="text-sm font-medium">URL identifier</label>
                <input
                  id="new-league-slug"
                  name="slug"
                  type="text"
                  required
                  pattern="[a-z0-9-]+"
                  placeholder="pl-predictors"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
                <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens only.</p>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Create league
                </button>
              </div>
            </form>
          </AdminDialog>
        }
      />

      {error && <AdminNotice tone="danger" role="alert">{error}</AdminNotice>}
      {leagueCreated === '1' && <AdminNotice tone="success" role="status">League created.</AdminNotice>}
      {leagueDeleted === '1' && <AdminNotice tone="success" role="status">League and its associated data deleted.</AdminNotice>}

      {!leagues?.length ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-semibold">No leagues yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create the first league to begin configuring seasons.</p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="League directory">
          {leagues.map((league) => {
            const seasons = league.seasons ?? [];
            const activeSeason = seasons.find((season) => season.status === 'active');
            const setupSeasons = seasons.filter((season) => season.status === 'setup').length;
            const pending = pendingByLeague.get(league.id) ?? 0;

            return (
              <article key={league.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{league.name}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">/{league.slug}</p>
                  </div>
                  <AdminBadge tone={league.invite_active ? 'green' : 'neutral'}>
                    Invite {league.invite_active ? 'active' : 'inactive'}
                  </AdminBadge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {activeSeason ? <AdminBadge tone="green">{activeSeason.name} active</AdminBadge> : <AdminBadge>No active season</AdminBadge>}
                  {setupSeasons > 0 && <AdminBadge tone="blue">{setupSeasons} in setup</AdminBadge>}
                  {pending > 0 && <AdminBadge tone="amber">{pending} pending request{pending === 1 ? '' : 's'}</AdminBadge>}
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Seasons</dt>
                    <dd className="mt-0.5 font-semibold">{seasons.length}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Administrators</dt>
                    <dd className="mt-0.5 font-semibold">{adminsByLeague.get(league.id) ?? 0}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex justify-end">
                  <Link href={`/admin/leagues/${league.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    Manage league <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
