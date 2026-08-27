import ExcelJS from 'exceljs';
import type { PointsReason } from '@/types';
import type { WorkbookLeaderboardRow } from '@/lib/exports/season-workbook';

export interface GameweekWorkbookFixture {
  id: string;
  kickoff: string;
  home_team_name: string;
  away_team_name: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  result_confirmed: boolean;
}

export interface GameweekWorkbookPrediction {
  fixture_id: string;
  participant_id: string;
  home_score: number;
  away_score: number;
  points_awarded: number | null;
  points_reason: PointsReason | null;
  is_admin_entered: boolean;
}

export interface CompletedGameweekWorkbookData {
  leagueName: string;
  seasonName: string;
  gameweekLabel: string;
  gameweekNumber: number;
  fixtures: GameweekWorkbookFixture[];
  predictions: GameweekWorkbookPrediction[];
  standings: WorkbookLeaderboardRow[];
}

type Result = 'H' | 'D' | 'A';
type Classification = PointsReason | 'unscored';

interface PlayerStats {
  participantId: string;
  displayName: string;
  position: number;
  leaderboardPoints: number;
  points: number;
  exact: number;
  correctResult: number;
  incorrect: number;
  unscored: number;
  submitted: number;
  missing: number;
  adminEntered: number;
  goalError: number;
  homePicks: number;
  drawPicks: number;
  awayPicks: number;
  missingFixtures: string[];
}

interface FixtureStats {
  fixture: GameweekWorkbookFixture;
  predictions: GameweekWorkbookPrediction[];
  submitted: number;
  missing: number;
  exact: number;
  correctResult: number;
  incorrect: number;
  unscored: number;
  totalPoints: number;
  goalError: number;
  averageHome: number | null;
  averageAway: number | null;
  averageGoals: number | null;
  mostCommonScore: string;
  consensusResult: Result | null;
  homePicks: number;
  drawPicks: number;
  awayPicks: number;
}

const colors = {
  navy: 'FF172033',
  blue: 'FF2563EB',
  paleBlue: 'FFEFF6FF',
  green: 'FFC6EFCE',
  greenText: 'FF166534',
  yellow: 'FFFFEB9C',
  yellowText: 'FF854D0E',
  red: 'FFFFC7CE',
  redText: 'FF991B1B',
  grey: 'FFF3F4F6',
  midGrey: 'FFE2E8F0',
  darkGrey: 'FF475569',
  white: 'FFFFFFFF',
  total: 'FFDBEAFE',
};

function score(home: number | null, away: number | null) {
  return home == null || away == null ? '—' : `${home}–${away}`;
}

function result(home: number, away: number): Result {
  if (home > away) return 'H';
  if (home === away) return 'D';
  return 'A';
}

function resultName(value: Result | null) {
  if (value === 'H') return 'Home win';
  if (value === 'D') return 'Draw';
  if (value === 'A') return 'Away win';
  return '—';
}

function classification(prediction: GameweekWorkbookPrediction): Classification {
  return prediction.points_reason ?? 'unscored';
}

function classificationName(value: Classification) {
  if (value === 'exact') return 'Exact score';
  if (value === 'correct_result') return 'Correct result';
  if (value === 'incorrect') return 'Incorrect';
  return 'Unscored';
}

function applyClassificationStyle(cell: ExcelJS.Cell, value: Classification) {
  const fill =
    value === 'exact'
      ? colors.green
      : value === 'correct_result'
        ? colors.yellow
        : value === 'incorrect'
          ? colors.red
          : colors.grey;
  const font =
    value === 'exact'
      ? colors.greenText
      : value === 'correct_result'
        ? colors.yellowText
        : value === 'incorrect'
          ? colors.redText
          : colors.darkGrey;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  cell.font = { color: { argb: font } };
}

function titleRows(sheet: ExcelJS.Worksheet, title: string, subtitle: string, endColumn: number) {
  sheet.mergeCells(1, 1, 1, endColumn);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 18, color: { argb: colors.white } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navy } };
  titleCell.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 30;

  sheet.mergeCells(2, 1, 2, endColumn);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { italic: true, color: { argb: colors.darkGrey } };
  subtitleCell.alignment = { vertical: 'middle' };
  sheet.getRow(2).height = 22;
}

function sectionTitle(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  title: string,
  endColumn: number
) {
  sheet.mergeCells(rowNumber, 1, rowNumber, endColumn);
  const cell = sheet.getCell(rowNumber, 1);
  cell.value = title;
  cell.font = { bold: true, size: 13, color: { argb: colors.navy } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.paleBlue } };
  cell.alignment = { vertical: 'middle' };
  sheet.getRow(rowNumber).height = 23;
}

function styleHeader(row: ExcelJS.Row, fill = colors.blue) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: colors.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: colors.midGrey } } };
  });
  row.height = 27;
}

function styleTotal(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: colors.navy } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.total } };
    cell.border = { top: { style: 'thin', color: { argb: colors.blue } } };
  });
}

function addStriping(row: ExcelJS.Row, index: number) {
  if (index % 2 !== 1) return;
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.grey } };
  });
}

