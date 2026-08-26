import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  FixtureOutcomeView,
  type FixtureOutcomeGameweek,
} from '@/components/admin/FixtureOutcomeView';

const gameweeks: FixtureOutcomeGameweek[] = [
  {
    id: 'gameweek-1',
    label: 'Gameweek 1',
    gameweekNumber: 1,
    fixtures: [
      {
        id: 'fixture-1',
        homeTeamName: 'Albion',
        awayTeamName: 'County',
        kickoff: '2026-08-08T14:00:00.000Z',
        homeScore: 2,
        awayScore: 1,
        exactScores: [
          { participantId: 'alice', displayName: 'Alice', homeScore: 2, awayScore: 1 },
          { participantId: 'charlie', displayName: 'Charlie', homeScore: 2, awayScore: 1 },
        ],
        correctResults: [{ participantId: 'bob', displayName: 'Bob', homeScore: 1, awayScore: 0 }],
      },
    ],
  },
];

describe('FixtureOutcomeView', () => {
  it('shows counts, names, and predicted scores for each fixture outcome', () => {
    render(<FixtureOutcomeView gameweeks={gameweeks} />);

    expect(screen.getByRole('heading', { name: 'Albion vs County' })).toBeVisible();
    expect(screen.getByLabelText('Final score')).toHaveTextContent('2–1');

    const exactGroup = screen.getByRole('group', { name: 'Exact score, 2 people' });
    const exactScores = within(exactGroup).getByRole('list', { name: 'Exact score predictions' });
    expect(within(exactScores).getByText('Alice')).toBeVisible();
    expect(within(exactScores).getByText('Charlie')).toBeVisible();
    expect(within(exactScores).getAllByText('2–1')).toHaveLength(2);

    const correctGroup = screen.getByRole('group', { name: 'Correct result, 1 person' });
    const correctResults = within(correctGroup).getByRole('list', {
      name: 'Correct result predictions',
    });
    expect(within(correctResults).getByText('Bob')).toBeVisible();
    expect(within(correctResults).getByText('1–0')).toBeVisible();

    expect(exactGroup).toHaveTextContent('2');
    expect(correctGroup).toHaveTextContent('1');
  });

  it('shows an empty state when no confirmed results exist', () => {
    render(<FixtureOutcomeView gameweeks={[]} />);

    expect(
      screen.getByText('No confirmed results are available for this season yet.')
    ).toBeVisible();
  });

  it('makes zero-result outcome groups explicit', () => {
    render(
      <FixtureOutcomeView
        gameweeks={[
          {
            ...gameweeks[0],
            fixtures: [
              {
                ...gameweeks[0].fixtures[0],
                exactScores: [],
                correctResults: [],
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getAllByText('Nobody')).toHaveLength(2);
  });
});
