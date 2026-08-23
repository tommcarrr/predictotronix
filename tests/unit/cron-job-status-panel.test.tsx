import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CronJobStatusPanel,
  buildCronDiagnosticPrompt,
  type CronJobRunStatus,
} from '@/components/admin/CronJobStatusPanel';

const failedRun: CronJobRunStatus = {
  id: 'run-1',
  job_name: 'sync-results',
  status: 'error',
  started_at: '2026-08-23T08:15:00.000Z',
  finished_at: '2026-08-23T08:15:02.500Z',
  duration_ms: 2_500,
  summary: { fixturesScored: 3, errorCount: 1 },
  error_details: {
    error: { message: 'API-Football timed out', stack: 'Error: API-Football timed out' },
  },
};

describe('CronJobStatusPanel', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('lists every configured job and identifies jobs that have never run', () => {
    render(<CronJobStatusPanel runs={[failedRun]} />);

    expect(screen.getByText('Sync fixtures')).toBeInTheDocument();
    expect(screen.getByText('Sync results')).toBeInTheDocument();
    expect(screen.getByText('Send reminders')).toBeInTheDocument();
    expect(screen.getAllByText('Never run')).toHaveLength(2);
    expect(screen.getByText('Errored')).toBeInTheDocument();
    expect(screen.getByText(/23 Aug 2026.*08:15:00 UTC/)).toBeInTheDocument();
  });

  it('copies a self-contained diagnostic prompt for an LLM', async () => {
    render(<CronJobStatusPanel runs={[failedRun]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy Sync results error diagnostics' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain('Diagnose this Predictotronix cron job failure');
    expect(copied).toContain('API-Football timed out');
    expect(copied).toContain('/api/cron/sync-results');
    expect(screen.getByText('Copied')).toBeInTheDocument();
  });

  it('builds readable JSON containing the schedule, summary, and error', () => {
    expect(JSON.parse(buildCronDiagnosticPrompt('sync-results', failedRun))).toMatchObject({
      job: { schedule: '*/15 * * * *' },
      run: {
        summary: { fixturesScored: 3 },
        errorDetails: { error: { message: 'API-Football timed out' } },
      },
    });
  });
});

