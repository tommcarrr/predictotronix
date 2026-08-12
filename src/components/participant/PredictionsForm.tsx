'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { submitPredictions } from '@/lib/predictions/actions';

interface Fixture {
  id: string;
  home_team_name: string;
  away_team_name: string;
  kickoff: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  result_confirmed: boolean;
  locked: boolean;
  prediction: {
    home_score: number;
    away_score: number;
    points_awarded: number | null;
    points_reason: string | null;
    is_admin_entered: boolean;
  } | null;
}

interface Props {
  fixtures: Fixture[];
}

export function PredictionsForm({ fixtures }: Props) {
  const [inputs, setInputs] = useState<Record<string, { home: string; away: string }>>(
    Object.fromEntries(
      fixtures.map((f) => [
        f.id,
        {
          home: f.prediction?.home_score?.toString() ?? '',
          away: f.prediction?.away_score?.toString() ?? '',
        },
      ])
    )
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    },
    []
  );

  function handleChange(fixtureId: string, side: 'home' | 'away', value: string) {
    const numeric = value.replace(/[^0-9]/g, '').slice(0, 2);
    setInputs((prev) => ({
      ...prev,
      [fixtureId]: { ...prev[fixtureId], [side]: numeric },
    }));

    if (focusTimer.current) clearTimeout(focusTimer.current);
    if (!numeric) return;
    focusTimer.current = setTimeout(() => {
      const editableInputs = Array.from(
        document.querySelectorAll<HTMLInputElement>('[data-prediction-score]:not(:disabled)')
      );
      const currentIndex = editableInputs.findIndex(
        (input) => input.dataset.fixtureId === fixtureId && input.dataset.side === side
      );
      editableInputs[currentIndex + 1]?.focus();
    }, 500);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const toSubmit = fixtures
      .filter((f) => !f.locked)
      .map((f) => ({
        fixtureId: f.id,
        homeScore: parseInt(inputs[f.id]?.home ?? '', 10),
        awayScore: parseInt(inputs[f.id]?.away ?? '', 10),
      }))
      .filter((p) => !isNaN(p.homeScore) && !isNaN(p.awayScore));

    if (toSubmit.length === 0) {
      setMessage('No valid predictions to submit.');
      return;
    }

    startTransition(async () => {
      const result = await submitPredictions(toSubmit);
      if (result.success) {
        setMessage(`✓ Saved ${result.saved} prediction(s).`);
      } else {
        setMessage(`Saved ${result.saved}. Errors: ${result.errors.join('; ')}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="participant-fixtures">
        {fixtures.map((f) => {
          const pred = f.prediction;
          const isScored = pred?.points_awarded !== null && pred?.points_awarded !== undefined;

          return (
            <div
              key={f.id}
              className={`participant-fixture ${f.locked ? 'participant-fixture--locked' : ''}`}
            >
              {/* Fixture header */}
              <div className="flex justify-between items-center text-xs text-[--color-text-secondary] mb-2">
                <span>
                  {new Date(f.kickoff).toLocaleString('en-GB', {
                    timeZone: 'Europe/London',
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {f.locked && <span className="text-[--color-error] font-bold text-xs">LOCKED</span>}
                {pred?.is_admin_entered && !f.locked && (
                  <span className="text-[--color-warning] text-xs">ADMIN-ENTERED</span>
                )}
              </div>

              {/* Team names and score inputs */}
              <div className="flex items-center gap-2 text-sm">
                <span className="participant-team-name flex-1 text-right">{f.home_team_name}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  disabled={f.locked}
                  value={inputs[f.id]?.home ?? ''}
                  onChange={(e) => handleChange(f.id, 'home', e.target.value)}
                  className="w-10 text-center bg-[--color-action-disabled-bg] border border-[--color-border] text-white p-1 disabled:opacity-50"
                  aria-label={`${f.home_team_name} score`}
                  data-prediction-score
                  data-fixture-id={f.id}
                  data-side="home"
                />
                <span className="text-[--color-text-secondary]">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  disabled={f.locked}
                  value={inputs[f.id]?.away ?? ''}
                  onChange={(e) => handleChange(f.id, 'away', e.target.value)}
                  className="w-10 text-center bg-[--color-action-disabled-bg] border border-[--color-border] text-white p-1 disabled:opacity-50"
                  aria-label={`${f.away_team_name} score`}
                  data-prediction-score
                  data-fixture-id={f.id}
                  data-side="away"
                />
                <span className="participant-team-name flex-1">{f.away_team_name}</span>
              </div>

              {/* Result and scoring */}
              {f.result_confirmed && f.home_score !== null && f.away_score !== null && (
                <div className="mt-2 text-xs text-[--color-text-secondary]">
                  Result: {f.home_score}–{f.away_score}
                  {isScored && (
                    <span
                      className={`ml-2 font-bold ${
                        pred!.points_awarded === 3
                          ? 'text-[--color-success]'
                          : pred!.points_awarded === 1
                            ? 'text-[--color-warning]'
                            : 'text-[--color-error]'
                      }`}
                    >
                      {pred!.points_awarded}pts ({pred!.points_reason})
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fixtures.some((f) => !f.locked) && (
        <button
          type="submit"
          disabled={isPending}
          className="participant-button participant-button--save w-full disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save predictions'}
        </button>
      )}

      {message && (
        <p
          className={`text-sm text-center ${
            message.startsWith('✓') ? 'text-[--color-success]' : 'text-[--color-warning]'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
