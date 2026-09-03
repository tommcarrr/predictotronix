import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminPredictionsForm } from '@/components/admin/AdminPredictionsForm';
import { adminExtractEmailPredictions, adminSubmitPredictions } from '@/lib/predictions/actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/predictions/actions', () => ({
  adminExtractEmailPredictions: vi.fn(),
  adminSubmitPredictions: vi.fn(),
}));

const { markMessagesReadMock } = vi.hoisted(() => ({
  markMessagesReadMock: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/gameweek-messages/actions', () => ({
  markGameweekMessagesRead: markMessagesReadMock,
}));

const messageContent = (text: string) => ({
  root: {
    children: [
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 },
        ],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
});

const participants = [
  {
    id: 'alice',
    label: 'Alice Adams',
    completed: 2,
    total: 2,
    status: 'ready' as const,
    isOffline: true,
  },
  {
    id: 'bob',
    label: 'Bob Brown',
    completed: 1,
    total: 2,
    status: 'in_progress' as const,
    isOffline: true,
  },
  {
    id: 'carol',
    label: 'Carol Clark',
    completed: 0,
    total: 2,
    status: 'awaiting' as const,
    isOffline: false,
  },
];

function renderForm() {
  render(
    <AdminPredictionsForm
      participants={participants}
      gameweeks={[{ id: 'gameweek', label: 'Gameweek 1' }]}
      selectedParticipantId=""
      selectedGameweekId="gameweek"
      llmFallbackConfigured={false}
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

function renderSelectedForm(
  prediction: {
    home_score: number;
    away_score: number;
    points_awarded: number | null;
  } | null = null
) {
  render(
    <AdminPredictionsForm
      participants={participants}
      gameweeks={[{ id: 'gameweek', label: 'Gameweek 1' }]}
      selectedParticipantId="bob"
      selectedGameweekId="gameweek"
      llmFallbackConfigured={false}
      fixtures={[
        {
          id: 'fixture',
          home_team_name: 'Home',
          away_team_name: 'Away',
          kickoff: '2026-08-15T15:00:00.000Z',
          result_confirmed: false,
          prediction,
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

describe('AdminPredictionsForm email import review', () => {
  it('fills a review draft without saving it automatically', async () => {
    vi.mocked(adminExtractEmailPredictions).mockResolvedValue({
      success: true,
      predictions: [
        {
          fixtureId: 'fixture',
          homeScore: 2,
          awayScore: 1,
          method: 'deterministic',
        },
      ],
      unmatchedFixtureIds: [],
      warnings: [],
      llmConfigured: false,
      usedLlm: false,
    });
    renderSelectedForm();

    fireEvent.change(screen.getByRole('textbox', { name: 'Email text' }), {
      target: { value: 'Home 2-1 Away' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Extract predictions' }));

    expect(await screen.findByText('Parser match')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Home score' })).toHaveValue('2');
    expect(screen.getByRole('textbox', { name: 'Away score' })).toHaveValue('1');
    expect(screen.getByRole('button', { name: 'Review and save predictions' })).toBeInTheDocument();
    expect(adminSubmitPredictions).not.toHaveBeenCalled();
  });

  it('warns when an imported score will replace an existing prediction', async () => {
    vi.mocked(adminExtractEmailPredictions).mockResolvedValue({
      success: true,
      predictions: [{ fixtureId: 'fixture', homeScore: 3, awayScore: 0, method: 'llm' }],
      unmatchedFixtureIds: [],
      warnings: [],
      llmConfigured: true,
      usedLlm: true,
    });
    renderSelectedForm({ home_score: 1, away_score: 1, points_awarded: null });

    fireEvent.change(screen.getByRole('textbox', { name: 'Email text' }), {
      target: { value: 'Home will beat Away' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Extract predictions' }));

    expect(await screen.findByText('LLM suggestion')).toBeInTheDocument();
    expect(screen.getByText('Will replace existing prediction 1–1')).toBeInTheDocument();
  });
});

describe('AdminPredictionsForm messages tab', () => {
  it('shows every gameweek message in one list and acknowledges unread messages', async () => {
    render(
      <AdminPredictionsForm
        participants={participants}
        gameweeks={[{ id: 'gameweek', label: 'Gameweek 1' }]}
        selectedParticipantId=""
        selectedGameweekId="gameweek"
        initialTab="messages"
        unreadMessageCount={2}
        messages={[
          {
            id: 'one',
            participantId: 'alice',
            participantName: 'Alice Adams',
            content: messageContent('First note'),
            plainText: 'First note',
            createdAt: '2026-08-10T12:00:00.000Z',
            updatedAt: '2026-08-10T12:00:00.000Z',
            unread: true,
          },
          {
            id: 'two',
            participantId: 'bob',
            participantName: 'Bob Brown',
            content: messageContent('Second note'),
            plainText: 'Second note',
            createdAt: '2026-08-10T11:00:00.000Z',
            updatedAt: '2026-08-10T11:00:00.000Z',
            unread: true,
          },
        ]}
        llmFallbackConfigured={false}
        fixtures={[]}
      />
    );

    expect(screen.getByText('Alice Adams')).toBeInTheDocument();
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Bob Brown')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Predictions/ })).toHaveAttribute(
      'href',
      '/admin/predictions?gameweekId=gameweek'
    );
    expect(screen.getByRole('tab', { name: /Messages/ })).toHaveAttribute(
      'href',
      '/admin/predictions?gameweekId=gameweek&tab=messages'
    );
    await waitFor(() => expect(markMessagesReadMock).toHaveBeenCalledWith('gameweek'));
  });
});
