const SCORE_WEIGHTS = [30, 30, 20, 11, 6, 3] as const;
const TOTAL_WEIGHT = SCORE_WEIGHTS.reduce((total, weight) => total + weight, 0);

export function weightedRandomScore(random = Math.random): number {
  const target = random() * TOTAL_WEIGHT;
  let cumulativeWeight = 0;

  for (let score = 0; score < SCORE_WEIGHTS.length; score += 1) {
    cumulativeWeight += SCORE_WEIGHTS[score];
    if (target < cumulativeWeight) return score;
  }

  return SCORE_WEIGHTS.length - 1;
}
