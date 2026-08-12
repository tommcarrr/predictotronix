import { ApiFootballProvider } from '@/lib/api-football/client';
import type { ApiFixture, FixtureProvider } from '@/lib/api-football/types';
import { FplFixtureProvider } from '@/lib/fpl/client';

class FallbackFixtureProvider implements FixtureProvider {
  readonly name: string;

  constructor(
    private readonly primary: FixtureProvider,
    private readonly fallback?: FixtureProvider
  ) {
    this.name = fallback
      ? `${primary.name} (fallback: ${fallback.name})`
      : primary.name;
  }

  private async run<T>(operation: (provider: FixtureProvider) => Promise<T>): Promise<T> {
    try {
      return await operation(this.primary);
    } catch (primaryError) {
      if (!this.fallback) throw primaryError;
      console.warn(`[fixture-provider] ${this.primary.name} failed; using ${this.fallback.name}`, primaryError);
      try {
        return await operation(this.fallback);
      } catch (fallbackError) {
        throw new Error(
          `${this.primary.name} failed: ${String(primaryError)}; ${this.fallback.name} also failed: ${String(fallbackError)}`
        );
      }
    }
  }

  getSeasonFixtures(leagueId: number, season: number): Promise<ApiFixture[]> {
    return this.run((provider) => provider.getSeasonFixtures(leagueId, season));
  }

  getRoundFixtures(leagueId: number, season: number, round: string): Promise<ApiFixture[]> {
    return this.run((provider) => provider.getRoundFixtures(leagueId, season, round));
  }

  getFixture(fixtureId: number): Promise<ApiFixture | null> {
    return this.run(async (provider) => {
      const fixture = await provider.getFixture(fixtureId);
      if (!fixture && provider === this.primary && this.fallback) {
        return this.fallback.getFixture(fixtureId);
      }
      return fixture;
    });
  }

  getRounds(leagueId: number, season: number): Promise<string[]> {
    return this.run((provider) => provider.getRounds(leagueId, season));
  }
}

/** FPL is always the default; configured API-Football credentials enable fallback. */
export function createProductionFixtureProvider(): FixtureProvider {
  const hasApiFootballFallback = Boolean(
    process.env.API_FOOTBALL_KEY?.trim() || process.env.RAPIDAPI_KEY?.trim()
  );
  return new FallbackFixtureProvider(
    new FplFixtureProvider(),
    hasApiFootballFallback ? new ApiFootballProvider() : undefined
  );
}
