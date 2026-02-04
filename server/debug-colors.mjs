// Debug script to check Excel cell colors
import ExcelJS from 'exceljs';

const filePath = 'D:/ControlDeCostos/server/data/deudas.xlsx';

async function debugColors() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((worksheet) => {
        console.log(`\n=== Sheet: ${worksheet.name} ===`);

        // Check first 10 rows for color info
        for (let rowNum = 1; rowNum <= 15; rowNum++) {
            const row = worksheet.getRow(rowNum);
            row.eachCell((cell, colNum) => {
                const fill = cell.fill;
                if (fill && (fill.fgColor || fill.bgColor)) {
                    console.log(`Row ${rowNum}, Col ${colNum}: Value="${cell.value}"`);
                    console.log(`  Fill type: ${fill.type}`);
                    if (fill.fgColor) {
                        console.log(`  fgColor: argb=${fill.fgColor.argb}, theme=${fill.fgColor.theme}, tint=${fill.fgColor.tint}`);
                    }
                    if (fill.bgColor) {
                        console.log(`  bgColor: argb=${fill.bgColor.argb}, theme=${fill.bgColor.theme}`);
                    }
                }
            });
        }
    });
}

debugColors().catch(console.error);
