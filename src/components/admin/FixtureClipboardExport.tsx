'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';

export interface FixtureExportGameweek {
  id: string;
  label: string;
  gameweekNumber: number;
  fixtures: {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    kickoff: string;
  }[];
}

interface Props {
  gameweeks: FixtureExportGameweek[];
}

type CopyStatus = 'idle' | 'copied' | 'error';

const kickoffFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatFixtureExport(gameweek: FixtureExportGameweek) {
  const fixtureLines = [...gameweek.fixtures]
    .sort((first, second) => first.kickoff.localeCompare(second.kickoff))
    .map(
      (fixture) =>
        `${kickoffFormatter.format(new Date(fixture.kickoff))} — ${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
    );

  return [`${gameweek.label} fixtures (UK time)`, '', ...fixtureLines].join('\n');
}

export function FixtureClipboardExport({ gameweeks }: Props) {
  const [selectedGameweekId, setSelectedGameweekId] = useState(gameweeks[0]?.id ?? '');
  const [status, setStatus] = useState<CopyStatus>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedGameweek = gameweeks.find((gameweek) => gameweek.id === selectedGameweekId) ?? gameweeks[0];
  const exportText = useMemo(
    () => (selectedGameweek ? formatFixtureExport(selectedGameweek) : ''),
    [selectedGameweek],
  );

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyFixtures() {
    try {
      await navigator.clipboard.writeText(exportText);
      setStatus('copied');
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clipboard export</p>
          <h2 className="mt-1 text-lg font-semibold">Copy gameweek fixtures</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a gameweek and copy its fixture list in kickoff order.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="fixture-export-gameweek" className="text-xs font-semibold text-muted-foreground">
              Gameweek
            </label>
            <div className="relative mt-1">
              <select
                id="fixture-export-gameweek"
                value={selectedGameweek?.id ?? ''}
                onChange={(event) => {
                  setSelectedGameweekId(event.target.value);
                  setStatus('idle');
                }}
                className="min-w-52 appearance-none rounded-lg border border-border bg-background py-2.5 pl-3 pr-10 text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {gameweeks.map((gameweek) => (
                  <option key={gameweek.id} value={gameweek.id}>
                    {gameweek.label} ({gameweek.fixtures.length})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
            </div>
          </div>
          <button
            type="button"
            onClick={copyFixtures}
            aria-label={status === 'copied' ? 'Fixtures copied' : 'Copy fixtures to clipboard'}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {status === 'copied' ? <Check className="size-4" /> : <Copy className="size-4" />}
            {status === 'copied' ? 'Copied!' : 'Copy fixtures'}
          </button>
        </div>
      </div>

      <textarea
        aria-label="Fixture export preview"
        className="mt-4 min-h-28 w-full resize-y rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        onFocus={(event) => event.currentTarget.select()}
        readOnly
        value={exportText}
      />
      <p aria-live="polite" className={`mt-2 text-xs ${status === 'error' ? 'text-destructive' : 'sr-only'}`}>
        {status === 'copied'
          ? `${selectedGameweek?.label ?? 'Gameweek'} fixtures copied to clipboard.`
          : status === 'error'
            ? 'Could not copy the fixtures. Select the preview above and copy it manually.'
            : ''}
      </p>
    </section>
  );
}
