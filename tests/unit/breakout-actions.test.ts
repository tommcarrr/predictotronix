import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient, getParticipant, requireUser, rpc } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getParticipant: vi.fn(),
  requireUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('@/lib/auth', () => ({ getParticipant, requireUser }));

import {
  getBreakoutLeaderboard,
  startBreakoutRun,
  submitBreakoutRun,
} from '@/lib/breakout/actions';

const leagueId = '11111111-1111-4111-8111-111111111111';
const runId = '22222222-2222-4222-8222-222222222222';

describe('league Breakout actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 'user-1' });
    getParticipant.mockResolvedValue({ id: 'participant-1', display_name: 'Player One' });
    createClient.mockResolvedValue({ rpc });
  });

  it('loads and maps the authenticated league leaderboard', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          rank_position: 1,
          participant_id: 'participant-1',
          display_name: 'Player One',
          score: 1250,
          achieved_at: '2026-08-23T12:00:00Z',
        },
      ],
      error: null,
    });

    await expect(getBreakoutLeaderboard(leagueId)).resolves.toEqual({
      success: true,
      participantId: 'participant-1',
      leaderboard: [
        {
          position: 1,
          participantId: 'participant-1',
          displayName: 'Player One',
          score: 1250,
          achievedAt: '2026-08-23T12:00:00Z',
        },
      ],
    });
    expect(rpc).toHaveBeenCalledWith('get_breakout_leaderboard', { p_league_id: leagueId });
  });

  it('starts a one-use verified run through the protected RPC', async () => {
    rpc.mockResolvedValue({ data: runId, error: null });

    await expect(startBreakoutRun(leagueId)).resolves.toEqual({ success: true, runId });
    expect(rpc).toHaveBeenCalledWith('start_breakout_run', { p_league_id: leagueId });
  });

  it('submits run facts rather than a client-calculated score', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const summary = {
      hitsByLevel: Array(10).fill(0),
      comboAwards: 0,
      livesLost: 3,
      maxCombo: 0,
      durationMs: 45_000,
      finished: false,
    };

    const result = await submitBreakoutRun(leagueId, runId, summary);

    expect(result.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('submit_breakout_run', {
      p_run_id: runId,
      p_league_id: leagueId,
      p_hits_by_level: summary.hitsByLevel,
      p_combo_awards: 0,
      p_lives_lost: 3,
      p_max_combo: 0,
      p_duration_ms: 45_000,
      p_finished: false,
    });
    expect(rpc.mock.calls[0][1]).not.toHaveProperty('p_score');
  });

  it('rejects impossible level progress before contacting Supabase', async () => {
    const result = await submitBreakoutRun(leagueId, runId, {
      hitsByLevel: [73, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      comboAwards: 0,
      livesLost: 0,
      maxCombo: 0,
      durationMs: 60_000,
      finished: false,
    });

    expect(result).toMatchObject({
      success: false,
      error: 'That game result could not be verified.',
    });
    expect(createClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});
