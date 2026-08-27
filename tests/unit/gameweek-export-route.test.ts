import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createServiceClient, requireLeagueAdminForGameweek, createCompletedGameweekWorkbook } =
  vi.hoisted(() => ({
    createServiceClient: vi.fn(),
    requireLeagueAdminForGameweek: vi.fn(),
    createCompletedGameweekWorkbook: vi.fn(),
  }));

vi.mock('@/lib/supabase/server', () => ({ createServiceClient }));
vi.mock('@/lib/admin/authorization', () => ({ requireLeagueAdminForGameweek }));
vi.mock('@/lib/exports/gameweek-workbook', () => ({ createCompletedGameweekWorkbook }));

import { GET } from '@/app/api/admin/exports/gameweek/route';

function chain(result: unknown, terminal: 'maybeSingle' | 'single' | 'order' | 'in') {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query[terminal] = vi.fn().mockResolvedValue(result);
  return query;
}

describe('completed gameweek export route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireLeagueAdminForGameweek.mockResolvedValue({ seasonId: 'season-1' });
    createCompletedGameweekWorkbook.mockResolvedValue(Buffer.from('workbook'));
  });

  it('rejects an in-progress gameweek before building a workbook', async () => {
    const gameweek = chain(
      {
        data: {
          id: 'gameweek-1',
          season_id: 'season-1',
          label: 'Gameweek 1',
          gameweek_number: 1,
          status: 'in_progress',
        },
        error: null,
      },
      'maybeSingle'
    );
    createServiceClient.mockResolvedValue({ from: vi.fn(() => gameweek) });

    const response = await GET(
      new NextRequest('http://localhost/api/admin/exports/gameweek?gameweekId=gameweek-1')
    );

    expect(response.status).toBe(409);
    expect(await response.text()).toContain('available after the gameweek is completed');
    expect(createCompletedGameweekWorkbook).not.toHaveBeenCalled();
  });

  it('authorizes and downloads a completed gameweek workbook', async () => {
    const gameweek = chain(
      {
        data: {
          id: 'gameweek-1',
          season_id: 'season-1',
          label: 'Gameweek 1',
          gameweek_number: 1,
          status: 'completed',
        },
        error: null,
      },
      'maybeSingle'
    );
    const season = chain(
      {
        data: { id: 'season-1', name: '2026/27', leagues: { name: 'Test League' } },
        error: null,
      },
      'single'
    );
    const fixtures = chain(
      {
        data: [
          {
            id: 'fixture-1',
            kickoff: '2026-08-01T14:00:00.000Z',
            home_team_name: 'Alpha',
            away_team_name: 'Beta',
            status: 'finished',
            home_score: 2,
            away_score: 1,
            result_confirmed: true,
          },
        ],
        error: null,
      },
      'order'
    );
    const predictions = chain(
      {
        data: [
          {
            fixture_id: 'fixture-1',
            participant_id: 'player-1',
            home_score: 2,
            away_score: 1,
            points_awarded: 3,
            points_reason: 'exact',
            is_admin_entered: false,
          },
        ],
        error: null,
      },
      'in'
    );
    const from = vi.fn((table: string) => {
      if (table === 'gameweeks') return gameweek;
      if (table === 'seasons') return season;
      if (table === 'fixtures') return fixtures;
      if (table === 'predictions') return predictions;
      throw new Error(`Unexpected table ${table}`);
    });
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          participant_id: 'player-1',
          display_name: 'Player One',
          position: 1,
          total_points: 3,
          exact_count: 1,
          predictions_submitted: 1,
          fixtures_in_gameweek: 1,
        },
      ],
      error: null,
    });
    createServiceClient.mockResolvedValue({ from, rpc });

    const response = await GET(
      new NextRequest('http://localhost/api/admin/exports/gameweek?gameweekId=gameweek-1')
    );

    expect(response.status).toBe(200);
    expect(requireLeagueAdminForGameweek).toHaveBeenCalledWith('gameweek-1');
    expect(createCompletedGameweekWorkbook).toHaveBeenCalledWith(
      expect.objectContaining({
        leagueName: 'Test League',
        seasonName: '2026/27',
        gameweekLabel: 'Gameweek 1',
        gameweekNumber: 1,
      })
    );
    expect(response.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="gameweek-1-analysis.xlsx"'
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('does not expose workbook data when authorization fails', async () => {
    requireLeagueAdminForGameweek.mockRejectedValue(new Error('FORBIDDEN'));
    createServiceClient.mockResolvedValue({});

    const response = await GET(
      new NextRequest('http://localhost/api/admin/exports/gameweek?gameweekId=gameweek-1')
    );

    expect(response.status).toBe(403);
    expect(createCompletedGameweekWorkbook).not.toHaveBeenCalled();
  });
});
