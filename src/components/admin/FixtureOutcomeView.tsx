import { AdminBadge } from '@/components/admin/AdminBadge';
import type { FixtureOutcomePrediction } from '@/lib/admin/fixture-outcomes';

export interface FixtureOutcomeGameweek {
  id: string;
  label: string;
  gameweekNumber: number;
  fixtures: {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    kickoff: string;
    homeScore: number;
    awayScore: number;
    exactScores: FixtureOutcomePrediction[];
    correctResults: FixtureOutcomePrediction[];
  }[];
}

function PredictionGroup({
  title,
  description,
  predictions,
  tone,
}: {
  title: string;
  description: string;
  predictions: FixtureOutcomePrediction[];
  tone: 'green' | 'blue';
}) {
  return (
    <div
      role="group"
      aria-label={`${title}, ${predictions.length} ${predictions.length === 1 ? 'person' : 'people'}`}
      className="rounded-xl border border-border bg-muted/25 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <AdminBadge tone={tone}>{predictions.length}</AdminBadge>
      </div>
      {predictions.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${title} predictions`}>
          {predictions.map((prediction) => (
            <li
              key={prediction.participantId}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs shadow-xs"
            >
              <span className="font-semibold">{prediction.displayName}</span>
              <span className="ml-1.5 text-muted-foreground">
                {prediction.homeScore}–{prediction.awayScore}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">Nobody</p>
      )}
    </div>
  );
}

export function FixtureOutcomeView({ gameweeks }: { gameweeks: FixtureOutcomeGameweek[] }) {
  if (gameweeks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No confirmed results are available for this season yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Prediction outcomes by fixture</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Exact scores are worth three points. Correct results shown here are the one-point outcomes
          that did not match the exact score.
        </p>
      </div>

      {gameweeks.map((gameweek) => (
        <section key={gameweek.id} aria-labelledby={`outcome-${gameweek.id}`}>
          <div className="mb-3 flex items-center gap-2">
            <h3 id={`outcome-${gameweek.id}`} className="font-semibold">
              {gameweek.label}
            </h3>
            <AdminBadge>{gameweek.fixtures.length} results</AdminBadge>
          </div>
          <div className="space-y-4">
            {gameweek.fixtures.map((fixture) => (
              <article
                key={fixture.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {fixture.homeTeamName} vs {fixture.awayTeamName}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(fixture.kickoff).toLocaleString('en-GB', {
                        timeZone: 'Europe/London',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-2xl font-bold tabular-nums" aria-label="Final score">
                    {fixture.homeScore}–{fixture.awayScore}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <PredictionGroup
                    title="Exact score"
                    description="Three points"
                    predictions={fixture.exactScores}
                    tone="green"
                  />
                  <PredictionGroup
                    title="Correct result"
                    description="One point · score not exact"
                    predictions={fixture.correctResults}
                    tone="blue"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
