import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiFootballProvider } from '@/lib/api-football/client';

describe('API-Football client diagnostics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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
