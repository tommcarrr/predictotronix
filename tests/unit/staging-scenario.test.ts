import { describe, expect, it } from 'vitest';
import {
  buildStagingScenario,
  deterministicUuid,
  STAGING_LEAGUE_ID,
  STAGING_SEASON_ID,
} from '../../scripts/staging/scenario.mts';

describe('staging scenario generator', () => {
  const now = new Date('2026-01-14T16:00:00.000Z');

  it('is deterministic for a fixed clock', () => {
    expect(buildStagingScenario(now)).toEqual(buildStagingScenario(now));
    expect(STAGING_LEAGUE_ID).toBe(deterministicUuid('league'));
    expect(STAGING_SEASON_ID).toBe(deterministicUuid('season'));
  });

  it('creates a complete realistic season shape', () => {
    const scenario = buildStagingScenario(now);

    expect(scenario.gameweeks).toHaveLength(38);
    expect(scenario.fixtures).toHaveLength(380);
    expect(scenario.participants).toHaveLength(30);
    expect(scenario.gameweeks.filter((gameweek) => gameweek.status === 'completed')).toHaveLength(19);
    expect(scenario.gameweeks.filter((gameweek) => gameweek.status === 'in_progress')).toHaveLength(1);
    expect(scenario.gameweeks.filter((gameweek) => gameweek.status === 'upcoming')).toHaveLength(18);
  });

  it('contains current-season edge cases and varied participation', () => {
    const scenario = buildStagingScenario(now);
    const currentFixtures = scenario.fixtures.filter(
      (fixture) => fixture.gameweek_id === scenario.gameweeks[19].id,
    );

    expect(currentFixtures.some((fixture) => fixture.status === 'finished')).toBe(true);
    expect(currentFixtures.some((fixture) => fixture.status === 'live')).toBe(true);
    expect(currentFixtures.some((fixture) => fixture.status === 'scheduled')).toBe(true);
    expect(currentFixtures.some((fixture) => fixture.status === 'postponed')).toBe(true);

    const predictionCounts = scenario.participants.map(
      (participant) =>
        scenario.predictions.filter(
          (prediction) => prediction.participant_id === participant.id,
        ).length,
    );
    expect(new Set(predictionCounts).size).toBeGreaterThan(3);
    expect(scenario.completedFixtureIds).toHaveLength(193);
  });

  it('uses unique deterministic identifiers', () => {
    const scenario = buildStagingScenario(now);
    const identifiers = [
      ...scenario.participants.map((participant) => participant.id),
      ...scenario.gameweeks.map((gameweek) => gameweek.id),
      ...scenario.fixtures.map((fixture) => fixture.id),
      ...scenario.predictions.map((prediction) => prediction.id),
    ];

    expect(new Set(identifiers)).toHaveLength(identifiers.length);
  });
});
