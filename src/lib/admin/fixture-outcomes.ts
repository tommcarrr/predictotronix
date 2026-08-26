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
