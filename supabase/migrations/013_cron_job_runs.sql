-- Migration: 013_cron_job_runs
-- Durable execution history for scheduled jobs and their diagnostics.

create table public.cron_job_runs (
  id            uuid primary key default gen_random_uuid(),
  job_name      text not null
                  check (job_name in ('sync-fixtures', 'sync-results', 'send-reminders')),
  status        text not null default 'running'
                  check (status in ('running', 'success', 'error')),
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  duration_ms   integer check (duration_ms is null or duration_ms >= 0),
  summary       jsonb not null default '{}'::jsonb,
  error_details jsonb
);

alter table public.cron_job_runs enable row level security;

-- Cron endpoints and the admin page use the server-only service role. No direct
-- browser access is allowed, because diagnostics can contain operational detail.
create index cron_job_runs_job_started_idx
  on public.cron_job_runs(job_name, started_at desc);

