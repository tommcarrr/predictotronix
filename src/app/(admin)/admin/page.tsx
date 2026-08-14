import { createServiceClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/admin/context';
import Link from 'next/link';

export const metadata = { title: 'Admin' };

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { selectedLeague, selectedSeason } = await getAdminContext();
  const supabase = await createServiceClient();

  if (!selectedLeague) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Create a league to start managing seasons, participants and fixtures.
        </p>
        <Link href="/admin/leagues" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Create a league
        </Link>
      </main>
    );
  }

  const [
    { count: seasonCount },
    { count: participantCount },
    { count: pendingRequests },
    { data: recentSync },
  ] = await Promise.all([
    supabase.from('seasons').select('id', { count: 'exact', head: true }).eq('league_id', selectedLeague.id),
    selectedSeason
      ? supabase.from('season_participants').select('participant_id', { count: 'exact', head: true }).eq('season_id', selectedSeason.id)
      : Promise.resolve({ count: 0 }),
    supabase.from('join_requests').select('id', { count: 'exact', head: true }).eq('league_id', selectedLeague.id).eq('status', 'pending'),
    selectedSeason
      ? supabase.from('fixtures').select('last_synced_at').eq('season_id', selectedSeason.id).not('last_synced_at', 'is', null).order('last_synced_at', { ascending: false }).limit(1)
      : Promise.resolve({ data: [] }),
  ]);

  const lastSync = recentSync?.[0]?.last_synced_at
    ? new Date(recentSync[0].last_synced_at).toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Never';

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedLeague.name}
          {selectedSeason ? ` · ${selectedSeason.name}` : ' · No season selected'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Seasons', value: seasonCount ?? 0, href: '/admin/seasons' },
          { label: 'Enrolled', value: participantCount ?? 0, href: '/admin/participants' },
          { label: 'Pending requests', value: pendingRequests ?? 0, highlight: (pendingRequests ?? 0) > 0, href: '/admin/participants?tab=requests' },
          { label: 'Last sync', value: lastSync, small: true, href: '/admin/fixtures?tab=sync' },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-lg border p-4 ${stat.highlight ? 'border-destructive bg-destructive/10' : 'border-border bg-card'}`}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            <p className={`mt-1 font-bold ${stat.small ? 'text-sm' : 'text-2xl'}`}>{stat.value}</p>
            <p className="mt-2 text-xs font-medium text-primary">View details</p>
          </Link>
        ))}
      </div>

      {!selectedSeason && (
        <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
          This league has no seasons yet. <Link href="/admin/seasons/new" className="text-primary hover:underline">Create one on the Seasons page.</Link>
        </div>
      )}
    </main>
  );
}
