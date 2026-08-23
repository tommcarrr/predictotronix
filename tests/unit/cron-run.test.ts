import { describe, expect, it } from 'vitest';
import { buildCronErrorDetails } from '@/lib/cron/run';

describe('cron run diagnostics', () => {
  it('preserves useful Error fields and structured context without secrets', () => {
    const root = new Error('provider request failed', { cause: new Error('socket timeout') });
    const details = buildCronErrorDetails('sync-fixtures', root, {
      seasonId: 'season-1',
      errors: ['fixture 42 failed'],
      apiKey: 'do-not-copy-this',
      recipient: 'person@example.com',
    });

    expect(details).toMatchObject({
      job: {
        id: 'sync-fixtures',
        endpoint: '/api/cron/sync-fixtures',
      },
      error: {
        name: 'Error',
        message: 'provider request failed',
        cause: { message: 'socket timeout' },
      },
      context: {
        seasonId: 'season-1',
        errors: ['fixture 42 failed'],
        apiKey: '[REDACTED]',
        recipient: '[REDACTED_EMAIL]',
      },
    });
  });
});
