'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, Download, Trophy } from 'lucide-react';
import {
  correctResultCount,
  getLeaderboardMovement,
  leaderboardBeforeLatestGameweek,
} from '@/lib/exports/leaderboard';

export interface LeaderboardRow {
  participant_id: string;
  position: number;
  display_name: string;
  total_points: number;
  exact_count: number;
  predictions_submitted: number;
  fixtures_in_gameweek?: number;
}

export interface GameweekStandings {
  id: string;
  label: string;
  gameweekNumber: number;
  status: string;
  rows: LeaderboardRow[];
}

interface Props {
  seasonId: string;
  seasonRows: LeaderboardRow[];
  gameweeks: GameweekStandings[];
}

type Format = 'text' | 'markdown' | 'html' | 'csv';
type View = 'season' | string;

const formats: { value: Format; label: string; extension: string }[] = [
  { value: 'html', label: 'Email-ready table', extension: 'html' },
  { value: 'csv', label: 'CSV', extension: 'csv' },
  { value: 'text', label: 'Plain text', extension: 'txt' },
  { value: 'markdown', label: 'Markdown', extension: 'md' },
];

export function ExportPanel({ seasonId, seasonRows, gameweeks }: Props) {
  const [view, setView] = useState<View>('season');
  const [format, setFormat] = useState<Format>('html');
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'copy' | 'download' | null>(null);

  const selectedGameweek = gameweeks.find((gameweek) => gameweek.id === view);
  const rows = selectedGameweek?.rows ?? seasonRows;
  const title = selectedGameweek?.label ?? 'Overall league table';
  const totalPoints = rows.reduce((sum, row) => sum + row.total_points, 0);
  const exactScores = rows.reduce((sum, row) => sum + row.exact_count, 0);
  const correctResults = rows.reduce((sum, row) => sum + correctResultCount(row), 0);
  const previousPositions = useMemo(() => {
    if (gameweeks.length <= 1) return undefined;
    const latestGameweek = [...gameweeks].sort(
      (a, b) => b.gameweekNumber - a.gameweekNumber
    )[0];
    const previousTable = leaderboardBeforeLatestGameweek(seasonRows, latestGameweek.rows);
    return new Map(previousTable.map((row) => [row.participant_id, row.position]));
  }, [gameweeks, seasonRows]);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams({ seasonId, format });
    if (selectedGameweek) params.set('gameweekId', selectedGameweek.id);
    return `/api/admin/exports/leaderboard?${params.toString()}`;
  }, [format, seasonId, selectedGameweek]);

  async function fetchExport() {
    const response = await fetch(exportUrl);
    if (!response.ok) throw new Error(await response.text());
    return response.text();
  }

  async function copyExport() {
    setBusy('copy');
    try {
      const content = await fetchExport();
      if (format === 'html' && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
        const document = new DOMParser().parseFromString(content, 'text/html');
        const plainText = document.body.innerText;
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([content], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } finally {
      setBusy(null);
    }
  }

  async function downloadExport() {
    setBusy('download');
    try {
      const content = await fetchExport();
      const selectedFormat = formats.find((item) => item.value === format)!;
      const filename = selectedGameweek
        ? `gameweek-${selectedGameweek.gameweekNumber}-standings.${selectedFormat.extension}`
        : `league-table.${selectedFormat.extension}`;
      const link = document.createElement('a');
      const mimeType =
        format === 'html'
          ? 'text/html'
          : format === 'csv'
            ? 'text/csv'
            : format === 'markdown'
              ? 'text/markdown'
              : 'text/plain';
      link.href = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setBusy(null);
    }
  }

  function downloadSeasonWorkbook() {
    window.location.assign(`/api/admin/exports/season?seasonId=${encodeURIComponent(seasonId)}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <label htmlFor="standings-view" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            View standings
          </label>
          <div className="relative">
            <select
              id="standings-view"
              value={view}
              onChange={(event) => setView(event.target.value)}
              className="min-w-64 appearance-none rounded-lg border border-border bg-background py-2.5 pl-3 pr-10 text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="season">Overall league table</option>
              {gameweeks.map((gameweek) => (
                <option key={gameweek.id} value={gameweek.id}>
                  {gameweek.label} · {gameweek.status === 'completed' ? 'Final' : 'In progress'}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={downloadSeasonWorkbook}
            className="mr-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground shadow-xs hover:opacity-90 sm:w-auto"
          >
            <Download className="size-4" />
            Export season (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => setExportOpen((open) => !open)}
            aria-expanded={exportOpen}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-medium shadow-xs hover:bg-accent sm:w-auto"
          >
            <Download className="size-4" />
            Export this view
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>

          {exportOpen && (
            <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-border bg-popover p-3 shadow-lg">
              <label htmlFor="export-format" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Export format
              </label>
              <select
                id="export-format"
                value={format}
                onChange={(event) => setFormat(event.target.value as Format)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {formats.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={copyExport}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={downloadExport}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Download className="size-4" />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={selectedGameweek ? 'Players scored' : 'League players'} value={rows.length} />
        <Stat label={selectedGameweek ? 'Correct scores' : 'Total correct scores'} value={exactScores} />
        <Stat label={selectedGameweek ? 'Correct results' : 'Total correct results'} value={correctResults} />
        <Stat label={selectedGameweek ? 'Points' : 'Total points'} value={totalPoints} />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {selectedGameweek ? 'Gameweek scores' : 'Season standings'}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold">{title}</h2>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">Updated from confirmed results</span>
        </div>

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3 text-right font-semibold">Position</th>
                  <th className="px-4 py-3 text-left font-semibold sm:px-5">Name</th>
                  {!selectedGameweek && (
                    <th className="px-3 py-3 text-left font-semibold">Movement</th>
                  )}
                  <th className="px-3 py-3 text-right font-semibold">
                    {selectedGameweek ? 'Correct scores' : 'Total correct scores'}
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">
                    {selectedGameweek ? 'Correct results' : 'Total correct results'}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold sm:px-5">
                    {selectedGameweek ? 'Points' : 'Total points'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const movement = getLeaderboardMovement(
                    row.position,
                    row.participant_id,
                    previousPositions
                  );
                  return (
                    <tr key={row.participant_id} className="border-b border-border/70 last:border-0 hover:bg-muted/35">
                      <td className="px-3 py-3.5 text-right font-semibold tabular-nums">
                        {row.position}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-2">
                          {row.position === 1 ? (
                            <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              <Trophy className="size-4" />
                            </span>
                          ) : null}
                          <span className="font-medium text-foreground">{row.display_name}</span>
                        </div>
                      </td>
                      {!selectedGameweek && (
                        <td className="px-3 py-3.5 font-semibold tabular-nums">
                          <MovementValue movement={movement} />
                        </td>
                      )}
                      <td className="px-3 py-3.5 text-right tabular-nums text-muted-foreground">
                        {row.exact_count}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-muted-foreground">
                        {correctResultCount(row)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-base font-bold tabular-nums sm:px-5">
                        {row.total_points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <Trophy className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No scores to show yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Standings will appear after results have been confirmed and scored.</p>
          </div>
        )}
        <div className="border-t border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:px-5">
          Correct scores earn 3 points. Correct results earn 1 point.
        </div>
      </section>
    </div>
  );
}

function MovementValue({
  movement,
}: {
  movement: ReturnType<typeof getLeaderboardMovement>;
}) {
  if (movement.direction !== 'up' && movement.direction !== 'down') {
    return <span className="text-muted-foreground">{movement.label}</span>;
  }

  return (
    <span>
      <span
        className={
          movement.direction === 'up'
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-red-700 dark:text-red-400'
        }
      >
        {movement.direction === 'up' ? '▲' : '▼'}
      </span>
      {movement.label.slice(1)}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}
