import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
  createCompletedGameweekWorkbook,
  type CompletedGameweekWorkbookData,
} from '@/lib/exports/gameweek-workbook';

const data: CompletedGameweekWorkbookData = {
  leagueName: 'Test League',
  seasonName: '2026/27',
  gameweekLabel: 'Gameweek 8',
  gameweekNumber: 8,
  fixtures: [
    {
      id: 'fixture-1',
      kickoff: '2026-10-03T14:00:00.000Z',
      home_team_name: 'Alpha',
      away_team_name: 'Beta',
      status: 'finished',
      home_score: 2,
      away_score: 1,
      result_confirmed: true,
    },
    {
      id: 'fixture-2',
      kickoff: '2026-10-04T16:30:00.000Z',
      home_team_name: 'Gamma',
      away_team_name: 'Delta',
      status: 'finished',
      home_score: 0,
      away_score: 0,
      result_confirmed: true,
    },
  ],
  standings: [
    {
      participant_id: 'bob',
      display_name: 'Bob',
      position: 1,
      total_points: 4,
      exact_count: 1,
      predictions_submitted: 2,
      fixtures_in_gameweek: 2,
    },
    {
      participant_id: 'alice',
      display_name: 'Alice',
      position: 2,
      total_points: 3,
      exact_count: 1,
      predictions_submitted: 2,
      fixtures_in_gameweek: 2,
    },
    {
      participant_id: 'carol',
      display_name: 'Carol',
      position: 3,
      total_points: 0,
      exact_count: 0,
      predictions_submitted: 1,
      fixtures_in_gameweek: 2,
    },
  ],
  predictions: [
    {
      fixture_id: 'fixture-1',
      participant_id: 'alice',
      home_score: 2,
      away_score: 1,
      points_awarded: 3,
      points_reason: 'exact',
      is_admin_entered: false,
    },
    {
      fixture_id: 'fixture-2',
      participant_id: 'alice',
      home_score: 1,
      away_score: 0,
      points_awarded: 0,
      points_reason: 'incorrect',
      is_admin_entered: false,
    },
    {
      fixture_id: 'fixture-1',
      participant_id: 'bob',
      home_score: 3,
      away_score: 0,
      points_awarded: 1,
      points_reason: 'correct_result',
      is_admin_entered: false,
    },
    {
      fixture_id: 'fixture-2',
      participant_id: 'bob',
      home_score: 0,
      away_score: 0,
      points_awarded: 3,
      points_reason: 'exact',
      is_admin_entered: true,
    },
    {
      fixture_id: 'fixture-1',
      participant_id: 'carol',
      home_score: 1,
      away_score: 2,
      points_awarded: 0,
      points_reason: 'incorrect',
      is_admin_entered: false,
    },
  ],
};

describe('completed gameweek workbook export', () => {
  it('creates a detailed multi-sheet analysis with a colour-coded prediction grid and totals', async () => {
    const workbook = new ExcelJS.Workbook();
    const exported = await createCompletedGameweekWorkbook(data);
    await workbook.xlsx.load(exported as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Overview',
      'Predictions Grid',
      'Leaderboard',
      'Player Analysis',
      'Fixture Analysis',
      'Pick Distribution',
      'Prediction Detail',
      'Forecast Tendencies',
      'Completeness',
      'Notes & Legend',
    ]);

    const overview = workbook.getWorksheet('Overview')!;
    expect(overview.getCell('B8').value).toBe(6);
    expect(overview.getCell('E8').value).toBe(5);
    expect(overview.getCell('B10').value).toBe(2);
    expect(overview.getCell('E10').value).toBe(1);
    expect(overview.getCell('B11').value).toBe(2);
    expect(overview.getCell('B12').value).toBe(7);

    const grid = workbook.getWorksheet('Predictions Grid')!;
    expect(grid.getRow(4).values).toEqual([
      undefined,
      'Position',
      'Player',
      'Alpha v Beta',
      'Gamma v Delta',
      'Points',
      'Exact',
      'Correct result',
      'Incorrect',
      'Submitted',
      'Missing',
    ]);
    expect(grid.getCell('C7').value).toBe('3–0 · 1 pt');
    expect(grid.getCell('D7').value).toBe('0–0 · 3 pts');
    expect(grid.getCell('C8').value).toBe('2–1 · 3 pts');
    expect(grid.getCell('D8').value).toBe('1–0 · 0 pts');
    expect(grid.getCell('D9').value).toBe('—');
    expect((grid.getCell('C7').fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFFFEB9C');
    expect((grid.getCell('D7').fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFC6EFCE');
    expect((grid.getCell('D8').fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFFFC7CE');
    expect(grid.getRow(10).values).toEqual([
      undefined,
      '',
      'Totals',
      '3 picks · 4 pts',
      '2 picks · 3 pts',
      7,
      2,
      1,
      2,
      5,
      1,
    ]);
  });

  it('reconciles player, fixture, detail, and completeness analysis', async () => {
    const workbook = new ExcelJS.Workbook();
    const exported = await createCompletedGameweekWorkbook(data);
    await workbook.xlsx.load(exported as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const playerAnalysis = workbook.getWorksheet('Player Analysis')!;
    expect(playerAnalysis.getRow(5).values).toEqual([
      undefined,
      1,
      'Bob',
      4,
      1,
      1,
      0,
      0,
      2,
      0,
      1,
      0.5,
      1,
      2,
      6,
      2 / 3,
      1,
    ]);

    const fixtureAnalysis = workbook.getWorksheet('Fixture Analysis')!;
    expect(fixtureAnalysis.getRow(5).getCell(1).value).toBe('Alpha v Beta');
    expect(fixtureAnalysis.getRow(5).getCell(7).value).toBe(1);
    expect(fixtureAnalysis.getRow(5).getCell(8).value).toBe(1);
    expect(fixtureAnalysis.getRow(5).getCell(9).value).toBe(1);
    expect(fixtureAnalysis.getRow(5).getCell(11).value).toBe(4);

    const detail = workbook.getWorksheet('Prediction Detail')!;
    expect(detail.rowCount).toBe(10);
    expect(detail.getRow(10).values).toContain('Missing');

    const completeness = workbook.getWorksheet('Completeness')!;
    const carol = completeness.getRow(7);
    expect(carol.getCell(1).value).toBe('Carol');
    expect(carol.getCell(3).value).toBe(1);
    expect(carol.getCell(6).value).toBe('Gamma v Delta');
  });
});
