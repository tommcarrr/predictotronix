import { describe, expect, it } from 'vitest';
import {
  parsePredictionEmail,
  type EmailImportFixture,
} from '@/lib/predictions/email-import-parser';

const fixtures: EmailImportFixture[] = [
  { id: 'mun-nfo', homeTeamName: 'Manchester United', awayTeamName: 'Nottingham Forest' },
  { id: 'tot-bha', homeTeamName: 'Tottenham Hotspur', awayTeamName: 'Brighton & Hove Albion' },
  { id: 'bou-che', homeTeamName: 'AFC Bournemouth', awayTeamName: 'Chelsea' },
  { id: 'cov-hul', homeTeamName: 'Coventry City', awayTeamName: 'Hull City' },
  { id: 'ips-mci', homeTeamName: 'Ipswich Town', awayTeamName: 'Manchester City' },
];

describe('prediction email deterministic parser', () => {
  it('covers common variants for every 2026/27 Premier League team', () => {
    const currentFixtures: EmailImportFixture[] = [
      { id: '1', homeTeamName: 'Arsenal', awayTeamName: 'Aston Villa' },
      { id: '2', homeTeamName: 'AFC Bournemouth', awayTeamName: 'Brentford' },
      { id: '3', homeTeamName: 'Brighton & Hove Albion', awayTeamName: 'Chelsea' },
      { id: '4', homeTeamName: 'Coventry City', awayTeamName: 'Crystal Palace' },
      { id: '5', homeTeamName: 'Everton', awayTeamName: 'Fulham' },
      { id: '6', homeTeamName: 'Hull City', awayTeamName: 'Ipswich Town' },
      { id: '7', homeTeamName: 'Leeds United', awayTeamName: 'Liverpool' },
      { id: '8', homeTeamName: 'Manchester City', awayTeamName: 'Manchester United' },
      { id: '9', homeTeamName: 'Newcastle United', awayTeamName: 'Nottingham Forest' },
      { id: '10', homeTeamName: 'Sunderland', awayTeamName: 'Tottenham Hotspur' },
    ];
    const result = parsePredictionEmail(
      `
      AFC 2-1 Villa
      Bournemouth 1-1 The Bees
      BHAFC 0-2 CFC
      CCFC 1-0 CPFC
      EFC 2-2 FFC
      HCAFC 0-1 ITFC
      LUFC 1-3 LFC
      MCFC 2-0 MUFC
      NUFC 2-1 NFFC
      SAFC 1-2 THFC
    `,
      currentFixtures
    );

    expect(result.predictions).toHaveLength(10);
    expect(result.unmatchedFixtureIds).toEqual([]);
  });

  it('recognises common team variants and score layouts', () => {
    const result = parsePredictionEmail(
      `
      Man Utd 2-1 Nott'm Forest
      Spurs v BHA: 3-0
      Bournemouth 1 Chelsea 1
      Cov 0:2 Hull
      Ipswich vs Man. City - 1-4
    `,
      fixtures
    );

    expect(result.predictions).toEqual([
      { fixtureId: 'mun-nfo', homeScore: 2, awayScore: 1, method: 'deterministic' },
      { fixtureId: 'tot-bha', homeScore: 3, awayScore: 0, method: 'deterministic' },
      { fixtureId: 'bou-che', homeScore: 1, awayScore: 1, method: 'deterministic' },
      { fixtureId: 'cov-hul', homeScore: 0, awayScore: 2, method: 'deterministic' },
      { fixtureId: 'ips-mci', homeScore: 1, awayScore: 4, method: 'deterministic' },
    ]);
    expect(result.unmatchedFixtureIds).toEqual([]);
  });

  it('maps a reversed fixture listing back to canonical home-away order', () => {
    const result = parsePredictionEmail('Liverpool 1-2 Arsenal', [
      { id: 'ars-liv', homeTeamName: 'Arsenal', awayTeamName: 'Liverpool' },
    ]);

    expect(result.predictions[0]).toMatchObject({ homeScore: 2, awayScore: 1 });
  });

  it('recognises a fixture and score split over several lines', () => {
    const result = parsePredictionEmail('Newcastle United vs\nSunderland\n2 - 2', [
      { id: 'new-sun', homeTeamName: 'Newcastle United', awayTeamName: 'Sunderland' },
    ]);

    expect(result.predictions[0]).toMatchObject({ homeScore: 2, awayScore: 2 });
  });

  it('leaves conflicting quoted scores for review instead of guessing', () => {
    const result = parsePredictionEmail('Arsenal 2-0 Liverpool\n> Arsenal 1-1 Liverpool', [
      { id: 'ars-liv', homeTeamName: 'Arsenal', awayTeamName: 'Liverpool' },
    ]);

    expect(result.predictions).toEqual([]);
    expect(result.unmatchedFixtureIds).toEqual(['ars-liv']);
    expect(result.warnings[0]).toMatch(/conflicting scores/i);
  });

  it('does not use an abbreviation shared by two teams in the gameweek', () => {
    const result = parsePredictionEmail('BFC 1-0 Chelsea', [
      { id: 'bre-che', homeTeamName: 'Brentford', awayTeamName: 'Chelsea' },
      { id: 'bur-eve', homeTeamName: 'Burnley', awayTeamName: 'Everton' },
    ]);

    expect(result.predictions).toEqual([]);
  });
});
