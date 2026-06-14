/** Abstract fixture data provider interface.
 *  Allows swapping real API data for test/synthetic data per season. */

export interface ApiFixture {
  id: number;
  date: string; // ISO 8601
  status: {
    short: string; // e.g. 'NS', 'FT', 'PST', 'CANC', 'ABD'
    long: string;
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    id: number;
    season: number;
    round: string; // e.g. "Regular Season - 1"
  };
}

export interface ApiRound {
  round: string; // e.g. "Regular Season - 1"
}

export interface FixtureProvider {
  /** Fetch all fixtures for a season. */
  getSeasonFixtures(leagueId: number, season: number): Promise<ApiFixture[]>;

  /** Fetch fixtures for a specific round/gameweek. */
  getRoundFixtures(leagueId: number, season: number, round: string): Promise<ApiFixture[]>;

  /** Fetch a single fixture by its API ID. */
  getFixture(fixtureId: number): Promise<ApiFixture | null>;

  /** Fetch the list of rounds for a season. */
  getRounds(leagueId: number, season: number): Promise<string[]>;
}
