'use client';

import { useState } from 'react';
import { Check, Clipboard, Clock3, TriangleAlert } from 'lucide-react';
import { CRON_JOBS, type CronJobName } from '@/lib/cron/jobs';
import type { Json } from '@/types/database';

export interface CronJobRunStatus {
  id: string;
  job_name: CronJobName;
  status: 'running' | 'success' | 'error';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  summary: Json;
  error_details: Json | null;
}

function formatUtc(iso: string) {
  return `${new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(iso))} UTC`;
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null) return null;
  if (durationMs < 1_000) return `${durationMs} ms`;
  return `${(durationMs / 1_000).toFixed(durationMs < 10_000 ? 1 : 0)} s`;
}

export function buildCronDiagnosticPrompt(jobName: CronJobName, run: CronJobRunStatus) {
  const job = CRON_JOBS.find((candidate) => candidate.id === jobName)!;
  return JSON.stringify(
    {
      request: 'Diagnose this Predictotronix cron job failure and propose a safe code fix.',
      job,
      run: {
        id: run.id,
        status: run.status,
        startedAt: run.started_at,
        finishedAt: run.finished_at,
        durationMs: run.duration_ms,
        summary: run.summary,
        errorDetails: run.error_details,
      },
    },
    null,
    2
  );
}

const statusStyles = {
  running: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  success: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
};

export function CronJobStatusPanel({
  runs,
  loadError,
}: {
  runs: CronJobRunStatus[];
  loadError?: string;
}) {
  const [copyState, setCopyState] = useState<{ jobName: CronJobName; ok: boolean } | null>(null);
  const latestByJob = new Map(runs.map((run) => [run.job_name, run]));

  async function copyDiagnostics(jobName: CronJobName, run: CronJobRunStatus) {
    try {
      await navigator.clipboard.writeText(buildCronDiagnosticPrompt(jobName, run));
      setCopyState({ jobName, ok: true });
    } catch {
      setCopyState({ jobName, ok: false });
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="cron-status-heading">
      <div>
        <h2 id="cron-status-heading" className="text-lg font-semibold">Scheduled jobs</h2>
        <p className="text-sm text-muted-foreground">
          Latest execution recorded by each secured cron endpoint. Times are shown in UTC.
        </p>
      </div>

      {loadError && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          Cron status could not be loaded: {loadError}
        </p>
      )}

      <div className="grid gap-3">
        {CRON_JOBS.map((job) => {
          const run = latestByJob.get(job.id);
          const duration = run ? formatDuration(run.duration_ms) : null;
          const diagnostics = run?.error_details
            ? JSON.stringify(run.error_details, null, 2)
            : null;

          return (
            <article key={job.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{job.label}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${run ? statusStyles[run.status] : 'border-border bg-muted text-muted-foreground'}`}>
                      {run ? run.status === 'running' ? 'Running' : run.status === 'success' ? 'Successful' : 'Errored' : 'Never run'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {job.scheduleLabel} · {job.schedule} · {job.endpoint}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="size-4" aria-hidden="true" />
                  {run ? (
                    <span>
                      <time dateTime={run.started_at}>{formatUtc(run.started_at)}</time>
                      {duration ? ` · ${duration}` : ''}
                    </span>
                  ) : (
                    <span>No run recorded</span>
                  )}
                </div>
              </div>

              {run?.status === 'error' && diagnostics && (
                <div className="mt-4 space-y-2 rounded-lg border border-red-500/30 bg-slate-950 p-3 text-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-300">
                      <TriangleAlert className="size-4" aria-hidden="true" />
                      Error diagnostics
                    </div>
                    <button
                      type="button"
                      onClick={() => copyDiagnostics(job.id, run)}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium hover:bg-slate-800"
                      aria-label={`Copy ${job.label} error diagnostics`}
                    >
                      {copyState?.jobName === job.id && copyState.ok ? (
                        <Check className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Clipboard className="size-3.5" aria-hidden="true" />
                      )}
                      {copyState?.jobName === job.id && copyState.ok ? 'Copied' : 'Copy for LLM'}
                    </button>
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-300">
                    {diagnostics}
                  </pre>
                  {copyState?.jobName === job.id && !copyState.ok && (
                    <p className="text-xs text-amber-300">Clipboard access failed. Select and copy the diagnostics above.</p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

