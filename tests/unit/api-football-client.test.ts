import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiFootballProvider } from '@/lib/api-football/client';

describe('API-Football client diagnostics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('authenticates direct API-Sports requests with API_FOOTBALL_KEY', async () => {
    vi.stubEnv('API_FOOTBALL_KEY', 'direct-api-key');
    vi.stubEnv('RAPIDAPI_KEY', 'legacy-key-that-must-not-be-used');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: [],
      results: 0,
      response: [],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await new ApiFootballProvider().getSeasonFixtures(39, 2025);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({ 'x-apisports-key': 'direct-api-key' });
    expect(options.headers).not.toHaveProperty('x-rapidapi-key');
    expect(options.headers).not.toHaveProperty('x-rapidapi-host');
  });

  it('surfaces API errors returned with HTTP 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: { token: 'Invalid or missing application key' },
      results: 0,
      response: [],
    }), { status: 200 })));

    await expect(new ApiFootballProvider().getSeasonFixtures(39, 2026)).rejects.toThrow(
      /token: Invalid or missing application key/
    );
  });

  it('includes safe request diagnostics without exposing credentials', async () => {
    vi.stubEnv('API_FOOTBALL_KEY', 'must-not-appear');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: ['Plan does not cover this season'],
      results: 0,
      response: [],
    }), {
      status: 403,
      headers: { 'x-ratelimit-requests-remaining': '42' },
    })));

    const message = await new ApiFootballProvider().getSeasonFixtures(39, 2026).catch(String);
    expect(message).toMatch(/"endpoint":"\/fixtures\?league=39&season=2026"/);
    expect(message).toMatch(/"dailyRequestsRemaining":"42"/);
    expect(message).toMatch(/"authMode":"API-Sports direct key"/);
    expect(message).not.toContain('must-not-appear');
  });

  it('returns a valid API response payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: [],
      results: 0,
      response: [],
    }), { status: 200 })));

    await expect(new ApiFootballProvider().getSeasonFixtures(39, 2026)).resolves.toEqual([]);
  });
});
