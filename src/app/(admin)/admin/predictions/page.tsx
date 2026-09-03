import { getAdminContext } from '@/lib/admin/context';
import { createServiceClient } from '@/lib/supabase/server';
import { AdminPredictionsForm } from '@/components/admin/AdminPredictionsForm';
import { selectPredictionGameweek } from '@/lib/predictions/gameweek';
import { getSeasonNow } from '@/lib/clock';

export const metadata = { title: 'Predictions | Admin' };

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ participantId?: string; gameweekId?: string; tab?: string }>;
}

interface ParticipantSummary {
  id: string;
  display_name: string;
  is_offline: boolean;
}

export default async function AdminPredictionsPage({ searchParams }: Props) {
  const { selectedSeason, user } = await getAdminContext();

  const { participantId = '', gameweekId = '', tab = 'predictions' } = await searchParams;
  const supabase = await createServiceClient();

  const [{ data: participantRows }, { data: gameweeks }, { data: seasonFixtures }] = selectedSeason
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
        supabase
          .from('fixtures')
          .select('id, gameweek_id, kickoff')
          .eq('season_id', selectedSeason.id)
          .order('kickoff', { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const participants = (participantRows ?? [])
    .map((row) => row.participants as unknown as ParticipantSummary | null)
    .filter((participant): participant is ParticipantSummary => Boolean(participant))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
  const seasonNow = selectedSeason ? await getSeasonNow(supabase, selectedSeason.id) : new Date();
  const defaultGameweek = selectPredictionGameweek(
    gameweeks ?? [],
    seasonFixtures ?? [],
    seasonNow
  );
  const selectedGameweek =
    (gameweeks ?? []).find((gameweek) => gameweek.id === gameweekId) ?? defaultGameweek;
  const selectedParticipant = participants.find((participant) => participant.id === participantId);

  const { data: fixtures } = selectedGameweek
    ? await supabase
        .from('fixtures')
        .select('id, home_team_name, away_team_name, kickoff, result_confirmed')
        .eq('gameweek_id', selectedGameweek.id)
        .order('kickoff', { ascending: true })
    : { data: [] };

  const fixtureIds = (fixtures ?? []).map((fixture) => fixture.id);
  const participantIds = participants.map((participant) => participant.id);
  const { data: gameweekPredictions } =
    fixtureIds.length && participantIds.length
      ? await supabase
          .from('predictions')
          .select('participant_id, fixture_id, home_score, away_score, points_awarded')
          .in('participant_id', participantIds)
          .in('fixture_id', fixtureIds)
      : { data: [] };
  const selectedPredictions = (gameweekPredictions ?? []).filter(
    (prediction) => prediction.participant_id === selectedParticipant?.id
  );
  const predictionMap = new Map(
    selectedPredictions.map((prediction) => [prediction.fixture_id, prediction])
  );
  const predictionCounts = new Map<string, number>();
  for (const prediction of gameweekPredictions ?? []) {
    predictionCounts.set(
      prediction.participant_id,
      (predictionCounts.get(prediction.participant_id) ?? 0) + 1
    );
  }

  const participantStatuses = participants.map((participant) => {
    const completed = predictionCounts.get(participant.id) ?? 0;
    const total = fixtureIds.length;
    const status =
      completed === 0 ? 'awaiting' : total > 0 && completed >= total ? 'ready' : 'in_progress';

    return {
      id: participant.id,
      label: participant.display_name,
      isOffline: participant.is_offline,
      completed,
      total,
      status,
    } as const;
  });

  const effectiveGameweekId = selectedGameweek?.id ?? '';
  const [{ data: messageRows }, { data: messageRead }] = selectedGameweek
    ? await Promise.all([
        supabase
          .from('gameweek_messages')
          .select(
            'id, participant_id, content, plain_text, created_at, updated_at, participants!inner(display_name)'
          )
          .eq('gameweek_id', selectedGameweek.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('admin_gameweek_message_reads')
          .select('last_read_at')
          .eq('gameweek_id', selectedGameweek.id)
          .eq('user_id', user.id)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];
  const lastReadAt = messageRead?.last_read_at ? new Date(messageRead.last_read_at).getTime() : 0;
  const messages = (messageRows ?? []).map((message) => ({
    id: message.id,
    participantId: message.participant_id,
    participantName: message.participants.display_name,
    content: message.content,
    plainText: message.plain_text,
    createdAt: message.created_at,
    updatedAt: message.updated_at,
    unread: new Date(message.updated_at).getTime() > lastReadAt,
  }));

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Participant Predictions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter or amend predictions on a participant&apos;s behalf. Admin entries remain editable
          after kickoff.
        </p>
      </div>

      {!selectedSeason ? (
        <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Select a working season before entering predictions.
        </p>
      ) : (
        <AdminPredictionsForm
          key={`${selectedParticipant?.id ?? ''}:${effectiveGameweekId}`}
          participants={participantStatuses}
          gameweeks={(gameweeks ?? []).map((gameweek) => ({
            id: gameweek.id,
            label: gameweek.label ?? `Gameweek ${gameweek.gameweek_number}`,
          }))}
          selectedParticipantId={selectedParticipant?.id ?? ''}
          selectedGameweekId={effectiveGameweekId}
          initialTab={tab === 'messages' ? 'messages' : 'predictions'}
          messages={messages}
          unreadMessageCount={messages.filter((message) => message.unread).length}
          llmFallbackConfigured={Boolean(process.env.OPENAI_API_KEY?.trim())}
          fixtures={(fixtures ?? []).map((fixture) => ({
            ...fixture,
            prediction: predictionMap.get(fixture.id) ?? null,
          }))}
        />
      )}
    </main>
  );
}
