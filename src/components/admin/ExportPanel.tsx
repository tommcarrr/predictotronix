'use client';

import { useState } from 'react';

interface Season {
  id: string;
  name: string;
  status: string;
  league_id: string;
  leagues: { name: string } | null;
}

interface LeaderboardRow {
  position: number;
  display_name: string;
  total_points: number;
  exact_count: number;
  predictions_submitted: number;
}

interface Props {
  seasons: Season[];
}

type Format = 'text' | 'markdown' | 'html' | 'csv';

function formatLeaderboard(rows: LeaderboardRow[], format: Format): string {
  if (!rows.length) return 'No data.';

  if (format === 'csv') {
    const header = 'Position,Player,Points,Exact,Predictions';
    const body = rows.map(
      (r) => `${r.position},${r.display_name},${r.total_points},${r.exact_count},${r.predictions_submitted}`
    );
    return [header, ...body].join('\n');
  }

  if (format === 'markdown') {
    const header = '| Pos | Player | Pts | ★ |\n|-----|--------|-----|---|';
    const body = rows.map(
      (r) => `| ${r.position} | ${r.display_name} | ${r.total_points} | ${r.exact_count} |`
    );
    return [header, ...body].join('\n');
  }

  if (format === 'html') {
    const header =
      '<table><thead><tr><th>Pos</th><th>Player</th><th>Pts</th><th>Exact</th></tr></thead><tbody>';
    const body = rows
      .map(
        (r) =>
          `<tr><td>${r.position}</td><td>${r.display_name}</td><td>${r.total_points}</td><td>${r.exact_count}</td></tr>`
      )
      .join('');
    return `${header}${body}</tbody></table>`;
  }

  // Plain text
  const lines = rows.map(
    (r) =>
      `${String(r.position).padStart(2)}. ${r.display_name.padEnd(25)} ${String(r.total_points).padStart(3)} pts  (${r.exact_count} exact)`
  );
  return lines.join('\n');
}

export function ExportPanel({ seasons }: Props) {
  const [selectedSeasonId, setSelectedSeasonId] = useState(seasons[0]?.id ?? '');
  const [format, setFormat] = useState<Format>('text');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadLeaderboard() {
    if (!selectedSeasonId) return;
    setLoading(true);
    setOutput('');

    try {
      const res = await fetch(`/api/admin/exports/leaderboard?seasonId=${selectedSeasonId}&format=${format}`);
      const text = await res.text();
      setOutput(text);
    } catch {
      setOutput('Error loading leaderboard.');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs uppercase text-muted-foreground font-medium">Season</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm min-w-48"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.leagues as any)?.name} — {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase text-muted-foreground font-medium">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="text">Plain text</option>
            <option value="markdown">Markdown</option>
            <option value="html">HTML table</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load Leaderboard'}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Output</span>
            <button
              onClick={copyToClipboard}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              {copied ? '✓ Copied!' : 'Copy to clipboard'}
            </button>
          </div>
          <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto whitespace-pre-wrap max-h-96">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
