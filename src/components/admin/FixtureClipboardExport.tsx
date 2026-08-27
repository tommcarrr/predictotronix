'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { AdminBadge, statusTone } from '@/components/admin/AdminBadge';
import { copyToClipboard } from '@/lib/client/clipboard';

type FixtureStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | 'abandoned';

export interface FixtureExportGameweek {
  id: string;
  label: string;
  gameweekNumber: number;
  fixtures: {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    kickoff: string;
    status: FixtureStatus;
    homeScore: number | null;
    awayScore: number | null;
    resultConfirmed: boolean;
    lastSyncedAt: string | null;
  }[];
}

interface Props {
  gameweeks: FixtureExportGameweek[];
  now: string;
}

type CopyStatus = 'idle' | 'copied' | 'error';

const datePartsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  weekday: 'long',
  day: 'numeric',
});

const exportWeekdays: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tues',
  Wednesday: 'Wed',
  Thursday: 'Thurs',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

function fixtureDateHeading(kickoff: string) {
  const parts = datePartsFormatter.formatToParts(new Date(kickoff));
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `(${exportWeekdays[weekday] ?? weekday} ${day})`;
}

export function formatFixtureExport(gameweek: FixtureExportGameweek) {
  const groups = new Map<string, string[]>();

  for (const fixture of [...gameweek.fixtures].sort((first, second) =>
    first.kickoff.localeCompare(second.kickoff)
  )) {
    const heading = fixtureDateHeading(fixture.kickoff);
    const lines = groups.get(heading) ?? [];
    lines.push(`${fixture.homeTeamName} - ${fixture.awayTeamName}`);
    groups.set(heading, lines);
  }

  return [...groups]
    .map(([heading, fixtureLines]) => [heading, ...fixtureLines].join('\n'))
    .join('\n\n');
}

export function orderFixtureExportGameweeks(gameweeks: FixtureExportGameweek[]) {
  return [...gameweeks].sort((first, second) => first.gameweekNumber - second.gameweekNumber);
}

/** Pick the current gameweek while it has a future kickoff, otherwise the next or latest one. */
export function selectFixtureExportGameweek(gameweeks: FixtureExportGameweek[], now: Date) {
  const chronological = orderFixtureExportGameweeks(gameweeks);
  return (
    chronological.find((gameweek) =>
      gameweek.fixtures.some((fixture) => new Date(fixture.kickoff) >= now)
    ) ?? chronological.at(-1)
  );
}

export function FixtureClipboardExport({ gameweeks, now }: Props) {
  const orderedGameweeks = useMemo(() => orderFixtureExportGameweeks(gameweeks), [gameweeks]);
  const [selectedGameweekId, setSelectedGameweekId] = useState(
    () => selectFixtureExportGameweek(gameweeks, new Date(now))?.id ?? ''
  );
  const [status, setStatus] = useState<CopyStatus>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedGameweek =
    orderedGameweeks.find((gameweek) => gameweek.id === selectedGameweekId) ?? orderedGameweeks[0];
  const exportText = useMemo(
    () => (selectedGameweek ? formatFixtureExport(selectedGameweek) : ''),
    [selectedGameweek]
  );

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  async function copyFixtures() {
    try {
      await copyToClipboard({ text: exportText });
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
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Clipboard export
          </p>
          <h2 className="mt-1 text-lg font-semibold">Copy gameweek fixtures</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a gameweek and copy its fixture list in kickoff order.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label
              htmlFor="fixture-export-gameweek"
              className="text-xs font-semibold text-muted-foreground"
            >
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
                {orderedGameweeks.map((gameweek) => (
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
      <p
        aria-live="polite"
        className={`mt-2 text-xs ${status === 'error' ? 'text-destructive' : 'sr-only'}`}
      >
        {status === 'copied'
          ? `${selectedGameweek?.label ?? 'Gameweek'} fixtures copied to clipboard.`
          : status === 'error'
            ? 'Could not copy the fixtures. Select the preview above and copy it manually.'
            : ''}
      </p>

      {selectedGameweek && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Match</th>
                <th className="px-4 py-3 font-semibold">Kickoff</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Result</th>
                <th className="px-4 py-3 font-semibold">Last synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...selectedGameweek.fixtures]
                .sort((first, second) => first.kickoff.localeCompare(second.kickoff))
                .map((fixture) => (
                  <tr key={fixture.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">
                      {fixture.homeTeamName} vs {fixture.awayTeamName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(fixture.kickoff).toLocaleString('en-GB', {
                        timeZone: 'Europe/London',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AdminBadge
                          tone={
                            fixture.status === 'postponed' ? 'amber' : statusTone(fixture.status)
                          }
                        >
                          {fixture.status}
                        </AdminBadge>
                        {fixture.resultConfirmed && <AdminBadge tone="green">Confirmed</AdminBadge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {fixture.homeScore !== null
                        ? `${fixture.homeScore}–${fixture.awayScore}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fixture.lastSyncedAt
                        ? new Date(fixture.lastSyncedAt).toLocaleString('en-GB', {
                            timeZone: 'Europe/London',
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
