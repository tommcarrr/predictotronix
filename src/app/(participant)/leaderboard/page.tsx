import { redirect } from 'next/navigation';
import { getParticipant, requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const user = await requireUser().catch(() => null);
  if (!user) redirect('/login');

  const participant = await getParticipant();
  const supabase = await createClient();

  // Get the active season
  const { data: activeSeasons } = await supabase
    .from('season_participants')
    .select(`season_id, seasons!inner(id, name, league_id, leagues(name))`)
    .eq('participant_id', participant?.id ?? '')
    .eq('seasons.status', 'active')
    .limit(1);

  const activeSeason = (activeSeasons?.[0] as any)?.seasons;
  if (!activeSeason) redirect('/dashboard');

  // Get season leaderboard via RPC
  const { data: leaderboard } = await supabase.rpc('get_season_leaderboard', {
    p_season_id: activeSeason.id,
  });

  // Get gameweeks for gameweek selector
  const { data: gameweeks } = await supabase
    .from('gameweeks')
    .select('id, label, gameweek_number, status')
    .eq('season_id', activeSeason.id)
    .order('gameweek_number', { ascending: true });

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <header className="border-b-2 border-[--color-secondary] pb-3">
        <a href="/dashboard" className="text-[--color-text-secondary] text-xs hover:underline">
          ← DASHBOARD
        </a>
        <h1 className="text-[--color-warning] font-bold text-lg uppercase mt-1">
          LEADERBOARD — {activeSeason.name}
        </h1>
      </header>

      {/* Season leaderboard */}
      <section>
        <h2 className="text-[--color-info] text-sm font-bold mb-2 uppercase">SEASON STANDINGS</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[--color-primary] text-white text-xs uppercase">
                <th className="text-left p-2 w-8">Pos</th>
                <th className="text-left p-2">Player</th>
                <th className="text-right p-2">Pts</th>
                <th className="text-right p-2">★</th>
                <th className="text-right p-2">P</th>
              </tr>
            </thead>
            <tbody>
              {(leaderboard ?? []).map((row: any, i: number) => {
                const isMe = row.participant_id === participant?.id;
                return (
                  <tr
                    key={row.participant_id}
                    className={`border-b border-[--color-action-disabled] ${
                      isMe ? 'bg-[--color-primary] bg-opacity-20' : i % 2 === 0 ? '' : 'bg-[--color-action-disabled-bg]'
                    }`}
                  >
                    <td className="p-2 font-bold text-[--color-warning]">{row.position}</td>
                    <td className="p-2">
                      {row.display_name}
                      {isMe && <span className="ml-1 text-[--color-success] text-xs">◄ YOU</span>}
                    </td>
                    <td className="p-2 text-right font-bold text-[--color-success]">
                      {row.total_points}
                    </td>
                    <td className="p-2 text-right text-[--color-text-secondary]">
                      {row.exact_count}
                    </td>
                    <td className="p-2 text-right text-[--color-text-secondary]">
                      {row.predictions_submitted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[--color-text-secondary] text-xs mt-1">
          Pts = points | ★ = exact scores | P = predictions scored
        </p>
      </section>

      {/* Gameweek links */}
      <section>
        <h2 className="text-[--color-info] text-sm font-bold mb-2 uppercase">GAMEWEEK RESULTS</h2>
        <div className="flex flex-wrap gap-2">
          {(gameweeks ?? [])
            .filter((gw) => gw.status !== 'upcoming')
            .map((gw) => (
              <a
                key={gw.id}
                href={`/leaderboard/${gw.id}`}
                className="text-xs border border-[--color-info] text-[--color-info] px-2 py-1 hover:bg-[--color-primary] hover:text-white"
              >
                {gw.label}
              </a>
            ))}
        </div>
      </section>
    </div>
  );
}