function configureSheet(sheet: ExcelJS.Worksheet, freezeRows = 4, freezeColumns = 0) {
  sheet.views = [{ state: 'frozen', xSplit: freezeColumns, ySplit: freezeRows }];
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };
  sheet.properties.defaultRowHeight = 19;
}

function ratio(numerator: number, denominator: number) {
  return denominator ? numerator / denominator : 0;
}

function average(total: number, count: number) {
  return count ? total / count : 0;
}

function predictionMap(predictions: GameweekWorkbookPrediction[]) {
  return new Map(
    predictions.map((prediction) => [
      `${prediction.participant_id}:${prediction.fixture_id}`,
      prediction,
    ])
  );
}

function goalError(prediction: GameweekWorkbookPrediction, fixture: GameweekWorkbookFixture) {
  if (fixture.home_score == null || fixture.away_score == null) return 0;
  return (
    Math.abs(prediction.home_score - fixture.home_score) +
    Math.abs(prediction.away_score - fixture.away_score)
  );
}

function countScorelines(predictions: GameweekWorkbookPrediction[]) {
  const counts = new Map<string, number>();
  predictions.forEach((prediction) => {
    const key = score(prediction.home_score, prediction.away_score);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function mostCommonResult(home: number, draw: number, away: number): Result | null {
  const maximum = Math.max(home, draw, away);
  if (!maximum) return null;
  const leaders = (
    [
      ['H', home],
      ['D', draw],
      ['A', away],
    ] as const
  ).filter(([, count]) => count === maximum);
  return leaders.length === 1 ? leaders[0][0] : null;
}

function buildPlayerStats(data: CompletedGameweekWorkbookData): PlayerStats[] {
  const predictions = predictionMap(data.predictions);
  return data.standings.map((standing) => {
    const stats: PlayerStats = {
      participantId: standing.participant_id,
      displayName: standing.display_name,
      position: standing.position,
      leaderboardPoints: standing.total_points,
      points: 0,
      exact: 0,
      correctResult: 0,
      incorrect: 0,
      unscored: 0,
      submitted: 0,
      missing: 0,
      adminEntered: 0,
      goalError: 0,
      homePicks: 0,
      drawPicks: 0,
      awayPicks: 0,
      missingFixtures: [],
    };

    data.fixtures.forEach((fixture) => {
      const prediction = predictions.get(`${standing.participant_id}:${fixture.id}`);
      if (!prediction) {
        stats.missing += 1;
        stats.missingFixtures.push(`${fixture.home_team_name} v ${fixture.away_team_name}`);
        return;
      }
      stats.submitted += 1;
      stats.points += prediction.points_awarded ?? 0;
      stats.goalError += goalError(prediction, fixture);
      if (prediction.is_admin_entered) stats.adminEntered += 1;
      const category = classification(prediction);
      if (category === 'exact') stats.exact += 1;
      else if (category === 'correct_result') stats.correctResult += 1;
      else if (category === 'incorrect') stats.incorrect += 1;
      else stats.unscored += 1;

      const pick = result(prediction.home_score, prediction.away_score);
      if (pick === 'H') stats.homePicks += 1;
      else if (pick === 'D') stats.drawPicks += 1;
      else stats.awayPicks += 1;
    });
    return stats;
  });
}

function buildFixtureStats(data: CompletedGameweekWorkbookData): FixtureStats[] {
  return data.fixtures.map((fixture) => {
    const predictions = data.predictions.filter(
      (prediction) => prediction.fixture_id === fixture.id
    );
    let exact = 0;
    let correctResult = 0;
    let incorrect = 0;
    let unscored = 0;
    let totalPoints = 0;
    let totalGoalError = 0;
    let homePicks = 0;
    let drawPicks = 0;
    let awayPicks = 0;
    let predictedHome = 0;
    let predictedAway = 0;

    predictions.forEach((prediction) => {
      const category = classification(prediction);
      if (category === 'exact') exact += 1;
      else if (category === 'correct_result') correctResult += 1;
      else if (category === 'incorrect') incorrect += 1;
      else unscored += 1;
      totalPoints += prediction.points_awarded ?? 0;
      totalGoalError += goalError(prediction, fixture);
      predictedHome += prediction.home_score;
      predictedAway += prediction.away_score;
      const pick = result(prediction.home_score, prediction.away_score);
      if (pick === 'H') homePicks += 1;
      else if (pick === 'D') drawPicks += 1;
      else awayPicks += 1;
    });

    return {
      fixture,
      predictions,
      submitted: predictions.length,
      missing: Math.max(0, data.standings.length - predictions.length),
      exact,
      correctResult,
      incorrect,
      unscored,
      totalPoints,
      goalError: totalGoalError,
      averageHome: predictions.length ? predictedHome / predictions.length : null,
      averageAway: predictions.length ? predictedAway / predictions.length : null,
      averageGoals: predictions.length
        ? (predictedHome + predictedAway) / predictions.length
        : null,
      mostCommonScore: countScorelines(predictions)[0]?.[0] ?? '—',
      consensusResult: mostCommonResult(homePicks, drawPicks, awayPicks),
      homePicks,
      drawPicks,
      awayPicks,
    };
  });
}

function fixtureLabel(fixture: GameweekWorkbookFixture) {
  return `${fixture.home_team_name} v ${fixture.away_team_name}`;
}

function addOverview(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  players: PlayerStats[],
  fixtures: FixtureStats[]
) {
  const sheet = workbook.addWorksheet('Overview');
  configureSheet(sheet, 3);
  sheet.columns = [
    { width: 25 },
    { width: 26 },
    { width: 4 },
    { width: 25 },
    { width: 26 },
    { width: 4 },
    { width: 24 },
    { width: 30 },
  ];
  titleRows(
    sheet,
    `${data.gameweekLabel} — analysis`,
    `${data.leagueName} · ${data.seasonName} · completed gameweek`,
    8
  );

  const submitted = players.reduce((sum, player) => sum + player.submitted, 0);
  const missing = players.reduce((sum, player) => sum + player.missing, 0);
  const exact = players.reduce((sum, player) => sum + player.exact, 0);
  const correct = players.reduce((sum, player) => sum + player.correctResult, 0);
  const incorrect = players.reduce((sum, player) => sum + player.incorrect, 0);
  const unscored = players.reduce((sum, player) => sum + player.unscored, 0);
  const points = players.reduce((sum, player) => sum + player.points, 0);
  const slots = players.length * data.fixtures.length;

  sectionTitle(sheet, 4, 'Gameweek summary', 8);
  const summaryRows: [string, string | number, string, string | number][] = [
    ['League', data.leagueName, 'Season', data.seasonName],
    ['Gameweek', data.gameweekLabel, 'Status', 'Completed'],
    ['Fixtures', data.fixtures.length, 'Players', players.length],
    ['Prediction slots', slots, 'Submitted', submitted],
    ['Submission rate', ratio(submitted, slots), 'Missing', missing],
    ['Exact scores', exact, 'Correct results', correct],
    ['Incorrect', incorrect, 'Unscored', unscored],
    ['Total points', points, 'Average points / prediction', average(points, submitted)],
    ['Maximum possible points', slots * 3, '% of maximum points won', ratio(points, slots * 3)],
  ];
  summaryRows.forEach((values, index) => {
    const row = sheet.getRow(5 + index);
    row.values = [values[0], values[1], '', values[2], values[3]];
    row.getCell(1).font = { bold: true, color: { argb: colors.darkGrey } };
    row.getCell(4).font = { bold: true, color: { argb: colors.darkGrey } };
    if (index % 2 === 1) {
      [1, 2, 4, 5].forEach((column) => {
        row.getCell(column).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.grey },
        };
      });
    }
  });
  sheet.getCell('B9').numFmt = '0.0%';
  sheet.getCell('E12').numFmt = '0.00';
  sheet.getCell('E13').numFmt = '0.0%';

  const actual = { H: 0, D: 0, A: 0 };
  data.fixtures.forEach((fixture) => {
    if (fixture.home_score == null || fixture.away_score == null) return;
    actual[result(fixture.home_score, fixture.away_score)] += 1;
  });
  const forecast = {
    H: players.reduce((sum, player) => sum + player.homePicks, 0),
    D: players.reduce((sum, player) => sum + player.drawPicks, 0),
    A: players.reduce((sum, player) => sum + player.awayPicks, 0),
  };

  sectionTitle(sheet, 15, 'Result distribution', 5);
  sheet.getRow(16).values = ['Type', 'Home wins', 'Draws', 'Away wins', 'Total'];
  styleHeader(sheet.getRow(16));
  const actualRow = sheet.getRow(17);
  actualRow.values = [
    'Actual fixtures',
    actual.H,
    actual.D,
    actual.A,
    actual.H + actual.D + actual.A,
  ];
  const forecastRow = sheet.getRow(18);
  forecastRow.values = ['Player forecasts', forecast.H, forecast.D, forecast.A, submitted];
  addStriping(forecastRow, 1);

  const sortedPlayers = [...players].sort(
    (a, b) => b.points - a.points || b.exact - a.exact || a.displayName.localeCompare(b.displayName)
  );
  const mostPoints = sortedPlayers[0]?.points ?? 0;
  const topScorers =
    sortedPlayers
      .filter((player) => player.points === mostPoints)
      .map((player) => player.displayName)
      .join(', ') || '—';
  const accuratePlayers = [...players]
    .filter((player) => player.submitted > 0)
    .sort(
      (a, b) =>
        ratio(b.exact + b.correctResult, b.submitted) -
          ratio(a.exact + a.correctResult, a.submitted) ||
        b.exact - a.exact ||
        a.displayName.localeCompare(b.displayName)
    );
  const mostPredictable = [...fixtures]
    .filter((fixture) => fixture.submitted > 0)
    .sort(
      (a, b) =>
        ratio(b.exact, b.submitted) - ratio(a.exact, a.submitted) ||
        average(b.totalPoints, b.submitted) - average(a.totalPoints, a.submitted)
    )[0];
  const toughest = [...fixtures]
    .filter((fixture) => fixture.submitted > 0)
    .sort(
      (a, b) =>
        average(a.totalPoints, a.submitted) - average(b.totalPoints, b.submitted) ||
        ratio(a.exact, a.submitted) - ratio(b.exact, b.submitted)
    )[0];
  const popularScore = countScorelines(data.predictions)[0];

  sectionTitle(sheet, 20, 'Gameweek highlights', 8);
  const highlightHeader = sheet.getRow(21);
  highlightHeader.values = ['Highlight', 'Value', 'Detail'];
  styleHeader(highlightHeader, colors.navy);
  const highlights: [string, string, string][] = [
    ['Top scorer', topScorers, `${mostPoints} point${mostPoints === 1 ? '' : 's'}`],
    [
      'Best outcome accuracy',
      accuratePlayers[0]?.displayName ?? '—',
      accuratePlayers[0]
        ? `${(ratio(accuratePlayers[0].exact + accuratePlayers[0].correctResult, accuratePlayers[0].submitted) * 100).toFixed(1)}%`
        : '—',
    ],
    [
      'Most predictable fixture',
      mostPredictable ? fixtureLabel(mostPredictable.fixture) : '—',
      mostPredictable
        ? `${mostPredictable.exact} exact prediction${mostPredictable.exact === 1 ? '' : 's'}`
        : '—',
    ],
    [
      'Toughest fixture',
      toughest ? fixtureLabel(toughest.fixture) : '—',
      toughest
        ? `${average(toughest.totalPoints, toughest.submitted).toFixed(2)} average points`
        : '—',
    ],
    [
      'Most popular scoreline',
      popularScore?.[0] ?? '—',
      popularScore ? `${popularScore[1]} picks` : '—',
    ],
  ];
  highlights.forEach((values, index) => {
    const row = sheet.getRow(22 + index);
    row.values = values;
    row.getCell(1).font = { bold: true };
    addStriping(row, index);
  });
  sheet.autoFilter = { from: 'A16', to: 'E16' };
}

function addPredictionsGrid(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  players: PlayerStats[],
  fixtures: FixtureStats[]
) {
  const fixtureCount = Math.max(data.fixtures.length, 1);
  const endColumn = 2 + fixtureCount + 6;
  const sheet = workbook.addWorksheet('Predictions Grid');
  configureSheet(sheet, 6, 2);
  sheet.getColumn(1).width = 10;
  sheet.getColumn(2).width = 25;
  for (let column = 3; column < 3 + fixtureCount; column += 1) sheet.getColumn(column).width = 22;
  for (let column = 3 + fixtureCount; column <= endColumn; column += 1)
    sheet.getColumn(column).width = 14;
  titleRows(
    sheet,
    `${data.gameweekLabel} — predictions grid`,
    'Prediction and points in each cell · green exact · yellow correct result · red incorrect',
    endColumn
  );

  const headers = [
    'Position',
    'Player',
    ...(data.fixtures.length ? data.fixtures.map(fixtureLabel) : ['No fixtures']),
    'Points',
    'Exact',
    'Correct result',
    'Incorrect',
    'Submitted',
    'Missing',
  ];
  const header = sheet.getRow(4);
  header.values = headers;
  styleHeader(header);
  const finalScoreRow = sheet.getRow(5);
  finalScoreRow.values = [
    '',
    'Final score',
    ...(data.fixtures.length
      ? data.fixtures.map((fixture) => score(fixture.home_score, fixture.away_score))
      : ['—']),
  ];
  finalScoreRow.eachCell((cell, column) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.paleBlue } };
    cell.font = { bold: column === 2 };
    cell.alignment = { horizontal: column >= 3 ? 'center' : 'left', vertical: 'middle' };
  });
  const kickoffRow = sheet.getRow(6);
  kickoffRow.values = [
    '',
    'Kickoff',
    ...(data.fixtures.length ? data.fixtures.map((fixture) => new Date(fixture.kickoff)) : ['—']),
  ];
  kickoffRow.eachCell((cell, column) => {
    cell.font = { italic: true, color: { argb: colors.darkGrey } };
    cell.alignment = { horizontal: column >= 3 ? 'center' : 'left', wrapText: true };
    if (column >= 3 && cell.value instanceof Date) cell.numFmt = 'ddd d mmm, hh:mm';
  });

  const predictions = predictionMap(data.predictions);
  players.forEach((player, index) => {
    const row = sheet.getRow(7 + index);
    row.values = [player.position, player.displayName];
    addStriping(row, index);
    data.fixtures.forEach((fixture, fixtureIndex) => {
      const cell = row.getCell(3 + fixtureIndex);
      const prediction = predictions.get(`${player.participantId}:${fixture.id}`);
      if (!prediction) {
        cell.value = '—';
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.grey } };
        cell.font = { italic: true, color: { argb: colors.darkGrey } };
      } else {
        const points = prediction.points_awarded;
        cell.value = `${score(prediction.home_score, prediction.away_score)} · ${points == null ? '—' : points} pt${points === 1 ? '' : 's'}`;
        applyClassificationStyle(cell, classification(prediction));
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    const totalsStart = 3 + fixtureCount;
    [
      player.points,
      player.exact,
      player.correctResult,
      player.incorrect,
      player.submitted,
      player.missing,
    ].forEach((value, valueIndex) => {
      const cell = row.getCell(totalsStart + valueIndex);
      cell.value = value;
      cell.alignment = { horizontal: 'center' };
      if (valueIndex === 0) cell.font = { bold: true };
    });
  });

  const totalRow = sheet.getRow(7 + players.length);
  totalRow.values = ['', 'Totals'];
  fixtures.forEach((fixture, index) => {
    totalRow.getCell(3 + index).value = `${fixture.submitted} picks · ${fixture.totalPoints} pts`;
    totalRow.getCell(3 + index).alignment = { horizontal: 'center', wrapText: true };
  });
  const totalsStart = 3 + fixtureCount;
  [
    players.reduce((sum, player) => sum + player.points, 0),
    players.reduce((sum, player) => sum + player.exact, 0),
    players.reduce((sum, player) => sum + player.correctResult, 0),
    players.reduce((sum, player) => sum + player.incorrect, 0),
    players.reduce((sum, player) => sum + player.submitted, 0),
    players.reduce((sum, player) => sum + player.missing, 0),
  ].forEach((value, index) => {
    totalRow.getCell(totalsStart + index).value = value;
  });
  styleTotal(totalRow);
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: endColumn } };
}

