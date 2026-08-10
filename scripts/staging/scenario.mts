import { createHash } from 'node:crypto';

export const STAGING_SCENARIO_KEY = 'predictotronix-mid-season-v1';
export const STAGING_LEAGUE_ID = deterministicUuid('league');
export const STAGING_SEASON_ID = deterministicUuid('season');

export const STAGING_PERSONAS = [
  { key: 'superadmin', displayName: 'Sam Super Admin', role: 'super_admin' },
  { key: 'leagueadmin', displayName: 'Alex League Admin', role: 'league_admin' },
  { key: 'player', displayName: 'Priya Player', role: null },
  { key: 'pending', displayName: 'Penny Pending', role: null },
  { key: 'outsider', displayName: 'Oscar Outsider', role: null },
] as const;

const TEAMS = [
  'Arsenal',
  'Aston Villa',
  'Bournemouth',
  'Brentford',
  'Brighton',
  'Burnley',
  'Chelsea',
  'Crystal Palace',
  'Everton',
  'Fulham',
  'Leeds United',
  'Liverpool',
  'Manchester City',
  'Manchester United',
  'Newcastle United',
  'Nottingham Forest',
  'Sunderland',
  'Tottenham Hotspur',
  'West Ham United',
  'Wolverhampton Wanderers',
] as const;

export interface ScenarioPersona {
  key: (typeof STAGING_PERSONAS)[number]['key'];
  displayName: string;
  email: string;
  password: string;
  role: 'super_admin' | 'league_admin' | null;
}

export interface ScenarioParticipant {
  id: string;
  display_name: string;
  email: string;
  mobile: string | null;
  is_offline: boolean;
  personaKey: ScenarioPersona['key'] | null;
}

export interface ScenarioGameweek {
  id: string;
  season_id: string;
  gameweek_number: number;
  label: string;
  api_football_round: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  first_kickoff: string;
}

export interface ScenarioFixture {
  id: string;
  season_id: string;
  gameweek_id: string;
  api_football_fixture_id: number;
  home_team_name: string;
  away_team_name: string;
  home_team_api_id: number;
  away_team_api_id: number;
  kickoff: string;
  status: 'finished' | 'live' | 'scheduled' | 'postponed';
  home_score: number | null;
  away_score: number | null;
  result_confirmed: boolean;
  api_football_status: string;
  api_football_data: Record<string, unknown>;
  last_synced_at: string;
}

export interface ScenarioPrediction {
  id: string;
  fixture_id: string;
  participant_id: string;
  season_id: string;
  home_score: number;
  away_score: number;
  is_admin_entered: boolean;
}

export interface StagingScenario {
  generatedAt: string;
  personas: ScenarioPersona[];
  participants: ScenarioParticipant[];
  gameweeks: ScenarioGameweek[];
  fixtures: ScenarioFixture[];
  predictions: ScenarioPrediction[];
  completedFixtureIds: string[];
}

