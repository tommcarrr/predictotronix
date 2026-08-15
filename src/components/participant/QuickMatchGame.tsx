'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { submitPredictions } from '@/lib/predictions/actions';

const TOTAL_CHANCES = 8;
const METER_CYCLE_MS = 1_800;
const PERFECT_DISTANCE = 8;
const GOOD_DISTANCE = 18;

type TeamSide = 'home' | 'away';
type GamePhase = 'aiming' | 'resolved' | 'saving' | 'saved' | 'error';

export interface QuickMatchFixture {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  existingPrediction: { home: number; away: number } | null;
}

interface Score {
  home: number;
  away: number;
}

interface ChanceResult {
  goal: boolean;
  quality: 'PERFECT' | 'GOOD' | 'WIDE';
}

interface Props {
  fixture: QuickMatchFixture;
  onClose: () => void;
  onSaved: (homeScore: number, awayScore: number) => void;
}

export function markerPositionAtElapsed(elapsedMs: number): number {
  const progress = ((elapsedMs % METER_CYCLE_MS) + METER_CYCLE_MS) % METER_CYCLE_MS;
  const normalized = progress / METER_CYCLE_MS;
  return normalized <= 0.5 ? normalized * 200 : (1 - normalized) * 200;
}

export function resolveQuickMatchChance({
  markerPosition,
  targetPosition,
  attackingSide,
  random = Math.random,
}: {
  markerPosition: number;
  targetPosition: number;
  attackingSide: TeamSide;
  random?: () => number;
}): ChanceResult {
  const distance = Math.abs(markerPosition - targetPosition);
  const isHome = attackingSide === 'home';

  if (distance <= PERFECT_DISTANCE) {
    return { goal: random() < (isHome ? 0.48 : 0.42), quality: 'PERFECT' };
  }

  if (distance <= GOOD_DISTANCE) {
    return { goal: random() < (isHome ? 0.28 : 0.24), quality: 'GOOD' };
  }

  return { goal: random() < (isHome ? 0.06 : 0.05), quality: 'WIDE' };
}

function createTargetPosition(random = Math.random) {
  return 20 + random() * 60;
}

