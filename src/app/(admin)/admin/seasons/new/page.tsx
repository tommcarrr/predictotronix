import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admin/context';
import { AdminNotice } from '@/components/admin/AdminNotice';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { createSeason } from '../actions';
import { FormSubmitButton } from '@/components/ui/form-submit-button';

export const metadata = { title: 'Create season | Admin' };

export default async function NewSeasonPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { selectedLeague, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <Link href="/admin/seasons" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Seasons
      </Link>
      <AdminPageHeader
        eyebrow="New season"
        title="Configure season"
        description={selectedLeague ? `Create a season for ${selectedLeague.name}. It will remain in setup until you activate it.` : 'Select a league before continuing.'}
      />
      {error && <AdminNotice tone="danger" role="alert">{error}</AdminNotice>}

      {!selectedLeague ? (
        <AdminNotice>Select a league from the workspace menu, then return to this page.</AdminNotice>
      ) : (
        <form action={createSeason.bind(null, selectedLeague.id)} className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <section className="space-y-4" aria-labelledby="season-details-heading">
            <div>
              <h2 id="season-details-heading" className="font-semibold">Season details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Use a clear name that participants will recognise.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="season-name" className="text-sm font-medium">Season name</label>
                <input id="season-name" name="name" required placeholder="2026/27" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="season-type" className="text-sm font-medium">Season type</label>
                <select id="season-type" name="season_type" defaultValue="production" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                  <option value="production">Production</option>
                  <option value="test">Test</option>
                  <option value="demo">Demo</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-6" aria-labelledby="fixture-source-heading">
            <div>
              <h2 id="fixture-source-heading" className="font-semibold">Fixture source</h2>
              <p className="mt-1 text-sm text-muted-foreground">Production sync requires both identifiers. They can be left empty for test seasons.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="api-football-league" className="text-sm font-medium">API-Football league ID</label>
                <input id="api-football-league" name="api_football_league_id" type="number" min="1" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="api-football-season" className="text-sm font-medium">API-Football season</label>
                <input id="api-football-season" name="api_football_season" type="number" min="2000" max="2200" placeholder="2026" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
            <Link href="/admin/seasons" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent">Cancel</Link>
            <FormSubmitButton pendingLabel="Creating season…" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Create in setup</FormSubmitButton>
          </div>
        </form>
      )}
    </main>
  );
}
