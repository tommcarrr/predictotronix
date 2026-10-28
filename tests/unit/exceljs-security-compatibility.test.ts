import ExcelJS from 'exceljs';
import { expect, it } from 'vitest';

it('round-trips extended conditional formatting with the patched UUID dependency', async () => {
  // Extended icon sets exercise ExcelJS's CommonJS require('uuid').v4() path.
  // Keep this covered while overriding its old UUID dependency.
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Scores');
  sheet.addRows([[0], [1], [3]]);
  sheet.addConditionalFormatting({
    ref: 'A1:A3',
    rules: [
      {
        type: 'iconSet',
        iconSet: '3Stars',
        priority: 1,
        cfvo: [
          { type: 'percent', value: 0 },
          { type: 'percent', value: 33 },
          { type: 'percent', value: 67 },
        ],
      },
    ],
  });

  const restored = new ExcelJS.Workbook();
  await restored.xlsx.load(await workbook.xlsx.writeBuffer());
  const restoredSheet = restored.getWorksheet('Scores')!;
  expect(restoredSheet.getCell('A3').value).toBe(3);
  expect(restoredSheet).toMatchObject({
    conditionalFormattings: [
      {
        ref: 'A1:A3',
        rules: [{ type: 'iconSet', iconSet: '3Stars' }],
      },
    ],
  });
});