export function QuickMatchGame({ fixture, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const markerPositionRef = useRef(50);
  const titleId = useId();
  const instructionsId = useId();
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState<Score>({ home: 0, away: 0 });
  const [targetPosition, setTargetPosition] = useState(() => createTargetPosition());
  const [markerPosition, setMarkerPosition] = useState(50);
  const [phase, setPhase] = useState<GamePhase>('aiming');
  const [lastResult, setLastResult] = useState<ChanceResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  );

  const attackingSide: TeamSide = roundIndex % 2 === 0 ? 'home' : 'away';
  const attackingTeam = attackingSide === 'home' ? fixture.homeTeamName : fixture.awayTeamName;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');

    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'aiming' || reducedMotion) return;

    const startedAt = performance.now();
    let animationFrame = 0;

    function animate(now: number) {
      const position = markerPositionAtElapsed(now - startedAt);
      markerPositionRef.current = position;
      setMarkerPosition(position);
      animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [phase, reducedMotion, roundIndex]);

  function closeGame() {
    if (phase === 'saving') return;
    onClose();
  }

  async function saveResult(finalScore: Score) {
    setPhase('saving');
    setSaveError(null);

    try {
      const result = await submitPredictions([
        {
          fixtureId: fixture.id,
          homeScore: finalScore.home,
          awayScore: finalScore.away,
        },
      ]);

      if (!result.success) {
        setSaveError(result.errors.join('; ') || 'The prediction could not be saved.');
        setPhase('error');
        return;
      }

      onSaved(finalScore.home, finalScore.away);
      setPhase('saved');
    } catch {
      setSaveError('The prediction could not be saved. Check your connection and try again.');
      setPhase('error');
    }
  }

  function takeChance() {
    if (phase !== 'aiming') return;

    const result = resolveQuickMatchChance({
      markerPosition: markerPositionRef.current,
      targetPosition,
      attackingSide,
    });
    const nextScore = { ...score };
    if (result.goal) nextScore[attackingSide] += 1;

    setLastResult(result);
    setScore(nextScore);

    if (roundIndex === TOTAL_CHANCES - 1) {
      void saveResult(nextScore);
    } else {
      setPhase('resolved');
    }
  }

  function nextChance() {
    if (phase !== 'resolved') return;

    markerPositionRef.current = 50;
    setMarkerPosition(50);
    setTargetPosition(createTargetPosition());
    setLastResult(null);
    setRoundIndex((current) => current + 1);
    setPhase('aiming');
  }

  function setReducedMotionAim(value: number) {
    markerPositionRef.current = value;
    setMarkerPosition(value);
  }

  return (
    <dialog
      ref={dialogRef}
      className="quick-match-dialog"
      aria-labelledby={titleId}
      aria-describedby={instructionsId}
      onCancel={(event) => {
        if (phase === 'saving') event.preventDefault();
        else onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) closeGame();
      }}
    >
      <div className="quick-match-shell">
        <header className="quick-match-header">
          <div>
            <p className="quick-match-kicker">PREDICTOTRONIX QUICK MATCH</p>
            <h2 id={titleId} className="quick-match-title">
              {fixture.homeTeamName} v {fixture.awayTeamName}
            </h2>
          </div>
          <button
            type="button"
            className="quick-match-close"
            onClick={closeGame}
            disabled={phase === 'saving'}
            aria-label="Close Quick Match"
          >
            ×
          </button>
        </header>

        <p id={instructionsId} className="quick-match-instructions">
          Stop the marker inside the target zone. Eight alternating chances decide the score.
        </p>

        {fixture.existingPrediction && (
          <p className="quick-match-warning">
            Full time will replace your {fixture.existingPrediction.home}–
            {fixture.existingPrediction.away} prediction.
          </p>
        )}

        <div className="quick-match-scoreboard" aria-label="Quick Match score">
          <span>{fixture.homeTeamName}</span>
          <strong>
            {score.home}–{score.away}
          </strong>
          <span>{fixture.awayTeamName}</span>
        </div>

        <div className="quick-match-status" aria-live="polite">
          {phase === 'aiming' && (
            <>
              Chance {roundIndex + 1}/{TOTAL_CHANCES}: {attackingTeam} attack
            </>
          )}
          {phase === 'resolved' && lastResult && (
            <strong>{lastResult.goal ? 'GOAL!' : `${lastResult.quality} — NO GOAL`}</strong>
          )}
          {phase === 'saving' && (
            <strong>
              FULL TIME {score.home}–{score.away} — saving prediction…
            </strong>
          )}
          {phase === 'saved' && <strong>FULL TIME — prediction saved</strong>}
          {phase === 'error' && <strong>FULL TIME — save failed</strong>}
        </div>

        {(phase === 'aiming' || phase === 'resolved') && (
          <div className="quick-match-meter-wrap">
            <div className="quick-match-meter" aria-hidden="true">
              <span
                className="quick-match-target"
                style={{ left: `${targetPosition - PERFECT_DISTANCE}%` }}
              />
              <span className="quick-match-marker" style={{ left: `${markerPosition}%` }} />
            </div>

            {reducedMotion && phase === 'aiming' && (
              <label className="quick-match-aim-control">
                Aim position
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(markerPosition)}
                  onChange={(event) => setReducedMotionAim(Number(event.target.value))}
                />
              </label>
            )}
          </div>
        )}

        {saveError && <p className="quick-match-error">{saveError}</p>}

        <div className="quick-match-actions">
          {phase === 'aiming' && (
            <button
              type="button"
              className="participant-button participant-button--save"
              onClick={takeChance}
            >
              Take chance
            </button>
          )}
          {phase === 'resolved' && (
            <button
              type="button"
              className="participant-button participant-button--primary"
              onClick={nextChance}
            >
              Next chance
            </button>
          )}
          {phase === 'error' && (
            <button
              type="button"
              className="participant-button participant-button--save"
              onClick={() => void saveResult(score)}
            >
              Retry save
            </button>
          )}
          {phase === 'saved' && (
            <button
              type="button"
              className="participant-button participant-button--primary"
              onClick={closeGame}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
