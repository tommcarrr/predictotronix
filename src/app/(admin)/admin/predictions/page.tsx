import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admin/context';
import { createServiceClient } from '@/lib/supabase/server';
import { AdminPredictionsForm } from '@/components/admin/AdminPredictionsForm';

export const metadata = { title: 'Predictions | Admin' };

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ participantId?: string; gameweekId?: string }>;
}

export default async function AdminPredictionsPage({ searchParams }: Props) {
  const { selectedSeason, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');

  const { participantId = '', gameweekId = '' } = await searchParams;
  const supabase = await createServiceClient();

  const [{ data: participantRows }, { data: gameweeks }] = selectedSeason
    ? await Promise.all([
        supabase
          .from('season_participants')
          .select('participant_id, participants!inner(id, display_name, is_offline)')
          .eq('season_id', selectedSeason.id),
        supabase
          .from('gameweeks')
          .select('id, label, gameweek_number')
          .eq('season_id', selectedSeason.id)
          .order('gameweek_number', { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  const participants = (participantRows ?? [])
    .map((row: any) => row.participants)
    .filter(Boolean)
    .sort((a: any, b: any) => a.display_name.localeCompare(b.display_name));
  const selectedParticipant = participants.find((participant: any) => participant.id === participantId);
  const selectedGameweek = (gameweeks ?? []).find((gameweek) => gameweek.id === gameweekId);

  const { data: fixtures } = selectedParticipant && selectedGameweek
    ? await supabase
        .from('fixtures')
        .select('id, home_team_name, away_team_name, kickoff, result_confirmed')
        .eq('gameweek_id', selectedGameweek.id)
        .order('kickoff', { ascending: true })
    : { data: [] };

  const fixtureIds = (fixtures ?? []).map((fixture) => fixture.id);
  const { data: predictions } = selectedParticipant && fixtureIds.length
    ? await supabase
        .from('predictions')
        .select('fixture_id, home_score, away_score, points_awarded')
        .eq('participant_id', selectedParticipant.id)
        .in('fixture_id', fixtureIds)
    : { data: [] };
  const predictionMap = new Map((predictions ?? []).map((prediction) => [prediction.fixture_id, prediction]));

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Participant Predictions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter or amend predictions on a participant&apos;s behalf. Admin entries remain editable after kickoff.
        </p>
      </div>

      {!selectedSeason ? (
        <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Select a working season before entering predictions.
        </p>
      ) : (
        <AdminPredictionsForm
          key={`${participantId}:${gameweekId}`}
          participants={participants.map((participant: any) => ({
            id: participant.id,
            label: `${participant.display_name}${participant.is_offline ? ' (offline)' : ''}`,
          }))}
          gameweeks={(gameweeks ?? []).map((gameweek) => ({
            id: gameweek.id,
            label: gameweek.label ?? `Gameweek ${gameweek.gameweek_number}`,
          }))}
          selectedParticipantId={selectedParticipant?.id ?? ''}
          selectedGameweekId={selectedGameweek?.id ?? ''}
          fixtures={(fixtures ?? []).map((fixture) => ({
            ...fixture,
            prediction: predictionMap.get(fixture.id) ?? null,
          }))}
        />
      )}
    </main>
  );
}