export function deterministicUuid(key: string): string {
  const hex = createHash('sha256')
    .update(`${STAGING_SCENARIO_KEY}:${key}`)
    .digest('hex')
    .slice(0, 32)
    .split('');

  hex[12] = '4';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function seededNumber(key: string, modulus: number): number {
  const value = createHash('sha256')
    .update(`${STAGING_SCENARIO_KEY}:${key}`)
    .digest()
    .readUInt32BE(0);
  return value % modulus;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function kickoffFor(
  currentGameweekStart: Date,
  gameweekNumber: number,
  fixtureIndex: number,
): Date {
  const weekOffset = gameweekNumber - 20;
  const dayOffsets = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2];
  const hourOffsets = [12.5, 15, 15, 17.5, 14, 16.5, 19, 20, 14, 16.5];
  const kickoff = addDays(currentGameweekStart, weekOffset * 7 + dayOffsets[fixtureIndex]);
  kickoff.setUTCHours(
    Math.floor(hourOffsets[fixtureIndex]),
    hourOffsets[fixtureIndex] % 1 === 0.5 ? 30 : 0,
    0,
    0,
  );
  return kickoff;
}

function pairTeams(gameweekNumber: number): Array<[number, number]> {
  const rotating = [...Array(TEAMS.length).keys()];
  for (let index = 0; index < gameweekNumber - 1; index++) {
    rotating.splice(1, 0, rotating.pop()!);
  }

  return Array.from({ length: 10 }, (_, index) => {
    const home = rotating[index];
    const away = rotating[rotating.length - 1 - index];
    return (gameweekNumber + index) % 2 === 0 ? [home, away] : [away, home];
  });
}

export function buildStagingScenario(
  now: Date = new Date(),
  emailDomain = 'staging.predictotronix.test',
): StagingScenario {
  const generatedAt = now.toISOString();
  const currentGameweekStart = new Date(now);
  currentGameweekStart.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
  currentGameweekStart.setUTCHours(0, 0, 0, 0);

  const password = 'StagingOnly!ChangeMe123';
  const personas: ScenarioPersona[] = STAGING_PERSONAS.map((persona) => ({
    ...persona,
    email: `${persona.key}@${emailDomain}`,
    password,
  }));

  const personaParticipants: ScenarioParticipant[] = personas
    .filter((persona) => !['pending', 'outsider'].includes(persona.key))
    .map((persona) => ({
      id: deterministicUuid(`participant:${persona.key}`),
      display_name: persona.displayName,
      email: persona.email,
      mobile: null,
      is_offline: false,
      personaKey: persona.key,
    }));

  const offlineParticipants: ScenarioParticipant[] = Array.from(
    { length: 27 },
    (_, index) => ({
      id: deterministicUuid(`participant:offline:${index + 1}`),
      display_name: `Player ${String(index + 1).padStart(2, '0')}`,
      email: `player${String(index + 1).padStart(2, '0')}@${emailDomain}`,
      mobile: index % 6 === 0 ? `+4477009${String(index).padStart(5, '0')}` : null,
      is_offline: true,
      personaKey: null,
    }),
  );
  const participants = [...personaParticipants, ...offlineParticipants];

  const gameweeks: ScenarioGameweek[] = [];
  const fixtures: ScenarioFixture[] = [];

  for (let gameweekNumber = 1; gameweekNumber <= 38; gameweekNumber++) {
    const gameweekId = deterministicUuid(`gameweek:${gameweekNumber}`);
    const status =
      gameweekNumber <= 19
        ? 'completed'
        : gameweekNumber === 20
          ? 'in_progress'
          : 'upcoming';
    const pairs = pairTeams(gameweekNumber);
    const firstKickoff = kickoffFor(currentGameweekStart, gameweekNumber, 0);

    gameweeks.push({
      id: gameweekId,
      season_id: STAGING_SEASON_ID,
      gameweek_number: gameweekNumber,
      label: `Gameweek ${gameweekNumber}`,
      api_football_round: `Regular Season - ${gameweekNumber}`,
      status,
      first_kickoff: firstKickoff.toISOString(),
    });

    pairs.forEach(([homeIndex, awayIndex], fixtureIndex) => {
      const fixtureId = deterministicUuid(`fixture:${gameweekNumber}:${fixtureIndex}`);
      const kickoff = kickoffFor(
        currentGameweekStart,
        gameweekNumber,
        fixtureIndex,
      );
      const completed = gameweekNumber <= 19;
      const currentFinished = gameweekNumber === 20 && fixtureIndex < 3;
      const currentLive = gameweekNumber === 20 && fixtureIndex === 3;
      const postponed = gameweekNumber === 20 && fixtureIndex === 9;
      const homeScore =
        completed || currentFinished
          ? seededNumber(`result:${fixtureId}:home`, 5)
          : currentLive
            ? 1
            : null;
      const awayScore =
        completed || currentFinished
          ? seededNumber(`result:${fixtureId}:away`, 4)
          : currentLive
            ? 1
            : null;
      const fixtureStatus = postponed
        ? 'postponed'
        : completed || currentFinished
          ? 'finished'
          : currentLive
            ? 'live'
            : 'scheduled';

      fixtures.push({
        id: fixtureId,
        season_id: STAGING_SEASON_ID,
        gameweek_id: gameweekId,
        api_football_fixture_id: 9_000_000 + gameweekNumber * 100 + fixtureIndex,
        home_team_name: TEAMS[homeIndex],
        away_team_name: TEAMS[awayIndex],
        home_team_api_id: 1000 + homeIndex,
        away_team_api_id: 1000 + awayIndex,
        kickoff: kickoff.toISOString(),
        status: fixtureStatus,
        home_score: homeScore,
        away_score: awayScore,
        result_confirmed: fixtureStatus === 'finished',
        api_football_status:
          fixtureStatus === 'finished'
            ? 'FT'
            : fixtureStatus === 'live'
              ? '2H'
              : fixtureStatus === 'postponed'
                ? 'PST'
                : 'NS',
        api_football_data: {
          synthetic: true,
          scenario: STAGING_SCENARIO_KEY,
        },
        last_synced_at: generatedAt,
      });
    });
  }

  const predictions: ScenarioPrediction[] = [];
  for (const participant of participants) {
    const participantIndex = participants.indexOf(participant);
    for (const fixture of fixtures) {
      const gameweekNumber = gameweeks.find(
        (gameweek) => gameweek.id === fixture.gameweek_id,
      )!.gameweek_number;
      if (gameweekNumber > 20 || fixture.status === 'postponed') continue;

      const fixtureIndex = fixtures.indexOf(fixture) % 10;
      const missingCompletedPrediction =
        gameweekNumber <= 19 &&
        participantIndex % 7 === 0 &&
        fixtureIndex === participantIndex % 10;
      const currentCompleteness = 2 + (participantIndex % 9);
      if (
        missingCompletedPrediction ||
        (gameweekNumber === 20 && fixtureIndex >= currentCompleteness)
      ) {
        continue;
      }

      const accuracyBand = participantIndex % 5;
      const actualHome = fixture.home_score ?? seededNumber(`${fixture.id}:future-home`, 4);
      const actualAway = fixture.away_score ?? seededNumber(`${fixture.id}:future-away`, 4);
      let homeScore = seededNumber(`${participant.id}:${fixture.id}:home`, 4);
      let awayScore = seededNumber(`${participant.id}:${fixture.id}:away`, 4);

      if (accuracyBand === 0 || seededNumber(`${participant.id}:${fixture.id}:exact`, 9) === 0) {
        homeScore = actualHome;
        awayScore = actualAway;
      } else if (accuracyBand <= 2) {
        const result = Math.sign(actualHome - actualAway);
        if (result > 0) [homeScore, awayScore] = [2, 1];
        if (result === 0) [homeScore, awayScore] = [1, 1];
        if (result < 0) [homeScore, awayScore] = [0, 1];
      }

      predictions.push({
        id: deterministicUuid(`prediction:${participant.id}:${fixture.id}`),
        fixture_id: fixture.id,
        participant_id: participant.id,
        season_id: STAGING_SEASON_ID,
        home_score: homeScore,
        away_score: awayScore,
        is_admin_entered: participant.is_offline,
      });
    }
  }

  return {
    generatedAt,
    personas,
    participants,
    gameweeks,
    fixtures,
    predictions,
    completedFixtureIds: fixtures
      .filter((fixture) => fixture.result_confirmed)
      .map((fixture) => fixture.id),
  };
}
