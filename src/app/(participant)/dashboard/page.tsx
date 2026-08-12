import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getParticipant, requireUser, isSuperAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';
import { getSeasonNow } from '@/lib/clock';
import { isKickoffLocked } from '@/lib/scoring';
import { PredictionsForm } from '@/components/participant/PredictionsForm';
import { GameweekCarousel } from '@/components/participant/GameweekCarousel';
import { selectPredictionGameweek } from '@/lib/predictions/gameweek';

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

  // Load every gameweek so players can browse the season in-place.
  const { data: predictionGameweeks } = activeSeason
    ? await supabase
        .from('gameweeks')
        .select('id, label, first_kickoff, status')
        .eq('season_id', activeSeason.id)
        .order('gameweek_number', { ascending: true })
    : { data: null };

  const seasonNow = activeSeason ? await getSeasonNow(supabase, activeSeason.id) : new Date();
  const candidateIds = (predictionGameweeks ?? []).map((gameweek) => gameweek.id);

  const { data: candidateFixtures, error: fixturesError } = candidateIds.length
    ? await supabase
        .from('fixtures')
        .select(
          'id, gameweek_id, home_team_name, away_team_name, kickoff, status, home_score, away_score, result_confirmed'
        )
        .in('gameweek_id', candidateIds)
        .order('kickoff', { ascending: true })
    : { data: [], error: null };

  const { data: existingPredictions } =
    candidateFixtures && candidateFixtures.length
      ? await supabase
          .from('predictions')
          .select(
            'fixture_id, home_score, away_score, points_awarded, points_reason, is_admin_entered'
          )
          .eq('participant_id', participant?.id ?? '')
          .in(
            'fixture_id',
            candidateFixtures.map((fixture) => fixture.id)
          )
      : { data: [] };

  const predictionMap = new Map(
    (existingPredictions ?? []).map((prediction) => [prediction.fixture_id, prediction])
  );
  const enrichedFixtures = (candidateFixtures ?? []).map((fixture) => ({
    ...fixture,
    locked: isKickoffLocked(new Date(fixture.kickoff), seasonNow),
    prediction: predictionMap.get(fixture.id) ?? null,
  }));
  const selectedGameweek = selectPredictionGameweek(
    predictionGameweeks ?? [],
    candidateFixtures ?? [],
    seasonNow
  );
  const initialGameweekIndex = Math.max(
    0,
    (predictionGameweeks ?? []).findIndex((gameweek) => gameweek.id === selectedGameweek?.id)
  );

  return (
    <div className="participant-dashboard pb-8">
      {/* Header */}
      <header className="participant-appbar">
        <div className="participant-appbar__inner">
          <div className="participant-appbar__logo" aria-label="Predictotronix">
            <span className="ceefax-logo participant-appbar__wordmark participant-appbar__wordmark--full" aria-hidden="true">
              {'PREDICTOTRONIX'.split('').map((ch, i) => <span key={i}>{ch}</span>)}
            </span>
            <span className="ceefax-logo participant-appbar__wordmark participant-appbar__wordmark--compact" aria-hidden="true">
              {'PDRCT'.split('').map((ch, i) => <span key={i}>{ch}</span>)}
            </span>
          </div>
          <div className="participant-appbar__menu">
            <p className="participant-appbar__welcome">Welcome, {participant?.display_name ?? user.email}</p>
            <form action={signOut}>
              <button type="submit" className="participant-appbar__signout">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="participant-dashboard__content space-y-6">
        {/* Active season */}
        {activeSeason ? (
          <section className="space-y-3">
            <h2 className="participant-section-title">
              {activeSeason.leagues?.name} — {activeSeason.name}
            </h2>

            {predictionGameweeks?.length ? (
              <GameweekCarousel initialIndex={initialGameweekIndex}>
                {predictionGameweeks.map((gameweek) => {
                  const fixtures = enrichedFixtures.filter((fixture) => fixture.gameweek_id === gameweek.id);
                  const fixtureCount = fixtures.length;
                  const predCount = fixtures.filter((fixture) => fixture.prediction).length;
                  return <article key={gameweek.id} className="participant-panel participant-gameweek-card space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="participant-gameweek-title">{gameweek.label}</p>
                  <p
                    className={`text-xs font-bold uppercase ${predCount === fixtureCount && fixtureCount > 0 ? 'text-[--color-success]' : 'text-[--color-warning]'}`}
                  >
                    {predCount}/{fixtureCount} predicted
                    {predCount === fixtureCount && fixtureCount > 0 ? ' ✓' : ''}
                  </p>
                </div>
                {gameweek.first_kickoff && (
                  <p className="text-[--color-text-secondary] text-xs">
                    First kickoff:{' '}
                    {new Date(gameweek.first_kickoff).toLocaleString('en-GB', {
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
                  <PredictionsForm fixtures={fixtures} />
                )}
                  </article>;
                })}
              </GameweekCarousel>
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
                    <span className="text-[--color-warning]">
                      {req.leagues?.name ?? 'a league'}
                    </span>{' '}
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
        <nav className="grid gap-3 text-sm">
          <Link href="/settings" className="participant-button participant-button--primary">
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

      </main>
    </div>
  );
}
