import ExcelJS from 'exceljs';

export interface WorkbookLeaderboardRow {
  position: number;
  participant_id: string;
  display_name: string;
  total_points: number;
  exact_count: number;
  predictions_submitted: number;
  fixtures_in_gameweek?: number;
}

export interface WorkbookFixture {
  id: string;
  kickoff: string;
  home_team_name: string;
  away_team_name: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  result_confirmed: boolean;
}

export interface WorkbookPrediction {
  fixture_id: string;
  participant_id: string;
  home_score: number;
  away_score: number;
  points_awarded: number | null;
}

export interface WorkbookGameweek {
  label: string;
  gameweekNumber: number;
  status: string;
  fixtures: WorkbookFixture[];
  predictions: WorkbookPrediction[];
  standings: WorkbookLeaderboardRow[];
}

export interface SeasonWorkbookData {
  leagueName: string;
  seasonName: string;
  standings: WorkbookLeaderboardRow[];
  gameweeks: WorkbookGameweek[];
}

const navy = 'FF172033';
const blue = 'FF2563EB';
const paleBlue = 'FFEFF6FF';
const paleGreen = 'FFECFDF5';
const grey = 'FFF3F4F6';
const white = 'FFFFFFFF';

function titleRow(sheet: ExcelJS.Worksheet, title: string, subtitle: string, endColumn: number) {
  sheet.mergeCells(1, 1, 1, endColumn);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 18, color: { argb: white } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } };
  titleCell.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 30;

  sheet.mergeCells(2, 1, 2, endColumn);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { italic: true, color: { argb: 'FF475569' } };
  subtitleCell.alignment = { vertical: 'middle' };
  sheet.getRow(2).height = 22;
}

function styleHeader(row: ExcelJS.Row, fill = blue) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });
  row.height = 24;
}

function safeSheetName(label: string, gameweekNumber: number) {
  const fallback = `Gameweek ${gameweekNumber}`;
  const cleaned = label.replace(/[\\/*?:[\]]/g, '-').trim() || fallback;
  return cleaned.slice(0, 31);
}

export async function createSeasonWorkbook(data: SeasonWorkbookData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Predictotronix';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const overall = workbook.addWorksheet('Overall Table', {
    views: [{ state: 'frozen', ySplit: 4 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  overall.columns = [
    { key: 'position', width: 10 }, { key: 'player', width: 30 }, { key: 'points', width: 13 },
    { key: 'exact', width: 13 }, { key: 'predictions', width: 20 },
  ];
  titleRow(overall, `${data.leagueName} — ${data.seasonName}`, 'Overall league table · ordered by rank', 5);
  overall.addRow([]);
  styleHeader(overall.addRow(['Position', 'Player', 'Total points', 'Exact scores', 'Predictions scored']));
  data.standings.forEach((entry, index) => {
    const row = overall.addRow([entry.position, entry.display_name, entry.total_points, entry.exact_count, entry.predictions_submitted]);
    if (index % 2 === 1) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: grey } }; });
    row.getCell(3).font = { bold: true };
  });
  overall.autoFilter = { from: 'A4', to: 'E4' };

  for (const gameweek of data.gameweeks) {
    const fixtureColumnCount = Math.max(gameweek.fixtures.length, 1);
    const endColumn = 2 + fixtureColumnCount;
    const sheet = workbook.addWorksheet(safeSheetName(gameweek.label, gameweek.gameweekNumber), {
      views: [{ state: 'frozen', xSplit: 2, ySplit: 6 }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    sheet.getColumn(1).width = 9;
    sheet.getColumn(2).width = 25;
    for (let column = 3; column <= endColumn; column += 1) sheet.getColumn(column).width = 22;

    titleRow(sheet, `${gameweek.label} — predictions`, `${data.leagueName} · ${data.seasonName} · ${gameweek.status.replace('_', ' ')}`, endColumn);
    sheet.addRow([]);
    const fixtureNames = gameweek.fixtures.map((fixture) => `${fixture.home_team_name} v ${fixture.away_team_name}`);
    styleHeader(sheet.addRow(['Rank', 'Player', ...(fixtureNames.length ? fixtureNames : ['No fixtures'])]));
    const resultRow = sheet.addRow(['', 'Result', ...gameweek.fixtures.map((fixture) => fixture.result_confirmed ? `${fixture.home_score}–${fixture.away_score}` : fixture.status.replace('_', ' '))]);
    resultRow.eachCell((cell, column) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: paleBlue } };
      cell.font = { bold: column === 2 };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
    const kickoffRow = sheet.addRow(['', 'Kickoff', ...gameweek.fixtures.map((fixture) => new Date(fixture.kickoff))]);
    kickoffRow.eachCell((cell, column) => {
      if (column >= 3) cell.numFmt = 'ddd d mmm, hh:mm';
      cell.font = { color: { argb: 'FF64748B' }, italic: true };
    });

    const predictions = new Map(gameweek.predictions.map((prediction) => [`${prediction.participant_id}:${prediction.fixture_id}`, prediction]));
    gameweek.standings.forEach((standing, index) => {
      const cells: (string | number)[] = [standing.position, standing.display_name];
      gameweek.fixtures.forEach((fixture) => {
        const prediction = predictions.get(`${standing.participant_id}:${fixture.id}`);
        cells.push(prediction ? `${prediction.home_score}–${prediction.away_score}${prediction.points_awarded == null ? '' : ` (${prediction.points_awarded} pt${prediction.points_awarded === 1 ? '' : 's'})`}` : '—');
      });
      const row = sheet.addRow(cells);
      if (index % 2 === 1) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: grey } }; });
      row.eachCell((cell, column) => { if (column >= 3) cell.alignment = { horizontal: 'center' }; });
    });

    const standingsStart = sheet.lastRow!.number + 3;
    sheet.mergeCells(standingsStart, 1, standingsStart, 5);
    const section = sheet.getCell(standingsStart, 1);
    section.value = 'Gameweek table';
    section.font = { bold: true, size: 14, color: { argb: navy } };
    styleHeader(sheet.addRow(['Position', 'Player', 'Points', 'Exact scores', 'Predictions scored']), navy);
    gameweek.standings.forEach((entry) => {
      const row = sheet.addRow([entry.position, entry.display_name, entry.total_points, entry.exact_count, `${entry.predictions_submitted}/${entry.fixtures_in_gameweek ?? gameweek.fixtures.length}`]);
      row.getCell(3).font = { bold: true };
      if (entry.position === 1) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: paleGreen } }; });
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
