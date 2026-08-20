import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PredictionsForm } from '@/components/participant/PredictionsForm';

const { clearPredictionsMock, submitPredictionsMock } = vi.hoisted(() => ({
  clearPredictionsMock: vi.fn(),
  submitPredictionsMock: vi.fn(),
}));

vi.mock('@/lib/predictions/actions', () => ({
  submitPredictions: submitPredictionsMock,
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

const nextGameweekFixture = {
  ...fixtures[0],
  id: 'next-gameweek',
  home_team_name: 'Next home',
  away_team_name: 'Next away',
  prediction: null,
};

describe('PredictionsForm random scores', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    clearPredictionsMock.mockReset();
    submitPredictionsMock.mockReset();
  });

  it('auto-selects the next score box only within the current gameweek', () => {
    vi.useFakeTimers();
    render(
      <>
        <PredictionsForm fixtures={[fixtures[0]]} />
        <PredictionsForm fixtures={[nextGameweekFixture]} />
      </>
    );

    const currentHome = screen.getByLabelText('Home score');
    const currentAway = screen.getByLabelText('Away score');
    const nextHome = screen.getByLabelText('Next home score');

    fireEvent.change(currentHome, { target: { value: '3' } });
    vi.advanceTimersByTime(500);
    expect(currentAway).toHaveFocus();

    fireEvent.change(currentAway, { target: { value: '2' } });
    vi.advanceTimersByTime(500);
    expect(currentAway).toHaveFocus();
    expect(nextHome).not.toHaveFocus();
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

  it('opens Quick Match after three fixture activations but never for locked fixtures', () => {
    const { container } = render(<PredictionsForm fixtures={fixtures} />);
    const openFixture = container.querySelector('[data-fixture-card="open"]');
    const lockedFixture = container.querySelector('[data-fixture-card="locked"]');

    expect(openFixture).not.toBeNull();
    expect(lockedFixture).not.toBeNull();

    fireEvent.pointerUp(lockedFixture!, { isPrimary: true });
    fireEvent.pointerUp(lockedFixture!, { isPrimary: true });
    fireEvent.pointerUp(lockedFixture!, { isPrimary: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.pointerUp(openFixture!, { isPrimary: true });
    fireEvent.pointerUp(openFixture!, { isPrimary: true });
    fireEvent.pointerUp(openFixture!, { isPrimary: true });

    expect(screen.getByRole('dialog', { name: 'Home v Away' })).toBeInTheDocument();
    expect(screen.getByText('Full time will replace your 2–1 prediction.')).toBeInTheDocument();
  });

  it('completes Quick Match and automatically saves its score for that fixture', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    submitPredictionsMock.mockResolvedValue({ success: true, saved: 1, errors: [] });
    render(<PredictionsForm fixtures={fixtures} />);

    fireEvent.click(screen.getByRole('button', { name: 'Play Quick Match for Home versus Away' }));

    for (let chance = 0; chance < 8; chance += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Stop marker' }));
      if (chance < 7) {
        fireEvent.click(screen.getByRole('button', { name: 'Next chance' }));
      }
    }

    expect(await screen.findByText('FULL TIME — prediction saved')).toBeInTheDocument();
    expect(submitPredictionsMock).toHaveBeenCalledWith([
      { fixtureId: 'open', homeScore: 4, awayScore: 4 },
    ]);
    expect(screen.getByLabelText('Home score')).toHaveValue('4');
    expect(screen.getByLabelText('Away score')).toHaveValue('4');
    expect(screen.getByText(/Quick Match saved Home 4–4 Away/)).toBeInTheDocument();
  });
});