function addLeaderboard(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  players: PlayerStats[]
) {
  const sheet = workbook.addWorksheet('Leaderboard');
  configureSheet(sheet, 4);
  sheet.columns = [
    { width: 10 },
    { width: 28 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
  ];
  titleRows(
    sheet,
    `${data.gameweekLabel} — leaderboard`,
    `${data.leagueName} · final standings`,
    9
  );
  const header = sheet.getRow(4);
  header.values = [
    'Position',
    'Player',
    'Points',
    'Exact',
    'Correct result',
    'Incorrect',
    'Submitted',
    'Missing',
    'Outcome accuracy',
  ];
  styleHeader(header);
  players.forEach((player, index) => {
    const row = sheet.getRow(5 + index);
    row.values = [
      player.position,
      player.displayName,
      player.leaderboardPoints,
      player.exact,
      player.correctResult,
      player.incorrect,
      player.submitted,
      player.missing,
      ratio(player.exact + player.correctResult, player.submitted),
    ];
    addStriping(row, index);
    row.getCell(3).font = { bold: true };
    row.getCell(9).numFmt = '0.0%';
    if (player.position === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.green } };
      });
    }
  });
  const totalRow = sheet.getRow(5 + players.length);
  totalRow.values = [
    '',
    'Totals',
    players.reduce((sum, player) => sum + player.points, 0),
    players.reduce((sum, player) => sum + player.exact, 0),
    players.reduce((sum, player) => sum + player.correctResult, 0),
    players.reduce((sum, player) => sum + player.incorrect, 0),
    players.reduce((sum, player) => sum + player.submitted, 0),
    players.reduce((sum, player) => sum + player.missing, 0),
    ratio(
      players.reduce((sum, player) => sum + player.exact + player.correctResult, 0),
      players.reduce((sum, player) => sum + player.submitted, 0)
    ),
  ];
  totalRow.getCell(9).numFmt = '0.0%';
  styleTotal(totalRow);
  sheet.autoFilter = { from: 'A4', to: 'I4' };
}

