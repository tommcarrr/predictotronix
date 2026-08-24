export const TOTAL_BREAKOUT_LEVELS = 10;
export const BRICK_HIT_POINTS = 50;
export const COMBO_SIZE = 5;
export const COMBO_BONUS = 250;
export const LIFE_LOSS_PENALTY = 1_000;
export const PERFECT_GAME_BONUS = 3_000;
export const MAX_BREAKOUT_RUN_MS = 45 * 60 * 1_000;
export const MINIMUM_MS_PER_BRICK_HIT = 120;

export interface BreakoutLevelDefinition {
  layout: readonly string[];
  paddleWidth: number;
  ballSpeedMultiplier: number;
  powerDropChance: number;
}

export interface BreakoutRunSummary {
  hitsByLevel: number[];
  comboAwards: number;
  livesLost: number;
  maxCombo: number;
  durationMs: number;
  finished: boolean;
}

export const BREAKOUT_LEVELS: readonly BreakoutLevelDefinition[] = [
  {
    layout: [
      '############',
      '############',
      '############',
      '############',
      '############',
      '############',
    ],
    paddleWidth: 150,
    ballSpeedMultiplier: 1,
    powerDropChance: 0.1,
  },
  {
    layout: [
      '....####....',
      '..########..',
      '.##########.',
      '############',
      '.##########.',
      '..########..',
    ],
    paddleWidth: 146,
    ballSpeedMultiplier: 1.05,
    powerDropChance: 0.095,
  },
  {
    layout: [
      '##........##',
      '.##......##.',
      '..##....##..',
      '...22..22...',
      '....2222....',
      '...##22##...',
      '..########..',
    ],
    paddleWidth: 142,
    ballSpeedMultiplier: 1.1,
    powerDropChance: 0.09,
  },
  {
    layout: [
      '222222222222',
      '2..#....#..2',
      '2..#.22.#..2',
      '2..######..2',
      '2..........2',
      '222..22..222',
    ],
    paddleWidth: 138,
    ballSpeedMultiplier: 1.15,
    powerDropChance: 0.085,
  },
  {
    layout: [
      '...222222...',
      '..22####22..',
      '.22######22.',
      '222.####.222',
      '.22######22.',
      '..22.##.22..',
      '...22..22...',
    ],
    paddleWidth: 134,
    ballSpeedMultiplier: 1.2,
    powerDropChance: 0.08,
  },
  {
    layout: [
      '22##22##22##',
      '##22##22##22',
      '.22##22##22.',
      '..22##22##..',
      '...22##22...',
      '....2222....',
    ],
    paddleWidth: 130,
    ballSpeedMultiplier: 1.25,
    powerDropChance: 0.075,
  },
  {
    layout: [
      '..22....22..',
      '.2222..2222.',
      '22##2222##22',
      '222222222222',
      '..22.22.22..',
      '.22......22.',
    ],
    paddleWidth: 126,
    ballSpeedMultiplier: 1.3,
    powerDropChance: 0.07,
  },
  {
    layout: [
      '333333333333',
      '.2222222222.',
      '..22222222..',
      '...222222...',
      '..22222222..',
      '.2222222222.',
      '333333333333',
    ],
    paddleWidth: 122,
    ballSpeedMultiplier: 1.35,
    powerDropChance: 0.065,
  },
  {
    layout: [
      '3333....3333',
      '3..322223..3',
      '3.33....33.3',
      '3.3.2222.3.3',
      '3.33....33.3',
      '3..322223..3',
      '3333....3333',
    ],
    paddleWidth: 118,
    ballSpeedMultiplier: 1.4,
    powerDropChance: 0.06,
  },
  {
    layout: [
      '..33333333..',
      '.3332222333.',
      '333222222333',
      '33.333333.33',
      '333222222333',
      '.3332222333.',
      '..33333333..',
    ],
    paddleWidth: 114,
    ballSpeedMultiplier: 1.45,
    powerDropChance: 0.055,
  },
] as const;

export const BREAKOUT_LEVEL_HIT_CAPS = BREAKOUT_LEVELS.map(({ layout }) =>
  [...layout.join('')].reduce((hits, brick) => hits + (brick === '#' ? 1 : Number(brick) || 0), 0)
);

export const MAX_BREAKOUT_SCORE = BREAKOUT_LEVEL_HIT_CAPS.reduce(
  (score, hits, index) => score + hits * BRICK_HIT_POINTS * (index + 1),
  BREAKOUT_LEVEL_HIT_CAPS.reduce(
    (bonus, hits) => bonus + Math.floor(hits / COMBO_SIZE) * COMBO_BONUS,
    PERFECT_GAME_BONUS
  )
);

export function brickHitPoints(level: number) {
  return BRICK_HIT_POINTS * level;
}

export function calculateBreakoutScore(summary: BreakoutRunSummary) {
  const baseScore = summary.hitsByLevel.reduce(
    (score, hits, index) => score + hits * brickHitPoints(index + 1),
    0
  );
  const perfectBonus = summary.finished && summary.livesLost === 0 ? PERFECT_GAME_BONUS : 0;
  return Math.max(
    0,
    baseScore +
      summary.comboAwards * COMBO_BONUS -
      summary.livesLost * LIFE_LOSS_PENALTY +
      perfectBonus
  );
}

export function isValidBreakoutRunSummary(value: unknown): value is BreakoutRunSummary {
  if (!value || typeof value !== 'object') return false;
  const summary = value as Partial<BreakoutRunSummary>;
  if (!Array.isArray(summary.hitsByLevel) || summary.hitsByLevel.length !== TOTAL_BREAKOUT_LEVELS)
    return false;
  if (!summary.hitsByLevel.every(Number.isInteger)) return false;
  if (
    ![summary.comboAwards, summary.livesLost, summary.maxCombo, summary.durationMs].every(
      Number.isInteger
    )
  )
    return false;
  if (typeof summary.finished !== 'boolean') return false;
  if (
    summary.comboAwards! < 0 ||
    summary.livesLost! < 0 ||
    summary.livesLost! > 99 ||
    summary.maxCombo! < 0 ||
    summary.durationMs! < 0 ||
    summary.durationMs! > MAX_BREAKOUT_RUN_MS
  )
    return false;

  let progressEnded = false;
  let completedLevels = 0;
  let totalHits = 0;
  let comboAwardCap = 0;
  for (let index = 0; index < BREAKOUT_LEVEL_HIT_CAPS.length; index += 1) {
    const hits = summary.hitsByLevel[index];
    const cap = BREAKOUT_LEVEL_HIT_CAPS[index];
    if (hits < 0 || hits > cap || (progressEnded && hits > 0)) return false;
    totalHits += hits;
    comboAwardCap += Math.floor(hits / COMBO_SIZE);
    if (!progressEnded && hits === cap) completedLevels += 1;
    else progressEnded = true;
  }

  if (summary.finished !== (completedLevels === TOTAL_BREAKOUT_LEVELS)) return false;
  if (summary.comboAwards! > comboAwardCap) return false;
  if (summary.maxCombo! > totalHits) return false;
  if (summary.durationMs! < totalHits * MINIMUM_MS_PER_BRICK_HIT) return false;
  return calculateBreakoutScore(summary as BreakoutRunSummary) <= MAX_BREAKOUT_SCORE;
}
