import { redirect } from 'next/navigation';
import { getParticipant, requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isKickoffLocked } from '@/lib/scoring';
import { getSeasonNow } from '@/lib/clock';
import { PredictionsForm } from '@/components/participant/PredictionsForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ gameweekId: string }>;
}

export default async function PredictionsPage({ params }: Props) {
  const { gameweekId } = await params;
  const user = await requireUser().catch(() => null);
  if (!user) redirect('/login');

  const participant = await getParticipant();
  if (!participant) redirect('/dashboard');

  const supabase = await createClient();

  // Load gameweek
  const { data: gameweek } = await supabase
    .from('gameweeks')
    .select('id, label, gameweek_number, season_id, first_kickoff')
    .eq('id', gameweekId)
    .single();

  if (!gameweek) redirect('/dashboard');

  // Load fixtures for this gameweek
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('id, home_team_name, away_team_name, kickoff, status, home_score, away_score, result_confirmed')
    .eq('gameweek_id', gameweekId)
    .order('kickoff', { ascending: true });

  // Load existing predictions for this participant
  const { data: existingPredictions } = await supabase
    .from('predictions')
    .select('fixture_id, home_score, away_score, points_awarded, points_reason, is_admin_entered')
    .eq('participant_id', participant.id)
    .in('fixture_id', fixtures?.map((f) => f.id) ?? []);

  const predictionMap = new Map(
    (existingPredictions ?? []).map((p) => [p.fixture_id, p])
  );
  const seasonNow = await getSeasonNow(supabase, gameweek.season_id);

  const enrichedFixtures = (fixtures ?? []).map((f) => ({
    ...f,
    locked: isKickoffLocked(new Date(f.kickoff), seasonNow),
    prediction: predictionMap.get(f.id) ?? null,
  }));

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <header className="border-b-2 border-[--color-secondary] pb-3">
        <a href="/dashboard" className="text-[--color-text-secondary] text-xs hover:underline">
          ← DASHBOARD
        </a>
        <h1 className="text-[--color-warning] font-bold text-lg uppercase mt-1">
          {gameweek.label}
        </h1>
      </header>

      <PredictionsForm fixtures={enrichedFixtures} participantId={participant.id} />
    </div>
  );
}