function addPlayerAnalysis(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  players: PlayerStats[]
) {
  const sheet = workbook.addWorksheet('Player Analysis');
  configureSheet(sheet, 4, 2);
  sheet.columns = [
    { width: 10 },
    { width: 26 },
    { width: 13 },
    { width: 12 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 17 },
    { width: 15 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 17 },
    { width: 16 },
  ];
  titleRows(
    sheet,
    `${data.gameweekLabel} — player analysis`,
    'Efficiency, accuracy, completeness and prediction error',
    16
  );
  const header = sheet.getRow(4);
  header.values = [
    'Position',
    'Player',
    'Points',
    'Exact',
    'Correct result',
    'Incorrect',
    'Unscored',
    'Submitted',
    'Missing',
    'Submission rate',
    'Exact-score rate',
    'Outcome accuracy',
    'Avg points / pick',
    'Max points',
    '% of max',
    'Avg goal error',
  ];
  styleHeader(header);
  players.forEach((player, index) => {
    const row = sheet.getRow(5 + index);
    row.values = [
      player.position,
      player.displayName,
      player.points,
      player.exact,
      player.correctResult,
      player.incorrect,
      player.unscored,
      player.submitted,
      player.missing,
      ratio(player.submitted, data.fixtures.length),
      ratio(player.exact, player.submitted),
      ratio(player.exact + player.correctResult, player.submitted),
      average(player.points, player.submitted),
      data.fixtures.length * 3,
      ratio(player.points, data.fixtures.length * 3),
      average(player.goalError, player.submitted),
    ];
    addStriping(row, index);
    row.getCell(3).font = { bold: true };
    [10, 11, 12, 15].forEach((column) => {
      row.getCell(column).numFmt = '0.0%';
    });
    [13, 16].forEach((column) => {
      row.getCell(column).numFmt = '0.00';
    });
  });
  sheet.autoFilter = { from: 'A4', to: 'P4' };
}

