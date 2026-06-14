import { redirect } from 'next/navigation';
import { isSuperAdmin, isLeagueAdmin, getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { approveJoinRequest, rejectJoinRequest, createOfflineParticipant } from './actions';

export default async function ParticipantsAdminPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const supabase = await createServiceClient();

  // Get leagues this user admins
  const { data: adminLeagues } = await supabase
    .from('league_roles')
    .select('league_id, leagues(id, name)')
    .eq('user_id', user.id)
    .in('role', ['super_admin', 'league_admin']);

  const leagueIds = (adminLeagues ?? [])
    .map((r: any) => r.leagues?.id)
    .filter(Boolean) as string[];

  if (leagueIds.length === 0 && !(await isSuperAdmin())) redirect('/dashboard');

  // All leagues for a super admin
  const effectiveLeagueIds = (await isSuperAdmin())
    ? ((await supabase.from('leagues').select('id')).data ?? []).map((l: any) => l.id)
    : leagueIds;

  const [{ data: pendingRequests }, { data: participants }] = await Promise.all([
    supabase
      .from('join_requests')
      .select(`
        id, status, created_at,
        user_id,
        leagues!inner(id, name),
        profiles(display_name, email)
      `)
      .eq('status', 'pending')
      .in('league_id', effectiveLeagueIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('participants')
      .select(`
        id, display_name, email, is_offline, created_at,
        profiles:user_id(display_name, email)
      `)
      .order('display_name', { ascending: true })
      .limit(100),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <a href="/admin" className="text-sm text-muted-foreground hover:underline">
          ← Admin
        </a>
        <h1 className="text-2xl font-bold mt-1">Participants</h1>
      </div>

      {/* Pending join requests */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Pending Requests
          {(pendingRequests?.length ?? 0) > 0 && (
            <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
              {pendingRequests!.length}
            </span>
          )}
        </h2>
        {!pendingRequests?.length ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map((req: any) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-medium">
                    {req.profiles?.display_name ?? req.profiles?.email ?? req.user_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {req.leagues?.name} — requested{' '}
                    {new Date(req.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveJoinRequest.bind(null, req.id, req.user_id, req.leagues?.id)}>
                    <button
                      type="submit"
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectJoinRequest.bind(null, req.id)}>
                    <button
                      type="submit"
                      className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All participants */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">All Participants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Email</th>
                <th className="text-left py-2 pr-4">Type</th>
              </tr>
            </thead>
            <tbody>
              {(participants ?? []).map((p: any) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">{p.display_name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{p.email ?? '—'}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        p.is_offline
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {p.is_offline ? 'offline' : 'registered'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add offline participant */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Add Offline Participant</h2>
        <form action={createOfflineParticipant} className="flex gap-3 max-w-md">
          <input
            name="display_name"
            type="text"
            required
            placeholder="Display name"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Email (optional)"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 whitespace-nowrap"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
