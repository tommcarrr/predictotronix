import type { ApiFixture, FixtureProvider } from './types';

const BASE_URL = process.env.API_FOOTBALL_BASE_URL ?? 'https://v3.football.api-sports.io';

interface ApiFootballEnvelope<T> {
  response?: T;
  errors?: unknown;
  results?: number;
}

interface RateLimitState {
  remaining: number;
  reset: number; // unix timestamp
}

let rateLimitState: RateLimitState = { remaining: 100, reset: 0 };

function formatApiErrors(errors: unknown): string[] {
  if (!errors) return [];
  if (typeof errors === 'string') return errors ? [errors] : [];
  if (Array.isArray(errors)) return errors.flatMap(formatApiErrors);
  if (typeof errors === 'object') {
    return Object.entries(errors as Record<string, unknown>).flatMap(([field, value]) =>
      formatApiErrors(value).map((message) => `${field}: ${message}`)
    );
  }
  return [String(errors)];
}

function getSafeRequestDiagnostics(path: string, response: Response, results?: number) {
  const baseHost = (() => {
    try {
      return new URL(BASE_URL).host;
    } catch {
      return 'invalid API_FOOTBALL_BASE_URL';
    }
  })();
  const authMode = process.env.API_FOOTBALL_KEY
    ? 'API-Sports direct key'
    : 'no API_FOOTBALL_KEY configured';
  const remaining = response.headers.get('x-ratelimit-remaining');
  const dailyRemaining = response.headers.get('x-ratelimit-requests-remaining');
  return {
    endpoint: path,
    baseHost,
    authMode,
    httpStatus: response.status,
    results: results ?? 'unknown',
    rateLimitRemaining: remaining ?? 'not provided',
    dailyRequestsRemaining: dailyRemaining ?? 'not provided',
  };
}

async function apiFetch<T>(path: string): Promise<T> {
  const now = Date.now() / 1000;
  if (rateLimitState.remaining <= 1 && now < rateLimitState.reset) {
    const waitMs = (rateLimitState.reset - now) * 1000 + 500;
    await new Promise((r) => setTimeout(r, waitMs));
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'x-apisports-key': process.env.API_FOOTBALL_KEY ?? '',
    },
    next: { revalidate: 0 }, // no caching — always fresh from API
  });

  // Track rate limit headers
  const remaining = response.headers.get('x-ratelimit-requests-remaining');
  const reset = response.headers.get('x-ratelimit-requests-reset');
  if (remaining) rateLimitState.remaining = parseInt(remaining, 10);
  if (reset) rateLimitState.reset = parseInt(reset, 10);

  let json: ApiFootballEnvelope<T>;
  try {
    json = (await response.json()) as ApiFootballEnvelope<T>;
  } catch {
    throw new Error(
      `API-Football returned a non-JSON response. Diagnostics: ${JSON.stringify(
        getSafeRequestDiagnostics(path, response)
      )}`
    );
  }

  const apiErrors = formatApiErrors(json.errors);
  const diagnostics = getSafeRequestDiagnostics(path, response, json.results);

  if (!response.ok || apiErrors.length > 0) {
    const message = apiErrors.length
      ? apiErrors.join('; ')
      : `${response.status} ${response.statusText}`;
    throw new Error(`API-Football rejected the request: ${message}. Diagnostics: ${JSON.stringify(diagnostics)}`);
  }

  if (json.response === undefined) {
    throw new Error(
      `API-Football response did not contain a response field. Diagnostics: ${JSON.stringify(diagnostics)}`
    );
  }

  return json.response;
}

/** Real implementation using API-Football directly through API-Sports. */
export class ApiFootballProvider implements FixtureProvider {
  async getSeasonFixtures(leagueId: number, season: number): Promise<ApiFixture[]> {
    return apiFetch<ApiFixture[]>(`/fixtures?league=${leagueId}&season=${season}`);
  }

  async getRoundFixtures(leagueId: number, season: number, round: string): Promise<ApiFixture[]> {
    const encodedRound = encodeURIComponent(round);
    return apiFetch<ApiFixture[]>(
      `/fixtures?league=${leagueId}&season=${season}&round=${encodedRound}`
    );
  }

  async getFixture(fixtureId: number): Promise<ApiFixture | null> {
    const results = await apiFetch<ApiFixture[]>(`/fixtures?id=${fixtureId}`);
    return results[0] ?? null;
  }

  async getRounds(leagueId: number, season: number): Promise<string[]> {
    return apiFetch<string[]>(`/fixtures/rounds?league=${leagueId}&season=${season}`);
  }
}