function addFixtureAnalysis(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  fixtures: FixtureStats[]
) {
  const sheet = workbook.addWorksheet('Fixture Analysis');
  configureSheet(sheet, 4, 1);
  sheet.columns = [
    { width: 30 },
    { width: 21 },
    { width: 12 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 11 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 18 },
    { width: 13 },
    { width: 17 },
    { width: 18 },
    { width: 17 },
    { width: 18 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
  ];
  titleRows(
    sheet,
    `${data.gameweekLabel} — fixture analysis`,
    'Prediction difficulty, consensus and score tendencies by fixture',
    21
  );
  const header = sheet.getRow(4);
  header.values = [
    'Fixture',
    'Kickoff',
    'Result',
    'Actual outcome',
    'Submitted',
    'Missing',
    'Exact',
    'Correct result',
    'Incorrect',
    'Unscored',
    'Total points',
    'Exact rate',
    'Outcome accuracy',
    'Avg points',
    'Avg predicted home',
    'Avg predicted away',
    'Avg predicted goals',
    'Most common score',
    'Consensus',
    'Home picks',
    'Draw picks',
    'Away picks',
  ];
  styleHeader(header);
  fixtures.forEach((fixture, index) => {
    const actualResult =
      fixture.fixture.home_score == null || fixture.fixture.away_score == null
        ? null
        : result(fixture.fixture.home_score, fixture.fixture.away_score);
    const row = sheet.getRow(5 + index);
    row.values = [
      fixtureLabel(fixture.fixture),
      new Date(fixture.fixture.kickoff),
      score(fixture.fixture.home_score, fixture.fixture.away_score),
      resultName(actualResult),
      fixture.submitted,
      fixture.missing,
      fixture.exact,
      fixture.correctResult,
      fixture.incorrect,
      fixture.unscored,
      fixture.totalPoints,
      ratio(fixture.exact, fixture.submitted),
      ratio(fixture.exact + fixture.correctResult, fixture.submitted),
      average(fixture.totalPoints, fixture.submitted),
      fixture.averageHome,
      fixture.averageAway,
      fixture.averageGoals,
      fixture.mostCommonScore,
      resultName(fixture.consensusResult),
      fixture.homePicks,
      fixture.drawPicks,
      fixture.awayPicks,
    ];
    addStriping(row, index);
    row.getCell(2).numFmt = 'ddd d mmm, hh:mm';
    [12, 13].forEach((column) => {
      row.getCell(column).numFmt = '0.0%';
    });
    [14, 15, 16, 17].forEach((column) => {
      row.getCell(column).numFmt = '0.00';
    });
    row.getCell(11).font = { bold: true };
  });
  sheet.autoFilter = { from: 'A4', to: 'V4' };
}

function addPickDistribution(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  fixtures: FixtureStats[]
) {
  const sheet = workbook.addWorksheet('Pick Distribution');
  configureSheet(sheet, 4, 1);
  sheet.columns = [
    { width: 30 },
    { width: 12 },
    { width: 17 },
    { width: 12 },
    { width: 12 },
    { width: 13 },
    { width: 17 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
  ];
  titleRows(
    sheet,
    `${data.gameweekLabel} — pick distribution`,
    'Popularity and success of every predicted scoreline',
    10
  );
  const header = sheet.getRow(4);
  header.values = [
    'Fixture',
    'Actual',
    'Predicted score',
    'Picks',
    'Pick share',
    'Exact hits',
    'Correct-result hits',
    'Incorrect',
    'Total points',
    'Avg points',
  ];
  styleHeader(header);
  let rowNumber = 5;
  fixtures.forEach((fixture) => {
    const groups = new Map<string, GameweekWorkbookPrediction[]>();
    fixture.predictions.forEach((prediction) => {
      const key = score(prediction.home_score, prediction.away_score);
      groups.set(key, [...(groups.get(key) ?? []), prediction]);
    });
    [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .forEach(([predictedScore, predictions]) => {
        const exact = predictions.filter(
          (prediction) => classification(prediction) === 'exact'
        ).length;
        const correct = predictions.filter(
          (prediction) => classification(prediction) === 'correct_result'
        ).length;
        const incorrect = predictions.filter(
          (prediction) => classification(prediction) === 'incorrect'
        ).length;
        const points = predictions.reduce(
          (sum, prediction) => sum + (prediction.points_awarded ?? 0),
          0
        );
        const row = sheet.getRow(rowNumber);
        row.values = [
          fixtureLabel(fixture.fixture),
          score(fixture.fixture.home_score, fixture.fixture.away_score),
          predictedScore,
          predictions.length,
          ratio(predictions.length, fixture.submitted),
          exact,
          correct,
          incorrect,
          points,
          average(points, predictions.length),
        ];
        addStriping(row, rowNumber - 5);
        row.getCell(5).numFmt = '0.0%';
        row.getCell(10).numFmt = '0.00';
        rowNumber += 1;
      });
  });
  if (rowNumber === 5) {
    sheet.getRow(5).values = ['No predictions submitted'];
  }
  sheet.autoFilter = { from: 'A4', to: 'J4' };
}

function addPredictionDetail(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  players: PlayerStats[]
) {
  const sheet = workbook.addWorksheet('Prediction Detail');
  configureSheet(sheet, 4, 2);
  sheet.columns = [
    { width: 26 },
    { width: 30 },
    { width: 21 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
  ];
  titleRows(
    sheet,
    `${data.gameweekLabel} — prediction detail`,
    'One auditable row per player and fixture',
    11
  );
  const header = sheet.getRow(4);
  header.values = [
    'Player',
    'Fixture',
    'Kickoff',
    'Prediction',
    'Actual',
    'Predicted outcome',
    'Actual outcome',
    'Classification',
    'Points',
    'Goal error',
    'Entry method',
  ];
  styleHeader(header);
  const predictions = predictionMap(data.predictions);
  let rowNumber = 5;
  players.forEach((player) => {
    data.fixtures.forEach((fixture) => {
      const prediction = predictions.get(`${player.participantId}:${fixture.id}`);
      const actualResult =
        fixture.home_score == null || fixture.away_score == null
          ? null
          : result(fixture.home_score, fixture.away_score);
      const row = sheet.getRow(rowNumber);
      row.values = [
        player.displayName,
        fixtureLabel(fixture),
        new Date(fixture.kickoff),
        prediction ? score(prediction.home_score, prediction.away_score) : '—',
        score(fixture.home_score, fixture.away_score),
        prediction ? resultName(result(prediction.home_score, prediction.away_score)) : '—',
        resultName(actualResult),
        prediction ? classificationName(classification(prediction)) : 'Missing',
        prediction?.points_awarded ?? 0,
        prediction ? goalError(prediction, fixture) : null,
        prediction ? (prediction.is_admin_entered ? 'Admin entered' : 'Player entered') : 'Missing',
      ];
      addStriping(row, rowNumber - 5);
      row.getCell(3).numFmt = 'ddd d mmm, hh:mm';
      if (prediction) applyClassificationStyle(row.getCell(8), classification(prediction));
      else {
        row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.grey } };
        row.getCell(8).font = { italic: true, color: { argb: colors.darkGrey } };
      }
      rowNumber += 1;
    });
  });
  sheet.autoFilter = { from: 'A4', to: 'K4' };
}

function addForecastTendencies(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  players: PlayerStats[]
) {
  const sheet = workbook.addWorksheet('Forecast Tendencies');
  configureSheet(sheet, 4, 1);
  sheet.columns = [
    { width: 26 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
  ];
  titleRows(
    sheet,
    `${data.gameweekLabel} — forecast tendencies`,
    'Home, draw and away preferences compared with the actual result mix',
    11
  );
  const header = sheet.getRow(4);
  header.values = [
    'Player',
    'Home picks',
    'Home %',
    'Draw picks',
    'Draw %',
    'Away picks',
    'Away %',
    'Home bias',
    'Draw bias',
    'Away bias',
    'Favoured outcome',
  ];
  styleHeader(header);
  const actual = { H: 0, D: 0, A: 0 };
  data.fixtures.forEach((fixture) => {
    if (fixture.home_score == null || fixture.away_score == null) return;
    actual[result(fixture.home_score, fixture.away_score)] += 1;
  });
  const actualTotal = actual.H + actual.D + actual.A;
  const writePlayer = (
    row: ExcelJS.Row,
    player: Pick<PlayerStats, 'displayName' | 'submitted' | 'homePicks' | 'drawPicks' | 'awayPicks'>
  ) => {
    const favourite = mostCommonResult(player.homePicks, player.drawPicks, player.awayPicks);
    row.values = [
      player.displayName,
      player.homePicks,
      ratio(player.homePicks, player.submitted),
      player.drawPicks,
      ratio(player.drawPicks, player.submitted),
      player.awayPicks,
      ratio(player.awayPicks, player.submitted),
      ratio(player.homePicks, player.submitted) - ratio(actual.H, actualTotal),
      ratio(player.drawPicks, player.submitted) - ratio(actual.D, actualTotal),
      ratio(player.awayPicks, player.submitted) - ratio(actual.A, actualTotal),
      resultName(favourite),
    ];
    [3, 5, 7, 8, 9, 10].forEach((column) => {
      row.getCell(column).numFmt = '0.0%';
    });
  };
  players.forEach((player, index) => {
    const row = sheet.getRow(5 + index);
    writePlayer(row, player);
    addStriping(row, index);
  });
  const totals = {
    displayName: 'All players',
    submitted: players.reduce((sum, player) => sum + player.submitted, 0),
    homePicks: players.reduce((sum, player) => sum + player.homePicks, 0),
    drawPicks: players.reduce((sum, player) => sum + player.drawPicks, 0),
    awayPicks: players.reduce((sum, player) => sum + player.awayPicks, 0),
  };
  const totalRow = sheet.getRow(5 + players.length);
  writePlayer(totalRow, totals);
  styleTotal(totalRow);

  const actualRow = sheet.getRow(7 + players.length);
  actualRow.values = [
    'Actual fixtures',
    actual.H,
    ratio(actual.H, actualTotal),
    actual.D,
    ratio(actual.D, actualTotal),
    actual.A,
    ratio(actual.A, actualTotal),
    0,
    0,
    0,
    resultName(mostCommonResult(actual.H, actual.D, actual.A)),
  ];
  [3, 5, 7, 8, 9, 10].forEach((column) => {
    actualRow.getCell(column).numFmt = '0.0%';
  });
  actualRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.paleBlue } };
    cell.font = { bold: true };
  });
  sheet.autoFilter = { from: 'A4', to: 'K4' };
}

