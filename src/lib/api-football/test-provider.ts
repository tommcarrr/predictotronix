import type { ApiFixture, FixtureProvider } from './types';

/**
 * Test fixture provider for synthetic/historical data.
 * Used by test/demo seasons to avoid consuming real API quota
 * and to enable pre-season end-to-end testing.
 */
export class TestFixtureProvider implements FixtureProvider {
  private fixtures: ApiFixture[];

  constructor(fixtures: ApiFixture[] = []) {
    this.fixtures = fixtures;
  }

  async getSeasonFixtures(leagueId: number, season: number): Promise<ApiFixture[]> {
    return this.fixtures.filter(
      (f) => f.league.id === leagueId && f.league.season === season
    );
  }

  async getRoundFixtures(leagueId: number, season: number, round: string): Promise<ApiFixture[]> {
    return this.fixtures.filter(
      (f) =>
        f.league.id === leagueId &&
        f.league.season === season &&
        f.league.round === round
    );
  }

  async getFixture(fixtureId: number): Promise<ApiFixture | null> {
    return this.fixtures.find((f) => f.id === fixtureId) ?? null;
  }

  async getRounds(leagueId: number, season: number): Promise<string[]> {
    const rounds = new Set(
      this.fixtures
        .filter((f) => f.league.id === leagueId && f.league.season === season)
        .map((f) => f.league.round)
    );
    return [...rounds].sort();
  }
}
