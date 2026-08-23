import { describe, expect, it } from 'vitest';
import {
  formatLeaderboard,
  leaderboardBeforeLatestGameweek,
  type ExportLeaderboardRow,
} from '@/lib/exports/leaderboard';

function row(
  participantId: string,
  name: string,
  position: number,
  points: number,
  exact: number
): ExportLeaderboardRow {
  return {
    participant_id: participantId,
    display_name: name,
    position,
    total_points: points,
    exact_count: exact,
    predictions_submitted: 10,
  };
}

describe('leaderboard exports', () => {
  const rows = [row('alice', 'Alice', 1, 9, 2), row('bob', 'Bob', 2, 5, 1)];

  it('exports gameweek results with only the requested email-friendly fields', () => {
    expect(formatLeaderboard(rows, 'markdown', 'gameweek')).toBe(
      '| Name | Correct Scores | Correct Results | Points |\n' +
        '| --- | --- | --- | --- |\n' +
        '| Alice | 2 | 3 | 9 |\n' +
        '| Bob | 1 | 2 | 5 |'
    );
  });

  it('exports the overall table with movement and cumulative labels', () => {
    const previousPositions = new Map([
      ['alice', 2],
      ['bob', 1],
    ]);

    expect(formatLeaderboard(rows, 'csv', 'season', previousPositions)).toBe(
      'Name,Movement,Total Correct Scores,Total Correct Results,Total Points\n' +
        '"Alice","▲ 1",2,3,9\n' +
        '"Bob","▼ 1",1,2,5'
    );
  });

  it('reconstructs the previous table by removing the latest gameweek using league tie rules', () => {
    const current = [row('alice', 'Alice', 1, 9, 3), row('bob', 'Bob', 2, 8, 1)];
    const latest = [row('alice', 'Alice', 1, 3, 1), row('bob', 'Bob', 2, 2, 0)];
    const previousTable = leaderboardBeforeLatestGameweek(current, latest);

    expect(previousTable.map(({ participant_id, position, total_points, exact_count }) => ({
      participant_id,
      position,
      total_points,
      exact_count,
    }))).toEqual([
      { participant_id: 'alice', position: 1, total_points: 6, exact_count: 2 },
      { participant_id: 'bob', position: 2, total_points: 6, exact_count: 1 },
    ]);
  });

  it('shows neutral movement when there is no previous gameweek table', () => {
    expect(formatLeaderboard(rows, 'markdown', 'season')).toContain('| Alice | — |');
  });

  it('escapes names safely in HTML and CSV exports', () => {
    const unsafe = [row('unsafe', 'A <B> & "C"', 1, 3, 1)];
    expect(formatLeaderboard(unsafe, 'html', 'gameweek')).toContain(
      'A &lt;B&gt; &amp; &quot;C&quot;'
    );
    expect(formatLeaderboard(unsafe, 'csv', 'gameweek')).toContain('"A <B> & ""C"""');
  });

  it('colours upward movement arrows green and downward arrows red in email HTML', () => {
    const html = formatLeaderboard(
      rows,
      'html',
      'season',
      new Map([
        ['alice', 2],
        ['bob', 1],
      ])
    );

    expect(html).toContain('<span style="color:#15803d;font-weight:700;">▲</span> 1');
    expect(html).toContain('<span style="color:#b91c1c;font-weight:700;">▼</span> 1');
  });
});
