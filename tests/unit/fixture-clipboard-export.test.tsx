import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FixtureClipboardExport,
  formatFixtureExport,
  type FixtureExportGameweek,
} from '@/components/admin/FixtureClipboardExport';

const gameweeks: FixtureExportGameweek[] = [
  {
    id: 'gameweek-2',
    label: 'Gameweek 2',
    gameweekNumber: 2,
    fixtures: [
      {
        id: 'later-fixture',
        homeTeamName: 'City',
        awayTeamName: 'United',
        kickoff: '2026-08-15T16:30:00.000Z',
      },
      {
        id: 'earlier-fixture',
        homeTeamName: 'Rovers',
        awayTeamName: 'Athletic',
        kickoff: '2026-08-15T14:00:00.000Z',
      },
    ],
  },
  {
    id: 'gameweek-1',
    label: 'Gameweek 1',
    gameweekNumber: 1,
    fixtures: [
      {
        id: 'only-fixture',
        homeTeamName: 'Albion',
        awayTeamName: 'County',
        kickoff: '2026-08-08T14:00:00.000Z',
      },
    ],
  },
];

const writeText = vi.fn();

describe('FixtureClipboardExport', () => {
  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('formats fixtures in kickoff order', () => {
    const output = formatFixtureExport(gameweeks[0]);

    expect(output).toMatch(/^Gameweek 2 fixtures \(UK time\)/);
    expect(output.indexOf('Rovers vs Athletic')).toBeLessThan(output.indexOf('City vs United'));
  });

  it('copies the selected gameweek and confirms success', async () => {
    writeText.mockResolvedValue(undefined);
    render(<FixtureClipboardExport gameweeks={gameweeks} />);

    fireEvent.change(screen.getByLabelText('Gameweek'), { target: { value: 'gameweek-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Copy fixtures to clipboard' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Gameweek 1 fixtures'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Albion vs County'));
    expect(writeText).not.toHaveBeenCalledWith(expect.stringContaining('City vs United'));
    expect(await screen.findByRole('button', { name: 'Fixtures copied' })).toHaveTextContent('Copied!');
  });

  it('keeps a selectable preview available when clipboard access fails', async () => {
    writeText.mockRejectedValue(new Error('Clipboard unavailable'));
    render(<FixtureClipboardExport gameweeks={gameweeks} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy fixtures to clipboard' }));

    expect(await screen.findByText('Could not copy the fixtures. Select the preview above and copy it manually.')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Fixture export preview' })).toHaveValue(
      formatFixtureExport(gameweeks[0]),
    );
  });
});
