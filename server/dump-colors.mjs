// Dump ALL unique colors
import ExcelJS from 'exceljs';

const filePath = 'D:/ControlDeCostos/server/data/deudas.xlsx';

async function dumpColors() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const uniqueColors = new Map();

    workbook.eachSheet((worksheet) => {
        worksheet.eachRow((row, rowNum) => {
            row.eachCell((cell, colNum) => {
                const fill = cell.fill;
                if (fill && (fill.fgColor || fill.bgColor)) {
                    const fgArgb = fill.fgColor?.argb || 'none';
                    const fgTheme = fill.fgColor?.theme ?? 'none';
                    const key = `${fgArgb}_${fgTheme}`;

                    if (!uniqueColors.has(key)) {
                        uniqueColors.set(key, {
                            argb: fgArgb,
                            theme: fgTheme,
                            example: `Row ${rowNum}, Col ${colNum}: "${String(cell.value).substring(0, 30)}"`
                        });
                    }
                }
            });
        });
    });

    console.log('=== Unique Colors Found ===\n');
    for (const [key, data] of uniqueColors) {
        console.log(`ARGB: ${data.argb}, Theme: ${data.theme}`);
        console.log(`  Example: ${data.example}\n`);
    }
}

dumpColors().catch(console.error);
