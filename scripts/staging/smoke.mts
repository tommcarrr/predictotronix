import { assertSafeStagingTarget } from '../../src/lib/environment.ts';

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  assertSafeStagingTarget();
  const appUrl = requiredEnvironment('NEXT_PUBLIC_APP_URL').replace(/\/$/, '');
  const cronSecret = requiredEnvironment('CRON_SECRET');

  const healthResponse = await fetch(`${appUrl}/api/health`, {
    headers: { Accept: 'application/json' },
  });
  if (!healthResponse.ok) {
    throw new Error(`Health check failed with HTTP ${healthResponse.status}.`);
  }

  const health = (await healthResponse.json()) as {
    ok?: boolean;
    environment?: string;
  };
  if (!health.ok || health.environment !== 'staging') {
    throw new Error(
      `Health check reported an unsafe environment: ${JSON.stringify(health)}.`,
    );
  }

  const syncResponse = await fetch(`${appUrl}/api/cron/sync-fixtures`, {
    method: 'POST',
    headers: { 'x-cron-secret': cronSecret },
  });
  if (syncResponse.status !== 409) {
    throw new Error(
      `Expected external fixture sync to be disabled with HTTP 409, received ${syncResponse.status}.`,
    );
  }

  console.log('Staging smoke test passed:', {
    appUrl,
    environment: health.environment,
    externalFixtureSync: 'disabled',
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
