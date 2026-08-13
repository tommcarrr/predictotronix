import Link from 'next/link';
import { ArrowLeft, Archive, CheckCircle2, Play, Trash2, Users } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/admin/context';
import { AdminBadge, statusTone } from '@/components/admin/AdminBadge';
import { AdminDialog } from '@/components/admin/AdminDialog';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { deleteSeason, updateSeasonStatus } from '../actions';

export const dynamic = 'force-dynamic';

type SeasonTab = 'overview' | 'danger';

export default async function SeasonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ seasonId: string }>;
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const { seasonId } = await params;
  const query = await searchParams;
  const { superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');
  const tab: SeasonTab = query.tab === 'danger' ? 'danger' : 'overview';
  const supabase = await createServiceClient();

  const { data: season } = await supabase
    .from('seasons')
    .select('id, league_id, name, status, season_type, api_football_league_id, api_football_season, created_at')
    .eq('id', seasonId)
    .maybeSingle();
  if (!season) notFound();
  const [{ data: league }, { count: participantCount }] = await Promise.all([
    supabase.from('leagues').select('name').eq('id', season.league_id).maybeSingle(),
    supabase.from('season_participants').select('participant_id', { count: 'exact', head: true }).eq('season_id', seasonId),
  ]);
  const basePath = `/admin/seasons/${seasonId}`;
  const activeHref = tab === 'overview' ? basePath : `${basePath}?tab=danger`;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <Link href="/admin/seasons" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Seasons
      </Link>
      <AdminPageHeader
        eyebrow={league?.name ?? 'Season'}
        title={season.name}
        description={<div className="flex flex-wrap gap-2"><AdminBadge tone={statusTone(season.status)}>{season.status}</AdminBadge><AdminBadge tone={season.season_type === 'production' ? 'neutral' : 'purple'}>{season.season_type}</AdminBadge></div>}
      />
      {query.error && <AdminNotice tone="danger" role="alert">{query.error}</AdminNotice>}

      <AdminTabs
        label="Season settings"
        activeHref={activeHref}
        items={[{ href: basePath, label: 'Overview' }, { href: `${basePath}?tab=danger`, label: 'Danger zone' }]}
      />

      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Configuration</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Participants</dt><dd className="mt-1 text-xl font-bold">{participantCount ?? 0}</dd></div>
              <div className="rounded-xl bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">API-Football league</dt><dd className="mt-1 text-xl font-bold">{season.api_football_league_id ?? '—'}</dd></div>
              <div className="rounded-xl bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">API-Football season</dt><dd className="mt-1 text-xl font-bold">{season.api_football_season ?? '—'}</dd></div>
              <div className="rounded-xl bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 font-semibold">{new Date(season.created_at).toLocaleDateString('en-GB')}</dd></div>
            </dl>
            <Link href="/admin/participants" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Users className="size-4" /> Manage people</Link>
          </section>

          <section className="h-fit rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Lifecycle</h2>
            <p className="mt-1 text-sm text-muted-foreground">Only the actions valid for the current state are shown.</p>
            <div className="mt-4 space-y-2">
              {season.status === 'setup' && (
                <form action={updateSeasonStatus.bind(null, seasonId, 'active')}>
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"><Play className="size-4" /> Activate season</button>
                </form>
              )}
              {season.status === 'active' && (
                <form action={updateSeasonStatus.bind(null, seasonId, 'completed')}>
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"><CheckCircle2 className="size-4" /> Mark completed</button>
                </form>
              )}
              {(season.status === 'setup' || season.status === 'completed') && (
                <AdminDialog trigger={<><Archive className="size-4" />Archive season</>} title={`Archive ${season.name}?`} description="Archived seasons can no longer become active." tone="secondary" triggerClassName="w-full">
                  <form action={updateSeasonStatus.bind(null, seasonId, 'archived')} className="space-y-4">
                    <p className="text-sm text-muted-foreground">Standings and historical data remain available.</p>
                    <div className="flex justify-end"><button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Archive season</button></div>
                  </form>
                </AdminDialog>
              )}
              {season.status === 'archived' && <AdminNotice>This season is archived. Permanent deletion is available in Danger zone.</AdminNotice>}
            </div>
          </section>
        </div>
      )}

      {tab === 'danger' && (
        <section className="max-w-3xl rounded-2xl border border-destructive/35 bg-destructive/5 p-5">
          <h2 className="text-lg font-semibold text-destructive">Delete season</h2>
          <p className="mt-1 text-sm text-muted-foreground">The season must be archived first. Deletion permanently removes its fixtures, predictions and scores.</p>
          <div className="mt-4">
            <AdminDialog trigger={<><Trash2 className="size-4" />Delete season</>} title={`Delete ${season.name}?`} description="This action cannot be undone." tone="danger">
              <form action={deleteSeason.bind(null, seasonId)} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="delete-season-confirmation" className="text-sm font-medium">Type <strong>{season.name}</strong> to confirm</label>
                  <input id="delete-season-confirmation" name="confirmation" required autoComplete="off" className="w-full rounded-lg border border-destructive/50 bg-background px-3 py-2.5 text-sm" />
                </div>
                <div className="flex justify-end"><button type="submit" className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">Delete permanently</button></div>
              </form>
            </AdminDialog>
          </div>
        </section>
      )}
    </main>
  );
}
