export type AppEnvironment = 'development' | 'staging' | 'production';
export type SeasonType = 'production' | 'test' | 'demo';

type EnvironmentSource = Record<string, string | undefined>;

export interface EnvironmentPolicy {
  appEnvironment: AppEnvironment;
  externalFixtureSyncEnabled: boolean;
  liveNotificationsEnabled: boolean;
}

const APP_ENVIRONMENTS = new Set<AppEnvironment>([
  'development',
  'staging',
  'production',
]);

export function resolveAppEnvironment(
  env: EnvironmentSource = process.env,
): AppEnvironment {
  const configured = env.APP_ENV;

  if (configured) {
    if (!APP_ENVIRONMENTS.has(configured as AppEnvironment)) {
      throw new Error(
        `Invalid APP_ENV "${configured}". Expected development, staging, or production.`,
      );
    }

    return configured as AppEnvironment;
  }

  // Backwards compatibility for the existing deployment until APP_ENV is set.
  return env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function getEnvironmentPolicy(
  env: EnvironmentSource = process.env,
): EnvironmentPolicy {
  const appEnvironment = resolveAppEnvironment(env);
  const externalFixtureSyncEnabled =
    appEnvironment === 'production' ||
    env.ALLOW_EXTERNAL_FIXTURE_SYNC === 'true';

  return {
    appEnvironment,
    externalFixtureSyncEnabled,
    liveNotificationsEnabled: appEnvironment === 'production',
  };
}

export function shouldDryRunNotifications(
  seasonType: SeasonType | string | null | undefined,
  env: EnvironmentSource = process.env,
): boolean {
  return (
    seasonType !== 'production' ||
    !getEnvironmentPolicy(env).liveNotificationsEnabled
  );
}

export function getSupabaseProjectRef(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const suffix = '.supabase.co';
    return hostname.endsWith(suffix)
      ? hostname.slice(0, -suffix.length)
      : null;
  } catch {
    return null;
  }
}

/**
 * Hard gate for future destructive staging tooling.
 *
 * Requiring both APP_ENV=staging and an exact project-ref match prevents a
 * copied production environment from becoming a valid reset target.
 */
export function assertSafeStagingTarget(
  env: EnvironmentSource = process.env,
): { projectRef: string } {
  if (env.APP_ENV !== 'staging') {
    throw new Error('Refusing staging operation: APP_ENV must be explicitly set to staging.');
  }

  const expectedProjectRef = env.STAGING_SUPABASE_PROJECT_REF?.trim().toLowerCase();
  if (!expectedProjectRef) {
    throw new Error(
      'Refusing staging operation: STAGING_SUPABASE_PROJECT_REF is required.',
    );
  }

  const actualProjectRef = getSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!actualProjectRef || actualProjectRef !== expectedProjectRef) {
    throw new Error(
      'Refusing staging operation: NEXT_PUBLIC_SUPABASE_URL does not match ' +
        'STAGING_SUPABASE_PROJECT_REF.',
    );
  }

  return { projectRef: actualProjectRef };
}
