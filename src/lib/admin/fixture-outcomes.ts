import { scorePrediction } from '@/lib/scoring';

export interface FixtureOutcomePrediction {
  participantId: string;
  displayName: string;
  homeScore: number;
  awayScore: number;
}

interface ScoredPrediction {
  participant_id: string;
  home_score: number;
  away_score: number;
}

export function getFixtureOutcomeReason(
  prediction: ScoredPrediction,
  fixture: { result_confirmed: boolean; home_score: number | null; away_score: number | null }
) {
  if (!fixture.result_confirmed || fixture.home_score === null || fixture.away_score === null) {
    return null;
  }
  return scorePrediction(
    [prediction.home_score, prediction.away_score],
    [fixture.home_score, fixture.away_score]
  ).reason;
}

export function getActiveFixtureOutcomePrediction(
  prediction: ScoredPrediction,
  activeParticipantNames: ReadonlyMap<string, string>
): FixtureOutcomePrediction | null {
  const displayName = activeParticipantNames.get(prediction.participant_id);
  if (!displayName) return null;

  return {
    participantId: prediction.participant_id,
    displayName,
    homeScore: prediction.home_score,
    awayScore: prediction.away_score,
  };
}
