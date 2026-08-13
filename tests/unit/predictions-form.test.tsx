import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PredictionsForm } from '@/components/participant/PredictionsForm';

const { clearPredictionsMock } = vi.hoisted(() => ({
  clearPredictionsMock: vi.fn(),
}));

vi.mock('@/lib/predictions/actions', () => ({
  submitPredictions: vi.fn(),
  clearPredictions: clearPredictionsMock,
}));

const fixtures = [
  {
    id: 'open',
    home_team_name: 'Home',
    away_team_name: 'Away',
    kickoff: '2026-08-15T15:00:00.000Z',
    status: 'scheduled',
    home_score: null,
    away_score: null,
    result_confirmed: false,
    locked: false,
    prediction: {
      home_score: 2,
      away_score: 1,
      points_awarded: null,
      points_reason: null,
      is_admin_entered: false,
    },
  },
  {
    id: 'locked',
    home_team_name: 'Locked home',
    away_team_name: 'Locked away',
    kickoff: '2026-08-15T17:00:00.000Z',
    status: 'scheduled',
    home_score: null,
    away_score: null,
    result_confirmed: false,
    locked: true,
    prediction: null,
  },
];

describe('PredictionsForm random scores', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearPredictionsMock.mockReset();
  });

  it('fills only empty, unlocked score boxes and preserves existing values', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    render(<PredictionsForm fixtures={fixtures} />);

    fireEvent.change(screen.getByLabelText('Home score'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fill with random scores' }));

    expect(screen.getByLabelText('Home score')).toHaveValue('0');
    expect(screen.getByLabelText('Away score')).toHaveValue('1');
    expect(screen.getByLabelText('Locked home score')).toHaveValue('');
    expect(screen.getByText(/Filled 1 empty score box/)).toBeInTheDocument();
  });

  it('clears saved scores for unlocked fixtures after confirmation', async () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    clearPredictionsMock.mockResolvedValue({
      success: true,
      cleared: 1,
      clearedFixtureIds: ['open'],
      errors: [],
    });
    render(<PredictionsForm fixtures={fixtures} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear predicted scores' }));

    expect(clearPredictionsMock).toHaveBeenCalledWith(['open']);
    expect(await screen.findByText('✓ Cleared predicted scores for this gameweek.')).toBeInTheDocument();
    expect(screen.getByLabelText('Home score')).toHaveValue('');
    expect(screen.getByLabelText('Away score')).toHaveValue('');
  });
});
