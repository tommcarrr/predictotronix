import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  it('falls back to the synchronous copy command when Safari rejects writeText', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard permission denied'));
    const execCommand = vi.fn().mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => 'Exported table' });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<ExportPanel seasonId="season-1" seasonRows={seasonRows} gameweeks={gameweeks} />);

    fireEvent.click(screen.getByRole('button', { name: 'Export this view' }));
    fireEvent.change(screen.getByLabelText('Export format'), { target: { value: 'text' } });
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible();
    expect(writeText).toHaveBeenCalledWith('Exported table');
    expect(execCommand).toHaveBeenCalledWith('copy');
    vi.unstubAllGlobals();
  });
});
