import ExcelJS from 'exceljs';

const filePath = 'D:/ControlDeCostos/server/data/ExcelDeudas.xlsx';

async function analyzeFirstRows() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    console.log(`=== SHEET: ${worksheet.name} ===`);

    for (let i = 1; i <= 20; i++) {
        const row = worksheet.getRow(i);
        let rowStr = `Row ${i}: `;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const val = cell.value;
            const fill = cell.fill;
            let color = '';
            if (fill && fill.fgColor && fill.fgColor.argb) color = `[${fill.fgColor.argb}]`;
            rowStr += `| Col${colNumber}: ${val}${color} `;
        });
        console.log(rowStr);
    }
}

analyzeFirstRows().catch(console.error);
