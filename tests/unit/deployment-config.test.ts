import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';

const renderBlueprint = readFileSync('render.yaml', 'utf8');
const stagingWorkflow = readFileSync(
  '.github/workflows/staging-operations.yml',
  'utf8',
);
const seasonClockMigration = readFileSync(
  'supabase/migrations/007_season_clock.sql',
  'utf8',
);

describe('staging deployment configuration', () => {
  it('defines a protected Render staging service with safe defaults', () => {
    expect(renderBlueprint).toContain('name: predictotronix-staging');
    expect(renderBlueprint).toContain('protection: enabled');
    expect(renderBlueprint).toContain('autoDeployTrigger: checksPass');
    expect(renderBlueprint).toContain('healthCheckPath: /api/health');
    expect(renderBlueprint).toContain('key: APP_ENV\n                value: staging');
    expect(renderBlueprint).toContain(
      'key: ALLOW_EXTERNAL_FIXTURE_SYNC\n                value: "false"',
    );
  });

  it('never commits staging credential values into the Blueprint', () => {
    for (const key of [
      'STAGING_SUPABASE_PROJECT_REF',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'CRON_SECRET',
    ]) {
      expect(renderBlueprint).toContain(`key: ${key}\n                sync: false`);
    }
  });

  it('keeps staging operations manual, protected, and serialized', () => {
    expect(stagingWorkflow).toContain('workflow_dispatch:');
    expect(stagingWorkflow).toContain('environment: staging');
    expect(stagingWorkflow).toContain('group: staging-operations');
    expect(stagingWorkflow).toContain('cancel-in-progress: false');
    expect(stagingWorkflow).toContain('supabase db push --db-url');
    expect(stagingWorkflow).toContain('npm run staging:reset');
    expect(stagingWorkflow).toContain('npm run staging:smoke');
  });

  it('keeps simulated time service-only and impossible for production seasons', () => {
    expect(seasonClockMigration).toContain(
      "when s.season_type in ('test', 'demo')",
    );
    expect(seasonClockMigration).toContain('else statement_timestamp()');
    expect(seasonClockMigration).toContain(
      'alter table public.season_runtime_settings enable row level security',
    );
    expect(seasonClockMigration).toContain(
      'revoke all on function public.get_season_time(uuid) from public',
    );
    expect(seasonClockMigration).toContain(
      'public.get_season_time(f.season_id)',
    );
  });
});

describe('health endpoint', () => {
  it('reports application health without caching', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body).toMatchObject({ ok: true, environment: 'development' });
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
