import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient, getParticipant, requireUser, rpc } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getParticipant: vi.fn(),
  requireUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('@/lib/auth', () => ({ getParticipant, requireUser }));

import { getBreakoutLeaderboard, submitBreakoutScore } from '@/lib/breakout/actions';
import { MAX_BREAKOUT_SCORE } from '@/lib/breakout/constants';

const leagueId = '11111111-1111-4111-8111-111111111111';

describe('league Breakout actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 'user-1' });
    getParticipant.mockResolvedValue({ id: 'participant-1', display_name: 'Player One' });
    createClient.mockResolvedValue({ rpc });
  });

  it('loads and maps the authenticated league leaderboard', async () => {
    rpc.mockResolvedValue({
      data: [{
        rank_position: 1,
        participant_id: 'participant-1',
        display_name: 'Player One',
        score: 1250,
        achieved_at: '2026-08-23T12:00:00Z',
      }],
      error: null,
    });

    await expect(getBreakoutLeaderboard(leagueId)).resolves.toEqual({
      success: true,
      participantId: 'participant-1',
      leaderboard: [{
        position: 1,
        participantId: 'participant-1',
        displayName: 'Player One',
        score: 1250,
        achievedAt: '2026-08-23T12:00:00Z',
      }],
    });
    expect(rpc).toHaveBeenCalledWith('get_breakout_leaderboard', { p_league_id: leagueId });
  });

  it('submits a valid personal best through the protected RPC', async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    const result = await submitBreakoutScore(leagueId, 2500);

    expect(result.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('submit_breakout_score', {
      p_league_id: leagueId,
      p_score: 2500,
    });
  });

  it('rejects impossible scores before contacting Supabase', async () => {
    const result = await submitBreakoutScore(leagueId, MAX_BREAKOUT_SCORE + 1);

    expect(result).toMatchObject({ success: false, error: 'That score is invalid.' });
    expect(createClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});
