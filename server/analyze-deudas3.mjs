import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'data', 'Deudas.xlsx');

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(filePath);

// We want to see all distinct sections and total rows
workbook.eachSheet((worksheet) => {
    console.log(`\n=== SHEET: ${worksheet.name} (${worksheet.rowCount} rows) ===`);
    
    // Scan all rows to find bank headers, loan headers, total rows
    for (let r = 1; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        const firstCellVal = String(row.getCell(1).value || '').trim().toUpperCase();
        
        // Show bank/section headers
        if (['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC', 'NARANJA'].includes(firstCellVal)) {
            console.log(`\n[ROW ${r}] BANK: ${firstCellVal}`);
            continue;
        }
        
        // Show loan name rows
        let hasLoanName = false;
        row.eachCell({ includeEmpty: false }, (cell) => {
            const v = String(cell.value || '').toUpperCase();
            if (v.startsWith('PRESTAMO')) hasLoanName = true;
        });
        if (hasLoanName) {
            let loanRow = '';
            for (let c = 1; c <= Math.min(worksheet.columnCount, 16); c++) {
                const v = row.getCell(c).value;
                if (v) loanRow += `C${c}:${String(v).substring(0,15)} `;
            }
            console.log(`[ROW ${r}] LOANS: ${loanRow}`);
            continue;
        }
        
        // Show fecha/cuotas header
        let isFechaRow = false;
        row.eachCell({ includeEmpty: false }, (cell) => {
            if (String(cell.value || '').toUpperCase() === 'FECHA') isFechaRow = true;
        });
        if (isFechaRow) {
            console.log(`[ROW ${r}] HEADER: Fecha/Cuotas`);
            continue;
        }
        
        // Show TOTAL rows
        if (firstCellVal.startsWith('TOTAL')) {
            let totalRow = '';
            for (let c = 1; c <= Math.min(worksheet.columnCount, 16); c++) {
                const v = row.getCell(c).value;
                if (v !== null && v !== undefined && v !== '') totalRow += `C${c}:${String(v).substring(0,12)} `;
            }
            console.log(`[ROW ${r}] TOTAL: ${totalRow}`);
            continue;
        }
        
        // Show data rows with color info
        let hasData = false;
        let rowSummary = '';
        for (let c = 1; c <= Math.min(worksheet.columnCount, 16); c++) {
            const cell = row.getCell(c);
            let v = cell.value;
            if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
            if (v !== null && v !== undefined && v !== '' && v !== 0) {
                hasData = true;
                const fill = cell.fill;
                const argb = (fill?.fgColor?.argb || fill?.bgColor?.argb || 'NONE');
                let colorName = 'NONE';
                if (argb.includes('38761D') || argb.includes('6AA84F')) colorName = 'GREEN';
                else if (argb.includes('FF9900')) colorName = 'ORANGE';
                else if (argb.includes('FFFFFF')) colorName = 'WHITE';
                else if (argb === 'NONE') colorName = 'NONE';
                else colorName = argb.substring(0, 8);
                rowSummary += `C${c}:${String(v).substring(0,8)}[${colorName}] `;
            }
        }
        if (hasData) console.log(`[ROW ${r}] DATA: ${rowSummary}`);
    }
});