function addCompleteness(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  players: PlayerStats[]
) {
  const sheet = workbook.addWorksheet('Completeness');
  configureSheet(sheet, 4);
  sheet.columns = [
    { width: 28 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 65 },
  ];
  titleRows(
    sheet,
    `${data.gameweekLabel} — completeness`,
    'Submission coverage and missing predictions',
    6
  );
  const header = sheet.getRow(4);
  header.values = [
    'Player',
    'Submitted',
    'Missing',
    'Submission rate',
    'Admin entered',
    'Missing fixtures',
  ];
  styleHeader(header);
  players.forEach((player, index) => {
    const row = sheet.getRow(5 + index);
    row.values = [
      player.displayName,
      player.submitted,
      player.missing,
      ratio(player.submitted, data.fixtures.length),
      player.adminEntered,
      player.missingFixtures.join('; ') || 'None',
    ];
    addStriping(row, index);
    row.getCell(4).numFmt = '0.0%';
    row.getCell(6).alignment = { wrapText: true, vertical: 'top' };
    if (player.missing) applyClassificationStyle(row.getCell(3), 'incorrect');
    else applyClassificationStyle(row.getCell(3), 'exact');
  });
  sheet.autoFilter = { from: 'A4', to: 'F4' };
}

function addNotes(
  workbook: ExcelJS.Workbook,
  data: CompletedGameweekWorkbookData,
  players: PlayerStats[]
) {
  const sheet = workbook.addWorksheet('Notes & Legend');
  configureSheet(sheet, 3);
  sheet.columns = [{ width: 27 }, { width: 82 }];
  titleRows(
    sheet,
    `${data.gameweekLabel} — notes & legend`,
    'Definitions, scoring and data-quality checks',
    2
  );

  sectionTitle(sheet, 4, 'Prediction grid legend', 2);
  const legend: [Classification, string][] = [
    ['exact', 'Exact score — 3 points'],
    ['correct_result', 'Correct match result (home win, draw or away win) — 1 point'],
    ['incorrect', 'Incorrect match result — 0 points'],
    ['unscored', 'Submitted prediction without a scoring result'],
  ];
  legend.forEach(([category, description], index) => {
    const row = sheet.getRow(5 + index);
    row.values = [classificationName(category), description];
    applyClassificationStyle(row.getCell(1), category);
  });

  sectionTitle(sheet, 10, 'Metric definitions', 2);
  const definitions = [
    [
      'Outcome accuracy',
      'Exact-score predictions plus correct-result predictions, divided by submitted predictions.',
    ],
    ['Exact-score rate', 'Exact-score predictions divided by submitted predictions.'],
    ['Goal error', 'Absolute home-goal error plus absolute away-goal error. Lower is better.'],
    [
      'Home / draw / away bias',
      'A player’s forecast share minus the actual gameweek result share.',
    ],
    [
      'Maximum points',
      'Three points for every player-fixture prediction slot, including missed predictions.',
    ],
    [
      'Consensus',
      'The uniquely most common home, draw or away forecast. A tie is shown as a dash.',
    ],
  ];
  definitions.forEach((values, index) => {
    const row = sheet.getRow(11 + index);
    row.values = values;
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    addStriping(row, index);
  });

  sectionTitle(sheet, 18, 'Data-quality checks', 2);
  const leaderboardMismatches = players.filter(
    (player) => player.points !== player.leaderboardPoints
  );
  const checks = [
    [
      'Completed fixtures with confirmed scores',
      `${data.fixtures.filter((fixture) => fixture.result_confirmed && fixture.home_score != null && fixture.away_score != null).length} of ${data.fixtures.length}`,
    ],
    ['Unscored submitted predictions', players.reduce((sum, player) => sum + player.unscored, 0)],
    ['Leaderboard / grid point mismatches', leaderboardMismatches.length],
    ['Generated by', 'Predictotronix admin export'],
  ];
  checks.forEach((values, index) => {
    const row = sheet.getRow(19 + index);
    row.values = values;
    row.getCell(1).font = { bold: true };
    addStriping(row, index);
  });
}

export async function createCompletedGameweekWorkbook(
  sourceData: CompletedGameweekWorkbookData
): Promise<Buffer> {
  const data: CompletedGameweekWorkbookData = {
    ...sourceData,
    fixtures: [...sourceData.fixtures].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    ),
    standings: [...sourceData.standings].sort(
      (a, b) => a.position - b.position || a.display_name.localeCompare(b.display_name)
    ),
  };
  const players = buildPlayerStats(data);
  const fixtures = buildFixtureStats(data);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Predictotronix';
  workbook.title = `${data.gameweekLabel} analysis`;
  workbook.subject = `${data.leagueName} ${data.seasonName}`;
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  addOverview(workbook, data, players, fixtures);
  addPredictionsGrid(workbook, data, players, fixtures);
  addLeaderboard(workbook, data, players);
  addPlayerAnalysis(workbook, data, players);
  addFixtureAnalysis(workbook, data, fixtures);
  addPickDistribution(workbook, data, fixtures);
  addPredictionDetail(workbook, data, players);
  addForecastTendencies(workbook, data, players);
  addCompleteness(workbook, data, players);
  addNotes(workbook, data, players);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
