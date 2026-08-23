import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/types/database';
import { getCronJob, type CronJobName } from './jobs';

type ServiceClient = SupabaseClient<Database>;

export interface CronExecutionResult {
  body: Record<string, unknown>;
  httpStatus?: number;
  summary?: Record<string, unknown>;
  errors?: unknown[];
}

export class CronExecutionError extends Error {
  constructor(
    message: string,
    readonly httpStatus = 500,
    readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CronExecutionError';
  }
}

function redactSensitiveText(value: string) {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/(SMS to\s+)\+?[\d()\s-]{8,}/gi, '$1[REDACTED_PHONE]')
    .replace(
      /((?:api[-_]?key|authorization|bearer|token|secret)["'\s:=]+)[^\s,"'}]+/gi,
      '$1[REDACTED]'
    );
}

function toJson(value: unknown, seen = new WeakSet<object>()): Json {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') return redactSensitiveText(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveText(value.message),
      ...(value.stack ? { stack: redactSensitiveText(value.stack) } : {}),
      ...(value.cause !== undefined ? { cause: toJson(value.cause, seen) } : {}),
    };
  }
  if (Array.isArray(value)) return value.map((item) => toJson(item, seen));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /api[-_]?key|authorization|token|secret|password/i.test(key)
          ? '[REDACTED]'
          : toJson(item, seen),
      ])
    );
  }
  return String(value);
}

export function buildCronErrorDetails(
  jobName: CronJobName,
  error: unknown,
  context?: Record<string, unknown>
): Json {
  const job = getCronJob(jobName);
  return {
    job: {
      id: job.id,
      label: job.label,
      endpoint: job.endpoint,
      schedule: job.schedule,
    },
    recordedAt: new Date().toISOString(),
    error: toJson(error),
    ...(context ? { context: toJson(context) } : {}),
    runtime: {
      node: process.version,
      environment: process.env.NODE_ENV ?? 'unknown',
    },
  };
}

async function startRun(client: ServiceClient, jobName: CronJobName, startedAt: string) {
  const { data, error } = await client
    .from('cron_job_runs')
    .insert({ job_name: jobName, status: 'running', started_at: startedAt })
    .select('id')
    .single();

  if (error) {
    console.error(`[cron/${jobName}] Could not record run start`, error);
    return null;
  }
  return data.id;
}

async function finishRun(
  client: ServiceClient,
  runId: string | null,
  values: Database['public']['Tables']['cron_job_runs']['Update']
) {
  if (!runId) return;
  const { error } = await client.from('cron_job_runs').update(values).eq('id', runId);
  if (error) console.error('[cron] Could not record run completion', error);
}

export async function executeCronJob(
  jobName: CronJobName,
  handler: (client: ServiceClient) => Promise<CronExecutionResult>
) {
  const started = new Date();
  let client: ServiceClient | null = null;
  let runId: string | null = null;

  try {
    client = createServiceClient();
    runId = await startRun(client, jobName, started.toISOString());
    const result = await handler(client);
    const errors = (result.errors ?? []).filter((error) => error !== null && error !== undefined);
    const finished = new Date();
    const status = errors.length > 0 ? 'error' : 'success';
    const summary = toJson(result.summary ?? {});
    const errorDetails = errors.length
      ? buildCronErrorDetails(jobName, new Error(`${jobName} reported ${errors.length} error(s).`), {
          errors,
          summary: result.summary ?? {},
        })
      : null;

    await finishRun(client, runId, {
      status,
      finished_at: finished.toISOString(),
      duration_ms: Math.max(0, finished.getTime() - started.getTime()),
      summary,
      error_details: errorDetails,
    });

    return NextResponse.json(result.body, { status: result.httpStatus ?? 200 });
  } catch (error) {
    const finished = new Date();
    const context = error instanceof CronExecutionError ? error.context : undefined;
    const details = buildCronErrorDetails(jobName, error, context);
    if (client) {
      await finishRun(client, runId, {
        status: 'error',
        finished_at: finished.toISOString(),
        duration_ms: Math.max(0, finished.getTime() - started.getTime()),
        error_details: details,
      });
    }
    console.error(`[cron/${jobName}]`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: error instanceof CronExecutionError ? error.httpStatus : 500 }
    );
  }
}
