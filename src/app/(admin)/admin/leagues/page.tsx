import { createServiceClient } from '@/lib/supabase/server';
import { assignLeagueAdmin, createLeague, deleteLeague, regenerateInviteCode } from './actions';
import { getAdminContext } from '@/lib/admin/context';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Leagues | Admin' };

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ error?: string; adminAssigned?: string; leagueDeleted?: string }>;
};

export default async function LeaguesAdminPage({ searchParams }: Props) {
  const { error, adminAssigned, leagueDeleted } = await searchParams;
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

  const { data: profiles } = selectedLeague
    ? await supabase.from('profiles').select('id, display_name, email').order('display_name')
    : { data: [] };

  const { data: leagueAdmins } = selectedLeague
    ? await supabase
        .from('league_roles')
        .select('user_id')
        .eq('league_id', selectedLeague.id)
        .eq('role', 'league_admin')
    : { data: [] };

  const adminIds = new Set((leagueAdmins ?? []).map((role) => role.user_id));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const missingAdminProfileIds = [...adminIds].filter((id) => !profileById.has(id));
  const missingAdminUsers = await Promise.all(
    missingAdminProfileIds.map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      return [id, data.user] as const;
    }),
  );
  const authUserById = new Map(missingAdminUsers);
  const currentAdmins = [...adminIds]
    .map((id) => {
      const profile = profileById.get(id);
      const authUser = authUserById.get(id);
      const email = profile?.email ?? authUser?.email ?? null;
      const metadataDisplayName = authUser?.user_metadata?.display_name;
      const displayName =
        profile?.display_name ??
        (typeof metadataDisplayName === 'string' && metadataDisplayName.trim()
          ? metadataDisplayName.trim()
          : null) ??
        email?.split('@')[0] ??
        'Unknown user';

      return { id, displayName, email };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const adminCandidates = (profiles ?? []).filter((profile) => !adminIds.has(profile.id));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">League settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedLeague ? `Invite links and seasons for ${selectedLeague.name}.` : 'Create your first league.'}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {adminAssigned === '1' && (
        <p role="status" className="rounded-md border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          League admin assigned.
        </p>
      )}
      {leagueDeleted === '1' && (
        <p role="status" className="rounded-md border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          League and its associated data deleted.
        </p>
      )}

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

              <div className="border-t border-destructive/20 pt-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Permanent deletion is available only when every season is archived.
                </p>
                <form action={deleteLeague.bind(null, league.id)} className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`delete-league-${league.id}`}>
                    Enter {league.name} to confirm deletion
                  </label>
                  <input
                    id={`delete-league-${league.id}`}
                    name="confirmation"
                    required
                    placeholder={`Type ${league.name} to confirm`}
                    autoComplete="off"
                    className="min-w-64 flex-1 rounded border border-destructive/50 bg-background px-3 py-1.5 text-xs"
                  />
                  <button type="submit" className="rounded bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90">
                    Delete league permanently
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </section>

      {selectedLeague && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">League admins</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Assign registered users to administer {selectedLeague.name}.
            </p>
          </div>

          {currentAdmins.length ? (
            <ul className="space-y-2">
              {currentAdmins.map((admin) => (
                <li key={admin.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <span className="font-medium">{admin.displayName}</span>
                  {admin.email && admin.email !== admin.displayName && (
                    <span className="ml-2 text-muted-foreground">{admin.email}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No league admins are assigned.</p>
          )}

          <form action={assignLeagueAdmin} className="flex max-w-2xl flex-wrap items-end gap-3">
            <input type="hidden" name="league_id" value={selectedLeague.id} />
            <div className="min-w-64 flex-1 space-y-1">
              <label htmlFor="league-admin-user" className="text-sm font-medium">
                Registered user
              </label>
              <select
                id="league-admin-user"
                name="user_id"
                required
                disabled={!adminCandidates.length}
                defaultValue=""
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="" disabled>
                  {adminCandidates.length ? 'Select a user' : 'All registered users are already admins'}
                </option>
                {adminCandidates.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.display_name ?? profile.email ?? 'Unknown user'}
                    {profile.display_name && profile.email ? ` (${profile.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!adminCandidates.length}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Assign admin
            </button>
          </form>
        </section>
      )}

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
