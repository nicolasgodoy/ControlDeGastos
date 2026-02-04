import ExcelJS from 'exceljs';

const filePath = 'D:/ControlDeCostos/server/data/ExcelDeudas.xlsx';

async function analyzeNewExcel() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((worksheet) => {
        console.log(`\n=== SHEET: ${worksheet.name} ===`);
        const rowCount = Math.min(worksheet.rowCount, 100);

        for (let i = 1; i <= rowCount; i++) {
            const row = worksheet.getRow(i);
            const values = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const fill = cell.fill;
                let colorInfo = '';
                if (fill && fill.fgColor && fill.fgColor.argb) {
                    colorInfo = `[Color:${fill.fgColor.argb}]`;
                }
                values.push(`Col${colNumber}: ${cell.value}${colorInfo}`);
            });
            if (values.length > 0) {
                console.log(`Row ${i} | ${values.join(' | ')}`);
            }
        }
    });
}

analyzeNewExcel().catch(console.error);
