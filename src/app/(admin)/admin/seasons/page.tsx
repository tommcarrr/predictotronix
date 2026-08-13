import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/admin/context';
import { redirect } from 'next/navigation';
import { AdminBadge, statusTone } from '@/components/admin/AdminBadge';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const metadata = { title: 'Seasons | Admin' };
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ error?: string; seasonCreated?: string; seasonDeleted?: string }>;
};

export default async function SeasonsAdminPage({ searchParams }: Props) {
  const { error, seasonCreated, seasonDeleted } = await searchParams;
  const { selectedLeague, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');
  const supabase = await createServiceClient();

  const { data: seasons } = selectedLeague
    ? await supabase
        .from('seasons')
        .select('id, name, status, season_type, api_football_league_id, api_football_season, created_at')
        .eq('league_id', selectedLeague.id)
        .order('created_at', { ascending: false })
    : { data: [] };
  const seasonIds = (seasons ?? []).map((season) => season.id);
  const { data: participantRows } = seasonIds.length
    ? await supabase.from('season_participants').select('season_id').in('season_id', seasonIds)
    : { data: [] };
  const participantCounts = new Map<string, number>();
  for (const row of participantRows ?? []) {
    participantCounts.set(row.season_id, (participantCounts.get(row.season_id) ?? 0) + 1);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <AdminPageHeader
        eyebrow="Configure"
        title="Seasons"
        description={selectedLeague ? `Manage the season lifecycle for ${selectedLeague.name}.` : 'Select or create a league before adding a season.'}
        actions={selectedLeague && (
          <Link href="/admin/seasons/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="size-4" /> Create season
          </Link>
        )}
      />

      {error && <AdminNotice tone="danger" role="alert">{error}</AdminNotice>}
      {seasonCreated === '1' && <AdminNotice tone="success" role="status">Season created in setup.</AdminNotice>}
      {seasonDeleted === '1' && <AdminNotice tone="success" role="status">Season and its associated data deleted.</AdminNotice>}

      {!selectedLeague ? (
        <AdminNotice>Select a league from the workspace menu before creating a season.</AdminNotice>
      ) : !seasons?.length ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-semibold">No seasons yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a season to configure fixtures, participants and predictions.</p>
          <Link href="/admin/seasons/new" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Create the first season <ArrowRight className="size-4" />
          </Link>
        </section>
      ) : (
        <section className="space-y-3" aria-label="Seasons">
          {seasons.map((season) => {
            const participantCount = participantCounts.get(season.id) ?? 0;
            const sourceConfigured = Boolean(season.api_football_league_id && season.api_football_season);
            return (
              <article key={season.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{season.name}</h2>
                    <AdminBadge tone={statusTone(season.status)}>{season.status}</AdminBadge>
                    {season.season_type !== 'production' && <AdminBadge tone="purple">{season.season_type}</AdminBadge>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span>{participantCount} participant{participantCount === 1 ? '' : 's'}</span>
                    <span>{sourceConfigured ? 'Fixture source configured' : 'Fixture source incomplete'}</span>
                  </div>
                </div>
                <Link href={`/admin/seasons/${season.id}`} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  Manage season <ArrowRight className="size-4" />
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
