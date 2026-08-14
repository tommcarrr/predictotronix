import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FixtureClipboardExport,
  formatFixtureExport,
  selectFixtureExportGameweek,
  type FixtureExportGameweek,
} from '@/components/admin/FixtureClipboardExport';

const fixtureDetails = {
  status: 'scheduled' as const,
  homeScore: null,
  awayScore: null,
  resultConfirmed: false,
  lastSyncedAt: null,
};

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
        ...fixtureDetails,
      },
      {
        id: 'earlier-fixture',
        homeTeamName: 'Rovers',
        awayTeamName: 'Athletic',
        kickoff: '2026-08-15T14:00:00.000Z',
        ...fixtureDetails,
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
        ...fixtureDetails,
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

  it('groups fixtures by UK date in kickoff order using the compact paste format', () => {
    const output = formatFixtureExport({
      ...gameweeks[0],
      fixtures: [
        {
          id: 'tuesday',
          homeTeamName: 'Chelsea',
          awayTeamName: 'Spurs',
          kickoff: '2026-05-19T19:00:00.000Z',
          ...fixtureDetails,
        },
        {
          id: 'friday',
          homeTeamName: 'Villa',
          awayTeamName: 'Liverpool',
          kickoff: '2026-05-15T19:00:00.000Z',
          ...fixtureDetails,
        },
        {
          id: 'sunday-2',
          homeTeamName: 'Everton',
          awayTeamName: 'Sunderland',
          kickoff: '2026-05-17T14:00:00.000Z',
          ...fixtureDetails,
        },
        {
          id: 'sunday-1',
          homeTeamName: 'Man U',
          awayTeamName: 'NForest',
          kickoff: '2026-05-17T12:00:00.000Z',
          ...fixtureDetails,
        },
      ],
    });

    expect(output).toBe(
      '(Fri 15)\nVilla - Liverpool\n\n' +
        '(Sun 17)\nMan U - NForest\nEverton - Sunderland\n\n' +
        '(Tues 19)\nChelsea - Spurs'
    );
  });

  it('selects the first gameweek with a fixture still to kick off, then the latest when all are past', () => {
    expect(selectFixtureExportGameweek(gameweeks, new Date('2026-08-11T12:00:00.000Z'))?.id).toBe(
      'gameweek-2'
    );
    expect(selectFixtureExportGameweek(gameweeks, new Date('2026-08-20T12:00:00.000Z'))?.id).toBe(
      'gameweek-2'
    );
  });

  it('copies the selected gameweek and confirms success', async () => {
    writeText.mockResolvedValue(undefined);
    render(<FixtureClipboardExport gameweeks={gameweeks} now="2026-08-11T12:00:00.000Z" />);

    fireEvent.change(screen.getByLabelText('Gameweek'), { target: { value: 'gameweek-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Copy fixtures to clipboard' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Albion - County'));
    expect(writeText).not.toHaveBeenCalledWith(expect.stringContaining('City - United'));
    expect(await screen.findByRole('button', { name: 'Fixtures copied' })).toHaveTextContent(
      'Copied!'
    );
  });

  it('keeps a selectable preview available when clipboard access fails', async () => {
    writeText.mockRejectedValue(new Error('Clipboard unavailable'));
    render(<FixtureClipboardExport gameweeks={gameweeks} now="2026-08-11T12:00:00.000Z" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy fixtures to clipboard' }));

    expect(
      await screen.findByText(
        'Could not copy the fixtures. Select the preview above and copy it manually.'
      )
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Fixture export preview' })).toHaveValue(
      formatFixtureExport(gameweeks[0])
    );
  });

  it('shows only fixtures from the selected gameweek in the results table', () => {
    render(<FixtureClipboardExport gameweeks={gameweeks} now="2026-08-11T12:00:00.000Z" />);

    expect(screen.getByText('City vs United')).toBeVisible();
    expect(screen.queryByText('Albion vs County')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Gameweek'), { target: { value: 'gameweek-1' } });

    expect(screen.getByText('Albion vs County')).toBeVisible();
    expect(screen.queryByText('City vs United')).not.toBeInTheDocument();
  });
});
