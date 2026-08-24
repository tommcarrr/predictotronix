import { Megaphone, OctagonAlert, X } from 'lucide-react';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { FormSubmitButton } from '@/components/ui/form-submit-button';
import { getAdminContext } from '@/lib/admin/context';
import { getLoginNoticeFormBounds, type LoginNoticeTone } from '@/lib/login-notices';
import { createServiceClient } from '@/lib/supabase/server';
import { createLoginNotice, expireLoginNotice } from './actions';

export const metadata = { title: 'Login notices | Admin' };
export const dynamic = 'force-dynamic';

const toneOptions: Array<{ value: LoginNoticeTone; label: string; colour: string }> = [
  { value: 'info', label: 'Information', colour: '#00ffff' },
  { value: 'success', label: 'Success', colour: '#00ff00' },
  { value: 'warning', label: 'Warning', colour: '#ffff00' },
  { value: 'error', label: 'Error', colour: '#ff0000' },
];

type Props = {
  searchParams: Promise<{ error?: string; created?: string; expired?: string }>;
};

export default async function LoginNoticesAdminPage({ searchParams }: Props) {
  const query = await searchParams;
  const { selectedLeague, superAdmin } = await getAdminContext();
  const bounds = getLoginNoticeFormBounds();
  const supabase = await createServiceClient();

  let noticesQuery = supabase
    .from('login_notices')
    .select('id, league_id, title, body, tone, display_mode, expires_at, created_at')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (superAdmin && selectedLeague) {
    noticesQuery = noticesQuery.or(`league_id.is.null,league_id.eq.${selectedLeague.id}`);
  } else if (superAdmin) {
    noticesQuery = noticesQuery.is('league_id', null);
  } else if (selectedLeague) {
    noticesQuery = noticesQuery.eq('league_id', selectedLeague.id);
  }

  const { data: notices } = selectedLeague || superAdmin ? await noticesQuery : { data: [] };

  const canCreate = superAdmin || Boolean(selectedLeague);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <AdminPageHeader
        eyebrow="Communicate"
        title="Login notices"
        description="Publish short, time-limited messages that league users see after signing in."
      />

      {query.error && (
        <AdminNotice tone="danger" role="alert">
          {query.error}
        </AdminNotice>
      )}
      {query.created === '1' && (
        <AdminNotice tone="success" role="status">
          Notice published.
        </AdminNotice>
      )}
      {query.expired === '1' && (
        <AdminNotice tone="success" role="status">
          Notice withdrawn.
        </AdminNotice>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Megaphone className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Create a notice</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Defaults to one week and remains visible until the user dismisses it.
              </p>
            </div>
          </div>

          {canCreate ? (
            <form action={createLoginNotice} className="mt-6 space-y-5">
              <input type="hidden" name="league_id" value={selectedLeague?.id ?? ''} />

              <div className="space-y-1.5">
                <label htmlFor="notice-scope" className="text-sm font-medium">
                  Audience
                </label>
                {superAdmin ? (
                  <select
                    id="notice-scope"
                    name="scope"
                    defaultValue={selectedLeague ? 'league' : 'global'}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  >
                    {selectedLeague && <option value="league">{selectedLeague.name}</option>}
                    <option value="global">All league users</option>
                  </select>
                ) : (
                  <>
                    <input type="hidden" name="scope" value="league" />
                    <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
                      {selectedLeague?.name}
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="notice-title" className="text-sm font-medium">
                  Title
                </label>
                <input
                  id="notice-title"
                  name="title"
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="notice-body" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="notice-body"
                  name="body"
                  required
                  maxLength={2000}
                  rows={5}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Plain text only · 2,000 characters maximum.
                </p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Ceefax colour</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {toneOptions.map((tone, index) => (
                    <label
                      key={tone.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/20"
                    >
                      <input
                        type="radio"
                        name="tone"
                        value={tone.value}
                        defaultChecked={index === 0}
                      />
                      <span
                        className="size-4 shrink-0 border border-black/30"
                        style={{ backgroundColor: tone.colour }}
                      />
                      {tone.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="notice-expiry" className="text-sm font-medium">
                    Expires
                  </label>
                  <input
                    id="notice-expiry"
                    type="datetime-local"
                    name="expires_at"
                    required
                    min={bounds.min}
                    max={bounds.max}
                    defaultValue={bounds.defaultValue}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">UK time · maximum 2 weeks.</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="notice-frequency" className="text-sm font-medium">
                    Display
                  </label>
                  <select
                    id="notice-frequency"
                    name="display_mode"
                    defaultValue="once"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="once">Until dismissed (default)</option>
                    <option value="every_login">After every login</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Every-login notices can be dismissed for the current session.
                  </p>
                </div>
              </div>

              <FormSubmitButton
                pendingLabel="Publishing…"
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:w-auto"
              >
                Publish notice
              </FormSubmitButton>
            </form>
          ) : (
            <AdminNotice>No league is available for this notice.</AdminNotice>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Active notices</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Global notices and notices for the current league.
            </p>
          </div>
          {notices?.length ? (
            notices.map((notice) => {
              const tone = toneOptions.find((option) => option.value === notice.tone);
              return (
                <article key={notice.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="size-3 shrink-0 border border-black/30"
                          style={{ backgroundColor: tone?.colour }}
                        />
                        <h3 className="font-semibold">{notice.title}</h3>
                        <AdminBadge tone={notice.league_id ? 'blue' : 'purple'}>
                          {notice.league_id ? (selectedLeague?.name ?? 'League') : 'Global'}
                        </AdminBadge>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {notice.body}
                      </p>
                    </div>
                    <form action={expireLoginNotice.bind(null, notice.id)}>
                      <FormSubmitButton
                        pendingLabel="Withdrawing…"
                        aria-label={`Withdraw ${notice.title}`}
                        title="Withdraw notice"
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <X className="size-4" />
                      </FormSubmitButton>
                    </form>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>
                      {notice.display_mode === 'once' ? 'Until dismissed' : 'Every login'}
                    </span>
                    <span>
                      Expires{' '}
                      {new Date(notice.expires_at).toLocaleString('en-GB', {
                        timeZone: 'Europe/London',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <OctagonAlert className="mx-auto mb-2 size-5" />
              No active notices for this audience.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
