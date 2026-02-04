// Debug script to find green cells specifically
import ExcelJS from 'exceljs';

const filePath = 'D:/ControlDeCostos/server/data/deudas.xlsx';

async function findGreens() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    console.log('Searching for green cells (paid items)...\n');

    workbook.eachSheet((worksheet) => {
        console.log(`\n=== Sheet: ${worksheet.name} ===`);

        worksheet.eachRow((row, rowNum) => {
            row.eachCell((cell, colNum) => {
                const fill = cell.fill;
                if (fill && fill.fgColor) {
                    const argb = fill.fgColor.argb || '';
                    const theme = fill.fgColor.theme;

                    // Look for anything that might be green
                    // Theme 6 is typically accent green, theme 9 is often green too
                    // Or ARGB with high G value
                    if ((theme !== undefined && theme !== 7) || // Not orange theme
                        argb.match(/00[0-9A-F]{2}00|00B050|92D050|70AD47|00FF00/i)) {
                        console.log(`Row ${rowNum}, Col ${colNum}: "${cell.value}"`);
                        console.log(`  theme=${theme}, argb=${argb}`);
                    }
                }
            });
        });
    });
}

findGreens().catch(console.error);
