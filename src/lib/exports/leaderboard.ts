export type LeaderboardExportFormat = 'text' | 'markdown' | 'html' | 'csv';
export type LeaderboardExportView = 'gameweek' | 'season';

export interface ExportLeaderboardRow {
  participant_id: string;
  position: number;
  display_name: string;
  total_points: number;
  exact_count: number;
  predictions_submitted: number;
  fixtures_in_gameweek?: number;
}

const EXACT_SCORE_POINTS = 3;

export function correctResultCount(row: ExportLeaderboardRow) {
  return Math.max(0, row.total_points - row.exact_count * EXACT_SCORE_POINTS);
}

export type LeaderboardMovementDirection = 'up' | 'down' | 'same' | 'new' | 'none';

export interface LeaderboardMovement {
  label: string;
  direction: LeaderboardMovementDirection;
}

export function getLeaderboardMovement(
  currentPosition: number,
  participantId: string,
  previousPositions: ReadonlyMap<string, number> | undefined
): LeaderboardMovement {
  if (!previousPositions) return { label: '—', direction: 'none' };
  const previousPosition = previousPositions.get(participantId);
  if (previousPosition === undefined) return { label: 'New', direction: 'new' };
  const places = previousPosition - currentPosition;
  if (places > 0) return { label: `▲ ${places}`, direction: 'up' };
  if (places < 0) return { label: `▼ ${Math.abs(places)}`, direction: 'down' };
  return { label: '—', direction: 'same' };
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeMarkdown(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll(/\r?\n/g, ' ');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatHtmlMovement(value: string) {
  if (value.startsWith('▲')) {
    return `<span style="color:#15803d;font-weight:700;">▲</span>${escapeHtml(value.slice(1))}`;
  }
  if (value.startsWith('▼')) {
    return `<span style="color:#b91c1c;font-weight:700;">▼</span>${escapeHtml(value.slice(1))}`;
  }
  return escapeHtml(value);
}

function rankLeaderboard(rows: ExportLeaderboardRow[]) {
  const sorted = [...rows].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.exact_count !== a.exact_count) return b.exact_count - a.exact_count;
    return a.display_name.localeCompare(b.display_name);
  });

  let position = 1;
  return sorted.map((row, index) => {
    const previous = sorted[index - 1];
    if (
      previous &&
      (row.total_points !== previous.total_points || row.exact_count !== previous.exact_count)
    ) {
      position = index + 1;
    }
    return { ...row, position };
  });
}

export function leaderboardBeforeLatestGameweek(
  currentRows: ExportLeaderboardRow[],
  latestGameweekRows: ExportLeaderboardRow[]
): ExportLeaderboardRow[] {
  const latestByParticipant = new Map(
    latestGameweekRows.map((row) => [row.participant_id, row])
  );
  return rankLeaderboard(
    currentRows.map((row) => {
      const latest = latestByParticipant.get(row.participant_id);
      return {
        ...row,
        position: 0,
        total_points: row.total_points - (latest?.total_points ?? 0),
        exact_count: row.exact_count - (latest?.exact_count ?? 0),
        predictions_submitted:
          row.predictions_submitted - (latest?.predictions_submitted ?? 0),
      };
    })
  );
}

export function formatLeaderboard(
  rows: ExportLeaderboardRow[],
  format: LeaderboardExportFormat,
  view: LeaderboardExportView,
  previousPositions?: ReadonlyMap<string, number>
): string {
  if (!rows.length) return format === 'html' ? '<p>No data.</p>' : 'No data.';

  const isSeason = view === 'season';
  const formattedRows = rows.map((row) => ({
    name: row.display_name,
    movement: getLeaderboardMovement(row.position, row.participant_id, previousPositions).label,
    correctScores: row.exact_count,
    correctResults: correctResultCount(row),
    points: row.total_points,
  }));
  const headers = isSeason
    ? ['Name', 'Movement', 'Total Correct Scores', 'Total Correct Results', 'Total Points']
    : ['Name', 'Correct Scores', 'Correct Results', 'Points'];

  if (format === 'csv') {
    const body = formattedRows.map((row) => {
      const values = isSeason
        ? [
            escapeCsv(row.name),
            escapeCsv(row.movement),
            row.correctScores,
            row.correctResults,
            row.points,
          ]
        : [escapeCsv(row.name), row.correctScores, row.correctResults, row.points];
      return values.join(',');
    });
    return [headers.join(','), ...body].join('\n');
  }

  if (format === 'markdown') {
    const header = `| ${headers.join(' | ')} |`;
    const divider = `| ${headers.map(() => '---').join(' | ')} |`;
    const body = formattedRows.map((row) => {
      const values = isSeason
        ? [
            escapeMarkdown(row.name),
            row.movement,
            row.correctScores,
            row.correctResults,
            row.points,
          ]
        : [escapeMarkdown(row.name), row.correctScores, row.correctResults, row.points];
      return `| ${values.join(' | ')} |`;
    });
    return [header, divider, ...body].join('\n');
  }

  if (format === 'html') {
    const headerCells = headers
      .map(
        (header) =>
          `<th style="background:#172033;color:#fff;padding:10px 12px;text-align:left;border:1px solid #cbd5e1;">${escapeHtml(header)}</th>`
      )
      .join('');
    const body = formattedRows
      .map((row, index) => {
        const values = isSeason
          ? [row.name, row.movement, row.correctScores, row.correctResults, row.points]
          : [row.name, row.correctScores, row.correctResults, row.points];
        const cells = values
          .map(
            (value, column) =>
              `<td style="padding:9px 12px;border:1px solid #cbd5e1;${column === 0 ? 'font-weight:600;' : ''}">${isSeason && column === 1 ? formatHtmlMovement(String(value)) : escapeHtml(String(value))}</td>`
          )
          .join('');
        return `<tr style="background:${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">${cells}</tr>`;
      })
      .join('');
    return `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;color:#172033;">\n<thead><tr>${headerCells}</tr></thead>\n<tbody>${body}</tbody>\n</table>`;
  }

  return formattedRows
    .map((row) => {
      const details = isSeason
        ? [
            `Movement: ${row.movement}`,
            `Total correct scores: ${row.correctScores}`,
            `Total correct results: ${row.correctResults}`,
            `Total points: ${row.points}`,
          ]
        : [
            `Correct scores: ${row.correctScores}`,
            `Correct results: ${row.correctResults}`,
            `Points: ${row.points}`,
          ];
      return `${row.name}\n${details.join('  |  ')}`;
    })
    .join('\n\n');
}
