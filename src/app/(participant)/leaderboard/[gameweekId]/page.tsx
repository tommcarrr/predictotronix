import { redirect } from 'next/navigation';
import { getParticipant, requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ gameweekId: string }>;
}

export default async function GameweekLeaderboardPage({ params }: Props) {
  const { gameweekId } = await params;
  const user = await requireUser().catch(() => null);
  if (!user) redirect('/login');

  const participant = await getParticipant();
  const supabase = await createClient();

  const { data: gameweek } = await supabase
    .from('gameweeks')
    .select('id, label, gameweek_number, season_id, status')
    .eq('id', gameweekId)
    .single();

  if (!gameweek) redirect('/leaderboard');

  // Get neighbouring gameweeks for prev/next navigation
  const { data: allGameweeks } = await supabase
    .from('gameweeks')
    .select('id, gameweek_number, label, status')
    .eq('season_id', gameweek.season_id)
    .order('gameweek_number', { ascending: true });

  const idx = (allGameweeks ?? []).findIndex((gw) => gw.id === gameweekId);
  const prev = idx > 0 ? allGameweeks![idx - 1] : null;
  const next = idx >= 0 && idx < (allGameweeks?.length ?? 0) - 1 ? allGameweeks![idx + 1] : null;

  // Get gameweek leaderboard via RPC
  const { data: leaderboard } = await supabase.rpc('get_gameweek_leaderboard', {
    p_gameweek_id: gameweekId,
  });

  // My predictions for this gameweek (for breakdown)
  const myPredictions = participant
    ? await (async () => {
        const { data: fixtures } = await supabase
          .from('fixtures')
          .select('id, home_team_name, away_team_name, home_score, away_score, result_confirmed')
          .eq('gameweek_id', gameweekId)
          .order('kickoff', { ascending: true });

        const { data: preds } = await supabase
          .from('predictions')
          .select('fixture_id, home_score, away_score, points_awarded, points_reason')
          .eq('participant_id', participant.id)
          .in('fixture_id', (fixtures ?? []).map((f) => f.id));

        const predMap = new Map((preds ?? []).map((p) => [p.fixture_id, p]));
        return (fixtures ?? []).map((f) => ({ ...f, prediction: predMap.get(f.id) ?? null }));
      })()
    : [];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <header className="border-b-2 border-[--color-secondary] pb-3">
        <a href="/leaderboard" className="text-[--color-text-secondary] text-xs hover:underline">
          ← SEASON LEADERBOARD
        </a>
        <h1 className="text-[--color-warning] font-bold text-lg uppercase mt-1">
          {gameweek.label}
        </h1>

        {/* Prev / Next navigation */}
        <div className="flex gap-4 mt-2 text-xs">
          {prev ? (
            <a href={`/leaderboard/${prev.id}`} className="text-[--color-info] hover:underline">
              ← {prev.label}
            </a>
          ) : <span />}
          {next && next.status !== 'upcoming' && (
            <a href={`/leaderboard/${next.id}`} className="text-[--color-info] hover:underline ml-auto">
              {next.label} →
            </a>
          )}
        </div>
      </header>

      {/* Gameweek leaderboard */}
      <section>
        <h2 className="text-[--color-info] text-sm font-bold mb-2 uppercase">GAMEWEEK STANDINGS</h2>
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
                    <td className="p-2 text-right font-bold text-[--color-success]">{row.total_points}</td>
                    <td className="p-2 text-right text-[--color-text-secondary]">{row.exact_count}</td>
                    <td className="p-2 text-right text-[--color-text-secondary]">
                      {row.predictions_submitted}/{row.fixtures_in_gameweek}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[--color-text-secondary] text-xs mt-1">
          Pts = points | ★ = exact scores | P = predictions/fixtures
        </p>
      </section>

      {/* My scoring breakdown */}
      {myPredictions.length > 0 && (
        <section>
          <h2 className="text-[--color-info] text-sm font-bold mb-2 uppercase">MY PREDICTIONS</h2>
          <div className="space-y-1">
            {myPredictions.map((f: any) => (
              <div key={f.id} className="border border-[--color-action-disabled] p-2 text-sm flex items-center gap-3">
                <div className="flex-1 text-xs">
                  <span className="font-bold">{f.home_team_name}</span>
                  <span className="text-[--color-text-secondary]"> vs </span>
                  <span className="font-bold">{f.away_team_name}</span>
                </div>
                {f.prediction ? (
                  <span className="text-[--color-text-secondary] text-xs">
                    {f.prediction.home_score}–{f.prediction.away_score}
                  </span>
                ) : (
                  <span className="text-[--color-action-disabled] text-xs">no pred</span>
                )}
                {f.result_confirmed && f.home_score !== null && (
                  <span className="text-xs text-[--color-text-secondary]">
                    ({f.home_score}–{f.away_score})
                  </span>
                )}
                {f.prediction?.points_awarded !== null && f.prediction?.points_awarded !== undefined && (
                  <span className={`text-xs font-bold min-w-8 text-right ${
                    f.prediction.points_awarded === 3 ? 'text-[--color-success]' :
                    f.prediction.points_awarded === 1 ? 'text-[--color-warning]' :
                    'text-[--color-error]'
                  }`}>
                    {f.prediction.points_awarded}pts
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
