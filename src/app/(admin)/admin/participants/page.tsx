import { Plus, Trash2, UserPen, UserPlus, UserRoundMinus } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import {
  approveJoinRequest,
  createOfflineParticipant,
  deleteUnattachedUser,
  mergeOfflineParticipant,
  rejectJoinRequest,
  updateParticipantDisplayName,
} from './actions';
import { addSeasonParticipant, removeSeasonParticipant } from '../seasons/actions';
import { getAdminContext } from '@/lib/admin/context';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminDialog } from '@/components/admin/AdminDialog';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { FormSubmitButton } from '@/components/ui/form-submit-button';
import { ParticipantMergeDialog } from '@/components/admin/ParticipantMergeDialog';
import type { Tables } from '@/types/database';

export const metadata = { title: 'People | Admin' };
export const dynamic = 'force-dynamic';

type ParticipantSummary = Pick<
  Tables<'participants'>,
  'id' | 'user_id' | 'display_name' | 'email' | 'is_offline'
>;

type Props = {
  searchParams: Promise<{
    tab?: string;
    error?: string;
    nameUpdated?: string;
    approved?: string;
    rejected?: string;
    merged?: string;
    deleted?: string;
  }>;
};

export default async function ParticipantsAdminPage({ searchParams }: Props) {
  const {
    tab: requestedTab,
    error,
    nameUpdated,
    approved,
    rejected,
    merged,
    deleted,
  } = await searchParams;
  const { user, superAdmin, selectedLeague, selectedSeason } = await getAdminContext();
  const tab =
    requestedTab === 'requests'
      ? 'requests'
      : requestedTab === 'unattached' && superAdmin
        ? 'unattached'
        : 'members';
  const supabase = await createServiceClient();

  const { data: unattachedUsers, error: unattachedUsersError } =
    superAdmin && tab === 'unattached'
      ? await supabase.rpc('list_unattached_auth_users', { p_actor_user_id: user.id })
      : { data: [], error: null };
  if (unattachedUsersError) {
    console.error('Failed to load unattached users', unattachedUsersError);
  }

  const { data: pendingRequests } = selectedLeague
    ? await supabase
        .from('join_requests')
        .select('id, user_id, created_at, leagues(id, name)')
        .eq('league_id', selectedLeague.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
    : { data: [] };

  const { data: seasonParticipantRows } = selectedSeason
    ? await supabase
        .from('season_participants')
        .select('participant_id, participants!inner(id, user_id, display_name, email, is_offline)')
        .eq('season_id', selectedSeason.id)
    : { data: [] };

  const enrolledParticipants = (seasonParticipantRows ?? [])
    .map((row) => row.participants as unknown as ParticipantSummary)
    .filter(Boolean)
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
  const enrolledIds = new Set(enrolledParticipants.map((participant) => participant.id));

  const { data: leagueSeasons } = selectedLeague
    ? await supabase.from('seasons').select('id').eq('league_id', selectedLeague.id)
    : { data: [] };
  const leagueSeasonIds = (leagueSeasons ?? []).map((season) => season.id);
  const { data: leagueEnrolments } = leagueSeasonIds.length
    ? await supabase
        .from('season_participants')
        .select('participant_id')
        .in('season_id', leagueSeasonIds)
    : { data: [] };
  const leagueParticipantIds = [
    ...new Set((leagueEnrolments ?? []).map((row) => row.participant_id)),
  ];
  const { data: leagueParticipants } = leagueParticipantIds.length
    ? await supabase
        .from('participants')
        .select('id, user_id, display_name, email, is_offline')
        .in('id', leagueParticipantIds)
        .order('display_name')
    : { data: [] };
  const availableParticipants = (leagueParticipants ?? []).filter(
    (participant) => !enrolledIds.has(participant.id)
  );
  const registeredMergeOptions = (leagueParticipants ?? [])
    .filter((participant) => Boolean(participant.user_id) && !participant.is_offline)
    .map((participant) => ({
      id: participant.id,
      displayName: participant.display_name,
      email: participant.email,
    }));
  const offlineMergeOptions = (leagueParticipants ?? [])
    .filter((participant) => !participant.user_id && participant.is_offline)
    .map((participant) => ({
      id: participant.id,
      displayName: participant.display_name,
      email: participant.email,
    }));

  const requestUserIds = [
    ...new Set((pendingRequests ?? []).map((request) => request.user_id)),
  ];
  const { data: requestProfiles } = requestUserIds.length
    ? await supabase.from('profiles').select('id, display_name, email').in('id', requestUserIds)
    : { data: [] };
  const profileMap = Object.fromEntries(
    (requestProfiles ?? []).map((profile) => [profile.id, profile])
  );
  const missingProfileUserIds = requestUserIds.filter((userId) => !profileMap[userId]);
  const authUsers = await Promise.all(
    missingProfileUserIds.map(async (userId) => {
      const { data } = await supabase.auth.admin.getUserById(userId);
      return [userId, data.user] as const;
    })
  );
  const authUserMap = Object.fromEntries(authUsers);
  const requestIdentityMap = Object.fromEntries(
    requestUserIds.map((userId) => {
      const profile = profileMap[userId];
      const authUser = authUserMap[userId];
      const email = profile?.email ?? authUser?.email ?? null;
      const displayName =
        profile?.display_name ??
        (typeof authUser?.user_metadata?.display_name === 'string'
          ? authUser.user_metadata.display_name
          : null) ??
        email?.split('@')[0] ??
        'Unknown user';
      return [userId, { displayName, email }];
    })
  );

  const activeHref =
    tab === 'requests'
      ? '/admin/participants?tab=requests'
      : tab === 'unattached'
        ? '/admin/participants?tab=unattached'
        : '/admin/participants';

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <AdminPageHeader
        eyebrow="Run"
        title="People"
        description={
          tab === 'unattached' ? (
            'Accounts with no participant, league, join request, admin role, or valid invitation.'
          ) : (
            <>
              Join requests are scoped to <strong>{selectedLeague?.name ?? 'no league'}</strong>.
              Members are scoped to <strong>{selectedSeason?.name ?? 'no season'}</strong>.
            </>
          )
        }
        actions={
          tab === 'members' &&
          selectedSeason && (
            <div className="flex flex-wrap gap-2">
              {selectedLeague &&
                registeredMergeOptions.length > 0 &&
                offlineMergeOptions.length > 0 && (
                  <ParticipantMergeDialog
                    leagueId={selectedLeague.id}
                    registeredParticipants={registeredMergeOptions}
                    offlineParticipants={offlineMergeOptions}
                    mergeAction={mergeOfflineParticipant}
                  />
                )}
              {availableParticipants.length > 0 && (
                <AdminDialog
                  trigger={
                    <>
                      <UserPlus className="size-4" />
                      Add existing
                    </>
                  }
                  title={`Add to ${selectedSeason.name}`}
                  description="Choose someone who has participated in another season in this league."
                  tone="secondary"
                >
                  <div className="divide-y divide-border">
                    {availableParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{participant.display_name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {participant.email ??
                              (participant.is_offline
                                ? 'Offline participant'
                                : 'Email unavailable')}
                          </p>
                        </div>
                        <form
                          action={addSeasonParticipant.bind(
                            null,
                            selectedSeason.id,
                            participant.id
                          )}
                        >
                          <FormSubmitButton
                            pendingLabel="Adding…"
                            className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-accent"
                          >
                            Add
                          </FormSubmitButton>
                        </form>
                      </div>
                    ))}
                  </div>
                </AdminDialog>
              )}
              <AdminDialog
                trigger={
                  <>
                    <Plus className="size-4" />
                    Add offline
                  </>
                }
                title="Add offline participant"
                description={`Create and enrol a participant in ${selectedSeason.name}.`}
              >
                <form action={createOfflineParticipant} className="space-y-4">
                  <input type="hidden" name="season_id" value={selectedSeason.id} />
                  <div className="space-y-1.5">
                    <label htmlFor="offline-display-name" className="text-sm font-medium">
                      Display name
                    </label>
                    <input
                      id="offline-display-name"
                      name="display_name"
                      required
                      minLength={2}
                      maxLength={80}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="offline-email" className="text-sm font-medium">
                      Email <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      id="offline-email"
                      name="email"
                      type="email"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="flex justify-end">
                    <FormSubmitButton
                      pendingLabel="Adding participant…"
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      Add participant
                    </FormSubmitButton>
                  </div>
                </form>
              </AdminDialog>
            </div>
          )
        }
      />

      {error && (
        <AdminNotice tone="danger" role="alert">
          {error}
        </AdminNotice>
      )}
      {nameUpdated === '1' && (
        <AdminNotice tone="success" role="status">
          Display name updated.
        </AdminNotice>
      )}
      {approved === '1' && (
        <AdminNotice tone="success" role="status">
          Join request approved and participant enrolled.
        </AdminNotice>
      )}
      {rejected === '1' && <AdminNotice role="status">Join request rejected.</AdminNotice>}
      {merged === '1' && (
        <AdminNotice tone="success" role="status">
          Offline participant merged into the registered user. The original record was deleted.
        </AdminNotice>
      )}
      {deleted === '1' && (
        <AdminNotice tone="success" role="status">
          Unattached user deleted.
        </AdminNotice>
      )}

      <AdminTabs
        label="People"
        activeHref={activeHref}
        items={[
          { href: '/admin/participants', label: 'Members' },
          {
            href: '/admin/participants?tab=requests',
            label: 'Join requests',
            count: pendingRequests?.length ?? 0,
          },
          ...(superAdmin
            ? [
                {
                  href: '/admin/participants?tab=unattached',
                  label: 'Unattached users',
                  count: unattachedUsers?.length ?? 0,
                },
              ]
            : []),
        ]}
      />

      {tab === 'unattached' && (
        <section aria-labelledby="unattached-users-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="unattached-users-heading" className="text-lg font-semibold">
                Unattached users
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These accounts have no participant history, league ownership, join request, admin
                role, or valid league invitation.
              </p>
            </div>
            <AdminBadge tone="neutral">{unattachedUsers?.length ?? 0} accounts</AdminBadge>
          </div>

          {unattachedUsersError ? (
            <AdminNotice tone="danger" role="alert">
              Unattached users are temporarily unavailable. Check that database migration 021 has
              been applied, then try again.
            </AdminNotice>
          ) : !unattachedUsers?.length ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No unattached users.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Last sign in</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unattachedUsers.map((unattachedUser) => {
                    const confirmation = unattachedUser.email ?? unattachedUser.user_id;
                    return (
                      <tr key={unattachedUser.user_id}>
                        <td className="px-4 py-3 font-medium">{unattachedUser.display_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {unattachedUser.email ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(unattachedUser.created_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {unattachedUser.last_sign_in_at
                            ? new Date(unattachedUser.last_sign_in_at).toLocaleDateString('en-GB')
                            : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <AdminBadge
                            tone={unattachedUser.email_confirmed_at ? 'green' : 'neutral'}
                          >
                            {unattachedUser.email_confirmed_at ? 'Confirmed' : 'Unconfirmed'}
                          </AdminBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AdminDialog
                            trigger={
                              <>
                                <Trash2 className="size-3.5" />
                                Delete
                              </>
                            }
                            title={`Delete ${unattachedUser.display_name}`}
                            description="Permanently removes this auth account and profile. This cannot be undone."
                            tone="danger"
                            triggerClassName="px-2.5 py-1.5 text-xs"
                          >
                            <form
                              action={deleteUnattachedUser.bind(null, unattachedUser.user_id)}
                              className="space-y-4"
                            >
                              <div className="space-y-1.5">
                                <label
                                  htmlFor={`delete-user-${unattachedUser.user_id}`}
                                  className="text-sm font-medium"
                                >
                                  Type <strong>{confirmation}</strong> to confirm
                                </label>
                                <input
                                  id={`delete-user-${unattachedUser.user_id}`}
                                  name="confirmation"
                                  required
                                  autoComplete="off"
                                  className="w-full rounded-lg border border-destructive/50 bg-background px-3 py-2.5 text-sm"
                                />
                              </div>
                              <div className="flex justify-end">
                                <FormSubmitButton
                                  pendingLabel="Deleting user…"
                                  className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"
                                >
                                  Delete user
                                </FormSubmitButton>
                              </div>
                            </form>
                          </AdminDialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'requests' && (
        <section aria-labelledby="join-requests-heading">
          <div className="mb-4">
            <h2 id="join-requests-heading" className="text-lg font-semibold">
              Join requests
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Approval enrols the person into the selected season.
            </p>
          </div>
          {!selectedSeason && pendingRequests && pendingRequests.length > 0 && (
            <AdminNotice tone="danger">
              Select or create a season before approving these requests.
            </AdminNotice>
          )}
          {!pendingRequests?.length ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No pending requests.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <article
                  key={request.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {requestIdentityMap[request.user_id].displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {requestIdentityMap[request.user_id].email ?? 'Email unavailable'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {new Date(request.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form
                      action={approveJoinRequest.bind(null, request.id, selectedSeason?.id ?? '')}
                    >
                      <FormSubmitButton
                        pendingLabel="Approving…"
                        disabled={!selectedSeason}
                        title={!selectedSeason ? 'Select a season before approving' : undefined}
                        className="rounded-lg bg-green-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </FormSubmitButton>
                    </form>
                    <form action={rejectJoinRequest.bind(null, request.id)}>
                      <FormSubmitButton
                        pendingLabel="Rejecting…"
                        className="rounded-lg border border-destructive/40 px-3.5 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
                      >
                        Reject
                      </FormSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'members' && (
        <section aria-labelledby="season-members-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="season-members-heading" className="text-lg font-semibold">
                Season members
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Only people enrolled in the selected season are shown.
              </p>
            </div>
            {selectedSeason && (
              <AdminBadge tone="blue">{enrolledParticipants.length} enrolled</AdminBadge>
            )}
          </div>

          {!selectedSeason ? (
            <AdminNotice>
              Select a season from the workspace menu to manage its members.
            </AdminNotice>
          ) : !enrolledParticipants.length ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No participants are enrolled in this season.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrolledParticipants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="px-4 py-3 font-medium">{participant.display_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {participant.email ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge tone={participant.is_offline ? 'neutral' : 'green'}>
                          {participant.is_offline ? 'Offline' : 'Registered'}
                        </AdminBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {selectedLeague && (
                            <AdminDialog
                              trigger={
                                <>
                                  <UserPen className="size-3.5" />
                                  Edit
                                </>
                              }
                              title={`Edit ${participant.display_name}`}
                              tone="secondary"
                              triggerClassName="px-2.5 py-1.5 text-xs"
                            >
                              <form
                                action={updateParticipantDisplayName.bind(
                                  null,
                                  selectedLeague.id,
                                  participant.id
                                )}
                                className="space-y-4"
                              >
                                <div className="space-y-1.5">
                                  <label
                                    htmlFor={`display-name-${participant.id}`}
                                    className="text-sm font-medium"
                                  >
                                    Display name
                                  </label>
                                  <input
                                    id={`display-name-${participant.id}`}
                                    name="display_name"
                                    required
                                    minLength={2}
                                    maxLength={80}
                                    defaultValue={participant.display_name}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <FormSubmitButton
                                    pendingLabel="Saving name…"
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                                  >
                                    Save name
                                  </FormSubmitButton>
                                </div>
                              </form>
                            </AdminDialog>
                          )}
                          <form
                            action={removeSeasonParticipant.bind(
                              null,
                              selectedSeason.id,
                              participant.id
                            )}
                          >
                            <FormSubmitButton
                              pendingLabel="Removing…"
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                            >
                              <UserRoundMinus className="size-3.5" />
                              Remove
                            </FormSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
