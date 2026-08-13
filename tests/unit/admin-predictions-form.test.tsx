import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminPredictionsForm } from '@/components/admin/AdminPredictionsForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/predictions/actions', () => ({
  adminSubmitPredictions: vi.fn(),
}));

const participants = [
  { id: 'alice', label: 'Alice Adams', completed: 2, total: 2, status: 'ready' as const, isOffline: true },
  { id: 'bob', label: 'Bob Brown', completed: 1, total: 2, status: 'in_progress' as const, isOffline: true },
  { id: 'carol', label: 'Carol Clark', completed: 0, total: 2, status: 'awaiting' as const, isOffline: false },
];

function renderForm() {
  render(
    <AdminPredictionsForm
      participants={participants}
      gameweeks={[{ id: 'gameweek', label: 'Gameweek 1' }]}
      selectedParticipantId=""
      selectedGameweekId="gameweek"
      fixtures={[
        {
          id: 'fixture',
          home_team_name: 'Home',
          away_team_name: 'Away',
          kickoff: '2026-08-15T15:00:00.000Z',
          result_confirmed: false,
          prediction: null,
        },
      ]}
    />
  );
}

describe('AdminPredictionsForm participant filters', () => {
  it('filters participants by name', () => {
    renderForm();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter by name' }), {
      target: { value: 'bob' },
    });

    expect(screen.getByRole('button', { name: /Bob Brown/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Alice Adams/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Carol Clark/ })).not.toBeInTheDocument();
  });

  it('combines ready and offline filters', () => {
    renderForm();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hide ready' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Offline only' }));

    expect(screen.getByRole('button', { name: /Bob Brown/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Alice Adams/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Carol Clark/ })).not.toBeInTheDocument();
  });

  it('shows an empty state when no participant matches', () => {
    renderForm();

    const filters = screen.getByText('Filter by name').closest('div')?.parentElement;
    expect(filters).not.toBeNull();
    fireEvent.change(within(filters!).getByRole('searchbox'), { target: { value: 'Nobody' } });

    expect(screen.getByText('No participants match these filters.')).toBeInTheDocument();
  });
});
