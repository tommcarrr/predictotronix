import Link from 'next/link';
import { ArrowLeft, ExternalLink, RefreshCw, ShieldPlus, Trash2 } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/admin/context';
import { AdminBadge, statusTone } from '@/components/admin/AdminBadge';
import { AdminDialog } from '@/components/admin/AdminDialog';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { assignLeagueAdmin, deleteLeague, regenerateInviteCode, toggleInviteActive } from '../actions';

export const dynamic = 'force-dynamic';

type LeagueTab = 'overview' | 'invites' | 'admins' | 'danger';

export default async function LeagueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ tab?: string; error?: string; adminAssigned?: string }>;
}) {
  const { leagueId } = await params;
  const query = await searchParams;
  const { superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');
  const tab: LeagueTab = ['overview', 'invites', 'admins', 'danger'].includes(query.tab ?? '')
    ? query.tab as LeagueTab
    : 'overview';

  const supabase = await createServiceClient();
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, slug, invite_code, invite_active, created_at, seasons(id, name, status, season_type)')
    .eq('id', leagueId)
    .maybeSingle();
  if (!league) notFound();

  const [{ data: pendingRequests }, { data: profiles }, { data: leagueAdmins }] = await Promise.all([
    supabase.from('join_requests').select('id').eq('league_id', leagueId).eq('status', 'pending'),
    supabase.from('profiles').select('id, display_name, email').order('display_name'),
    supabase.from('league_roles').select('user_id').eq('league_id', leagueId).eq('role', 'league_admin'),
  ]);

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
      const displayName = profile?.display_name ??
        (typeof metadataDisplayName === 'string' && metadataDisplayName.trim() ? metadataDisplayName.trim() : null) ??
        email?.split('@')[0] ?? 'Unknown user';
      return { id, displayName, email };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const adminCandidates = (profiles ?? []).filter((profile) => !adminIds.has(profile.id));
  const seasons = league.seasons ?? [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/join/${league.invite_code}`;
  const basePath = `/admin/leagues/${leagueId}`;
  const activeHref = tab === 'overview' ? basePath : `${basePath}?tab=${tab}`;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <Link href="/admin/leagues" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All leagues
      </Link>
      <AdminPageHeader
        eyebrow="League"
        title={league.name}
        description={<>/{league.slug} · Created {new Date(league.created_at).toLocaleDateString('en-GB')}</>}
      />

      {query.error && <AdminNotice tone="danger" role="alert">{query.error}</AdminNotice>}
      {query.adminAssigned === '1' && <AdminNotice tone="success" role="status">League administrator assigned.</AdminNotice>}

      <AdminTabs
        label="League settings"
        activeHref={activeHref}
        items={[
          { href: basePath, label: 'Overview' },
          { href: `${basePath}?tab=invites`, label: 'Invites' },
          { href: `${basePath}?tab=admins`, label: 'Admins' },
          { href: `${basePath}?tab=danger`, label: 'Danger zone' },
        ]}
      />

      {tab === 'overview' && (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seasons</p>
            <p className="mt-2 text-3xl font-bold">{seasons.length}</p>
            <Link href="/admin/seasons" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">View seasons</Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending requests</p>
            <p className="mt-2 text-3xl font-bold">{pendingRequests?.length ?? 0}</p>
            <Link href="/admin/participants?tab=requests" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Review requests</Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Administrators</p>
            <p className="mt-2 text-3xl font-bold">{currentAdmins.length}</p>
            <Link href={`${basePath}?tab=admins`} className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Manage access</Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 md:col-span-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Season status</h2>
                <p className="mt-1 text-sm text-muted-foreground">Lifecycle at a glance. Detailed changes live on the Seasons pages.</p>
              </div>
              <Link href="/admin/seasons/new" className="text-sm font-semibold text-primary hover:underline">Create season</Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {seasons.length ? seasons.map((season) => (
                <AdminBadge key={season.id} tone={statusTone(season.status)}>{season.name} · {season.status}</AdminBadge>
              )) : <span className="text-sm text-muted-foreground">No seasons yet.</span>}
            </div>
          </div>
        </section>
      )}

      {tab === 'invites' && (
        <section className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">League invitation</h2>
              <p className="mt-1 text-sm text-muted-foreground">Anyone with an active link can request to join this league.</p>
            </div>
            <AdminBadge tone={league.invite_active ? 'green' : 'neutral'}>{league.invite_active ? 'Active' : 'Inactive'}</AdminBadge>
          </div>
          <div className="rounded-xl bg-muted p-3 font-mono text-xs break-all">{inviteUrl}</div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/join/${league.invite_code}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold hover:bg-accent">
              Open join page <ExternalLink className="size-4" />
            </Link>
            <form action={toggleInviteActive.bind(null, leagueId, !league.invite_active)}>
              <button type="submit" className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold hover:bg-accent">
                {league.invite_active ? 'Deactivate link' : 'Activate link'}
              </button>
            </form>
            <AdminDialog
              trigger={<><RefreshCw className="size-4" />Regenerate</>}
              title="Regenerate invitation link?"
              description="The current link will stop working immediately."
              tone="secondary"
            >
              <form action={regenerateInviteCode.bind(null, leagueId)} className="space-y-4">
                <p className="text-sm text-muted-foreground">Share the new link with anyone who still needs to join.</p>
                <div className="flex justify-end">
                  <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Regenerate link</button>
                </div>
              </form>
            </AdminDialog>
          </div>
        </section>
      )}

      {tab === 'admins' && (
        <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Current administrators</h2>
            <p className="mt-1 text-sm text-muted-foreground">These users can administer {league.name}.</p>
            <ul className="mt-4 divide-y divide-border">
              {currentAdmins.length ? currentAdmins.map((admin) => (
                <li key={admin.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{admin.displayName}</p>
                    {admin.email && <p className="truncate text-sm text-muted-foreground">{admin.email}</p>}
                  </div>
                  <AdminBadge tone="purple">Admin</AdminBadge>
                </li>
              )) : <li className="text-sm text-muted-foreground">No league administrators are assigned.</li>}
            </ul>
          </div>
          <form action={assignLeagueAdmin} className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <h2 className="font-semibold">Assign administrator</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose an existing registered user.</p>
            </div>
            <input type="hidden" name="league_id" value={leagueId} />
            <div className="space-y-1.5">
              <label htmlFor="league-admin-user" className="text-sm font-medium">Registered user</label>
              <select id="league-admin-user" name="user_id" required disabled={!adminCandidates.length} defaultValue="" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm disabled:opacity-50">
                <option value="" disabled>{adminCandidates.length ? 'Select a user' : 'All users are already admins'}</option>
                {adminCandidates.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.display_name ?? profile.email ?? 'Unknown user'}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={!adminCandidates.length} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              <ShieldPlus className="size-4" /> Assign admin
            </button>
          </form>
        </section>
      )}

      {tab === 'danger' && (
        <section className="max-w-3xl rounded-2xl border border-destructive/35 bg-destructive/5 p-5">
          <h2 className="text-lg font-semibold text-destructive">Delete league</h2>
          <p className="mt-1 text-sm text-muted-foreground">Permanent deletion is available only when every season is archived.</p>
          <div className="mt-4">
            <AdminDialog
              trigger={<><Trash2 className="size-4" />Delete league</>}
              title={`Delete ${league.name}?`}
              description="This permanently removes the league and its associated data."
              tone="danger"
            >
              <form action={deleteLeague.bind(null, leagueId)} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="delete-league-confirmation" className="text-sm font-medium">Type <strong>{league.name}</strong> to confirm</label>
                  <input id="delete-league-confirmation" name="confirmation" required autoComplete="off" className="w-full rounded-lg border border-destructive/50 bg-background px-3 py-2.5 text-sm" />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">Delete permanently</button>
                </div>
              </form>
            </AdminDialog>
          </div>
        </section>
      )}
    </main>
  );
}
