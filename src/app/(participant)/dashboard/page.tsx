import { redirect } from 'next/navigation';
import { getParticipant, requireUser, isSuperAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';

export const dynamic = 'force-dynamic';

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
    .select(`
      season_id,
      seasons!inner(id, name, status, league_id,
        leagues(name)
      )
    `)
    .eq('participant_id', participant?.id ?? '')
    .eq('seasons.status', 'active')
    .limit(1);

  const activeSeason = (activeSeasons?.[0] as any)?.seasons;

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

  // Count predictions for the upcoming gameweek
  const { count: predCount } = gw
    ? await supabase
        .from('predictions')
        .select('id', { count: 'exact', head: true })
        .eq('participant_id', participant?.id ?? '')
        .in(
          'fixture_id',
          (await supabase.from('fixtures').select('id').eq('gameweek_id', gw.id)).data?.map(
            (f: any) => f.id
          ) ?? []
        )
    : { count: 0 };

  const { count: fixtureCount } = gw
    ? await supabase
        .from('fixtures')
        .select('id', { count: 'exact', head: true })
        .eq('gameweek_id', gw.id)
    : { count: 0 };

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
            <div className="border border-[--color-info] p-3 space-y-2">
              <p className="text-[--color-info] font-bold">{gw.label}</p>
              <p className="text-sm">
                Predictions:{' '}
                <span className={predCount === fixtureCount ? 'text-[--color-success]' : 'text-[--color-warning]'}>
                  {predCount}/{fixtureCount}
                  {predCount === fixtureCount ? ' ✓ COMPLETE' : ' — incomplete'}
                </span>
              </p>
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
              <a
                href={`/predictions/${gw.id}`}
                className="inline-block mt-2 px-3 py-1 bg-[--color-primary] text-white text-sm font-bold hover:opacity-90"
              >
                [SUBMIT PREDICTIONS]
              </a>
            </div>
          ) : (
            <p className="text-[--color-text-secondary] text-sm">No upcoming gameweek.</p>
          )}
        </section>
      ) : (
        <section className="border border-[--color-warning] p-3 space-y-2">
          <p className="text-[--color-warning]">
            You are not enrolled in any active season.
          </p>
          {pendingJoinRequests && pendingJoinRequests.length > 0 ? (
            <div className="space-y-1">
              {pendingJoinRequests.map((req: any) => (
                <p key={req.id} className="text-[--color-text-secondary] text-sm">
                  ⧗ Join request for <span className="text-[--color-warning]">{req.leagues?.name ?? 'a league'}</span> is pending approval.
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[--color-text-secondary] text-sm">Contact your league admin for an invite.</p>
          )}
        </section>
      )}

      {/* Nav links */}
      <nav className="space-y-1 text-sm">
        <a href="/leaderboard" className="block text-[--color-info] hover:underline">
          [LEADERBOARD]
        </a>
        <a href="/settings" className="block text-[--color-info] hover:underline">
          [NOTIFICATION SETTINGS]
        </a>
        {isAdmin && (
          <a href="/admin" className="block text-[--color-warning] hover:underline font-bold">
            [ADMIN PANEL]
          </a>
        )}
      </nav>

      {/* Sign out */}
      <form action={signOut} className="pt-2">
        <button type="submit" className="text-[--color-error] text-sm hover:underline">
          [SIGN OUT]
        </button>
      </form>
    </div>
  );
}
