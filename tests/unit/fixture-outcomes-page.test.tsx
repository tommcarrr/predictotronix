import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FixturesAdminPage from '@/app/(admin)/admin/fixtures/page';

const state = vi.hoisted(() => ({
  queries: [] as { table: string; filters: Record<string, unknown> }[],
  weeks: [] as { id: string; label: string; gameweek_number: number; fixtures: { id: string }[] }[],
  failFixtures: false,
}));
vi.mock('@/lib/admin/context', () => ({
  getAdminContext: async () => ({
    selectedLeague: { name: 'League' },
    selectedSeason: { id: 'season' },
  }),
}));
vi.mock('@/lib/clock', () => ({ getSeasonNow: vi.fn() }));
vi.mock('@/components/admin/FixtureSyncConsole', () => ({ FixtureSyncConsole: () => null }));
vi.mock('@/components/admin/FixtureClipboardExport', () => ({
  FixtureClipboardExport: () => null,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from(table: string) {
      const filters: Record<string, unknown> = {};
      state.queries.push({ table, filters });
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return query;
        },
        in: (key: string, value: unknown) => {
          filters[key] = value;
          return query;
        },
        not: (key: string, operator: string, value: unknown) => {
          filters[`not:${key}`] = [operator, value];
          return query;
        },
        order: () => query,
        async range(from: number, to: number) {
          if (table === 'gameweeks') return { data: state.weeks.slice(from, to + 1), error: null };
          if (table === 'fixtures' && state.failFixtures)
            return { data: null, error: { message: 'Failed' } };
          const week = state.weeks.find((week) => week.id === filters.gameweek_id);
          const rows =
            table === 'fixtures' && week
              ? [
                  {
                    id: `fixture-${week.id}`,
                    home_team_name: 'Albion',
                    away_team_name: 'County',
                    kickoff: '2026-10-01T15:00:00Z',
                    status: 'finished',
                    home_score: 2,
                    away_score: 1,
                    result_confirmed: true,
                    gameweeks: week,
                  },
                ]
              : table === 'predictions'
                ? [
                    {
                      fixture_id: (filters.fixture_id as string[])[0],
                      participant_id: 'alice',
                      home_score: 2,
                      away_score: 1,
                    },
                  ]
                : table === 'season_participants'
                  ? [{ participant_id: 'alice', participants: { display_name: 'Alice' } }]
                  : [];
          return { data: rows.slice(from, to + 1), error: null };
        },
      };
      return query;
    },
  }),
}));

beforeEach(() => {
  state.queries = [];
  state.failFixtures = false;
  state.weeks = [2, 1].map((n) => ({
    id: `week-${n}`,
    label: `Week ${n}`,
    gameweek_number: n,
    fixtures: [{ id: `fixture-week-${n}` }],
  }));
});
afterEach(cleanup);

describe('outcomes gameweek queries', () => {
  it.each([undefined, 'another-season-week'])(
    'defaults to the latest eligible week for %s',
    async (gameweek) => {
      render(
        await FixturesAdminPage({ searchParams: Promise.resolve({ tab: 'outcomes', gameweek }) })
      );
      expect(screen.getByRole('combobox', { name: 'Gameweek' })).toHaveValue('week-2');
      expect(screen.getByText('Alice')).toBeVisible();
      const fixtures = state.queries.filter((q) => q.table === 'fixtures');
      expect(fixtures.length).toBeGreaterThan(0);
      for (const query of fixtures)
        expect(query.filters).toMatchObject({
          season_id: 'season',
          gameweek_id: 'week-2',
          result_confirmed: true,
        });
      for (const query of state.queries.filter((q) => q.table === 'predictions')) {
        expect(query.filters).toEqual({ season_id: 'season', fixture_id: ['fixture-week-2'] });
      }
    }
  );

  it('loads only the requested older week and preserves the outcomes tab in navigation', async () => {
    render(
      await FixturesAdminPage({
        searchParams: Promise.resolve({ tab: 'outcomes', gameweek: 'week-1' }),
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('week-1');
    expect(screen.getByRole('button', { name: 'Show outcomes' }).closest('form')).toHaveAttribute(
      'method',
      'get'
    );
    for (const query of state.queries.filter((q) => q.table === 'predictions')) {
      expect(query.filters.fixture_id).toEqual(['fixture-week-1']);
    }
  });

  it('does not load fixtures, predictions or participants when no confirmed results exist', async () => {
    state.weeks = [];
    render(await FixturesAdminPage({ searchParams: Promise.resolve({ tab: 'outcomes' }) }));
    expect(
      screen.getByText('No confirmed results are available for this season yet.')
    ).toBeVisible();
    expect(state.queries.every((q) => q.table === 'gameweeks')).toBe(true);
  });

  it('does not query predictions or show Nobody when fixtures fail to load', async () => {
    state.failFixtures = true;
    render(await FixturesAdminPage({ searchParams: Promise.resolve({ tab: 'outcomes' }) }));
    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
    expect(screen.queryByText('Nobody')).toBeNull();
    expect(state.queries.some((q) => q.table === 'predictions')).toBe(false);
  });
});
