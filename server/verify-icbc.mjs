/**
 * verify-icbc.mjs
 * Muestra todas las deudas ICBC parseadas con sus fechas y colores reales del Excel.
 */
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'data', 'Deudas.xlsx');

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(filePath);

const sheet = workbook.getWorksheet(1);

// Find ICBC section
let icbcRowStart = 0;
let headerRow = 0;
let loanNames = [];

for (let r = 1; r <= sheet.rowCount; r++) {
    const v = String(sheet.getRow(r).getCell(1).value || '').trim().toUpperCase();
    if (v === 'ICBC') { icbcRowStart = r; continue; }
    if (icbcRowStart && !headerRow) {
        let isLoanRow = false;
        sheet.getRow(r).eachCell({ includeEmpty: false }, (cell) => {
            const cv = String(cell.value || '').toUpperCase();
            if (cv.startsWith('PRESTAMO') || cv.startsWith('TARJETA')) isLoanRow = true;
        });
        if (isLoanRow) {
            // record loanNames with col
            const row = sheet.getRow(r);
            for (let c = 1; c <= sheet.columnCount; c += 2) {
                const lt = String(row.getCell(c).value || row.getCell(c+1).value || '').trim();
                if (lt && !lt.toUpperCase().includes('TOTAL')) {
                    loanNames.push({ col: c, name: lt });
                }
            }
            console.log('Loan columns found:', loanNames.map(l => `C${l.col}:${l.name}`).join(' | '));
            continue;
        }
        let isFechaRow = false;
        sheet.getRow(r).eachCell({ includeEmpty: false }, (cell) => {
            if (String(cell.value || '').toUpperCase() === 'FECHA') isFechaRow = true;
        });
        if (isFechaRow) { headerRow = r; continue; }
    }
    if (headerRow && r > headerRow) {
        const firstV = String(sheet.getRow(r).getCell(1).value || '').trim().toUpperCase();
        if (firstV.startsWith('TOTAL')) {
            // Print TOTAL row
            let totalStr = `\n📊 ${firstV} (row ${r}): `;
            for (let c = 1; c <= Math.min(sheet.columnCount, 18); c++) {
                let v = sheet.getRow(r).getCell(c).value;
                if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
                if (v !== null && v !== undefined && v !== '') totalStr += `C${c}=${v} `;
            }
            console.log(totalStr);
            continue;
        }

        // Data row - show each loan's cell
        for (const loan of loanNames) {
            const fechaCell = sheet.getRow(r).getCell(loan.col);
            const cuotasCell = sheet.getRow(r).getCell(loan.col + 1);
            let dateVal = fechaCell.value;
            let amountVal = cuotasCell.value;
            if (amountVal && typeof amountVal === 'object' && amountVal.result !== undefined) amountVal = amountVal.result;
            if (dateVal && typeof dateVal === 'object' && dateVal.result !== undefined) dateVal = dateVal.result;
            if (!dateVal || !amountVal) continue;
            
            const numAmt = typeof amountVal === 'number' ? amountVal : parseFloat(String(amountVal).replace(/[^0-9.-]/g,''));
            if (isNaN(numAmt) || numAmt <= 0) continue;

            const fill = cuotasCell.fill;
            const argb = (fill?.fgColor?.argb || fill?.bgColor?.argb || 'NONE').toUpperCase();
            let colorLabel;
            if (argb.includes('38761D') || argb.includes('6AA84F')) colorLabel = '🟢 PAID';
            else if (argb.includes('FF9900')) colorLabel = '🟠 PEND';
            else if (argb === 'FFFFFFFF') colorLabel = '⬜ WHITE(pending)';
            else if (argb === 'NONE')  colorLabel = '❔ NONE(pending)';
            else colorLabel = argb;

            let dateStr = '';
            if (dateVal instanceof Date) {
                dateStr = `${dateVal.getUTCFullYear()}-${String(dateVal.getUTCMonth()+1).padStart(2,'0')}-${String(dateVal.getUTCDate()).padStart(2,'0')}`;
            } else {
                dateStr = String(dateVal);
            }

            console.log(`  [R${r}] ${loan.name.padEnd(35)} ${dateStr}  $${numAmt.toLocaleString('es-AR')}  ${colorLabel}`);
        }
    }
}
