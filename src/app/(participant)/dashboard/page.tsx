import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getParticipant, requireUser, isSuperAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';
import { getSeasonNow } from '@/lib/clock';
import { isKickoffLocked } from '@/lib/scoring';
import { PredictionsForm } from '@/components/participant/PredictionsForm';

export const metadata = { title: 'Dashboard' };

export const dynamic = 'force-dynamic';

interface ActiveSeason {
  id: string;
  name: string;
  league_id: string;
  leagues: { name: string } | null;
}

interface PendingJoinRequest {
  id: string;
  leagues: { name: string } | null;
}

export default async function DashboardPage() {
  const user = await requireUser().catch(() => null);
  if (!user) redirect('/login');

  const [participant, isAdmin] = await Promise.all([getParticipant(), isSuperAdmin()]);
  const supabase = await createClient();

  // Get pending join requests for this user
  const { data: pendingJoinRequests } = await supabase
    .from('join_requests')
    .select('id, created_at, leagues(name)')
    .eq('user_id', user.id)
    .eq('status', 'pending');

  // Get the active season for the first league the participant belongs to
  const { data: activeSeasons } = await supabase
    .from('season_participants')
    .select(
      `
      season_id,
      seasons!inner(id, name, status, league_id,
        leagues(name)
      )
    `
    )
    .eq('participant_id', participant?.id ?? '')
    .eq('seasons.status', 'active')
    .limit(1);

  const activeSeason = activeSeasons?.[0]?.seasons as unknown as ActiveSeason | undefined;

  // Get the upcoming gameweek
  const { data: nextGameweek } = activeSeason
    ? await supabase
        .from('gameweeks')
        .select('id, label, first_kickoff, status')
        .eq('season_id', activeSeason.id)
        .in('status', ['upcoming', 'in_progress'])
        .order('gameweek_number', { ascending: true })
        .limit(1)
    : { data: null };

  const gw = nextGameweek?.[0];

  // Load the upcoming fixtures once so the dashboard can be used to predict,
  // rather than only showing a count and sending the participant elsewhere.
  const { data: fixtures, error: fixturesError } = gw
    ? await supabase
        .from('fixtures')
        .select(
          'id, home_team_name, away_team_name, kickoff, status, home_score, away_score, result_confirmed'
        )
        .eq('gameweek_id', gw.id)
        .order('kickoff', { ascending: true })
    : { data: [], error: null };

  const { data: existingPredictions } =
    gw && fixtures?.length
      ? await supabase
          .from('predictions')
          .select(
            'fixture_id, home_score, away_score, points_awarded, points_reason, is_admin_entered'
          )
          .eq('participant_id', participant?.id ?? '')
          .in(
            'fixture_id',
            fixtures.map((fixture) => fixture.id)
          )
      : { data: [] };

  const predictionMap = new Map(
    (existingPredictions ?? []).map((prediction) => [prediction.fixture_id, prediction])
  );
  const seasonNow = activeSeason ? await getSeasonNow(supabase, activeSeason.id) : new Date();
  const enrichedFixtures = (fixtures ?? []).map((fixture) => ({
    ...fixture,
    locked: isKickoffLocked(new Date(fixture.kickoff), seasonNow),
    prediction: predictionMap.get(fixture.id) ?? null,
  }));
  const fixtureCount = enrichedFixtures.length;
  const predCount = enrichedFixtures.filter((fixture) => fixture.prediction).length;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <header className="border-b-2 border-[--color-secondary] pb-3">
        <div className="ceefax-logo text-xl mb-1">
          {'PREDICTOTRONIX'.split('').map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>
        <p className="text-[--color-text-secondary] text-sm">
          Welcome, {participant?.display_name ?? user.email}
        </p>
      </header>

      {/* Active season */}
      {activeSeason ? (
        <section className="space-y-3">
          <h2 className="text-[--color-warning] font-bold uppercase text-sm">
            ▶ {activeSeason.leagues?.name} — {activeSeason.name}
          </h2>

          {gw ? (
            <div className="border border-[--color-info] p-4 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[--color-info] font-bold text-lg">{gw.label}</p>
                <p
                  className={`text-xs font-bold uppercase ${predCount === fixtureCount && fixtureCount > 0 ? 'text-[--color-success]' : 'text-[--color-warning]'}`}
                >
                  {predCount}/{fixtureCount} predicted
                  {predCount === fixtureCount && fixtureCount > 0 ? ' ✓' : ''}
                </p>
              </div>
              {gw.first_kickoff && (
                <p className="text-[--color-text-secondary] text-xs">
                  First kickoff:{' '}
                  {new Date(gw.first_kickoff).toLocaleString('en-GB', {
                    timeZone: 'Europe/London',
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              )}
              {fixturesError ? (
                <p className="border border-[--color-error] p-3 text-sm text-[--color-error]">
                  Fixtures could not be loaded. Refresh the page or contact your league admin.
                </p>
              ) : enrichedFixtures.length === 0 ? (
                <p className="border border-[--color-warning] p-3 text-sm text-[--color-text-secondary]">
                  No fixtures have been added to this gameweek yet.
                </p>
              ) : (
                <PredictionsForm fixtures={enrichedFixtures} />
              )}
              <Link
                href={`/predictions/${gw.id}`}
                className="inline-flex min-h-10 items-center justify-center border border-[--color-info] px-4 py-2 text-sm font-bold text-[--color-info] hover:bg-[--color-info] hover:text-white"
              >
                Open gameweek
              </Link>
            </div>
          ) : (
            <p className="text-[--color-text-secondary] text-sm">No upcoming gameweek.</p>
          )}
        </section>
      ) : (
        <section className="border border-[--color-warning] p-3 space-y-2">
          <p className="text-[--color-warning]">You are not enrolled in any active season.</p>
          {pendingJoinRequests && pendingJoinRequests.length > 0 ? (
            <div className="space-y-1">
              {(pendingJoinRequests as unknown as PendingJoinRequest[]).map((req) => (
                <p key={req.id} className="text-[--color-text-secondary] text-sm">
                  ⧗ Join request for{' '}
                  <span className="text-[--color-warning]">{req.leagues?.name ?? 'a league'}</span>{' '}
                  is pending approval.
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[--color-text-secondary] text-sm">
              Contact your league admin for an invite.
            </p>
          )}
        </section>
      )}

      {/* Nav links */}
      <nav className="grid gap-2 text-sm sm:grid-cols-2">
        <Link
          href="/leaderboard"
          className="inline-flex min-h-10 items-center justify-center bg-[--color-primary] px-4 py-2 font-bold text-white hover:opacity-90"
        >
          Leaderboard
        </Link>
        <Link
          href="/settings"
          className="inline-flex min-h-10 items-center justify-center bg-[--color-primary] px-4 py-2 font-bold text-white hover:opacity-90"
        >
          Notification settings
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex min-h-10 items-center justify-center border border-[--color-warning] px-4 py-2 font-bold text-[--color-warning] hover:bg-[--color-warning] hover:text-black"
          >
            Admin panel
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <form action={signOut} className="pt-2">
        <button
          type="submit"
          className="min-h-10 border border-[--color-error] px-4 py-2 text-sm font-bold text-[--color-error] hover:bg-[--color-error] hover:text-white"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
