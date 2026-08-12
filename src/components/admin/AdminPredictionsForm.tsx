'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminSubmitPredictions } from '@/lib/predictions/actions';

interface Option {
  id: string;
  label: string;
}

interface Fixture {
  id: string;
  home_team_name: string;
  away_team_name: string;
  kickoff: string;
  result_confirmed: boolean;
  prediction: {
    home_score: number;
    away_score: number;
    points_awarded: number | null;
  } | null;
}

interface Props {
  participants: Option[];
  gameweeks: Option[];
  selectedParticipantId: string;
  selectedGameweekId: string;
  fixtures: Fixture[];
}

export function AdminPredictionsForm({
  participants,
  gameweeks,
  selectedParticipantId,
  selectedGameweekId,
  fixtures,
}: Props) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState(selectedParticipantId);
  const [gameweekId, setGameweekId] = useState(selectedGameweekId);
  const [inputs, setInputs] = useState<Record<string, { home: string; away: string }>>(
    Object.fromEntries(
      fixtures.map((fixture) => [
        fixture.id,
        {
          home: fixture.prediction?.home_score.toString() ?? '',
          away: fixture.prediction?.away_score.toString() ?? '',
        },
      ])
    )
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function navigate(nextParticipantId: string, nextGameweekId: string) {
    const params = new URLSearchParams();
    if (nextParticipantId) params.set('participantId', nextParticipantId);
    if (nextGameweekId) params.set('gameweekId', nextGameweekId);
    router.push(`/admin/predictions?${params.toString()}`);
  }

  function changeScore(fixtureId: string, side: 'home' | 'away', value: string) {
    const numeric = value.replace(/[^0-9]/g, '').slice(0, 2);
    setInputs((current) => ({
      ...current,
      [fixtureId]: { ...current[fixtureId], [side]: numeric },
    }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const predictions = fixtures
      .map((fixture) => ({
        fixtureId: fixture.id,
        homeScore: Number.parseInt(inputs[fixture.id]?.home ?? '', 10),
        awayScore: Number.parseInt(inputs[fixture.id]?.away ?? '', 10),
      }))
      .filter((prediction) =>
        Number.isInteger(prediction.homeScore) && Number.isInteger(prediction.awayScore)
      );

    if (!participantId || predictions.length === 0) {
      setMessage('Enter at least one complete prediction.');
      return;
    }

    startTransition(async () => {
      const result = await adminSubmitPredictions(participantId, predictions);
      setMessage(
        result.success
          ? `Saved ${result.saved} prediction${result.saved === 1 ? '' : 's'}.`
          : `Saved ${result.saved}. ${result.errors.join('; ')}`
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          <span>Participant</span>
          <select
            value={participantId}
            onChange={(event) => {
              const value = event.target.value;
              setParticipantId(value);
              navigate(value, gameweekId);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="">Select a participant</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>{participant.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          <span>Gameweek</span>
          <select
            value={gameweekId}
            onChange={(event) => {
              const value = event.target.value;
              setGameweekId(value);
              navigate(participantId, value);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="">Select a gameweek</option>
            {gameweeks.map((gameweek) => (
              <option key={gameweek.id} value={gameweek.id}>{gameweek.label}</option>
            ))}
          </select>
        </label>
      </div>

      {participantId && gameweekId && fixtures.length === 0 && (
        <p className="text-sm text-muted-foreground">This gameweek has no fixtures.</p>
      )}

      {participantId && gameweekId && fixtures.length > 0 && (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            {fixtures.map((fixture) => (
              <div key={fixture.id} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{new Date(fixture.kickoff).toLocaleString('en-GB', {
                    timeZone: 'Europe/London',
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                  {fixture.result_confirmed && <span>Result confirmed</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-right font-medium">{fixture.home_team_name}</span>
                  <input
                    aria-label={`${fixture.home_team_name} score`}
                    value={inputs[fixture.id]?.home ?? ''}
                    onChange={(event) => changeScore(fixture.id, 'home', event.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    className="w-12 rounded border border-border bg-background p-2 text-center"
                  />
                  <span className="text-muted-foreground">–</span>
                  <input
                    aria-label={`${fixture.away_team_name} score`}
                    value={inputs[fixture.id]?.away ?? ''}
                    onChange={(event) => changeScore(fixture.id, 'away', event.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    className="w-12 rounded border border-border bg-background p-2 text-center"
                  />
                  <span className="flex-1 font-medium">{fixture.away_team_name}</span>
                </div>
                {fixture.prediction?.points_awarded != null && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Current points: {fixture.prediction.points_awarded}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save predictions'}
          </button>
          {message && <p className="text-center text-sm" role="status">{message}</p>}
        </form>
      )}
    </div>
  );
}
