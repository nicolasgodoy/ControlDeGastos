import ExcelJS from 'exceljs';

const filePath = 'D:/ControlDeCostos/server/data/ExcelDeudas.xlsx';

async function checkColorsAgain() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const colors = new Map();
    let totalCells = 0;

    workbook.eachSheet((worksheet) => {
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                const fill = cell.fill;
                if (fill && (fill.fgColor || fill.bgColor)) {
                    const argb = (fill.fgColor?.argb || fill.bgColor?.argb || 'none');
                    const key = argb;
                    colors.set(key, (colors.get(key) || 0) + 1);
                }
                totalCells++;
            });
        });
    });

    console.log('Colors found in ExcelDeudas.xlsx:');
    for (const [color, count] of colors) {
        console.log(`- ${color}: ${count} cells`);
    }
}

checkColorsAgain().catch(console.error);
