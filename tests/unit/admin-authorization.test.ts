import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createServiceClient, requireLeagueAdmin, maybeSingle, inQuery } = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  requireLeagueAdmin: vi.fn(),
  maybeSingle: vi.fn(),
  inQuery: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireLeagueAdmin }));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient }));

import {
  requireLeagueAdminForFixture,
  requireLeagueAdminForFixtures,
  requireLeagueAdminForSeason,
} from '@/lib/admin/authorization';

describe('league-scoped admin authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.in = inQuery;
    query.maybeSingle = maybeSingle;
    createServiceClient.mockResolvedValue({ from: vi.fn(() => query) });
    requireLeagueAdmin.mockResolvedValue({ id: 'admin-1' });
  });

  it('derives the league from the season before authorizing', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'season-1', league_id: 'league-1' } });

    await expect(requireLeagueAdminForSeason('season-1')).resolves.toMatchObject({
      leagueId: 'league-1',
      seasonId: 'season-1',
    });
    expect(requireLeagueAdmin).toHaveBeenCalledWith('league-1');
  });

  it('derives fixture ownership through its season', async () => {
    maybeSingle
      .mockResolvedValueOnce({ data: { id: 'fixture-1', season_id: 'season-1' } })
      .mockResolvedValueOnce({ data: { id: 'season-1', league_id: 'league-1' } });

    await requireLeagueAdminForFixture('fixture-1');
    expect(requireLeagueAdmin).toHaveBeenCalledWith('league-1');
  });

  it('rejects a mixed-season fixture batch before mutation', async () => {
    inQuery.mockResolvedValue({
      data: [
        { id: 'fixture-1', season_id: 'season-1' },
        { id: 'fixture-2', season_id: 'season-2' },
      ],
    });

    await expect(requireLeagueAdminForFixtures(['fixture-1', 'fixture-2']))
      .rejects.toThrow('FIXTURES_MUST_SHARE_SEASON');
    expect(requireLeagueAdmin).not.toHaveBeenCalled();
  });

  it('propagates denial for an unassigned league', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'season-2', league_id: 'league-2' } });
    requireLeagueAdmin.mockRejectedValue(new Error('FORBIDDEN'));

    await expect(requireLeagueAdminForSeason('season-2')).rejects.toThrow('FORBIDDEN');
  });
});
