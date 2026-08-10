import { describe, expect, it } from 'vitest';
import {
  assertSafeStagingTarget,
  getEnvironmentPolicy,
  getSupabaseProjectRef,
  resolveAppEnvironment,
  shouldDryRunNotifications,
} from '@/lib/environment';

describe('environment policy', () => {
  it('preserves production behaviour when only NODE_ENV is configured', () => {
    expect(resolveAppEnvironment({ NODE_ENV: 'production' })).toBe('production');
    expect(getEnvironmentPolicy({ NODE_ENV: 'production' })).toMatchObject({
      externalFixtureSyncEnabled: true,
      liveNotificationsEnabled: true,
    });
  });

  it('defaults non-production Node environments to development', () => {
    expect(resolveAppEnvironment({ NODE_ENV: 'test' })).toBe('development');
  });

  it('rejects an invalid explicit APP_ENV', () => {
    expect(() => resolveAppEnvironment({ APP_ENV: 'preview' })).toThrow(
      'Invalid APP_ENV',
    );
  });

  it('disables live providers in staging by default', () => {
    expect(getEnvironmentPolicy({ APP_ENV: 'staging' })).toEqual({
      appEnvironment: 'staging',
      externalFixtureSyncEnabled: false,
      liveNotificationsEnabled: false,
    });
  });

  it('allows an explicit fixture-sync override without enabling notifications', () => {
    expect(
      getEnvironmentPolicy({
        APP_ENV: 'staging',
        ALLOW_EXTERNAL_FIXTURE_SYNC: 'true',
      }),
    ).toMatchObject({
      externalFixtureSyncEnabled: true,
      liveNotificationsEnabled: false,
    });
  });

  it('dry-runs notifications outside production environments or seasons', () => {
    expect(
      shouldDryRunNotifications('production', { APP_ENV: 'staging' }),
    ).toBe(true);
    expect(
      shouldDryRunNotifications('test', { APP_ENV: 'production' }),
    ).toBe(true);
    expect(
      shouldDryRunNotifications('production', { APP_ENV: 'production' }),
    ).toBe(false);
  });
});

describe('staging target safety', () => {
  const safeEnvironment = {
    APP_ENV: 'staging',
    STAGING_SUPABASE_PROJECT_REF: 'staging-project',
    NEXT_PUBLIC_SUPABASE_URL: 'https://staging-project.supabase.co',
  };

  it('extracts Supabase project references', () => {
    expect(getSupabaseProjectRef(safeEnvironment.NEXT_PUBLIC_SUPABASE_URL)).toBe(
      'staging-project',
    );
    expect(getSupabaseProjectRef('https://example.com')).toBeNull();
    expect(getSupabaseProjectRef('not a URL')).toBeNull();
  });

  it('accepts an explicitly matching staging target', () => {
    expect(assertSafeStagingTarget(safeEnvironment)).toEqual({
      projectRef: 'staging-project',
    });
  });

  it('rejects production mode and mismatched project references', () => {
    expect(() =>
      assertSafeStagingTarget({ ...safeEnvironment, APP_ENV: 'production' }),
    ).toThrow('APP_ENV must be explicitly set to staging');

    expect(() =>
      assertSafeStagingTarget({
        ...safeEnvironment,
        NEXT_PUBLIC_SUPABASE_URL: 'https://production-project.supabase.co',
      }),
    ).toThrow('does not match');
  });
});
