import { redirect } from 'next/navigation';
import { requireSuperAdmin, isSuperAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const isAdmin = await isSuperAdmin();
  if (!isAdmin) redirect('/dashboard');

  const supabase = await createServiceClient();

  // Overview stats
  const [
    { count: leagueCount },
    { count: participantCount },
    { count: pendingRequests },
    { data: recentSync },
  ] = await Promise.all([
    supabase.from('leagues').select('id', { count: 'exact', head: true }),
    supabase.from('participants').select('id', { count: 'exact', head: true }),
    supabase.from('join_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('fixtures')
      .select('last_synced_at')
      .not('last_synced_at', 'is', null)
      .order('last_synced_at', { ascending: false })
      .limit(1),
  ]);

  const lastSync = recentSync?.[0]?.last_synced_at
    ? new Date(recentSync[0].last_synced_at).toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Never';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Leagues', value: leagueCount ?? 0 },
          { label: 'Participants', value: participantCount ?? 0 },
          { label: 'Pending requests', value: pendingRequests ?? 0, highlight: (pendingRequests ?? 0) > 0 },
          { label: 'Last sync', value: lastSync, small: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border p-4 ${stat.highlight ? 'border-destructive bg-destructive/10' : 'border-border bg-card'}`}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            <p className={`mt-1 font-bold ${stat.small ? 'text-sm' : 'text-2xl'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[
          { href: '/admin/leagues', label: 'Leagues & Invite Links', desc: 'Manage leagues, generate invites' },
          { href: '/admin/seasons', label: 'Seasons', desc: 'Create and manage seasons, enrol participants' },
          { href: '/admin/participants', label: 'Participants', desc: 'Manage players, approve requests, add offline participants' },
          { href: '/admin/fixtures', label: 'Fixtures & Results', desc: 'Sync fixtures, correct results' },
          { href: '/admin/exports', label: 'Exports & Clipboard', desc: 'Copy leaderboards, fixture lists, reports' },
          { href: '/admin/test-tools', label: 'Test Season Tools', desc: 'Inject results, fast-forward gameweeks (test/demo seasons only)' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-lg border border-border p-4 hover:bg-accent transition-colors"
          >
            <p className="font-medium">{link.label}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{link.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
