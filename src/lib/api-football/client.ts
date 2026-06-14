import type { ApiFixture, FixtureProvider } from './types';

const BASE_URL = process.env.API_FOOTBALL_BASE_URL ?? 'https://v3.football.api-sports.io';

interface RateLimitState {
  remaining: number;
  reset: number; // unix timestamp
}

let rateLimitState: RateLimitState = { remaining: 100, reset: 0 };

async function apiFetch<T>(path: string): Promise<T> {
  const now = Date.now() / 1000;
  if (rateLimitState.remaining <= 1 && now < rateLimitState.reset) {
    const waitMs = (rateLimitState.reset - now) * 1000 + 500;
    await new Promise((r) => setTimeout(r, waitMs));
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY ?? '',
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
    next: { revalidate: 0 }, // no caching — always fresh from API
  });

  // Track rate limit headers
  const remaining = response.headers.get('x-ratelimit-requests-remaining');
  const reset = response.headers.get('x-ratelimit-requests-reset');
  if (remaining) rateLimitState.remaining = parseInt(remaining, 10);
  if (reset) rateLimitState.reset = parseInt(reset, 10);

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status} ${response.statusText} — ${path}`);
  }

  const json = await response.json();
  return json.response as T;
}

/** Real implementation using API-Football via RapidAPI. */
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
