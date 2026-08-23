import type { ApiFixture, FixtureProvider } from '@/lib/api-football/types';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const PREMIER_LEAGUE_ID = 39;

interface FplTeam {
  id: number;
  name: string;
}

interface FplEvent {
  id: number;
  deadline_time: string;
}

interface FplBootstrap {
  teams: FplTeam[];
  events: FplEvent[];
}

interface FplFixture {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
}

async function fplFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${FPL_BASE_URL}${path}`, { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`FPL API error: ${response.status} ${response.statusText} — ${path}`);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`FPL API returned a non-JSON response — ${path}`);
  }
}

function fplSeason(events: FplEvent[]): number | null {
  const firstDeadline = events.find((event) => event.deadline_time)?.deadline_time;
  return firstDeadline ? new Date(firstDeadline).getUTCFullYear() : null;
}

function fplStatus(fixture: FplFixture) {
  if (fixture.finished || fixture.finished_provisional) {
    return { short: 'FT', long: 'Match Finished' };
  }
  if (fixture.started) {
    return { short: '1H', long: 'Match in progress' };
  }
  return { short: 'NS', long: 'Not Started' };
}

/** Unauthenticated current-season Premier League provider backed by the public FPL API. */
export class FplFixtureProvider implements FixtureProvider {
  readonly name = 'Fantasy Premier League API';
  private bootstrapPromise?: Promise<FplBootstrap>;
  private fixturesPromise?: Promise<FplFixture[]>;

  private bootstrap() {
    return (this.bootstrapPromise ??= fplFetch<FplBootstrap>('/bootstrap-static/'));
  }

  private fixtures() {
    return (this.fixturesPromise ??= fplFetch<FplFixture[]>('/fixtures/'));
  }

  private async mappedFixtures(leagueId: number, season: number): Promise<ApiFixture[]> {
    if (leagueId !== PREMIER_LEAGUE_ID) {
      throw new Error(`FPL API supports Premier League ID 39 only; received league ${leagueId}.`);
    }

    const [bootstrap, fixtures] = await Promise.all([this.bootstrap(), this.fixtures()]);
    const availableSeason = fplSeason(bootstrap.events);
    if (availableSeason !== season) {
      throw new Error(
        `FPL API exposes the current ${availableSeason ?? 'unknown'} season, but season ${season} was requested.`
      );
    }

    const teams = new Map(bootstrap.teams.map((team) => [team.id, team.name]));
    return fixtures.flatMap((fixture): ApiFixture[] => {
      const homeName = teams.get(fixture.team_h);
      const awayName = teams.get(fixture.team_a);
      if (!fixture.kickoff_time || !homeName || !awayName) return [];
      return [{
        // Namespace public FPL IDs away from positive API-Football IDs in the legacy column.
        id: -fixture.id,
        date: fixture.kickoff_time,
        status: fplStatus(fixture),
        teams: {
          home: { id: fixture.team_h, name: homeName },
          away: { id: fixture.team_a, name: awayName },
        },
        goals: { home: fixture.team_h_score, away: fixture.team_a_score },
        league: {
          id: PREMIER_LEAGUE_ID,
          season,
          round: fixture.event ? `Regular Season - ${fixture.event}` : 'Unassigned',
        },
      }];
    });
  }

  getSeasonFixtures(leagueId: number, season: number) {
    return this.mappedFixtures(leagueId, season);
  }

  async getRoundFixtures(leagueId: number, season: number, round: string) {
    const fixtures = await this.mappedFixtures(leagueId, season);
    return fixtures.filter((fixture) => fixture.league.round === round);
  }

  async getFixture(fixtureId: number) {
    const bootstrap = await this.bootstrap();
    const season = fplSeason(bootstrap.events);
    if (season === null) return null;
    const mapped = await this.mappedFixtures(PREMIER_LEAGUE_ID, season);
    return mapped.find((fixture) => fixture.id === fixtureId) ?? null;
  }

  async getRounds(leagueId: number, season: number) {
    const fixtures = await this.mappedFixtures(leagueId, season);
    return [...new Set(fixtures.map((fixture) => fixture.league.round))]
      .filter((round) => round !== 'Unassigned');
  }
}
