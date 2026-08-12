import type { ApiFixture, FixtureProvider } from './types';

const DIRECT_BASE_URL = 'https://v3.football.api-sports.io';
const RAPIDAPI_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';
const RAPIDAPI_HOST = 'api-football-v1.p.rapidapi.com';

interface ApiFootballConfig {
  baseUrl: string;
  authMode: 'API-Sports direct key' | 'RapidAPI key';
  headers: Record<string, string>;
}

function getApiFootballConfig(): ApiFootballConfig {
  const directKey = process.env.API_FOOTBALL_KEY?.trim();
  const rapidApiKey = process.env.RAPIDAPI_KEY?.trim();

  if (directKey && rapidApiKey) {
    throw new Error(
      'API-Football configuration error: both API_FOOTBALL_KEY and RAPIDAPI_KEY are configured. Remove one so the provider is unambiguous.'
    );
  }

  if (directKey) {
    return {
      baseUrl: process.env.API_FOOTBALL_BASE_URL?.trim() || DIRECT_BASE_URL,
      authMode: 'API-Sports direct key',
      headers: { 'x-apisports-key': directKey },
    };
  }

  if (rapidApiKey) {
    return {
      baseUrl: process.env.API_FOOTBALL_BASE_URL?.trim() || RAPIDAPI_BASE_URL,
      authMode: 'RapidAPI key',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    };
  }

  throw new Error(
    'API-Football configuration error: configure exactly one of API_FOOTBALL_KEY (direct API-Sports) or RAPIDAPI_KEY (RapidAPI).'
  );
}

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

function getSafeRequestDiagnostics(
  config: ApiFootballConfig,
  path: string,
  response: Response,
  results?: number
) {
  const baseHost = (() => {
    try {
      return new URL(config.baseUrl).host;
    } catch {
      return 'invalid API_FOOTBALL_BASE_URL';
    }
  })();
  const remaining = response.headers.get('x-ratelimit-remaining');
  const dailyRemaining = response.headers.get('x-ratelimit-requests-remaining');
  return {
    endpoint: path,
    baseHost,
    authMode: config.authMode,
    httpStatus: response.status,
    results: results ?? 'unknown',
    rateLimitRemaining: remaining ?? 'not provided',
    dailyRequestsRemaining: dailyRemaining ?? 'not provided',
  };
}

async function apiFetch<T>(path: string): Promise<T> {
  const config = getApiFootballConfig();
  const now = Date.now() / 1000;
  if (rateLimitState.remaining <= 1 && now < rateLimitState.reset) {
    const waitMs = (rateLimitState.reset - now) * 1000 + 500;
    await new Promise((r) => setTimeout(r, waitMs));
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: config.headers,
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
        getSafeRequestDiagnostics(config, path, response)
      )}`
    );
  }

  const apiErrors = formatApiErrors(json.errors);
  const diagnostics = getSafeRequestDiagnostics(config, path, response, json.results);

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

/** Real implementation using either direct API-Sports or RapidAPI authentication. */
export class ApiFootballProvider implements FixtureProvider {
  readonly name = 'API-Football';

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
