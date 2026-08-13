'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminSubmitPredictions } from '@/lib/predictions/actions';

interface Option {
  id: string;
  label: string;
}

interface ParticipantOption extends Option {
  completed: number;
  total: number;
  status: 'awaiting' | 'in_progress' | 'ready';
  isOffline: boolean;
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
  participants: ParticipantOption[];
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
  const [participantName, setParticipantName] = useState('');
  const [hideReady, setHideReady] = useState(false);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const normalizedParticipantName = participantName.trim().toLocaleLowerCase();
  const filteredParticipants = participants.filter(
    (participant) =>
      (!normalizedParticipantName
        || participant.label.toLocaleLowerCase().includes(normalizedParticipantName))
      && (!hideReady || participant.status !== 'ready')
      && (!offlineOnly || participant.isOffline)
  );

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

    if (!selectedParticipantId || predictions.length === 0) {
      setMessage('Enter at least one complete prediction.');
      return;
    }

    startTransition(async () => {
      const result = await adminSubmitPredictions(selectedParticipantId, predictions);
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
      <div className="rounded-lg border border-border p-4">
        <label className="space-y-1 text-sm font-medium">
          <span>Gameweek</span>
          <select
            value={gameweekId}
            onChange={(event) => {
              const value = event.target.value;
              setGameweekId(value);
              navigate('', value);
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

      {gameweekId && fixtures.length === 0 && (
        <p className="text-sm text-muted-foreground">This gameweek has no fixtures.</p>
      )}

      {gameweekId && fixtures.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Participants</h2>
            <p className="text-sm text-muted-foreground">Select someone to enter or amend their picks.</p>
          </div>
          <div className="space-y-3 rounded-lg border border-border p-3">
            <label className="block space-y-1 text-sm font-medium">
              <span>Filter by name</span>
              <input
                type="search"
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                placeholder="Search participants"
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-normal"
              />
            </label>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hideReady}
                  onChange={(event) => setHideReady(event.target.checked)}
                  className="size-4 rounded border-border accent-primary"
                />
                <span>Hide ready</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={offlineOnly}
                  onChange={(event) => setOfflineOnly(event.target.checked)}
                  className="size-4 rounded border-border accent-primary"
                />
                <span>Offline only</span>
              </label>
            </div>
          </div>
          {filteredParticipants.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredParticipants.map((participant) => {
                const active = participant.id === selectedParticipantId;
                const status = participant.status === 'ready'
                  ? { label: 'Ready', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
                  : participant.status === 'in_progress'
                    ? { label: 'In progress', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' }
                    : { label: 'Awaiting picks', className: 'bg-muted text-muted-foreground' };

                return (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => navigate(participant.id, gameweekId)}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{participant.label}</span>
                      {participant.isOffline && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-semibold text-muted-foreground">
                          Offline
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {participant.completed}/{participant.total}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No participants match these filters.
            </p>
          )}
        </section>
      )}

      {selectedParticipantId && gameweekId && fixtures.length > 0 && (
        <form onSubmit={submit} className="space-y-4">
          <h2 className="border-b border-border pb-2 text-lg font-semibold">
            {participants.find((participant) => participant.id === selectedParticipantId)?.label}
          </h2>
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
