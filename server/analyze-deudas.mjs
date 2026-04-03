import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'data', 'Deudas.xlsx');

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(filePath);

workbook.eachSheet((worksheet) => {
    console.log(`\n=== SHEET: ${worksheet.name} ===`);
    console.log(`Rows: ${worksheet.rowCount}, Cols: ${worksheet.columnCount}`);
    
    for (let r = 1; r <= Math.min(25, worksheet.rowCount); r++) {
        const row = worksheet.getRow(r);
        let rowData = `Row ${String(r).padStart(2,'0')}: `;
        for (let c = 1; c <= Math.min(worksheet.columnCount, 16); c++) {
            const cell = row.getCell(c);
            let val = cell.value;
            if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
            const fill = cell.fill;
            const argb = fill?.fgColor?.argb || fill?.bgColor?.argb || '';
            const valStr = (val !== null && val !== undefined ? String(val).substring(0,10) : '').padEnd(10);
            const colorStr = argb ? `[${argb.substring(0,8)}]` : '[--------]';
            rowData += `C${String(c).padStart(2,'0')}:${valStr}${colorStr} `;
        }
        console.log(rowData);
    }
});

// Also check what colors appear in amount cells
console.log('\n\n=== COLOR ANALYSIS ON AMOUNT CELLS ===');
const colorCounts = {};
workbook.eachSheet((worksheet) => {
    let inData = false;
    let dataRowStart = 0;
    for (let r = 1; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        let isHeaderRow = false;
        row.eachCell({ includeEmpty: true }, (cell) => {
            if (String(cell.value || '').toUpperCase() === 'FECHA') isHeaderRow = true;
        });
        if (isHeaderRow) { inData = true; dataRowStart = r + 1; continue; }
        if (inData && r >= dataRowStart) {
            // Check even columns (amount cols)
            for (let c = 2; c <= Math.min(worksheet.columnCount, 16); c += 2) {
                const cell = row.getCell(c);
                let val = cell.value;
                if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
                if (val && (typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val))))) {
                    const fill = cell.fill;
                    const argb = fill?.fgColor?.argb || fill?.bgColor?.argb || 'NONE';
                    colorCounts[argb] = (colorCounts[argb] || 0) + 1;
                }
            }
        }
    }
});
console.log('Colors found on amount cells:', JSON.stringify(colorCounts, null, 2));
