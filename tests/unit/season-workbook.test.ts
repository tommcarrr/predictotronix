import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
  createSeasonWorkbook,
  type SeasonWorkbookData,
  type WorkbookLeaderboardRow,
} from '@/lib/exports/season-workbook';

function row(
  participantId: string,
  name: string,
  position: number,
  points: number,
  exact: number
): WorkbookLeaderboardRow {
  return {
    participant_id: participantId,
    display_name: name,
    position,
    total_points: points,
    exact_count: exact,
    predictions_submitted: 10,
  };
}

describe('season workbook export', () => {
  it('uses the new overall and gameweek standings structures', async () => {
    const data: SeasonWorkbookData = {
      leagueName: 'Test League',
      seasonName: '2026/27',
      standings: [row('alice', 'Alice', 1, 9, 2), row('bob', 'Bob', 2, 5, 1)],
      gameweeks: [
        {
          label: 'Gameweek 1',
          gameweekNumber: 1,
          status: 'completed',
          fixtures: [],
          predictions: [],
          standings: [row('bob', 'Bob', 1, 4, 1), row('alice', 'Alice', 2, 3, 1)],
        },
        {
          label: 'Gameweek 2',
          gameweekNumber: 2,
          status: 'in_progress',
          fixtures: [],
          predictions: [],
          standings: [row('alice', 'Alice', 1, 6, 1), row('bob', 'Bob', 2, 1, 0)],
        },
      ],
    };

    const workbook = new ExcelJS.Workbook();
    const exported = await createSeasonWorkbook(data);
    await workbook.xlsx.load(
      exported as unknown as Parameters<typeof workbook.xlsx.load>[0]
    );

    const overall = workbook.getWorksheet('Overall Table')!;
    expect(overall.getRow(4).values).toEqual([
      undefined,
      'Name',
      'Movement',
      'Total Correct Scores',
      'Total Correct Results',
      'Total Points',
    ]);
    expect(overall.getRow(5).getCell(1).value).toBe('Alice');
    expect(overall.getRow(5).getCell(2).text).toBe('▲ 1');
    expect(overall.getRow(5).getCell(3).value).toBe(2);
    expect(overall.getRow(5).getCell(4).value).toBe(3);
    expect(overall.getRow(5).getCell(5).value).toBe(9);

    const gameweek = workbook.getWorksheet('Gameweek 2')!;
    expect(gameweek.getRow(4).values).toEqual([undefined, 'Name', 'No fixtures']);
    const sectionRow = gameweek
      .getRows(1, gameweek.rowCount)!
      .find((sheetRow) => sheetRow.getCell(1).value === 'Gameweek table')!;
    expect(gameweek.getRow(sectionRow.number + 1).values).toEqual([
      undefined,
      'Name',
      'Correct Scores',
      'Correct Results',
      'Points',
    ]);
    expect(gameweek.getRow(sectionRow.number + 2).values).toEqual([
      undefined,
      'Alice',
      1,
      3,
      6,
    ]);
  });
});
