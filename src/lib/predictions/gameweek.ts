import { isKickoffLocked } from '@/lib/scoring';

interface PredictionGameweek {
  id: string;
}

interface PredictionFixture {
  gameweek_id: string | null;
  kickoff: string;
}

/** Pick the earliest gameweek that still contains a fixture open for predictions. */
export function selectPredictionGameweek<T extends PredictionGameweek>(
  gameweeks: T[],
  fixtures: PredictionFixture[],
  now: Date,
): T | undefined {
  const openGameweekId = gameweeks.find((gameweek) =>
    fixtures.some(
      (fixture) =>
        fixture.gameweek_id === gameweek.id &&
        !isKickoffLocked(new Date(fixture.kickoff), now),
    ),
  )?.id;

  return gameweeks.find((gameweek) => gameweek.id === openGameweekId) ?? gameweeks[0];
}
