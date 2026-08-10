import { createServiceClient } from '@/lib/supabase/server';
import { approveJoinRequest, rejectJoinRequest, createOfflineParticipant } from './actions';
import { getAdminContext } from '@/lib/admin/context';

export const metadata = { title: 'Participants | Admin' };

export const dynamic = 'force-dynamic';

export default async function ParticipantsAdminPage() {
  const { selectedLeague, selectedSeason } = await getAdminContext();
  const supabase = await createServiceClient();

  const { data: pendingRequests } = selectedLeague
    ? await supabase
      .from('join_requests')
      .select(`
        id, status, created_at,
        user_id,
        leagues!inner(id, name)
      `)
      .eq('status', 'pending')
      .eq('league_id', selectedLeague.id)
      .order('created_at', { ascending: true })
    : { data: [] };

  const { data: seasonParticipants } = selectedSeason
    ? await supabase
      .from('season_participants')
      .select(`
        participant_id,
        participants!inner(id, display_name, email, is_offline, created_at)
      `)
      .eq('season_id', selectedSeason.id)
    : { data: [] };

  const participants = (seasonParticipants ?? [])
    .map((row: any) => row.participants)
    .filter(Boolean)
    .sort((a: any, b: any) => a.display_name.localeCompare(b.display_name));

  // Fetch profiles for pending request users (no direct FK between join_requests and profiles)
  const requestUserIds = (pendingRequests ?? []).map((r: any) => r.user_id);
  const { data: requestProfiles } = requestUserIds.length
    ? await supabase.from('profiles').select('id, display_name, email').in('id', requestUserIds)
    : { data: [] };
  const profileMap = Object.fromEntries((requestProfiles ?? []).map((p: any) => [p.id, p]));

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Participants</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests for {selectedLeague?.name ?? 'the selected league'}; enrolment for {selectedSeason?.name ?? 'no selected season'}.
        </p>
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
                    {profileMap[req.user_id]?.display_name ?? profileMap[req.user_id]?.email ?? req.user_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {req.leagues?.name} — requested{' '}
                    {new Date(req.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveJoinRequest.bind(null, req.id, req.user_id, req.leagues?.id, selectedSeason?.id ?? '')}>
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
          {!participants.length && (
            <p className="mb-3 text-sm text-muted-foreground">No participants are enrolled in this season.</p>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Email</th>
                <th className="text-left py-2 pr-4">Type</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p: any) => (
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
        <form action={createOfflineParticipant} className="flex max-w-2xl flex-wrap gap-3">
          <input type="hidden" name="season_id" value={selectedSeason?.id ?? ''} />
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
            disabled={!selectedSeason}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 whitespace-nowrap disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </section>
    </main>
  );
}
