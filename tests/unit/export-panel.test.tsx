import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExportPanel, type LeaderboardRow } from '@/components/admin/ExportPanel';

function row(
  participantId: string,
  name: string,
  position: number,
  points: number,
  exact: number
): LeaderboardRow {
  return {
    participant_id: participantId,
    display_name: name,
    position,
    total_points: points,
    exact_count: exact,
    predictions_submitted: 10,
    fixtures_in_gameweek: 10,
  };
}

describe('ExportPanel standings display', () => {
  const seasonRows = [row('alice', 'Alice', 1, 9, 2), row('bob', 'Bob', 2, 5, 1)];
  const gameweeks = [
    {
      id: 'gameweek-2',
      label: 'Gameweek 2',
      gameweekNumber: 2,
      status: 'in_progress',
      rows: [row('alice', 'Alice', 1, 6, 1), row('bob', 'Bob', 2, 1, 0)],
    },
    {
      id: 'gameweek-1',
      label: 'Gameweek 1',
      gameweekNumber: 1,
      status: 'completed',
      rows: [row('bob', 'Bob', 1, 4, 1), row('alice', 'Alice', 2, 3, 1)],
    },
  ];

  it('shows the overall table using cumulative totals and coloured movement', () => {
    render(<ExportPanel seasonId="season-1" seasonRows={seasonRows} gameweeks={gameweeks} />);

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Position',
      'Name',
      'Movement',
      'Total correct scores',
      'Total correct results',
      'Total points',
    ]);
    expect(screen.getByText('▲')).toHaveClass('text-emerald-700');
    expect(screen.getByText('▼')).toHaveClass('text-red-700');
    expect(screen.getByRole('row', { name: /1 Alice ▲ 1 2 3 9/ })).toBeVisible();
    expect(screen.getByRole('row', { name: /2 Bob ▼ 1 1 2 5/ })).toBeVisible();
  });

  it('shows a gameweek using the four gameweek result fields', () => {
    render(<ExportPanel seasonId="season-1" seasonRows={seasonRows} gameweeks={gameweeks} />);
    fireEvent.change(screen.getByLabelText('View standings'), {
      target: { value: 'gameweek-2' },
    });

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Position',
      'Name',
      'Correct scores',
      'Correct results',
      'Points',
    ]);
    expect(screen.queryByRole('columnheader', { name: 'Movement' })).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: /1 Alice 1 3 6/ })).toBeVisible();
  });

  it('offers the analysis workbook only for a selected completed gameweek', () => {
    render(<ExportPanel seasonId="season-1" seasonRows={seasonRows} gameweeks={gameweeks} />);

    expect(
      screen.queryByRole('link', { name: 'Export gameweek analysis (.xlsx)' })
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('View standings'), {
      target: { value: 'gameweek-2' },
    });
    expect(
      screen.queryByRole('link', { name: 'Export gameweek analysis (.xlsx)' })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('View standings'), {
      target: { value: 'gameweek-1' },
    });
    const link = screen.getByRole('link', { name: 'Export gameweek analysis (.xlsx)' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/api/admin/exports/gameweek?gameweekId=gameweek-1');
  });
});
