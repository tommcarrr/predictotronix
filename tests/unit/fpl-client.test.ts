import { afterEach, describe, expect, it, vi } from 'vitest';
import { FplFixtureProvider } from '@/lib/fpl/client';

const bootstrap = {
  events: [{ id: 1, deadline_time: '2026-08-15T10:00:00Z' }],
  teams: [{ id: 1, name: 'Arsenal' }, { id: 2, name: 'Aston Villa' }],
};

const scheduledFixture: {
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
} = {
  id: 101,
  event: 1,
  kickoff_time: '2026-08-15T14:00:00Z',
  started: false,
  finished: false,
  finished_provisional: false,
  team_h: 1,
  team_a: 2,
  team_h_score: null,
  team_a_score: null,
};

describe('FPL fixture provider', () => {
  afterEach(() => vi.unstubAllGlobals());

  function mockFpl(fixture = scheduledFixture) {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(
      url.includes('bootstrap-static') ? bootstrap : [fixture]
    ), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('maps current Premier League fixtures to the existing provider contract', async () => {
    const fetchMock = mockFpl();
    const provider = new FplFixtureProvider();
    await expect(provider.getSeasonFixtures(39, 2026)).resolves.toEqual([expect.objectContaining({
      id: -101,
      date: '2026-08-15T14:00:00Z',
      status: { short: 'NS', long: 'Not Started' },
      teams: {
        home: { id: 1, name: 'Arsenal' },
        away: { id: 2, name: 'Aston Villa' },
      },
      league: { id: 39, season: 2026, round: 'Regular Season - 1' },
    })]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects non-Premier-League and non-current-season requests', async () => {
    mockFpl();
    const provider = new FplFixtureProvider();
    await expect(provider.getSeasonFixtures(140, 2026)).rejects.toThrow(/Premier League ID 39 only/);
    await expect(provider.getSeasonFixtures(39, 2025)).rejects.toThrow(/current 2026 season/);
  });

  it('maps finished scores and looks up namespaced fixture IDs', async () => {
    mockFpl({ ...scheduledFixture, started: true, finished: true, team_h_score: 2, team_a_score: 1 });
    await expect(new FplFixtureProvider().getFixture(-101)).resolves.toEqual(expect.objectContaining({
      id: -101,
      status: { short: 'FT', long: 'Match Finished' },
      goals: { home: 2, away: 1 },
    }));
  });

  it('maps provisionally finished fixtures as finished', async () => {
    mockFpl({
      ...scheduledFixture,
      started: true,
      finished: false,
      finished_provisional: true,
      team_h_score: 3,
      team_a_score: 0,
    });

    await expect(new FplFixtureProvider().getFixture(-101)).resolves.toEqual(expect.objectContaining({
      status: { short: 'FT', long: 'Match Finished' },
      goals: { home: 3, away: 0 },
    }));
  });
});
