import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'data', 'Deudas.xlsx');

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(filePath);

workbook.eachSheet((worksheet) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`SHEET: ${worksheet.name}`);
    console.log('='.repeat(70));

    // Track sections
    let currentBank = '';
    let loanNames = [];
    let headerRowNum = 0;

    for (let r = 1; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        const firstCellVal = String(row.getCell(1).value || '').trim().toUpperCase();

        // Bank header
        if (['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC', 'NARANJA'].includes(firstCellVal)) {
            currentBank = firstCellVal;
            console.log(`\n>>> BANCO: ${currentBank} (row ${r})`);
            continue;
        }

        // Check for loan name row (contains PRESTAMO or TARJETA)
        let hasLoanName = false;
        let loanRowData = {};
        row.eachCell({ includeEmpty: false }, (cell, c) => {
            const v = String(cell.value || '').toUpperCase();
            if (v.startsWith('PRESTAMO') || v.startsWith('TARJETA')) {
                hasLoanName = true;
                loanRowData[c] = String(cell.value).trim();
            }
        });
        if (hasLoanName) {
            loanNames = [];
            // Build loan names by scanning every 2 cols
            const maxCol = worksheet.columnCount;
            for (let c = 1; c <= maxCol; c++) {
                const v = String(row.getCell(c).value || '').trim();
                if (v) loanNames.push({ col: c, name: v });
            }
            console.log(`  Loans found: ${loanNames.map(l => `C${l.col}:${l.name}`).join(', ')}`);
            continue;
        }

        // Check for header row (FECHA)
        let isFechaRow = false;
        row.eachCell({ includeEmpty: false }, (cell) => {
            if (String(cell.value || '').toUpperCase() === 'FECHA') isFechaRow = true;
        });
        if (isFechaRow) {
            headerRowNum = r;
            // Print full header row
            let hdr = '  HEADERS: ';
            for (let c = 1; c <= Math.min(worksheet.columnCount, 18); c++) {
                const v = row.getCell(c).value;
                if (v) hdr += `C${c}:${String(v).substring(0, 8)} `;
            }
            console.log(hdr);
            continue;
        }

        // TOTAL rows - critical!
        if (firstCellVal.startsWith('TOTAL')) {
            let totalInfo = `  [${firstCellVal} - row ${r}]: `;
            for (let c = 1; c <= Math.min(worksheet.columnCount, 18); c++) {
                const cell = row.getCell(c);
                let v = cell.value;
                if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
                if (v !== null && v !== undefined && v !== '') {
                    totalInfo += `C${c}:${String(v).substring(0, 12)} `;
                }
            }
            console.log(totalInfo);
            continue;
        }

        // Data rows - show all with colors
        if (headerRowNum > 0 && r > headerRowNum && currentBank) {
            let hasData = false;
            let rowStr = `  ROW ${r}: `;
            for (let c = 1; c <= Math.min(worksheet.columnCount, 18); c++) {
                const cell = row.getCell(c);
                let v = cell.value;
                if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
                if (v === null || v === undefined || v === '') continue;

                const fill = cell.fill;
                const argb = (fill?.fgColor?.argb || fill?.bgColor?.argb || 'NONE').toUpperCase();
                let colorName;
                if (argb.includes('38761D') || argb.includes('6AA84F')) colorName = '🟢PAID';
                else if (argb.includes('FF9900')) colorName = '🟠PEND';
                else if (argb === 'FFFFFFFF') colorName = '⬜WHITE';
                else if (argb === 'FF434343') colorName = '⬛GREY';
                else if (argb === 'NONE') colorName = '❔NONE';
                else colorName = argb.substring(0, 8);

                hasData = true;
                rowStr += `C${c}:${String(v).substring(0, 10)}[${colorName}] `;
            }
            if (hasData) console.log(rowStr);
        }
    }
});
